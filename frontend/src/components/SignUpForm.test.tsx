import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import SignUpForm from "./SignUpForm";

describe("SignUpForm", () => {
  it("submits with email, password, display_name", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<SignUpForm onSubmit={onSubmit} />);

    fireEvent.change(screen.getByTestId("signup-display-name"), {
      target: { value: "Test User" },
    });
    fireEvent.change(screen.getByTestId("signup-email"), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByTestId("signup-password"), {
      target: { value: "SecurePass1!" },
    });
    fireEvent.click(screen.getByTestId("signup-submit"));

    expect(onSubmit).toHaveBeenCalledWith({
      display_name: "Test User",
      email: "test@example.com",
      password: "SecurePass1!",
    });
  });

  it("shows error when provided", () => {
    render(<SignUpForm onSubmit={vi.fn()} error="Email already in use" />);
    expect(screen.getByRole("alert")).toHaveTextContent("Email already in use");
  });
});
