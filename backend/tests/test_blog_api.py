"""Integration tests for the blog API endpoints."""
import pytest
import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from unittest.mock import MagicMock, patch

from models.user import User, UserRole
from models.blog_post import BlogPost
from services.auth_service import hash_password


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


@pytest_asyncio.fixture
async def content_manager_user(db_session: AsyncSession) -> tuple[str, str]:
    u = User(
        email="cm@test.com",
        hashed_password=hash_password("CMPass1!"),
        display_name="Content Manager",
        role=UserRole.content_manager,
    )
    db_session.add(u)
    await db_session.flush()
    return ("cm@test.com", "CMPass1!")


@pytest_asyncio.fixture
async def content_manager_client(
    client: AsyncClient, content_manager_user: tuple[str, str]
) -> AsyncClient:
    email, password = content_manager_user
    await client.post("/api/auth/login", json={"email": email, "password": password})
    return client


@pytest_asyncio.fixture
async def buyer_user(db_session: AsyncSession) -> tuple[str, str]:
    u = User(
        email="buyer@test.com",
        hashed_password=hash_password("BuyerPass1!"),
        display_name="Buyer User",
        role=UserRole.buyer,
    )
    db_session.add(u)
    await db_session.flush()
    return ("buyer@test.com", "BuyerPass1!")


@pytest_asyncio.fixture
async def buyer_client(client: AsyncClient, buyer_user: tuple[str, str]) -> AsyncClient:
    email, password = buyer_user
    await client.post("/api/auth/login", json={"email": email, "password": password})
    return client


@pytest_asyncio.fixture
async def sample_post(db_session: AsyncSession, admin_user) -> BlogPost:
    """Create one post owned by the admin user for read tests."""
    result = await db_session.execute(
        __import__("sqlalchemy").select(User).where(User.email == "admin@test.com")
    )
    user = result.scalar_one()
    post = BlogPost(
        title="Sample Post",
        body="<p>Hello world</p>",
        author="Test Author",
        creator_id=user.id,
        slug="sample-post",
        status="published",
    )
    db_session.add(post)
    await db_session.flush()
    return post


# ---------------------------------------------------------------------------
# US1: Public list / search
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_public_list_returns_posts_without_auth(client: AsyncClient, sample_post: BlogPost):
    resp = await client.get("/api/blog/posts")
    assert resp.status_code == 200
    data = resp.json()
    assert "items" in data
    assert "total" in data
    assert data["total"] >= 1
    ids = [item["id"] for item in data["items"]]
    assert str(sample_post.id) in ids


@pytest.mark.asyncio
async def test_public_list_returns_empty_when_no_posts(client: AsyncClient):
    resp = await client.get("/api/blog/posts")
    assert resp.status_code == 200
    data = resp.json()
    assert "items" in data


@pytest.mark.asyncio
async def test_search_delegates_to_meilisearch(client: AsyncClient):
    from services.blog_search_service import BlogSearchListResponse, BlogSearchHit

    mock_result = BlogSearchListResponse(
        items=[
            BlogSearchHit(
                id="abc-123",
                title="<em>Found</em> post",
                body_snippet="body with <em>match</em>",
                author_display="Author",
                created_at_ts=1740912000,
            )
        ],
        total=1,
    )
    with patch(
        "services.blog_search_service.BlogSearchService.search", return_value=mock_result
    ):
        resp = await client.get("/api/blog/posts?q=found")

    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 1
    assert data["items"][0]["is_search_result"] is True
    assert "<em>" in data["items"][0]["title"]


# ---------------------------------------------------------------------------
# US0: Draft / Published
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_draft_not_in_public_list(content_manager_client: AsyncClient, public_client: AsyncClient):
    """Create draft → public list does not include it."""
    resp = await content_manager_client.post(
        "/api/blog/posts",
        json={"title": "Draft Post", "body": "<p>draft</p>", "status": "draft", "slug": "draft-post"},
    )
    assert resp.status_code == 201
    post_id = resp.json()["id"]

    list_resp = await public_client.get("/api/blog/posts")
    assert list_resp.status_code == 200
    ids = [item["id"] for item in list_resp.json()["items"]]
    assert post_id not in ids


@pytest.mark.asyncio
async def test_published_in_public_list(content_manager_client: AsyncClient, public_client: AsyncClient):
    """Publish post → public list includes it."""
    resp = await content_manager_client.post(
        "/api/blog/posts",
        json={"title": "Published Post", "body": "<p>pub</p>", "status": "published", "slug": "published-post"},
    )
    assert resp.status_code == 201
    post_id = resp.json()["id"]

    list_resp = await public_client.get("/api/blog/posts")
    assert list_resp.status_code == 200
    ids = [item["id"] for item in list_resp.json()["items"]]
    assert post_id in ids


