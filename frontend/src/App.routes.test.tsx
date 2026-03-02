/** US1 T010: Buyer navigating to /admin is redirected to /dashboard. */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { AdminRoute } from "./App";

const mockUseAuth = vi.fn();
vi.mock("./contexts/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe("AdminRoute — buyer redirect (US1)", () => {
  it("redirects buyer from /admin to /dashboard", () => {
    mockUseAuth.mockReturnValue({
      user: { id: "1", email: "b@example.com", display_name: "Buyer" },
      profile: { id: "1", display_name: "Buyer", email: "b@example.com", role: "buyer", avatar_url: null },
      loading: false,
      loadProfile: vi.fn(),
      signup: vi.fn(),
      login: vi.fn(),
      logout: vi.fn(),
    });
    render(
      <MemoryRouter initialEntries={["/admin"]}>
        <Routes>
          <Route path="/admin" element={<AdminRoute><div>Admin content</div></AdminRoute>} />
          <Route path="/dashboard" element={<div>Dashboard</div>} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.queryByText("Admin content")).not.toBeInTheDocument();
  });
});
