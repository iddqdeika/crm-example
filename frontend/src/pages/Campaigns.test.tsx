import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import Campaigns from "./Campaigns";

vi.mock("../contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "1", email: "buyer@test.com", display_name: "Buyer" },
    profile: { id: "1", display_name: "Buyer", email: "buyer@test.com", role: "buyer", avatar_url: null },
    loading: false,
    loadProfile: vi.fn(),
    signup: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
  }),
}));

vi.mock("../services/api", () => ({
  campaignApi: {
    list: vi.fn().mockResolvedValue({ items: [], total: 0 }),
  },
  columnConfigApi: {
    get: vi.fn().mockResolvedValue({ column_ids: [] }),
    save: vi.fn().mockResolvedValue({}),
  },
}));

function renderCampaigns() {
  return render(
    <BrowserRouter>
      <Campaigns />
    </BrowserRouter>
  );
}

describe("Campaigns BEM class names", () => {
  it("renders <main> with class campaigns", () => {
    const { container } = renderCampaigns();
    expect(container.querySelector(".campaigns")).toBeInTheDocument();
  });

  it("renders heading with class campaigns__heading", () => {
    const { container } = renderCampaigns();
    expect(container.querySelector(".campaigns__heading")).toBeInTheDocument();
  });

  it("renders table with class campaigns__table", async () => {
    renderCampaigns();
    const table = await screen.findByTestId("campaign-table");
    expect(table).toHaveClass("campaigns__table");
  });

  it("renders toolbar with class campaigns__toolbar", () => {
    const { container } = renderCampaigns();
    expect(container.querySelector(".campaigns__toolbar")).toBeInTheDocument();
  });

  it("renders create link with class campaigns__create-btn", () => {
    const { container } = renderCampaigns();
    expect(container.querySelector(".campaigns__create-btn")).toBeInTheDocument();
  });
});
