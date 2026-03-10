import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import AppHeader from "./AppHeader";

const { mockUseAuth } = vi.hoisted(() => ({ mockUseAuth: vi.fn() }));
vi.mock("../contexts/AuthContext", () => ({ useAuth: mockUseAuth }));

function makeAuth(role: string) {
  return {
    user: { id: "1", email: "u@example.com", display_name: "User" },
    profile: { id: "1", display_name: "User", email: "u@example.com", role, avatar_url: null },
    loading: false,
    loadProfile: vi.fn(),
    signup: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
  };
}

function renderHeader() {
  return render(
    <BrowserRouter>
      <AppHeader />
    </BrowserRouter>
  );
}

describe("AppHeader — Blog link visibility", () => {
  it("shows Blog link (→/blog) for any logged-in user", () => {
    mockUseAuth.mockReturnValue(makeAuth("buyer"));
    renderHeader();
    expect(screen.getByTestId("header-blog-link")).toHaveAttribute("href", "/blog");
    expect(screen.getByRole("link", { name: /^Blog$/ })).toHaveAttribute("href", "/blog");
  });

  it("shows Manage posts link (→/blog/manage) for content_manager role", () => {
    mockUseAuth.mockReturnValue(makeAuth("content_manager"));
    renderHeader();
    expect(screen.getByTestId("header-manage-posts-link")).toHaveAttribute("href", "/blog/manage");
    expect(screen.getByRole("link", { name: /manage posts/i })).toBeInTheDocument();
  });

  it("shows Manage posts link (→/blog/manage) for admin role", () => {
    mockUseAuth.mockReturnValue(makeAuth("admin"));
    renderHeader();
    expect(screen.getByTestId("header-manage-posts-link")).toBeInTheDocument();
    expect(screen.getByTestId("header-manage-posts-link")).toHaveAttribute("href", "/blog/manage");
  });
});
