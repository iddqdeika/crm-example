"""Backfill slug and status for blog posts that have no slug (e.g. created before 012).

For each post without slug: set slug from slugify(title), resolve collisions with -2, -3
by created_at (oldest keeps base slug); set status=published.

Usage (from backend/ with PYTHONPATH=src or from backend/src):
    python -m scripts.migrate_blog_slugs
    # or: python src/scripts/migrate_blog_slugs.py (with PYTHONPATH=src)
"""
import asyncio
import os
import sys

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

# Allow running from backend/ or backend/src
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from core.slug import slugify  # noqa: E402
from models.blog_post import BlogPost  # noqa: E402


async def main() -> None:
    from core.settings import get_settings

    settings = get_settings()
    engine = create_async_engine(settings.database_url, echo=False)
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with factory() as session:
        result = await session.execute(
            select(BlogPost)
            .where(BlogPost.slug.is_(None) | (BlogPost.slug == ""))
            .order_by(BlogPost.created_at.asc())
        )
        posts = result.scalars().all()

        if not posts:
            print("No posts without slug found. Nothing to do.")
            await engine.dispose()
            return

        print(f"Found {len(posts)} post(s) without slug. Backfilling...")
        assigned: set[str] = set()

        for post in posts:
            base = slugify(post.title) if post.title else "post"
            if not base:
                base = "post"
            candidate = base
            n = 2
            while True:
                if candidate not in assigned:
                    check = await session.execute(
                        select(BlogPost.id).where(BlogPost.slug == candidate)
                    )
                    if check.scalar_one_or_none() is None:
                        break
                candidate = f"{base}-{n}"
                n += 1
                if len(candidate) > 100:
                    candidate = candidate[:100].rstrip("-")

            post.slug = candidate
            post.status = "published"
            assigned.add(candidate)
            session.add(post)
            print(f"  {post.id}: slug={candidate!r}, status=published")

        await session.commit()

    await engine.dispose()
    print("Done. Run rebuild_search_index if you use Meilisearch, so search reflects slugs.")


if __name__ == "__main__":
    asyncio.run(main())
