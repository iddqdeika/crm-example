import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import Profile from "./Profile";

vi.mock("../contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "1", email: "u@example.com", display_name: "User" },
    profile: { id: "1", display_name: "User", email: "u@example.com", avatar_url: null },
    loadProfile: vi.fn(),
    loading: false,
    signup: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
  }),
}));

describe("Profile", () => {
  it("displays user info and links for password and avatar", () => {
    render(
      <BrowserRouter>
        <Profile />
      </BrowserRouter>
    );
    expect(screen.getByTestId("profile-page")).toBeInTheDocument();
    expect(screen.getByTestId("profile-display-name")).toHaveTextContent("User");
    expect(screen.getByTestId("profile-email")).toHaveTextContent("u@example.com");
    expect(screen.getByTestId("password-change-form")).toBeInTheDocument();
    expect(screen.getByTestId("avatar-upload")).toBeInTheDocument();
  });

  it("shows avatar placeholder when no avatar_url", () => {
    render(
      <BrowserRouter>
        <Profile />
      </BrowserRouter>
    );
    expect(screen.getByTestId("profile-avatar-placeholder")).toHaveTextContent("No avatar");
  });
});
