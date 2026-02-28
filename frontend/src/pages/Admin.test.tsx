import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import Admin from "./Admin";

vi.mock("../contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "1", email: "admin@test.com", display_name: "Admin" },
    profile: { id: "1", display_name: "Admin", email: "admin@test.com", role: "admin", avatar_url: null },
    loading: false,
    loadProfile: vi.fn(),
    signup: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
  }),
}));

vi.mock("../services/api", () => ({
  adminApi: {
    listUsers: vi.fn().mockResolvedValue({
      items: [
        { id: "1", email: "admin@test.com", display_name: "Admin", role: "admin", is_active: true },
        { id: "2", email: "user@test.com", display_name: "User", role: "standard", is_active: false },
      ],
      total: 2,
    }),
    updateUser: vi.fn().mockResolvedValue({}),
  },
}));

function renderAdmin() {
  return render(
    <BrowserRouter>
      <Admin />
    </BrowserRouter>
  );
}

describe("Admin", () => {
  it("renders with BEM class names on container, heading, list, and items", async () => {
    const { container } = renderAdmin();
    expect(container.querySelector(".admin")).toBeInTheDocument();

    const list = await screen.findByTestId("admin-user-list");
    expect(container.querySelector(".admin__heading")).toBeInTheDocument();
    expect(list).toHaveClass("admin__list");
    expect(container.querySelectorAll(".admin__item").length).toBe(2);
    expect(container.querySelectorAll(".admin__user-btn").length).toBe(2);
  });

  it("renders detail panel with BEM classes when a user is selected", async () => {
    const { container } = renderAdmin();
    const userBtn = await screen.findByTestId("admin-user-1");
    fireEvent.click(userBtn);

    expect(container.querySelector(".admin__detail")).toBeInTheDocument();
    expect(container.querySelector(".admin__detail-heading")).toBeInTheDocument();
    expect(container.querySelector(".admin__detail-actions")).toBeInTheDocument();
  });
});
