import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import SignUp from "./SignUp";

vi.mock("../contexts/AuthContext", () => ({
  useAuth: () => ({
    user: null,
    profile: null,
    loading: false,
    loadProfile: vi.fn(),
    signup: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
  }),
}));

function renderSignUp() {
  return render(
    <BrowserRouter>
      <SignUp />
    </BrowserRouter>
  );
}

describe("SignUp", () => {
  it("renders with auth BEM class names on container, heading, form, inputs, and button", () => {
    const { container } = renderSignUp();
    expect(container.querySelector(".auth")).toBeInTheDocument();
    expect(container.querySelector(".auth__heading")).toBeInTheDocument();
    expect(container.querySelector(".auth__form")).toBeInTheDocument();
    expect(container.querySelectorAll(".auth__input").length).toBeGreaterThanOrEqual(3);
    expect(container.querySelector(".auth__btn")).toBeInTheDocument();
  });

  it("contains a link to /login", () => {
    renderSignUp();
    const link = screen.getByRole("link", { name: /sign in/i });
    expect(link).toHaveAttribute("href", "/login");
  });
});
