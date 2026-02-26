import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import AvatarUpload from "./AvatarUpload";

describe("AvatarUpload", () => {
  it("shows placeholder when no avatarUrl", () => {
    render(
      <AvatarUpload
        onUpload={vi.fn()}
        onRemove={vi.fn()}
        avatarUrl={null}
      />
    );
    expect(screen.getByTestId("avatar-placeholder")).toBeInTheDocument();
    expect(screen.getByTestId("avatar-file-input")).toBeInTheDocument();
  });

  it("shows image and remove button when avatarUrl set", () => {
    render(
      <AvatarUpload
        onUpload={vi.fn()}
        onRemove={vi.fn()}
        avatarUrl="/me/avatar/1/image"
      />
    );
    expect(screen.getByTestId("avatar-image")).toHaveAttribute("src", "/me/avatar/1/image");
    expect(screen.getByTestId("avatar-remove")).toBeInTheDocument();
  });
});
