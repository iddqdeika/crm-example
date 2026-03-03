import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import RichTextEditor from "../components/RichTextEditor";
import RichTextRenderer from "../components/RichTextRenderer";
import { blogApi, type BlogPostDetailDto } from "../services/api";
import { slugify } from "../utils/slug";
import "./BlogManageEditPage.css";

export default function BlogManageEditPage() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [author, setAuthor] = useState("");
  const [slug, setSlug] = useState("");
  const [seoTitle, setSeoTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const slugManuallyEdited = useRef(false);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [slugTaken, setSlugTaken] = useState(false);

  useEffect(() => {
    if (!slug.trim()) {
      setSlugTaken(false);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const res = await blogApi.checkSlug({
          slug: slug.trim(),
          ...(isEdit && id ? { exclude_post_id: id } : {}),
        });
        setSlugTaken(!res.available);
      } catch {
        setSlugTaken(false);
      }
    }, 500);
    return () => clearTimeout(t);
  }, [slug, isEdit, id]);

  useEffect(() => {
    if (!isEdit || !id) return;
    blogApi
      .get(id)
      .then((post: BlogPostDetailDto) => {
        setTitle(post.title);
        setBody(post.body);
        setAuthor(post.author_display === post.creator_display_name ? "" : post.author_display);
        setSlug(post.slug ?? slugify(post.title));
        setSeoTitle(post.seo_title ?? "");
        setMetaDescription(post.meta_description ?? "");
        setStatus((post.status === "published" ? "published" : "draft") as "draft" | "published");
      })
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  useEffect(() => {
    if (slugManuallyEdited.current) return;
    setSlug(slugify(title));
  }, [title]);

  const handleSave = useCallback(
    async (newStatus: "draft" | "published") => {
      if (!title.trim()) {
        setError("Title is required.");
        return;
      }
      if (!body.trim() || body === "<p></p>") {
        setError("Body is required.");
        return;
      }
      const slugVal = slug.trim() || slugify(title.trim()) || "post";
      setError("");
      setSaving(true);
      try {
        const payload = {
          title: title.trim(),
          body,
          author: author.trim() || null,
          slug: slugVal,
          status: newStatus,
          seo_title: seoTitle.trim() || null,
          meta_description: metaDescription.trim() || null,
        };
        if (isEdit && id) {
          await blogApi.update(id, payload);
        } else {
          await blogApi.create(payload);
        }
        navigate("/blog/manage");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Save failed.");
      } finally {
        setSaving(false);
      }
    },
    [id, isEdit, title, body, author, slug, seoTitle, metaDescription, navigate]
  );

  if (loading) {
    return (
      <main className="blog-manage-edit">
        <p>Loading…</p>
      </main>
    );
  }

  return (
    <main className="blog-manage-edit">
      <div className="blog-manage-edit__header">
        <Link to="/blog/manage" className="blog-manage-edit__back">← Back to posts</Link>
        <h1 className="blog-manage-edit__heading">
          {isEdit ? "Edit post" : "New post"}
        </h1>
      </div>

      <div className="blog-manage-edit__form">
        <div className="blog-manage-edit__field">
          <label htmlFor="post-title" className="blog-manage-edit__label">
            Title <span aria-hidden="true">*</span>
          </label>
          <input
            id="post-title"
            type="text"
            className="blog-manage-edit__input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Post title"
            aria-required="true"
          />
        </div>

        <div className="blog-manage-edit__field">
          <label htmlFor="post-slug" className="blog-manage-edit__label">
            URL slug
          </label>
          <input
            id="post-slug"
            type="text"
            className="blog-manage-edit__input"
            value={slug}
            onChange={(e) => {
              slugManuallyEdited.current = true;
              setSlug(e.target.value);
            }}
            placeholder="my-post-title"
            data-testid="post-slug-input"
          />
          {slugTaken && (
            <p className="blog-manage-edit__slug-warning" role="alert" data-testid="slug-taken-warning">
              This URL is already taken. Choose a different slug.
            </p>
          )}
        </div>

        <div className="blog-manage-edit__field">
          <label htmlFor="post-author" className="blog-manage-edit__label">
            Author (optional)
          </label>
          <input
            id="post-author"
            type="text"
            className="blog-manage-edit__input"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="Leave blank to use your display name"
          />
        </div>

        <div className="blog-manage-edit__seo">
          <h3 className="blog-manage-edit__seo-heading">SEO</h3>
          <div className="blog-manage-edit__field">
            <label htmlFor="post-seo-title" className="blog-manage-edit__label">
              SEO title (max 60 characters)
            </label>
            <input
              id="post-seo-title"
              type="text"
              className="blog-manage-edit__input"
              value={seoTitle}
              onChange={(e) => setSeoTitle(e.target.value.slice(0, 60))}
              placeholder="Leave blank to use post title"
              maxLength={60}
              data-testid="seo-title-input"
            />
            <span className="blog-manage-edit__char-count" aria-live="polite">
              {seoTitle.length}/60
            </span>
          </div>
          <div className="blog-manage-edit__field">
            <label htmlFor="post-meta-desc" className="blog-manage-edit__label">
              Meta description (max 160 characters)
            </label>
            <textarea
              id="post-meta-desc"
              className="blog-manage-edit__input blog-manage-edit__input--textarea"
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value.slice(0, 160))}
              placeholder="Short description for search results"
              maxLength={160}
              rows={3}
              data-testid="meta-description-input"
            />
            <span className="blog-manage-edit__char-count" aria-live="polite">
              {metaDescription.length}/160
            </span>
          </div>
        </div>

        <div className="blog-manage-edit__field">
          <div className="blog-manage-edit__body-header">
            <label className="blog-manage-edit__label">
              Body <span aria-hidden="true">*</span>
            </label>
            <button
              type="button"
              className="blog-manage-edit__preview-btn"
              onClick={() => setShowPreview((v) => !v)}
              data-testid="preview-btn"
            >
              {showPreview ? "Edit" : "Preview"}
            </button>
          </div>

          {showPreview ? (
            <div className="blog-manage-edit__preview" data-testid="post-preview">
              <h2 className="blog-manage-edit__preview-title">{title || "No title"}</h2>
              <RichTextRenderer html={body} />
            </div>
          ) : (
            <RichTextEditor value={body} onChange={setBody} />
          )}
        </div>

        {error && <p className="blog-manage-edit__error" role="alert">{error}</p>}

        <div className="blog-manage-edit__actions">
          <button
            type="button"
            className="blog-manage-edit__save-btn blog-manage-edit__save-btn--draft"
            onClick={() => handleSave("draft")}
            disabled={saving}
            data-testid="save-draft-btn"
          >
            {saving ? "Saving…" : "Save draft"}
          </button>
          <button
            type="button"
            className="blog-manage-edit__save-btn blog-manage-edit__save-btn--publish"
            onClick={() => handleSave("published")}
            disabled={saving}
            data-testid="publish-post-btn"
          >
            {saving ? "Saving…" : isEdit && status === "published" ? "Update" : "Publish"}
          </button>
          <Link to="/blog/manage" className="blog-manage-edit__cancel">
            Cancel
          </Link>
        </div>
      </div>
    </main>
  );
}
