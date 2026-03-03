"""Rebuild Meilisearch blog_posts index from PostgreSQL.

Clears the index first so deleted posts (stale documents) are removed,
then indexes only published posts. Fixes search returning 404s for
old/test posts that no longer exist in the DB.

Usage:
    python src/scripts/rebuild_search_index.py
"""
import asyncio
import sys

from sqlalchemy import select
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlalchemy.orm import selectinload


async def main() -> None:
    from core.settings import get_settings
    from models.blog_post import BlogPost
    from services.blog_search_service import BlogSearchService

    settings = get_settings()
    engine = create_async_engine(settings.database_url, echo=False)
    factory = async_sessionmaker(engine, expire_on_commit=False)

    search = BlogSearchService(url=settings.meilisearch_url, api_key=settings.meilisearch_api_key)
    search.ensure_index_configured()

    # Clear index first so deleted posts (e.g. old "Redirect post" test data) are removed
    print("Clearing existing documents from Meilisearch index...")
    search.delete_all_documents()

    async with factory() as session:
        result = await session.execute(
            select(BlogPost)
            .options(selectinload(BlogPost.creator))
            .where(BlogPost.status == "published")
        )
        posts = result.scalars().all()

    print(f"Indexing {len(posts)} published posts...")
    count = 0
    for post in posts:
        creator_name = post.creator.display_name if post.creator else ""
        search.upsert(post, creator_name)
        count += 1

    await engine.dispose()
    print(f"Indexed {count} documents.")
    print("Done.")


if __name__ == "__main__":
    sys.path.insert(0, "src")
    asyncio.run(main())
