import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import BlogPostCard from "./BlogPostCard";

const basePost = {
  id: "abc-123",
  title: "Test Post Title",
  body_excerpt: "This is the post excerpt.",
  author_display: "Jane Smith",
  created_at: "2026-03-01T12:00:00Z",
  updated_at: "2026-03-01T12:00:00Z",
  is_edited: false,
};

function renderCard(props = {}) {
  return render(
    <BrowserRouter>
      <BlogPostCard {...basePost} {...props} />
    </BrowserRouter>
  );
}

describe("BlogPostCard", () => {
  it("renders the post title", () => {
    renderCard();
    expect(screen.getByText("Test Post Title")).toBeInTheDocument();
  });

  it("renders the author display name", () => {
    renderCard();
    expect(screen.getByText("Jane Smith")).toBeInTheDocument();
  });

  it("renders the excerpt", () => {
    renderCard();
    expect(screen.getByText("This is the post excerpt.")).toBeInTheDocument();
  });

  it("links to /blog/post/{slug} or /blog/post/{id} when slug missing", () => {
    renderCard();
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/blog/post/abc-123");
  });

  it("links to /blog/post/{slug} when slug provided", () => {
    renderCard({ slug: "test-post-title" });
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/blog/post/test-post-title");
  });

  it("renders a formatted date", () => {
    renderCard();
    expect(screen.getByText(/2026|Mar|march/i)).toBeInTheDocument();
  });
});
