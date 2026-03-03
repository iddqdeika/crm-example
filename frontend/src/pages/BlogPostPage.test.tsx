import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter, Route, Routes } from "react-router-dom";

const mockPost = vi.hoisted(() => ({
  id: "post-1",
  title: "My Great Post",
  body: "<p>Post body content</p>",
  author_display: "Jane Smith",
  creator_display_name: "Jane Smith",
  creator_id: "user-1",
  created_at: "2026-03-01T12:00:00Z",
  updated_at: "2026-03-01T12:00:00Z",
  is_edited: false,
  slug: "my-great-post",
}));

const mockUseAuth = vi.hoisted(() => vi.fn());

vi.mock("../services/api", () => ({
  blogApi: {
    getBySlug: vi.fn().mockResolvedValue(mockPost),
  },
}));

vi.mock("../contexts/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

const postEdited = {
  ...mockPost,
  updated_at: "2026-03-02T10:00:00Z",
  is_edited: true,
};

import BlogPostPage from "./BlogPostPage";

function renderPage(slug = "my-great-post") {
  return render(
    <HelmetProvider>
      <MemoryRouter initialEntries={[`/blog/post/${slug}`]}>
        <Routes>
          <Route path="/blog/post/:slug" element={<BlogPostPage />} />
        </Routes>
      </MemoryRouter>
    </HelmetProvider>
  );
}

describe("BlogPostPage", () => {
  beforeEach(() => {
    sessionStorage.clear();
    mockUseAuth.mockReturnValue({
      user: null,
      profile: null,
      loading: false,
      loadProfile: vi.fn(),
      signup: vi.fn(),
      login: vi.fn(),
      logout: vi.fn(),
    });
  });

  it("renders post title", async () => {
    renderPage();
    expect(await screen.findByText("My Great Post")).toBeInTheDocument();
  });

  it("renders author_display", async () => {
    renderPage();
    expect(await screen.findByText("Jane Smith")).toBeInTheDocument();
  });

  it("renders Back to blog link", async () => {
    renderPage();
    expect(await screen.findByText(/back to blog/i)).toBeInTheDocument();
  });

  it("does not show last updated when is_edited is false", async () => {
    renderPage();
    await screen.findByText("My Great Post");
    expect(screen.queryByText(/last updated/i)).not.toBeInTheDocument();
  });

  it("shows last updated when is_edited is true", async () => {
    const { blogApi } = await import("../services/api");
    (blogApi.getBySlug as ReturnType<typeof vi.fn>).mockResolvedValueOnce(postEdited);
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/last updated/i)).toBeInTheDocument();
    });
  });

  it("sets document title, meta description, and canonical in head", async () => {
    const { blogApi } = await import("../services/api");
    (blogApi.getBySlug as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ...mockPost,
      seo_title: "SEO Title for Search",
      meta_description: "Short description for search results.",
      slug: "my-great-post",
    });
    renderPage("my-great-post");
    await screen.findByText("My Great Post");
    await waitFor(() => {
      expect(document.title).toBe("SEO Title for Search");
    });
    const metaDesc = document.querySelector('meta[name="description"]');
    expect(metaDesc?.getAttribute("content")).toBe("Short description for search results.");
    const canonical = document.querySelector('link[rel="canonical"]');
    expect(canonical?.getAttribute("href")).toMatch(/\/blog\/post\/my-great-post$/);
  });

  it("shows Log in and Register when user is null", async () => {
    renderPage("my-great-post");
    await screen.findByText("My Great Post");
    expect(screen.getByRole("link", { name: /log in/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /register/i })).toBeInTheDocument();
  });

  it("clicking Register sets redirectAfterLogin to current post path and navigates to /signup", async () => {
    renderPage("my-great-post");
    await screen.findByText("My Great Post");
    const registerLink = screen.getByRole("link", { name: /register/i });
    expect(registerLink).toHaveAttribute("href", "/signup");
    await userEvent.click(registerLink);
    expect(sessionStorage.getItem("redirectAfterLogin")).toBe("/blog/post/my-great-post");
  });

  it("does not show Log in or Register when user is authenticated", async () => {
    mockUseAuth.mockReturnValue({
      user: { id: "u1", email: "u@example.com", display_name: "User" },
      profile: null,
      loading: false,
      loadProfile: vi.fn(),
      signup: vi.fn(),
      login: vi.fn(),
      logout: vi.fn(),
    });
    renderPage("my-great-post");
    await screen.findByText("My Great Post");
    expect(screen.queryByRole("link", { name: /log in/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /register/i })).not.toBeInTheDocument();
  });
});
