import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import SignUp from "./SignUp";

const mockSignup = vi.fn();
vi.mock("../contexts/AuthContext", () => ({
  useAuth: () => ({
    user: null,
    profile: null,
    loading: false,
    loadProfile: vi.fn(),
    signup: mockSignup,
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
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

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

  it("redirects to sessionStorage.redirectAfterLogin after successful signup", async () => {
    sessionStorage.setItem("redirectAfterLogin", "/blog");
    const mockLocation = { href: "" };
    Object.defineProperty(window, "location", { value: mockLocation, writable: true });
    mockSignup.mockResolvedValue(undefined);

    renderSignUp();
    const email = screen.getByRole("textbox", { name: /email/i });
    const password = screen.getByLabelText(/password/i);
    const displayName = screen.getByRole("textbox", { name: /display name|name/i });
    const submit = screen.getByRole("button", { name: /sign up|submit/i });

    await userEvent.type(email, "test@example.com");
    await userEvent.type(password, "secret123");
    await userEvent.type(displayName, "Test User");
    await userEvent.click(submit);

    await vi.waitFor(() => {
      expect(mockSignup).toHaveBeenCalled();
    });
    expect(sessionStorage.getItem("redirectAfterLogin")).toBeNull();
    expect(mockLocation.href).toBe("/blog");
  });
});
