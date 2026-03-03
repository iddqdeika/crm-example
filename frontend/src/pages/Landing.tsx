import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import BlogPostCard from "../components/BlogPostCard";
import { blogApi, type BlogPostSummaryDto } from "../services/api";
import "./Landing.css";

export default function Landing() {
  const [latestPosts, setLatestPosts] = useState<BlogPostSummaryDto[]>([]);

  useEffect(() => {
    blogApi.list({ limit: 3 }).then((data) => {
      if ("items" in data) {
        setLatestPosts(data.items as BlogPostSummaryDto[]);
      }
    }).catch(() => {});
  }, []);

  return (
    <div className="landing">
      <header className="landing__hero">
        <h1 className="landing__headline">
          <span className="landing__headline-accent">Quality</span> ensures
          your future
        </h1>
        <p className="landing__tagline">
          See what matters, fix what counts, and ship work you're proud of —
          before anyone else notices.
        </p>
        <hr className="landing__hero-rule" aria-hidden="true" />
      </header>

      <section className="landing__benefits" aria-label="Benefits">
        <div className="landing__benefits-inner">
          <article className="landing__benefit">
            <h2 className="landing__benefit-title">See problems first</h2>
            <p className="landing__benefit-text">
              Catch quality gaps before they reach your audience. Real clarity,
              not dashboards full of noise.
            </p>
          </article>
          <article className="landing__benefit">
            <h2 className="landing__benefit-title">Ship with confidence</h2>
            <p className="landing__benefit-text">
              Know exactly where to improve so you move faster without cutting
              corners.
            </p>
          </article>
          <article className="landing__benefit">
            <h2 className="landing__benefit-title">Prove your impact</h2>
            <p className="landing__benefit-text">
              Turn quality into a measurable advantage. Show stakeholders the
              value of getting it right.
            </p>
          </article>
        </div>
      </section>

      {(latestPosts.length > 0) && (
        <section className="landing__blog" aria-label="Latest blog posts" data-testid="landing-blog-section">
          <div className="landing__blog-header">
            <h2 className="landing__blog-heading">From our blog</h2>
            <Link to="/blog" className="landing__blog-see-all">See all posts</Link>
          </div>
          <ul className="landing__blog-grid" role="list">
            {latestPosts.map((post) => (
              <li key={post.id}>
                <BlogPostCard {...post} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="landing__cta" aria-label="Get started">
        <h2 className="landing__cta-heading">Let's check it</h2>
        <p className="landing__cta-sub">
          Join creative teams who refuse to compromise on quality.
        </p>
        <div className="landing__cta-actions">
          <Link to="/signup" className="landing__btn landing__btn--primary">
            Sign up
          </Link>
          <Link to="/login" className="landing__btn landing__btn--secondary">
            Sign in
          </Link>
        </div>
      </section>
    </div>
  );
}
