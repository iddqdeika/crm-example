"""Object storage abstraction: StorageClient protocol + S3/MinIO implementation."""
import asyncio
import uuid
from functools import partial
from typing import TYPE_CHECKING, Protocol

import boto3
from botocore.exceptions import BotoCoreError, ClientError

from core.settings import Settings, get_settings

if TYPE_CHECKING:
    pass


class StorageError(Exception):
    """Raised when the storage backend is unavailable or returns an unexpected error."""


def media_key(category: str, user_id: str | uuid.UUID, file_id: str | uuid.UUID, ext: str) -> str:
    """Generate a storage object key for any media category.

    Examples:
        avatars/{user_id}/{avatar_id}.jpg
        documents/{user_id}/{doc_id}.pdf
    """
    clean_ext = ext if ext.startswith(".") else f".{ext}"
    return f"{category}/{user_id}/{file_id}{clean_ext}"


class StorageClient(Protocol):
    """Protocol for durable object storage operations."""

    async def put_object(self, key: str, data: bytes, content_type: str) -> None:
        """Store *data* at *key*. Raises StorageError on backend failure."""
        ...

    async def delete_object(self, key: str) -> None:
        """Delete the object at *key*. No-op if key does not exist."""
        ...

    async def get_presigned_url(self, key: str, expires_seconds: int = 3600) -> str:
        """Return a time-limited URL allowing direct download of the object."""
        ...


class S3StorageClient:
    """StorageClient backed by MinIO / AWS S3 via boto3 (sync calls in executor)."""

    def __init__(self, settings: Settings | None = None) -> None:
        s = settings or get_settings()
        self._bucket = s.storage_bucket
        self._public_url = s.storage_public_url.rstrip("/")
        self._client = boto3.client(
            "s3",
            endpoint_url=s.storage_endpoint_url,
            aws_access_key_id=s.storage_access_key,
            aws_secret_access_key=s.storage_secret_key,
        )

    def _run(self, fn, *args, **kwargs):
        """Run a sync boto3 call in the default executor."""
        loop = asyncio.get_event_loop()
        return loop.run_in_executor(None, partial(fn, *args, **kwargs))

    async def put_object(self, key: str, data: bytes, content_type: str) -> None:
        try:
            await self._run(
                self._client.put_object,
                Bucket=self._bucket,
                Key=key,
                Body=data,
                ContentType=content_type,
            )
        except (BotoCoreError, ClientError) as exc:
            raise StorageError(str(exc)) from exc

    async def delete_object(self, key: str) -> None:
        try:
            await self._run(
                self._client.delete_object,
                Bucket=self._bucket,
                Key=key,
            )
        except (BotoCoreError, ClientError) as exc:
            raise StorageError(str(exc)) from exc

    async def get_presigned_url(self, key: str, expires_seconds: int = 3600) -> str:
        try:
            url: str = await self._run(
                self._client.generate_presigned_url,
                "get_object",
                Params={"Bucket": self._bucket, "Key": key},
                ExpiresIn=expires_seconds,
            )
            # Replace internal endpoint with public URL so browsers can reach it.
            internal = self._client.meta.endpoint_url or ""
            if internal and url.startswith(internal):
                url = self._public_url + url[len(internal):]
            return url
        except (BotoCoreError, ClientError) as exc:
            raise StorageError(str(exc)) from exc


def get_storage_client() -> StorageClient:
    """FastAPI dependency: returns a configured S3StorageClient."""
    return S3StorageClient()
