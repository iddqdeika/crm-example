import { Link } from "react-router-dom";
import "./BlogPostCard.css";

type Props = {
  id: string;
  title: string;
  body_excerpt: string;
  author_display: string;
  created_at: string;
  is_edited?: boolean;
  slug?: string | null;
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function BlogPostCard({
  id,
  title,
  body_excerpt,
  author_display,
  created_at,
  slug,
}: Props) {
  const href = slug ? `/blog/post/${slug}` : `/blog/post/${id}`;
  return (
    <Link to={href} className="blog-post-card">
      <article className="blog-post-card__article">
        <h3 className="blog-post-card__title">{title}</h3>
        <p className="blog-post-card__excerpt">{body_excerpt}</p>
        <footer className="blog-post-card__footer">
          <span className="blog-post-card__author">{author_display}</span>
          <time className="blog-post-card__date" dateTime={created_at}>
            {formatDate(created_at)}
          </time>
        </footer>
      </article>
    </Link>
  );
}
