# Data Model: Blog Section (011)

**Date**: 2026-03-02

---

## 1. PostgreSQL — New Table: `blog_posts`

```sql
CREATE TABLE blog_posts (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    title       VARCHAR(255) NOT NULL,
    body        TEXT        NOT NULL,
    author      VARCHAR(255),              -- optional free-text display name
    creator_id  UUID        NOT NULL
                    REFERENCES users(id)
                    ON DELETE RESTRICT,
    created_at  TIMESTAMP   NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_blog_posts_created_at ON blog_posts (created_at DESC);
CREATE INDEX idx_blog_posts_creator_id ON blog_posts (creator_id);
```

### Field descriptions

| Column | Type | Nullable | Notes |
|--------|------|----------|-------|
| `id` | UUID | NOT NULL | Auto-generated primary key |
| `title` | VARCHAR(255) | NOT NULL | Min 1 char; max 255 chars |
| `body` | TEXT | NOT NULL | HTML string from TipTap editor; min 1 char |
| `author` | VARCHAR(255) | NULL | Free-text display name; if null, public display falls back to creator's `display_name` |
| `creator_id` | UUID FK → users.id | NOT NULL | Auto-set to the authenticated user's id on creation; immutable after creation |
| `created_at` | TIMESTAMP | NOT NULL | Auto-set on INSERT; immutable |
| `updated_at` | TIMESTAMP | NOT NULL | Auto-set on INSERT; auto-updated on every UPDATE |

### Design notes

- **No `published` boolean**: All saved posts are public (per spec assumption). Draft state is out of scope.
- **`updated_at` serves as "last updated"**: The public reading page displays `updated_at` only when it differs from `created_at` (i.e., the post has been edited).
- **`author` is free-text**: Not a FK to the users table. Content managers may want to attribute authorship to an external person or a pen name.
- **`creator_id` is immutable**: Set at creation and never changed, even when another content-manager edits the post.
- **No soft delete**: Deletion is hard (permanent). Archive/restore is out of scope.

---

## 2. PostgreSQL — Modified Enum: `userrole`

The existing `userrole` PostgreSQL enum must gain a new value:

```sql
ALTER TYPE userrole ADD VALUE 'content_manager';
```

### Updated `UserRole` Python enum (`models/user.py`)

```python
class UserRole(str, enum.Enum):
    admin = "admin"
    buyer = "buyer"
    content_manager = "content_manager"   # NEW
```

### Role capability matrix (post-change)

| Capability | admin | buyer | content_manager |
|---|---|---|---|
| Campaigns (CRUD) | ✅ | ✅ | ❌ |
| Users / admin panel | ✅ | ❌ | ❌ |
| Blog posts (CRUD) | ✅ | ❌ | ✅ |
| Blog images (upload) | ✅ | ❌ | ✅ |
| Read blog (public) | ✅ | ✅ | ✅ |
| Read blog (no login) | ✅ | ✅ | ✅ |

---

## 3. SQLAlchemy Model

```python
# backend/src/models/blog_post.py
import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base


class BlogPost(Base):
    __tablename__ = "blog_posts"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    author: Mapped[str | None] = mapped_column(String(255), nullable=True)
    creator_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="RESTRICT"), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=datetime.utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    creator = relationship("User", backref="blog_posts")
```

---

## 4. Pydantic Schemas (overview)

```python
# backend/src/schemas/blog.py

class BlogPostCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    body: str = Field(..., min_length=1)
    author: str | None = Field(None, max_length=255)

class BlogPostUpdate(BaseModel):
    title: str | None = Field(None, min_length=1, max_length=255)
    body: str | None = Field(None, min_length=1)
    author: str | None = Field(None, max_length=255)   # None = clear; omit = unchanged

class BlogPostResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    title: str
    body: str
    author_display: str       # computed: author or creator.display_name
    creator_id: UUID
    creator_display_name: str
    created_at: datetime
    updated_at: datetime
    is_edited: bool           # True when updated_at != created_at

class BlogPostSummary(BaseModel):
    """For list views (no full body)."""
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    title: str
    body_excerpt: str         # first ~200 chars of plain text, server-side truncation
    author_display: str
    created_at: datetime
    updated_at: datetime
    is_edited: bool

class BlogPostListResponse(BaseModel):
    items: list[BlogPostSummary]
    total: int

class BlogSearchHit(BaseModel):
    """Meilisearch result item with highlighted fields."""
    id: str
    title: str                # plain or <em>-highlighted version
    body_snippet: str         # short highlighted body_plain excerpt
    author_display: str
    created_at_ts: int
```

---

## 5. Meilisearch Index: `blog_posts`

### Index settings (applied on service startup or via init script)

```json
{
  "indexUid": "blog_posts",
  "primaryKey": "id",
  "searchableAttributes": ["title", "body_plain", "author_display"],
  "displayedAttributes": ["id", "title", "body_plain", "author_display", "created_at_ts"],
  "rankingRules": ["words", "typo", "proximity", "attribute", "sort", "exactness"],
  "sortableAttributes": ["created_at_ts"],
  "highlightPreTag": "<em>",
  "highlightPostTag": "</em>"
}
```

### Document schema

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "How Quality Assurance Scales",
  "body_plain": "Plain text version of the post body with HTML tags stripped.",
  "author_display": "Jane Smith",
  "created_at_ts": 1740912000
}
```

**Notes**:
- `body_plain` is the HTML-stripped version of `body`; prevents indexing HTML markup
- `created_at_ts` is a Unix timestamp integer (sortable in Meilisearch)
- The index is updated synchronously after every successful PostgreSQL write
- Full index rebuild available via `python src/scripts/rebuild_search_index.py`

---

## 6. Alembic Migration

**File**: `backend/migrations/versions/20260302_001_blog_posts.py`

Operations in order:
1. `op.execute("ALTER TYPE userrole ADD VALUE 'content_manager'")` — add enum value (must be done outside a transaction in PostgreSQL; use `with op.get_context().autocommit_block():`)
2. `op.create_table('blog_posts', ...)` — create the table with all columns
3. `op.create_index('idx_blog_posts_created_at', 'blog_posts', ['created_at'], postgresql_using='btree')`
4. `op.create_index('idx_blog_posts_creator_id', 'blog_posts', ['creator_id'])`

**Downgrade**:
- Drop `blog_posts` table and indexes
- PostgreSQL does not support removing enum values (`ALTER TYPE ... DROP VALUE` is not available); downgrade leaves `content_manager` in the enum (harmless)

---

## 7. Entity Relationships

```
users (existing)
  │ 1
  │
  └──< blog_posts.creator_id   (many posts per user; RESTRICT delete)
```

No other entity relationships. `author` is a denormalized free-text string, not a FK.
