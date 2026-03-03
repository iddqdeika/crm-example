import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import BlogAuthLinks from "../components/BlogAuthLinks";
import RichTextRenderer from "../components/RichTextRenderer";
import { blogApi, type BlogPostDetailDto } from "../services/api";
import "./BlogPostPage.css";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<BlogPostDetailDto | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    blogApi
      .getBySlug(slug)
      .then((data) => {
        if (data && "redirectSlug" in data) {
          navigate(`/blog/post/${data.redirectSlug}`, { replace: true });
          return;
        }
        setPost(data as BlogPostDetailDto);
      })
      .catch((err: Error & { status?: number }) => {
        if (err?.status === 404) setNotFound(true);
      })
      .finally(() => setLoading(false));
  }, [slug, navigate]);

  if (loading) {
    return (
      <main className="blog-post-page">
        <p className="blog-post-page__loading">Loading…</p>
      </main>
    );
  }

  if (notFound || !post) {
    return (
      <main className="blog-post-page">
        <p className="blog-post-page__not-found">Post not found.</p>
        <Link to="/blog" className="blog-post-page__back">← Back to blog</Link>
      </main>
    );
  }

  const pageTitle = post.seo_title || post.title;
  const metaDescription = post.meta_description || post.title;
  const canonicalUrl =
    typeof window !== "undefined" && post.slug
      ? `${window.location.origin}/blog/post/${post.slug}`
      : undefined;

  return (
    <main className="blog-post-page">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={metaDescription} />
        {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
      </Helmet>
      <Link to="/blog" className="blog-post-page__back">← Back to blog</Link>
      <BlogAuthLinks />
      <article className="blog-post-page__article">
        <header className="blog-post-page__header">
          <h1 className="blog-post-page__title">{post.title}</h1>
          <div className="blog-post-page__meta">
            <span className="blog-post-page__author">{post.author_display}</span>
            <time className="blog-post-page__date" dateTime={post.created_at}>
              {formatDate(post.created_at)}
            </time>
            {post.is_edited && (
              <time className="blog-post-page__updated" dateTime={post.updated_at}>
                Last updated: {formatDate(post.updated_at)}
              </time>
            )}
          </div>
        </header>
        <RichTextRenderer html={post.body} />
      </article>
    </main>
  );
}
