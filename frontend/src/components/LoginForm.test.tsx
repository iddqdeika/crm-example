import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import LoginForm from "./LoginForm";

describe("LoginForm", () => {
  it("submits with email and password", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<LoginForm onSubmit={onSubmit} />);

    fireEvent.change(screen.getByTestId("login-email"), {
      target: { value: "user@example.com" },
    });
    fireEvent.change(screen.getByTestId("login-password"), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByTestId("login-submit"));

    expect(onSubmit).toHaveBeenCalledWith({
      email: "user@example.com",
      password: "password123",
    });
  });

  it("shows error when provided", () => {
    render(<LoginForm onSubmit={vi.fn()} error="Invalid credentials" />);
    expect(screen.getByRole("alert")).toHaveTextContent("Invalid credentials");
  });
});
