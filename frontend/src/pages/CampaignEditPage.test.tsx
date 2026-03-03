import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import CampaignEditPage from "./CampaignEditPage";

const fakeCampaign = {
  id: "abc-123",
  name: "Test Campaign",
  budget: 500,
  status: "active",
  version: 1,
  owner_id: "user-1",
  owner_display_name: "Buyer",
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
  ad_groups: [
    {
      id: "ag-1",
      sort_order: 0,
      country_targets: "US",
      platform_targets: null,
      browser_targets: null,
      timezone_targets: null,
      ssp_id_whitelist: null,
      ssp_id_blacklist: null,
      source_id_whitelist: null,
      source_id_blacklist: null,
      creatives: [],
    },
  ],
};

vi.mock("../services/api", () => {
  const getCampaign = vi.fn();
  const updateCampaign = vi.fn();
  return {
    campaignApi: {
      get: getCampaign,
      update: updateCampaign,
    },
  };
});

import { campaignApi } from "../services/api";

function renderCampaignEdit() {
  (campaignApi.get as ReturnType<typeof vi.fn>).mockResolvedValue(fakeCampaign);
  (campaignApi.update as ReturnType<typeof vi.fn>).mockResolvedValue(fakeCampaign);
  return render(
    <MemoryRouter initialEntries={["/campaigns/abc-123"]}>
      <Routes>
        <Route path="/campaigns/:id" element={<CampaignEditPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("CampaignEditPage BEM class names", () => {
  it("renders <main> with class campaign-edit", async () => {
    const { container } = renderCampaignEdit();
    await screen.findByText("Edit campaign");
    expect(container.querySelector(".campaign-edit")).toBeInTheDocument();
  });

  it("renders heading with class campaign-edit__heading", async () => {
    const { container } = renderCampaignEdit();
    await screen.findByText("Edit campaign");
    expect(container.querySelector(".campaign-edit__heading")).toBeInTheDocument();
  });

  it("renders ad group blocks with class campaign-edit__ad-group-block", async () => {
    const { container } = renderCampaignEdit();
    await screen.findByText("Edit campaign");
    expect(container.querySelector(".campaign-edit__ad-group-block")).toBeInTheDocument();
  });

  it("renders accordion header with class campaign-edit__ad-group-header", async () => {
    const { container } = renderCampaignEdit();
    await screen.findByText("Edit campaign");
    expect(container.querySelector(".campaign-edit__ad-group-header")).toBeInTheDocument();
  });

  it("renders save button with campaign-edit__btn--primary class", async () => {
    const { container } = renderCampaignEdit();
    await screen.findByText("Edit campaign");
    expect(container.querySelector(".campaign-edit__btn--primary")).toBeInTheDocument();
  });
});
