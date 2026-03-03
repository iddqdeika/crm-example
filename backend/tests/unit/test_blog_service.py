"""Unit tests for blog_service — verify Meilisearch sync calls."""
import uuid
from datetime import datetime
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import AsyncSession

from models.blog_post import BlogPost
from models.user import User, UserRole
from schemas.blog import BlogPostCreate, BlogPostUpdate
from services import blog_service


def _make_user():
    u = MagicMock(spec=User)
    u.id = uuid.uuid4()
    u.display_name = "Test Creator"
    u.role = UserRole.content_manager
    return u


def _make_session(post):
    db = MagicMock(spec=AsyncSession)
    db.add = MagicMock()
    db.flush = AsyncMock()
    db.refresh = AsyncMock()
    db.delete = AsyncMock()
    # Simulate `db.execute(select(BlogPost).where(...))` returning a result with the post
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = post
    db.execute = AsyncMock(return_value=mock_result)
    return db


@pytest.mark.asyncio
async def test_create_calls_search_upsert():
    from types import SimpleNamespace
    search_service = MagicMock()
    creator = SimpleNamespace(id=uuid.uuid4(), display_name="Test Creator")
    now = datetime.utcnow()
    post_id = uuid.uuid4()
    post = SimpleNamespace(
        id=post_id,
        title="Test",
        body="<p>body</p>",
        author=None,
        creator_id=creator.id,
        creator=creator,
        created_at=now,
        updated_at=now,
    )
    db = MagicMock(spec=AsyncSession)
    db.add = MagicMock()
    db.flush = AsyncMock()
    db.refresh = AsyncMock()

    # Intercept the BlogPost constructor and skip slug-availability check (no real DB)
    with (
        patch("services.blog_service.BlogPost", return_value=post),
        patch("services.blog_service.check_slug_available", new_callable=AsyncMock, return_value=True),
    ):
        await blog_service.create_post(
            db,
            creator.id,
            BlogPostCreate(title="Test", body="<p>body</p>", slug="test", status="published"),
            search_service=search_service,
        )

    search_service.upsert.assert_called_once()
    call_args = search_service.upsert.call_args
    assert call_args[0][0] is post
    assert call_args[0][1] == "Test Creator"


@pytest.mark.asyncio
async def test_delete_calls_search_delete():
    search_service = MagicMock()
    user = _make_user()
    now = datetime.utcnow()
    post_id = uuid.uuid4()
    post = BlogPost(
        id=post_id,
        title="Delete Me",
        body="<p>body</p>",
        creator_id=user.id,
        created_at=now,
        updated_at=now,
    )
    db = _make_session(post)
    db.delete = AsyncMock()

    await blog_service.delete_post(db, post_id, search_service=search_service)

    search_service.delete.assert_called_once_with(post_id)


@pytest.mark.asyncio
async def test_update_published_post_calls_search_upsert():
    from types import SimpleNamespace

    search_service = MagicMock()
    user = _make_user()
    now = datetime.utcnow()
    post_id = uuid.uuid4()
    post = SimpleNamespace(
        id=post_id,
        title="Original title",
        body="<p>original</p>",
        author=None,
        creator_id=user.id,
        creator=user,
        created_at=now,
        updated_at=now,
        slug="original-slug",
        status="published",
        seo_title=None,
        meta_description=None,
    )
    db = _make_session(post)

    with patch("services.blog_service.check_slug_available", new_callable=AsyncMock, return_value=True):
        await blog_service.update_post(
            db,
            post_id,
            BlogPostUpdate(title="Updated title", body="<p>updated</p>"),
            search_service=search_service,
        )

    search_service.upsert.assert_called_once()
    call_args = search_service.upsert.call_args
    assert call_args[0][0] is post
    assert call_args[0][1] == "Test Creator"


@pytest.mark.asyncio
async def test_update_unpublishes_post_calls_search_delete():
    from types import SimpleNamespace

    search_service = MagicMock()
    user = _make_user()
    now = datetime.utcnow()
    post_id = uuid.uuid4()
    post = SimpleNamespace(
        id=post_id,
        title="To unpublish",
        body="<p>body</p>",
        author=None,
        creator_id=user.id,
        creator=user,
        created_at=now,
        updated_at=now,
        slug="to-unpublish",
        status="published",
        seo_title=None,
        meta_description=None,
    )
    db = _make_session(post)

    with patch("services.blog_service.check_slug_available", new_callable=AsyncMock, return_value=True):
        await blog_service.update_post(
            db,
            post_id,
            BlogPostUpdate(status="draft"),
            search_service=search_service,
        )

    search_service.delete.assert_called_once_with(post_id)


@pytest.mark.asyncio
async def test_rebuild_search_index_clears_and_indexes_published_posts():
    from types import SimpleNamespace

    search_service = MagicMock()
    user = _make_user()
    now = datetime.utcnow()
    post1 = SimpleNamespace(
        id=uuid.uuid4(),
        title="Post 1",
        body="<p>one</p>",
        author=None,
        creator_id=user.id,
        creator=user,
        created_at=now,
        updated_at=now,
        slug="post-1",
        status="published",
        seo_title=None,
        meta_description=None,
    )
    post2 = SimpleNamespace(
        id=uuid.uuid4(),
        title="Post 2",
        body="<p>two</p>",
        author=None,
        creator_id=user.id,
        creator=user,
        created_at=now,
        updated_at=now,
        slug="post-2",
        status="published",
        seo_title=None,
        meta_description=None,
    )
    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = [post1, post2]
    db = MagicMock(spec=AsyncSession)
    db.execute = AsyncMock(return_value=mock_result)

    count = await blog_service.rebuild_search_index(db, search_service)

    assert count == 2
    search_service.delete_all_documents.assert_called_once()
    assert search_service.upsert.call_count == 2
    search_service.upsert.assert_any_call(post1, "Test Creator")
    search_service.upsert.assert_any_call(post2, "Test Creator")
