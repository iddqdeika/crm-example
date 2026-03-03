"""Meilisearch index sync and search for blog posts."""
import logging
import re
import uuid
from typing import TYPE_CHECKING

import meilisearch

from schemas.blog import BlogSearchHit, BlogSearchListResponse

if TYPE_CHECKING:
    from models.blog_post import BlogPost

logger = logging.getLogger(__name__)

_INDEX = "blog_posts"


def _strip_html(html: str) -> str:
    return re.sub(r"<[^>]+>", "", html)


def _to_document(post: "BlogPost", creator_display_name: str) -> dict:
    author_display = post.author if post.author else creator_display_name
    return {
        "id": str(post.id),
        "title": post.title,
        "body_plain": _strip_html(post.body).strip(),
        "author_display": author_display,
        "created_at_ts": int(post.created_at.timestamp()),
        "slug": (post.slug or ""),
    }


class BlogSearchService:
    def __init__(self, url: str, api_key: str) -> None:
        self._client = meilisearch.Client(url, api_key)

    def ensure_index_configured(self) -> None:
        """Apply index settings on startup. Errors are logged and swallowed."""
        try:
            index = self._client.index(_INDEX)
            index.update_settings(
                {
                    "searchableAttributes": ["title", "body_plain", "author_display"],
                    "displayedAttributes": [
                        "id",
                        "title",
                        "body_plain",
                        "author_display",
                        "created_at_ts",
                        "slug",
                    ],
                    "sortableAttributes": ["created_at_ts"],
                    "highlightPreTag": "<em>",
                    "highlightPostTag": "</em>",
                }
            )
        except Exception:
            logger.warning("Meilisearch: failed to configure index settings", exc_info=True)

    def upsert(self, post: "BlogPost", creator_display_name: str) -> None:
        """Index or update a post. Errors are logged and swallowed."""
        try:
            doc = _to_document(post, creator_display_name)
            self._client.index(_INDEX).add_documents([doc])
        except Exception:
            logger.warning("Meilisearch: failed to upsert post %s", post.id, exc_info=True)

    def delete(self, post_id: uuid.UUID) -> None:
        """Remove a post from the index. Errors are logged and swallowed."""
        try:
            self._client.index(_INDEX).delete_document(str(post_id))
        except Exception:
            logger.warning("Meilisearch: failed to delete post %s", post_id, exc_info=True)

    def delete_all_documents(self) -> None:
        """Remove all documents from the index. Use before a full rebuild to drop stale entries."""
        try:
            self._client.index(_INDEX).delete_all_documents()
        except Exception:
            logger.warning("Meilisearch: failed to delete all documents", exc_info=True)
            raise

    def search(self, q: str, limit: int = 20, page: int = 1) -> BlogSearchListResponse:
        """Fulltext search; returns highlighted results."""
        try:
            offset = (page - 1) * limit
            result = self._client.index(_INDEX).search(
                q,
                {
                    "limit": limit,
                    "offset": offset,
                    "attributesToHighlight": ["title", "body_plain"],
                    "highlightPreTag": "<em>",
                    "highlightPostTag": "</em>",
                },
            )
            hits = []
            for h in result.get("hits", []):
                formatted = h.get("_formatted", {})
                hits.append(
                    BlogSearchHit(
                        id=h["id"],
                        title=formatted.get("title", h["title"]),
                        body_snippet=formatted.get("body_plain", h.get("body_plain", ""))[:300],
                        author_display=h.get("author_display", ""),
                        created_at_ts=h.get("created_at_ts", 0),
                        slug=h.get("slug", ""),
                    )
                )
            total = result.get("estimatedTotalHits", len(hits))
            return BlogSearchListResponse(items=hits, total=total)
        except Exception:
            logger.warning("Meilisearch: search failed for query %r", q, exc_info=True)
            return BlogSearchListResponse(items=[], total=0)


_instance: BlogSearchService | None = None


def get_search_service() -> BlogSearchService:
    global _instance
    if _instance is None:
        from core.settings import get_settings

        s = get_settings()
        _instance = BlogSearchService(url=s.meilisearch_url, api_key=s.meilisearch_api_key)
    return _instance
