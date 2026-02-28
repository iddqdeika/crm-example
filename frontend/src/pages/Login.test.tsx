import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import Login from "./Login";

vi.mock("../contexts/AuthContext", () => ({
  useAuth: () => ({
    user: null,
    profile: null,
    loading: false,
    sessionInfo: { sessionInactivityExpiresAt: null, sessionAbsoluteExpiresAt: null, sessionWarningSecs: 300 },
    loadProfile: vi.fn(),
    touchSession: vi.fn(),
    signup: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
  }),
}));

function renderLogin(path = "/login") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="*" element={<Login />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("Login", () => {
  it("renders with auth BEM class names on container, heading, form, inputs, and button", () => {
    const { container } = renderLogin();
    expect(container.querySelector(".auth")).toBeInTheDocument();
    expect(container.querySelector(".auth__heading")).toBeInTheDocument();
    expect(container.querySelector(".auth__form")).toBeInTheDocument();
    expect(container.querySelectorAll(".auth__input").length).toBeGreaterThanOrEqual(2);
    expect(container.querySelector(".auth__btn")).toBeInTheDocument();
  });

  it("contains a link to /signup", () => {
    renderLogin();
    const link = screen.getByRole("link", { name: /sign up/i });
    expect(link).toHaveAttribute("href", "/signup");
  });

  it("T022: shows session expired message when ?reason=expired is in the URL", () => {
    renderLogin("/login?reason=expired");
    expect(
      screen.getByText(/session expired due to inactivity/i)
    ).toBeInTheDocument();
  });

  it("T022b: does NOT show expired message without reason=expired", () => {
    renderLogin("/login");
    expect(
      screen.queryByText(/session expired/i)
    ).not.toBeInTheDocument();
  });
});
