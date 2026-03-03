"""Slug sanitization for blog post URLs (lowercase, hyphens, ASCII only, max 100 chars)."""
import re

_SLUG_MAX_LENGTH = 100
# Allow only lowercase letters, digits, hyphens; no leading/trailing hyphen
_SLUG_PATTERN = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")


def slugify(text: str) -> str:
    """Convert title to URL-safe slug: lowercase, hyphens, strip non-ASCII, trim, max 100."""
    if not text or not isinstance(text, str):
        return ""
    s = text.lower().strip()
    # Replace spaces, underscores, multiple dashes with single hyphen
    s = re.sub(r"[\s_\-]+", "-", s)
    # Remove any character that is not a-z, 0-9, or hyphen
    s = re.sub(r"[^a-z0-9\-]", "", s)
    # Collapse consecutive hyphens and strip leading/trailing
    s = re.sub(r"-+", "-", s).strip("-")
    if len(s) > _SLUG_MAX_LENGTH:
        s = s[:_SLUG_MAX_LENGTH].rstrip("-")
    return s


def is_valid_slug(slug: str) -> bool:
    """Return True if slug matches allowed format (1-100 chars, [a-z0-9-], no leading/trailing hyphen)."""
    if not slug or len(slug) > _SLUG_MAX_LENGTH:
        return False
    return bool(_SLUG_PATTERN.match(slug))
