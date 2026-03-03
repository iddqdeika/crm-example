import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import BlogAuthLinks from "../components/BlogAuthLinks";
import BlogPostCard from "../components/BlogPostCard";
import { blogApi, type BlogPostSummaryDto, type BlogSearchHitDto } from "../services/api";
import "./BlogPage.css";

type SummaryItem = BlogPostSummaryDto;
type SearchItem = BlogSearchHitDto;

export default function BlogPage() {
  const [latestPosts, setLatestPosts] = useState<SummaryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchItem[]>([]);
  const [searchTotal, setSearchTotal] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    blogApi
      .list({ limit: 20 })
      .then((data) => {
        if ("items" in data) {
          setLatestPosts(data.items as SummaryItem[]);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!searchQuery.trim()) {
      setIsSearching(false);
      setSearchResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const data = await blogApi.list({ q: searchQuery, limit: 20 });
        if ("items" in data && data.items.length > 0 && "is_search_result" in data.items[0]) {
          setSearchResults(data.items as SearchItem[]);
          setSearchTotal(data.total);
        } else {
          setSearchResults([]);
          setSearchTotal(0);
        }
      } catch {
        setSearchResults([]);
        setSearchTotal(0);
      }
    }, 300);
  }, [searchQuery]);

  const clearSearch = () => {
    setSearchQuery("");
    setIsSearching(false);
    setSearchResults([]);
  };

  return (
    <main className="blog-page">
      <header className="blog-page__header">
        <h1 className="blog-page__heading">Blog</h1>
        <BlogAuthLinks />
        <div className="blog-page__search-wrap">
          <label htmlFor="blog-search" className="blog-page__search-label">
            Search
          </label>
          <input
            id="blog-search"
            type="search"
            className="blog-page__search"
            placeholder="Search posts…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search posts"
          />
        </div>
      </header>

      {isSearching ? (
        <section className="blog-page__results" aria-label="Search results">
          <div className="blog-page__results-header">
            <h2 className="blog-page__section-heading">
              {searchTotal > 0 ? `${searchTotal} result${searchTotal !== 1 ? "s" : ""}` : "No results found"}
            </h2>
            <button type="button" className="blog-page__clear-btn" onClick={clearSearch}>
              See all posts
            </button>
          </div>
          {searchResults.length === 0 ? (
            <p className="blog-page__empty">No results found for &ldquo;{searchQuery}&rdquo;.</p>
          ) : (
            <ul className="blog-page__grid" role="list">
              {searchResults.map((hit) => (
                <li key={hit.id}>
                  <Link to={hit.slug ? `/blog/post/${hit.slug}` : `/blog/post/${hit.id}`} className="blog-search-hit">
                    <article className="blog-search-hit__article">
                      <h3
                        className="blog-search-hit__title"
                        dangerouslySetInnerHTML={{ __html: hit.title }}
                      />
                      <p
                        className="blog-search-hit__snippet"
                        dangerouslySetInnerHTML={{ __html: hit.body_snippet }}
                      />
                      <span className="blog-search-hit__author">{hit.author_display}</span>
                    </article>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : (
        <section className="blog-page__latest" aria-label="Latest posts">
          <h2 className="blog-page__section-heading">Latest</h2>
          {loading ? (
            <p className="blog-page__loading">Loading…</p>
          ) : latestPosts.length === 0 ? (
            <p className="blog-page__empty">No posts yet.</p>
          ) : (
            <ul className="blog-page__grid" role="list">
              {latestPosts.map((post) => (
                <li key={post.id}>
                  <BlogPostCard {...post} />
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </main>
  );
}
