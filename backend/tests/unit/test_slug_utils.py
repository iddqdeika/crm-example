"""Unit tests for slug sanitization (research: lowercase, hyphens, strip non-ASCII, trim, max 100)."""
import pytest


def test_slugify_lowercase():
    from core.slug import slugify
    assert slugify("Hello World") == "hello-world"


def test_slugify_replaces_spaces_with_hyphens():
    from core.slug import slugify
    assert slugify("my first post") == "my-first-post"


def test_slugify_strips_special_characters():
    from core.slug import slugify
    assert slugify("Hello! @World#") == "hello-world"


def test_slugify_removes_non_ascii():
    from core.slug import slugify
    # Non-ASCII stripped (no transliteration): é and ï removed
    assert slugify("Café naïve") == "caf-nave"


def test_slugify_trims_leading_trailing_hyphens():
    from core.slug import slugify
    assert slugify("  hello world  ") == "hello-world"


def test_slugify_collapses_multiple_hyphens():
    from core.slug import slugify
    assert slugify("hello---world") == "hello-world"


def test_slugify_max_100_characters():
    from core.slug import slugify
    long_title = "a" * 150
    result = slugify(long_title)
    assert len(result) == 100
    assert result == "a" * 100


def test_slugify_empty_returns_empty():
    from core.slug import slugify
    assert slugify("") == ""


def test_slugify_only_special_returns_empty():
    from core.slug import slugify
    assert slugify("!@#$%") == ""


def test_slugify_allows_digits():
    from core.slug import slugify
    assert slugify("Post 123") == "post-123"
