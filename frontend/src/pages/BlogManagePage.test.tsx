import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";

vi.mock("../services/api", () => ({
  blogApi: {
    list: vi.fn().mockResolvedValue({
      items: [
        {
          id: "post-1",
          title: "First Post",
          body_excerpt: "Excerpt 1",
          author_display: "Jane",
          created_at: "2026-03-01T12:00:00Z",
          updated_at: "2026-03-01T12:00:00Z",
          is_edited: false,
        },
        {
          id: "post-2",
          title: "Second Post",
          body_excerpt: "Excerpt 2",
          author_display: "Bob",
          created_at: "2026-03-02T10:00:00Z",
          updated_at: "2026-03-02T10:00:00Z",
          is_edited: false,
        },
      ],
      total: 2,
    }),
    remove: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => vi.fn() };
});

import BlogManagePage from "./BlogManagePage";

function renderPage() {
  return render(
    <BrowserRouter>
      <BlogManagePage />
    </BrowserRouter>
  );
}

describe("BlogManagePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the Blog Posts heading", () => {
    renderPage();
    expect(screen.getByText("Blog Posts")).toBeInTheDocument();
  });

  it("renders search input", () => {
    renderPage();
    expect(screen.getByRole("searchbox")).toBeInTheDocument();
  });

  it("renders New post button linking to create page", () => {
    renderPage();
    const btn = screen.getByTestId("new-post-btn");
    expect(btn).toHaveAttribute("href", "/blog/manage/new");
  });

  it("renders post table with correct columns", async () => {
    renderPage();
    expect(await screen.findByTestId("blog-manage-table")).toBeInTheDocument();
    expect(screen.getByText(/title/i)).toBeInTheDocument();
    expect(screen.getByText(/date/i)).toBeInTheDocument();
    expect(screen.getByText(/author/i)).toBeInTheDocument();
  });

  it("renders Edit and Delete buttons for each post", async () => {
    renderPage();
    await screen.findByTestId("blog-manage-table");
    expect(screen.getByTestId("edit-post-post-1")).toBeInTheDocument();
    expect(screen.getByTestId("delete-post-post-1")).toBeInTheDocument();
    expect(screen.getByTestId("edit-post-post-2")).toBeInTheDocument();
    expect(screen.getByTestId("delete-post-post-2")).toBeInTheDocument();
  });
});
