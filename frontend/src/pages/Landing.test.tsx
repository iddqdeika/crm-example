import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import Landing from "./Landing";

function renderLanding() {
  return render(
    <BrowserRouter>
      <Landing />
    </BrowserRouter>
  );
}

describe("Landing", () => {
  it("renders hero, benefits, and CTA sections with BEM class names", () => {
    const { container } = renderLanding();
    expect(container.querySelector(".landing__hero")).toBeInTheDocument();
    expect(container.querySelector(".landing__benefits")).toBeInTheDocument();
    expect(container.querySelector(".landing__cta")).toBeInTheDocument();
  });

  it("displays the value proposition in the hero section", () => {
    const { container } = renderLanding();
    const headline = container.querySelector(".landing__headline");
    expect(headline).toBeInTheDocument();
    expect(headline!.textContent).toMatch(/quality\s+ensures\s+your\s+future/i);
  });

  it("contains sign-up link to /signup and sign-in link to /login", () => {
    renderLanding();
    expect(
      screen.getByRole("link", { name: /sign up/i })
    ).toHaveAttribute("href", "/signup");
    expect(
      screen.getByRole("link", { name: /sign in/i })
    ).toHaveAttribute("href", "/login");
  });
});
