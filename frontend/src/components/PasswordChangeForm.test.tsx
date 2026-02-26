import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import PasswordChangeForm from "./PasswordChangeForm";

describe("PasswordChangeForm", () => {
  it("submits current and new password", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<PasswordChangeForm onSubmit={onSubmit} />);
    fireEvent.change(screen.getByTestId("current-password"), {
      target: { value: "old" },
    });
    fireEvent.change(screen.getByTestId("new-password"), {
      target: { value: "newpass1!" },
    });
    fireEvent.click(screen.getByTestId("password-change-submit"));
    expect(onSubmit).toHaveBeenCalledWith({
      current_password: "old",
      new_password: "newpass1!",
    });
  });
});
