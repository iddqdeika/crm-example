/** Slug sanitization (match backend: lowercase, hyphens, strip non-ASCII, trim, max 100). */
const SLUG_MAX_LENGTH = 100;

export function slugify(text: string): string {
  if (!text || typeof text !== "string") return "";
  let s = text.toLowerCase().trim();
  s = s.replace(/[\s_\-]+/g, "-");
  s = s.replace(/[^a-z0-9\-]/g, "");
  s = s.replace(/-+/g, "-").replace(/^-|-$/g, "");
  if (s.length > SLUG_MAX_LENGTH) {
    s = s.slice(0, SLUG_MAX_LENGTH).replace(/-+$/, "");
  }
  return s;
}
