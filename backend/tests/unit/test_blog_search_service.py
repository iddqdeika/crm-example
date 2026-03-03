"""Unit tests for BlogSearchService — mock Meilisearch client."""
import uuid
from datetime import datetime
from unittest.mock import MagicMock, patch

import pytest

from services.blog_search_service import BlogSearchService


def _make_post(title: str = "Test Post", body: str = "<p>Hello world</p>", author: str | None = None):
    post = MagicMock()
    post.id = uuid.uuid4()
    post.title = title
    post.body = body
    post.author = author
    post.created_at = datetime(2026, 3, 2, 12, 0, 0)
    return post


@pytest.fixture
def mock_client():
    with patch("services.blog_search_service.meilisearch.Client") as MockClient:
        instance = MagicMock()
        MockClient.return_value = instance
        yield instance


@pytest.fixture
def search_service(mock_client):
    svc = BlogSearchService(url="http://localhost:7700", api_key="test-key")
    svc._client = mock_client
    return svc


def test_upsert_sends_correct_document_shape(search_service, mock_client):
    post = _make_post(title="My Blog Post", body="<p>Hello <strong>world</strong></p>")
    creator_display_name = "Jane Smith"

    mock_index = MagicMock()
    mock_client.index.return_value = mock_index

    search_service.upsert(post, creator_display_name)

    mock_client.index.assert_called_once_with("blog_posts")
    call_args = mock_index.add_documents.call_args
    docs = call_args[0][0]
    assert len(docs) == 1
    doc = docs[0]
    assert doc["id"] == str(post.id)
    assert doc["title"] == "My Blog Post"
    assert "<p>" not in doc["body_plain"]
    assert "Hello" in doc["body_plain"]
    assert doc["author_display"] == "Jane Smith"
    assert isinstance(doc["created_at_ts"], int)


def test_upsert_uses_author_when_set(search_service, mock_client):
    post = _make_post(author="Custom Author")
    mock_index = MagicMock()
    mock_client.index.return_value = mock_index

    search_service.upsert(post, "Creator Name")

    docs = mock_index.add_documents.call_args[0][0]
    assert docs[0]["author_display"] == "Custom Author"


def test_upsert_falls_back_to_creator_when_author_none(search_service, mock_client):
    post = _make_post(author=None)
    mock_index = MagicMock()
    mock_client.index.return_value = mock_index

    search_service.upsert(post, "Creator Name")

    docs = mock_index.add_documents.call_args[0][0]
    assert docs[0]["author_display"] == "Creator Name"


def test_delete_calls_index_delete(search_service, mock_client):
    post_id = uuid.uuid4()
    mock_index = MagicMock()
    mock_client.index.return_value = mock_index

    search_service.delete(post_id)

    mock_client.index.assert_called_once_with("blog_posts")
    mock_index.delete_document.assert_called_once_with(str(post_id))


def test_search_maps_formatted_fields(search_service, mock_client):
    mock_index = MagicMock()
    mock_client.index.return_value = mock_index
    mock_index.search.return_value = {
        "hits": [
            {
                "id": "abc-123",
                "title": "Raw Title",
                "body_plain": "Raw body",
                "author_display": "Jane",
                "created_at_ts": 1740912000,
                "_formatted": {
                    "title": "<em>highlighted</em> Title",
                    "body_plain": "Raw body <em>match</em>",
                },
            }
        ],
        "estimatedTotalHits": 1,
    }

    result = search_service.search("match", limit=10, page=1)

    assert result.total == 1
    hit = result.items[0]
    assert hit.title == "<em>highlighted</em> Title"
    assert "<em>match</em>" in hit.body_snippet
    assert hit.is_search_result is True


def test_upsert_swallows_meilisearch_errors(search_service, mock_client):
    """Meilisearch errors must not propagate to the caller."""
    post = _make_post()
    mock_index = MagicMock()
    mock_client.index.return_value = mock_index
    mock_index.add_documents.side_effect = Exception("Connection refused")

    # Should not raise
    search_service.upsert(post, "creator")


def test_delete_swallows_meilisearch_errors(search_service, mock_client):
    mock_index = MagicMock()
    mock_client.index.return_value = mock_index
    mock_index.delete_document.side_effect = Exception("timeout")

    # Should not raise
    search_service.delete(uuid.uuid4())


def test_delete_all_documents_calls_index(search_service, mock_client):
    mock_index = MagicMock()
    mock_client.index.return_value = mock_index

    search_service.delete_all_documents()

    mock_client.index.assert_called_once_with("blog_posts")
    mock_index.delete_all_documents.assert_called_once()
