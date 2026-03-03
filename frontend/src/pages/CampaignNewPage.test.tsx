import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import CampaignNewPage from "./CampaignNewPage";

vi.mock("../services/api", () => ({
  campaignApi: {
    create: vi.fn().mockResolvedValue({ id: "new-id" }),
  },
}));

function renderCampaignNew() {
  return render(
    <BrowserRouter>
      <CampaignNewPage />
    </BrowserRouter>
  );
}

describe("CampaignNewPage BEM class names", () => {
  it("renders <main> with class campaign-new", () => {
    const { container } = renderCampaignNew();
    expect(container.querySelector(".campaign-new")).toBeInTheDocument();
  });

  it("renders heading with class campaign-new__heading", () => {
    const { container } = renderCampaignNew();
    expect(container.querySelector(".campaign-new__heading")).toBeInTheDocument();
  });

  it("renders submit button with class campaign-new__submit", () => {
    const { container } = renderCampaignNew();
    expect(container.querySelector(".campaign-new__submit")).toBeInTheDocument();
  });

  it("renders form with class campaign-new__form", () => {
    const { container } = renderCampaignNew();
    expect(container.querySelector(".campaign-new__form")).toBeInTheDocument();
  });

  it("renders back link with class campaign-new__back-link", () => {
    const { container } = renderCampaignNew();
    expect(container.querySelector(".campaign-new__back-link")).toBeInTheDocument();
  });
});

describe("CampaignNewPage ad groups section", () => {
  it("renders an Add ad group button", () => {
    renderCampaignNew();
    expect(screen.getByTestId("add-ad-group")).toBeInTheDocument();
  });

  it("adds an ad group block when Add ad group is clicked", () => {
    renderCampaignNew();
    expect(screen.queryAllByTestId("ad-group-block")).toHaveLength(0);
    fireEvent.click(screen.getByTestId("add-ad-group"));
    expect(screen.queryAllByTestId("ad-group-block")).toHaveLength(1);
  });

  it("removes an ad group when Delete ad group is clicked", () => {
    renderCampaignNew();
    fireEvent.click(screen.getByTestId("add-ad-group"));
    const deleteBtn = screen.getByTestId("ad-group-delete");
    fireEvent.click(deleteBtn);
    expect(screen.queryAllByTestId("ad-group-block")).toHaveLength(0);
  });
});