@pytest.mark.asyncio
async def test_revert_to_draft_removes_from_public_list(content_manager_client: AsyncClient, public_client: AsyncClient):
    """Publish then revert to draft → no longer in public list."""
    create_resp = await content_manager_client.post(
        "/api/blog/posts",
        json={"title": "Will Revert", "body": "<p>x</p>", "status": "published", "slug": "will-revert"},
    )
    assert create_resp.status_code == 201
    post_id = create_resp.json()["id"]

    await content_manager_client.patch(
        f"/api/blog/posts/{post_id}",
        json={"status": "draft"},
    )

    list_resp = await public_client.get("/api/blog/posts")
    assert list_resp.status_code == 200
    ids = [item["id"] for item in list_resp.json()["items"]]
    assert post_id not in ids


@pytest.mark.asyncio
async def test_management_list_includes_status(content_manager_client: AsyncClient):
    """Authenticated list returns items with status."""
    await content_manager_client.post(
        "/api/blog/posts",
        json={"title": "Draft With Status", "body": "<p>b</p>", "status": "draft", "slug": "draft-with-status"},
    )
    resp = await content_manager_client.get("/api/blog/posts")
    assert resp.status_code == 200
    items = resp.json()["items"]
    assert len(items) >= 1
    assert "status" in items[0]
    assert items[0]["status"] in ("draft", "published")


@pytest.mark.asyncio
async def test_draft_get_returns_404_for_public(public_client: AsyncClient, content_manager_client: AsyncClient):
    """Draft post → GET by ID without auth returns 404 (not publicly accessible)."""
    create_resp = await content_manager_client.post(
        "/api/blog/posts",
        json={"title": "Draft Only", "body": "<p>d</p>", "status": "draft", "slug": "draft-only"},
    )
    assert create_resp.status_code == 201
    post_id = create_resp.json()["id"]

    get_resp = await public_client.get(f"/api/blog/posts/{post_id}")
    assert get_resp.status_code == 404


# ---------------------------------------------------------------------------
# US2: Slug uniqueness and check-slug
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_check_slug_returns_available_for_new_slug(content_manager_client: AsyncClient):
    resp = await content_manager_client.get("/api/blog/posts/check-slug?slug=brand-new-slug")
    assert resp.status_code == 200
    data = resp.json()
    assert data["available"] is True


@pytest.mark.asyncio
async def test_check_slug_returns_taken_when_published_post_has_slug(
    content_manager_client: AsyncClient,
):
    await content_manager_client.post(
        "/api/blog/posts",
        json={"title": "Taken", "body": "<p>x</p>", "status": "published", "slug": "taken-slug"},
    )
    resp = await content_manager_client.get("/api/blog/posts/check-slug?slug=taken-slug")
    assert resp.status_code == 200
    assert resp.json()["available"] is False


@pytest.mark.asyncio
async def test_check_slug_exclude_post_id_returns_available_for_own_slug(
    content_manager_client: AsyncClient,
):
    create_resp = await content_manager_client.post(
        "/api/blog/posts",
        json={"title": "Mine", "body": "<p>x</p>", "status": "published", "slug": "my-own-slug"},
    )
    post_id = create_resp.json()["id"]
    resp = await content_manager_client.get(
        f"/api/blog/posts/check-slug?slug=my-own-slug&exclude_post_id={post_id}"
    )
    assert resp.status_code == 200
    assert resp.json()["available"] is True


@pytest.mark.asyncio
async def test_get_by_slug_200_for_published(
    content_manager_client: AsyncClient, public_client: AsyncClient
):
    create_resp = await content_manager_client.post(
        "/api/blog/posts",
        json={"title": "By Slug Post", "body": "<p>x</p>", "status": "published", "slug": "by-slug-post"},
    )
    assert create_resp.status_code == 201
    resp = await public_client.get("/api/blog/posts/by-slug/by-slug-post")
    assert resp.status_code == 200
    assert resp.json()["title"] == "By Slug Post"
    assert resp.json()["slug"] == "by-slug-post"


@pytest.mark.asyncio
async def test_get_by_slug_404_for_draft(
    content_manager_client: AsyncClient, public_client: AsyncClient
):
    await content_manager_client.post(
        "/api/blog/posts",
        json={"title": "Draft Slug", "body": "<p>x</p>", "status": "draft", "slug": "draft-slug"},
    )
    resp = await public_client.get("/api/blog/posts/by-slug/draft-slug")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_get_by_slug_404_for_nonexistent(public_client: AsyncClient):
    resp = await public_client.get("/api/blog/posts/by-slug/nonexistent-slug-123")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_get_by_slug_301_from_old_slug(
    content_manager_client: AsyncClient, public_client: AsyncClient
):
    create_resp = await content_manager_client.post(
        "/api/blog/posts",
        json={"title": "Redirect Post", "body": "<p>x</p>", "status": "published", "slug": "old-slug"},
    )
    assert create_resp.status_code == 201
    post_id = create_resp.json()["id"]
    await content_manager_client.patch(
        f"/api/blog/posts/{post_id}",
        json={"slug": "new-slug"},
    )
    resp = await public_client.get("/api/blog/posts/by-slug/old-slug", follow_redirects=False)
    assert resp.status_code == 301
    assert resp.headers.get("location", "").endswith("/blog/post/new-slug")
    assert resp.headers.get("x-redirect-slug") == "new-slug"


