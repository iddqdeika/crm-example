/** US1: When user has role buyer, Campaigns link is shown and Admin link is not. */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import AppHeader from "./AppHeader";

vi.mock("../contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "1", email: "b@example.com", display_name: "Buyer" },
    profile: { id: "1", display_name: "Buyer", email: "b@example.com", role: "buyer", avatar_url: null },
    loading: false,
    loadProfile: vi.fn(),
    signup: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
  }),
}));

describe("AppHeader — buyer role (US1)", () => {
  it("shows Campaigns link and does not show Admin link when user has buyer role", () => {
    render(
      <BrowserRouter>
        <AppHeader />
      </BrowserRouter>
    );
    expect(screen.getByTestId("header-campaigns-link")).toHaveAttribute("href", "/campaigns");
    expect(screen.queryByTestId("header-admin-link")).not.toBeInTheDocument();
  });
});
