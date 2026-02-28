import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import AppHeader from "./AppHeader";

vi.mock("../contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "1", email: "u@example.com", display_name: "User" },
    profile: { id: "1", display_name: "User", email: "u@example.com", role: "admin", avatar_url: null },
    loading: false,
    loadProfile: vi.fn(),
    signup: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
  }),
}));

function renderHeader() {
  return render(
    <BrowserRouter>
      <AppHeader />
    </BrowserRouter>
  );
}

describe("AppHeader", () => {
  it("renders with BEM class names on header, links, user, and logout", () => {
    const { container } = renderHeader();
    expect(container.querySelector(".app-header")).toBeInTheDocument();
    expect(container.querySelector(".app-header__nav")).toBeInTheDocument();
    expect(container.querySelectorAll(".app-header__link").length).toBeGreaterThanOrEqual(2);
    expect(container.querySelector(".app-header__user")).toBeInTheDocument();
    expect(container.querySelector(".app-header__logout")).toBeInTheDocument();
  });

  it("contains navigation links to /dashboard and /profile", () => {
    renderHeader();
    const dashLink = screen.getByRole("link", { name: /dashboard/i });
    const profLink = screen.getByRole("link", { name: /profile/i });
    expect(dashLink).toHaveAttribute("href", "/dashboard");
    expect(profLink).toHaveAttribute("href", "/profile");
  });

  it("shows admin link when user has admin role", () => {
    renderHeader();
    const adminLink = screen.getByTestId("header-admin-link");
    expect(adminLink).toHaveAttribute("href", "/admin");
    expect(adminLink).toHaveClass("app-header__link");
  });
});
