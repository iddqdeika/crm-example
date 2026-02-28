import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import Profile from "./Profile";

vi.mock("../contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "1", email: "u@example.com", display_name: "User" },
    profile: { id: "1", display_name: "User", email: "u@example.com", avatar_url: null },
    loadProfile: vi.fn(),
    loading: false,
    signup: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
  }),
}));

function renderProfile() {
  return render(
    <BrowserRouter>
      <Profile />
    </BrowserRouter>
  );
}

describe("Profile", () => {
  it("renders with BEM class names on container, heading, info, name, and email", () => {
    const { container } = renderProfile();
    expect(container.querySelector(".profile")).toBeInTheDocument();
    expect(container.querySelector(".profile__heading")).toBeInTheDocument();
    expect(container.querySelector(".profile__info")).toBeInTheDocument();
    expect(container.querySelector(".profile__name")).toBeInTheDocument();
    expect(container.querySelector(".profile__email")).toBeInTheDocument();
  });

  it("renders sections with BEM class names and section headings", () => {
    const { container } = renderProfile();
    const sections = container.querySelectorAll(".profile__section");
    expect(sections.length).toBeGreaterThanOrEqual(2);
    const sectionHeadings = container.querySelectorAll(".profile__section-heading");
    expect(sectionHeadings.length).toBeGreaterThanOrEqual(2);
  });

  it("renders avatar placeholder with BEM class when no avatar", () => {
    const { container } = renderProfile();
    expect(container.querySelector(".profile__avatar-placeholder")).toBeInTheDocument();
  });

  it("displays user info and contains password and avatar forms", () => {
    renderProfile();
    expect(screen.getByTestId("profile-page")).toBeInTheDocument();
    expect(screen.getByTestId("profile-display-name")).toHaveTextContent("User");
    expect(screen.getByTestId("profile-email")).toHaveTextContent("u@example.com");
    expect(screen.getByTestId("password-change-form")).toBeInTheDocument();
    expect(screen.getByTestId("avatar-upload")).toBeInTheDocument();
  });

  it("shows avatar placeholder when no avatar_url", () => {
    renderProfile();
    expect(screen.getByTestId("profile-avatar-placeholder")).toHaveTextContent("No avatar");
  });
});
