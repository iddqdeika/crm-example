"""In-memory StorageClient fake for use in tests."""


class FakeStorageClient:
    """In-memory implementation of StorageClient protocol for testing.

    Stores objects in a plain dict keyed by object key. Presigned URLs are
    deterministic fake URLs of the form ``http://fake-storage/{key}``.
    """

    def __init__(self) -> None:
        self.objects: dict[str, bytes] = {}

    async def put_object(self, key: str, data: bytes, content_type: str) -> None:  # noqa: ARG002
        self.objects[key] = data

    async def delete_object(self, key: str) -> None:
        self.objects.pop(key, None)

    async def get_presigned_url(self, key: str, expires_seconds: int = 3600) -> str:  # noqa: ARG002
        return f"http://fake-storage/{key}"