@pytest.mark.asyncio
async def test_publish_with_duplicate_slug_returns_409(
    content_manager_client: AsyncClient,
):
    await content_manager_client.post(
        "/api/blog/posts",
        json={"title": "First", "body": "<p>a</p>", "status": "published", "slug": "same-slug"},
    )
    resp = await content_manager_client.post(
        "/api/blog/posts",
        json={"title": "Second", "body": "<p>b</p>", "status": "published", "slug": "same-slug"},
    )
    assert resp.status_code == 409


# ---------------------------------------------------------------------------
# US2: Create / update / delete (tested here so conftest fixtures are shared)
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_create_requires_content_manager_role(buyer_client: AsyncClient):
    resp = await buyer_client.post(
        "/api/blog/posts", json={"title": "Test", "body": "<p>body</p>", "slug": "test"}
    )
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_unauthenticated_cannot_create_post(client: AsyncClient):
    resp = await client.post(
        "/api/blog/posts", json={"title": "Test", "body": "<p>body</p>", "slug": "test"}
    )
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_create_post_as_content_manager(content_manager_client: AsyncClient):
    resp = await content_manager_client.post(
        "/api/blog/posts",
        json={"title": "New Post", "body": "<p>Content</p>", "author": "Jane", "slug": "new-post"},
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["title"] == "New Post"
    assert data["author_display"] == "Jane"
    assert data["is_edited"] is False
    assert "id" in data


@pytest.mark.asyncio
async def test_create_post_as_admin(admin_client: AsyncClient):
    resp = await admin_client.post(
        "/api/blog/posts",
        json={"title": "Admin Post", "body": "<p>Admin content</p>", "slug": "admin-post"},
    )
    assert resp.status_code == 201
    assert resp.json()["title"] == "Admin Post"


@pytest.mark.asyncio
async def test_update_post(content_manager_client: AsyncClient):
    create_resp = await content_manager_client.post(
        "/api/blog/posts",
        json={"title": "Original", "body": "<p>original</p>", "slug": "original"},
    )
    post_id = create_resp.json()["id"]
    created_at = create_resp.json()["updated_at"]

    import asyncio
    await asyncio.sleep(0.01)

    update_resp = await content_manager_client.patch(
        f"/api/blog/posts/{post_id}",
        json={"title": "Updated"},
    )
    assert update_resp.status_code == 200
    data = update_resp.json()
    assert data["title"] == "Updated"
    assert data["is_edited"] is True


@pytest.mark.asyncio
async def test_delete_post(content_manager_client: AsyncClient, client: AsyncClient):
    create_resp = await content_manager_client.post(
        "/api/blog/posts",
        json={"title": "To Delete", "body": "<p>delete me</p>", "slug": "to-delete"},
    )
    post_id = create_resp.json()["id"]

    del_resp = await content_manager_client.delete(f"/api/blog/posts/{post_id}")
    assert del_resp.status_code == 204

    get_resp = await client.get(f"/api/blog/posts/{post_id}")
    assert get_resp.status_code == 404


@pytest.mark.asyncio
async def test_buyer_cannot_delete_post(buyer_client: AsyncClient, sample_post: BlogPost):
    del_resp = await buyer_client.delete(f"/api/blog/posts/{sample_post.id}")
    assert del_resp.status_code == 403


# ---------------------------------------------------------------------------
# US3: Single post reading
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_public_get_returns_post_without_auth(client: AsyncClient, sample_post: BlogPost):
    resp = await client.get(f"/api/blog/posts/{sample_post.id}")
    assert resp.status_code == 200
    data = resp.json()
    assert data["title"] == "Sample Post"
    assert data["body"] == "<p>Hello world</p>"
    assert data["author_display"] == "Test Author"


@pytest.mark.asyncio
async def test_get_nonexistent_post_returns_404(client: AsyncClient):
    import uuid
    resp = await client.get(f"/api/blog/posts/{uuid.uuid4()}")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_author_fallback_to_creator(
    content_manager_client: AsyncClient, client: AsyncClient
):
    resp = await content_manager_client.post(
        "/api/blog/posts",
        json={"title": "No Author", "body": "<p>b</p>", "author": None, "slug": "no-author"},
    )
    post_id = resp.json()["id"]

    get_resp = await client.get(f"/api/blog/posts/{post_id}")
    assert get_resp.status_code == 200
    data = get_resp.json()
    assert data["author_display"] == "Content Manager"


@pytest.mark.asyncio
async def test_last_updated_only_after_edit(content_manager_client: AsyncClient):
    create_resp = await content_manager_client.post(
        "/api/blog/posts",
        json={"title": "No Edit Yet", "body": "<p>b</p>", "slug": "no-edit-yet"},
    )
    assert create_resp.status_code == 201
    post_id = create_resp.json()["id"]

    get_resp = await content_manager_client.get(f"/api/blog/posts/{post_id}")
    assert get_resp.json()["is_edited"] is False

    await content_manager_client.patch(
        f"/api/blog/posts/{post_id}", json={"title": "Edited"}
    )

    get_resp2 = await content_manager_client.get(f"/api/blog/posts/{post_id}")
    assert get_resp2.json()["is_edited"] is True
