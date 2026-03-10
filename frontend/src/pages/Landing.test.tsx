import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import Landing from "./Landing";
import { blogApi } from "../services/api";

vi.mock("../services/api", () => ({
  blogApi: {
    list: vi.fn(),
  },
}));

const mockBlogList = vi.mocked(blogApi.list);

function renderLanding() {
  return render(
    <BrowserRouter>
      <Landing />
    </BrowserRouter>
  );
}

describe("Landing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: never resolve so component stays in loading state unless test overrides
    mockBlogList.mockReturnValue(new Promise(() => {}));
  });

  it("renders hero, benefits, and CTA sections with BEM class names", () => {
    const { container } = renderLanding();
    expect(container.querySelector(".landing__hero")).toBeInTheDocument();
    expect(container.querySelector(".landing__benefits")).toBeInTheDocument();
    expect(container.querySelector(".landing__cta")).toBeInTheDocument();
  });

  it("displays the value proposition in the hero section", () => {
    const { container } = renderLanding();
    const headline = container.querySelector(".landing__headline");
    expect(headline).toBeInTheDocument();
    expect(headline!.textContent).toMatch(/quality\s+ensures\s+your\s+future/i);
  });

  it("contains sign-up link to /signup and sign-in link to /login", () => {
    renderLanding();
    expect(
      screen.getByRole("link", { name: /sign up/i })
    ).toHaveAttribute("href", "/signup");
    expect(
      screen.getByRole("link", { name: /sign in/i })
    ).toHaveAttribute("href", "/login");
  });

  describe("blog section placeholding (reserve space, no layout jump)", () => {
    it("shows blog section with placeholder cards while loading", () => {
      mockBlogList.mockReturnValue(new Promise(() => {}));
      const { container } = renderLanding();

      const section = screen.getByTestId("landing-blog-section");
      expect(section).toBeInTheDocument();
      expect(section).toHaveAttribute("aria-busy", "true");

      const placeholders = container.querySelectorAll(".landing__blog-placeholder-card");
      expect(placeholders).toHaveLength(3);
    });

    it("shows From our blog heading and See all posts link while loading", () => {
      mockBlogList.mockReturnValue(new Promise(() => {}));
      renderLanding();

      expect(screen.getByRole("heading", { name: /from our blog/i })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /see all posts/i })).toHaveAttribute("href", "/blog");
    });

    it("replaces placeholders with post cards when load completes", async () => {
      mockBlogList.mockResolvedValue({
        items: [
          {
            id: "1",
            title: "First post",
            body_excerpt: "Excerpt one",
            author_display: "Author A",
            created_at: "2026-01-01T00:00:00Z",
            updated_at: "2026-01-01T00:00:00Z",
            is_edited: false,
            slug: "first-post",
          },
        ],
        total: 1,
      });

      const { container } = renderLanding();

      await waitFor(() => {
        expect(screen.getByRole("link", { name: /first post/i })).toBeInTheDocument();
      });

      const section = screen.getByTestId("landing-blog-section");
      expect(section).toHaveAttribute("aria-busy", "false");
      const placeholders = container.querySelectorAll(".landing__blog-placeholder-card");
      expect(placeholders).toHaveLength(0);
    });

    it("hides blog section when load completes with no posts", async () => {
      mockBlogList.mockResolvedValue({ items: [], total: 0 });

      renderLanding();

      await waitFor(() => {
        expect(screen.queryByTestId("landing-blog-section")).not.toBeInTheDocument();
      });
    });
  });
});
