import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import Dashboard from "./Dashboard";

vi.mock("../contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "1", email: "u@example.com", display_name: "User" },
    profile: null,
    loading: false,
    loadProfile: vi.fn(),
    signup: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
  }),
}));

function renderDashboard() {
  return render(
    <BrowserRouter>
      <Dashboard />
    </BrowserRouter>
  );
}

describe("Dashboard", () => {
  it("renders with BEM class names on container, heading, and welcome text", () => {
    const { container } = renderDashboard();
    expect(container.querySelector(".dashboard")).toBeInTheDocument();
    expect(container.querySelector(".dashboard__heading")).toBeInTheDocument();
    expect(container.querySelector(".dashboard__welcome")).toBeInTheDocument();
  });
});
