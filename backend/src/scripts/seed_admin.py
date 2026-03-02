"""Seed an admin user for E2E testing. Idempotent — skips if user already exists."""
import asyncio
import os
import sys

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from models.base import Base  # noqa: E402
from models.user import User, UserRole  # noqa: E402
from models.profile import Profile  # noqa: E402, F401 — needed for User.profile relationship
from models.session import AuthenticationSession  # noqa: E402, F401
from services.auth_service import hash_password  # noqa: E402


async def seed_admin() -> None:
    email = os.environ.get("SEED_ADMIN_EMAIL")
    password = os.environ.get("SEED_ADMIN_PASSWORD")
    if not email or not password:
        print("SEED_ADMIN_EMAIL or SEED_ADMIN_PASSWORD not set, skipping seed.")
        return

    database_url = os.environ["DATABASE_URL"]
    engine = create_async_engine(database_url, echo=False)
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with factory() as session:
        result = await session.execute(select(User).where(User.email == email))
        existing = result.scalar_one_or_none()
        if existing:
            print(f"Admin user {email} already exists, skipping seed.")
            await engine.dispose()
            return

        user = User(
            email=email,
            hashed_password=hash_password(password),
            display_name="E2E Admin",
            role=UserRole.admin,
        )
        session.add(user)
        await session.commit()
        print(f"Admin user seeded: {email}")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(seed_admin())
