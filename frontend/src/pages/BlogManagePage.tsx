import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { blogApi, type BlogPostSummaryDto } from "../services/api";
import "./BlogManagePage.css";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function BlogManagePage() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<BlogPostSummaryDto[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"created_at" | "title">("created_at");
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await blogApi.list({
        search: search || undefined,
        sort_by: sortBy,
        sort_dir: sortDir,
        page,
        limit: 20,
      });
      if ("items" in data) {
        setPosts(data.items as BlogPostSummaryDto[]);
        setTotal(data.total);
      }
    } finally {
      setLoading(false);
    }
  }, [search, sortBy, sortDir, page]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleSort = (col: "created_at" | "title") => {
    if (sortBy === col) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortBy(col);
      setSortDir("desc");
    }
    setPage(1);
  };

  const confirmDelete = async (id: string) => {
    await blogApi.remove(id);
    setDeleteConfirmId(null);
    load();
  };

  return (
    <main className="blog-manage">
      <div className="blog-manage__header">
        <h1 className="blog-manage__heading">Blog Posts</h1>
        <Link to="/blog/manage/new" className="blog-manage__new-btn" data-testid="new-post-btn">
          New post
        </Link>
      </div>

      <div className="blog-manage__toolbar">
        <input
          type="search"
          className="blog-manage__search"
          placeholder="Search posts…"
          aria-label="Search posts"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          data-testid="blog-manage-search"
        />
      </div>

      {loading ? (
        <p className="blog-manage__loading">Loading…</p>
      ) : (
        <>
          <table className="blog-manage__table" data-testid="blog-manage-table">
            <thead>
              <tr>
                <th
                  className="blog-manage__th blog-manage__th--sortable"
                  onClick={() => toggleSort("title")}
                  aria-sort={sortBy === "title" ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
                >
                  Title {sortBy === "title" && (sortDir === "asc" ? "↑" : "↓")}
                </th>
                <th
                  className="blog-manage__th blog-manage__th--sortable"
                  onClick={() => toggleSort("created_at")}
                  aria-sort={sortBy === "created_at" ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
                >
                  Date {sortBy === "created_at" && (sortDir === "asc" ? "↑" : "↓")}
                </th>
                <th className="blog-manage__th">Status</th>
                <th className="blog-manage__th">Author</th>
                <th className="blog-manage__th">Actions</th>
              </tr>
            </thead>
            <tbody>
              {posts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="blog-manage__empty">No posts found.</td>
                </tr>
              ) : (
                posts.map((post) => (
                  <tr key={post.id} className="blog-manage__row">
                    <td className="blog-manage__td blog-manage__td--title">{post.title}</td>
                    <td className="blog-manage__td">{formatDate(post.created_at)}</td>
                    <td className="blog-manage__td" data-testid={`post-status-${post.id}`}>
                      {post.status === "published" ? "Published" : "Draft"}
                    </td>
                    <td className="blog-manage__td">{post.author_display}</td>
                    <td className="blog-manage__td blog-manage__td--actions">
                      <button
                        type="button"
                        className="blog-manage__action-btn blog-manage__action-btn--edit"
                        onClick={() => navigate(`/blog/manage/${post.id}`)}
                        data-testid={`edit-post-${post.id}`}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="blog-manage__action-btn blog-manage__action-btn--delete"
                        onClick={() => setDeleteConfirmId(post.id)}
                        data-testid={`delete-post-${post.id}`}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {total > 20 && (
            <div className="blog-manage__pagination">
              <button
                type="button"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </button>
              <span>Page {page}</span>
              <button
                type="button"
                disabled={page * 20 >= total}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {deleteConfirmId && (
        <div className="blog-manage__modal-overlay" role="dialog" aria-modal="true">
          <div className="blog-manage__modal">
            <p className="blog-manage__modal-text">
              Are you sure you want to permanently delete this post?
            </p>
            <div className="blog-manage__modal-actions">
              <button
                type="button"
                className="blog-manage__action-btn blog-manage__action-btn--delete"
                onClick={() => confirmDelete(deleteConfirmId)}
                data-testid="confirm-delete"
              >
                Delete
              </button>
              <button
                type="button"
                className="blog-manage__action-btn"
                onClick={() => setDeleteConfirmId(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
