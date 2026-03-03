import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import AppHeader from "./AppHeader";

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

describe("AppHeader — Blog link visibility", () => {
  it("shows Blog link for content_manager role", async () => {
    vi.mock("../contexts/AuthContext", () => ({
      useAuth: () => makeAuth("content_manager"),
    }));
    render(
      <BrowserRouter>
        <AppHeader />
      </BrowserRouter>
    );
    expect(screen.getByTestId("header-blog-link")).toHaveAttribute("href", "/blog/manage");
  });

  it("shows Blog link for admin role", () => {
    vi.mock("../contexts/AuthContext", () => ({
      useAuth: () => makeAuth("admin"),
    }));
    render(
      <BrowserRouter>
        <AppHeader />
      </BrowserRouter>
    );
    expect(screen.getByTestId("header-blog-link")).toBeInTheDocument();
  });
});
