import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import AppHeader from "./AppHeader";

const { mockUseAuth } = vi.hoisted(() => ({ mockUseAuth: vi.fn() }));
vi.mock("../contexts/AuthContext", () => ({ useAuth: mockUseAuth }));

function renderHeader() {
  return render(
    <BrowserRouter>
      <AppHeader />
    </BrowserRouter>
  );
}

const loggedInAuth = {
  user: { id: "1", email: "u@example.com", display_name: "User" },
  profile: { id: "1", display_name: "User", email: "u@example.com", role: "admin", avatar_url: null },
  loading: false,
  loadProfile: vi.fn(),
  signup: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
};

describe("AppHeader", () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue(loggedInAuth);
  });

  it("renders with BEM class names on header, links, user, and logout", () => {
    const { container } = renderHeader();
    expect(container.querySelector(".app-header")).toBeInTheDocument();
    expect(container.querySelector(".app-header__nav")).toBeInTheDocument();
    expect(container.querySelectorAll(".app-header__link").length).toBeGreaterThanOrEqual(2);
    expect(container.querySelector(".app-header__user")).toBeInTheDocument();
    expect(container.querySelector(".app-header__logout")).toBeInTheDocument();
  });

  it("contains navigation links to /dashboard, /blog, and /profile", () => {
    renderHeader();
    const dashLink = screen.getByRole("link", { name: /dashboard/i });
    const blogLink = screen.getByTestId("header-blog-link");
    const profLink = screen.getByRole("link", { name: /profile/i });
    expect(dashLink).toHaveAttribute("href", "/dashboard");
    expect(blogLink).toHaveAttribute("href", "/blog");
    expect(profLink).toHaveAttribute("href", "/profile");
  });

  it("shows admin link when user has admin role", () => {
    renderHeader();
    const adminLink = screen.getByTestId("header-admin-link");
    expect(adminLink).toHaveAttribute("href", "/admin");
    expect(adminLink).toHaveClass("app-header__link");
  });

  it("shows Campaigns link for admin (US1)", () => {
    renderHeader();
    expect(screen.getByTestId("header-campaigns-link")).toHaveAttribute("href", "/campaigns");
  });
});

describe("AppHeader when unauthenticated (visitor)", () => {
  beforeEach(() => {
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

  it("shows Sign up and Sign in in the top area (header/nav) when unauthenticated", () => {
    renderHeader();
    expect(screen.getByRole("link", { name: /sign up/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /sign in/i })).toBeInTheDocument();
  });

  it("links Sign up to /signup and Sign in to /login", () => {
    renderHeader();
    expect(screen.getByRole("link", { name: /sign up/i })).toHaveAttribute("href", "/signup");
    expect(screen.getByRole("link", { name: /sign in/i })).toHaveAttribute("href", "/login");
  });

  it("styles top auth controls with design tokens (primary/secondary classes)", () => {
    renderHeader();
    const signUp = screen.getByRole("link", { name: /sign up/i });
    const signIn = screen.getByRole("link", { name: /sign in/i });
    expect(signUp).toHaveClass("app-header__link--primary");
    expect(signIn).toHaveClass("app-header__link--secondary");
  });

  it("ensures top auth controls use modifier classes for min-height and focus (design doc)", () => {
    renderHeader();
    const signUp = screen.getByRole("link", { name: /sign up/i });
    const signIn = screen.getByRole("link", { name: /sign in/i });
    expect(signUp).toHaveClass("app-header__link--primary");
    expect(signIn).toHaveClass("app-header__link--secondary");
    expect(signUp).toBeVisible();
    expect(signIn).toBeVisible();
  });
});
