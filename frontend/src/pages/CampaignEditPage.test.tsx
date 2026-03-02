/** US2 T022: When campaign save returns 409, UI shows conflict message and offers refresh. */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import CampaignEditPage from "./CampaignEditPage";
import { campaignApi } from "../services/api";

vi.mock("../services/api", () => ({
  campaignApi: {
    get: vi.fn(),
    update: vi.fn(),
  },
}));

function renderEditPage(id: string) {
  return render(
    <MemoryRouter initialEntries={[`/campaigns/${id}`]}>
      <Routes>
        <Route path="/campaigns/:id" element={<CampaignEditPage />} />
      </Routes>
    </MemoryRouter>
  );
}

const campaignId = "11111111-1111-1111-1111-111111111111";
const mockCampaign = {
  id: campaignId,
  name: "Test Camp",
  budget: 100,
  status: "active",
  owner_id: "user-1",
  version: 1,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
  ad_groups: [] as Array<{
    id: string;
    campaign_id: string;
    country_targets: string | null;
    platform_targets: string | null;
    browser_targets: string | null;
    timezone_targets: string | null;
    ssp_id_whitelist: string | null;
    ssp_id_blacklist: string | null;
    source_id_whitelist: string | null;
    source_id_blacklist: string | null;
    sort_order: number;
    created_at: string;
    updated_at: string;
  }>,
};

describe("CampaignEditPage — 409 conflict (US2)", () => {
  beforeEach(() => {
    vi.mocked(campaignApi.get).mockResolvedValue({ ...mockCampaign, ad_groups: [] });
  });

  it("shows conflict message and Refresh button when save returns 409", async () => {
    const err = new Error("Campaign was updated by someone else; please refresh and try again.");
    (err as Error & { status?: number }).status = 409;
    vi.mocked(campaignApi.update).mockRejectedValue(err);

    renderEditPage(campaignId);
    await waitFor(() => expect(screen.getByDisplayValue("Test Camp")).toBeInTheDocument());

    await userEvent.clear(screen.getByLabelText(/name/i));
    await userEvent.type(screen.getByLabelText(/name/i), "Updated");
    await userEvent.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(screen.getByText(/updated by someone else|please refresh/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /refresh/i })).toBeInTheDocument();
    });
  });
});

describe("CampaignEditPage — ad groups (US3 T032)", () => {
  beforeEach(() => {
    vi.mocked(campaignApi.get).mockResolvedValue({
      ...mockCampaign,
      ad_groups: [
        {
          id: "ag-1",
          campaign_id: campaignId,
          country_targets: "US",
          platform_targets: null,
          browser_targets: null,
          timezone_targets: null,
          ssp_id_whitelist: null,
          ssp_id_blacklist: null,
          source_id_whitelist: null,
          source_id_blacklist: null,
          sort_order: 0,
          created_at: "2026-01-01T00:00:00Z",
          updated_at: "2026-01-01T00:00:00Z",
        },
      ],
    });
    vi.mocked(campaignApi.update).mockResolvedValue({ ...mockCampaign });
  });

  it("shows ad group blocks and Add ad group button", async () => {
    renderEditPage(campaignId);
    await waitFor(() => expect(screen.getByDisplayValue("Test Camp")).toBeInTheDocument());
    expect(screen.getByRole("heading", { level: 2, name: /ad groups/i })).toBeInTheDocument();
    const blocks = screen.getAllByTestId("ad-group-block");
    expect(blocks).toHaveLength(1);
    expect(screen.getByTestId("add-ad-group")).toBeInTheDocument();
  });

  it("Add ad group adds a block", async () => {
    renderEditPage(campaignId);
    await waitFor(() => expect(screen.getAllByTestId("ad-group-block")).toHaveLength(1));
    await userEvent.click(screen.getByTestId("add-ad-group"));
    expect(screen.getAllByTestId("ad-group-block")).toHaveLength(2);
  });

  it("Delete removes ad group block", async () => {
    renderEditPage(campaignId);
    await waitFor(() => expect(screen.getAllByTestId("ad-group-block")).toHaveLength(1));
    await userEvent.click(screen.getByTestId("ad-group-delete"));
    expect(screen.queryAllByTestId("ad-group-block")).toHaveLength(0);
  });

  it("ad group fields are editable", async () => {
    renderEditPage(campaignId);
    await waitFor(() => expect(screen.getByDisplayValue("US")).toBeInTheDocument());
    const countryInput = screen.getByLabelText(/country targets/i);
    await userEvent.clear(countryInput);
    await userEvent.type(countryInput, "US,CA");
    expect(screen.getByDisplayValue("US,CA")).toBeInTheDocument();
  });
});

describe("CampaignEditPage — creatives (US4 T040)", () => {
  beforeEach(() => {
    vi.mocked(campaignApi.get).mockResolvedValue({
      ...mockCampaign,
      ad_groups: [
        {
          id: "ag-1",
          campaign_id: campaignId,
          country_targets: "US",
          platform_targets: null,
          browser_targets: null,
          timezone_targets: null,
          ssp_id_whitelist: null,
          ssp_id_blacklist: null,
          source_id_whitelist: null,
          source_id_blacklist: null,
          sort_order: 0,
          created_at: "2026-01-01T00:00:00Z",
          updated_at: "2026-01-01T00:00:00Z",
          creatives: [
            {
              id: "cr-1",
              ad_group_id: "ag-1",
              name: "Banner1",
              ad_type: "banner",
              click_url: "https://x.com",
              icon_storage_path: null,
              image_storage_path: null,
              sort_order: 0,
              created_at: "2026-01-01T00:00:00Z",
              updated_at: "2026-01-01T00:00:00Z",
            },
          ],
        },
      ],
    });
    vi.mocked(campaignApi.update).mockResolvedValue({ ...mockCampaign });
  });

  it("shows creatives section with Add creative button", async () => {
    renderEditPage(campaignId);
    await waitFor(() => expect(screen.getByDisplayValue("Banner1")).toBeInTheDocument());
    expect(screen.getByTestId("creatives-section")).toBeInTheDocument();
    expect(screen.getAllByTestId("creative-row")).toHaveLength(1);
    expect(screen.getByTestId("add-creative")).toBeInTheDocument();
  });

  it("Add creative adds a row", async () => {
    renderEditPage(campaignId);
    await waitFor(() => expect(screen.getAllByTestId("creative-row")).toHaveLength(1));
    await userEvent.click(screen.getByTestId("add-creative"));
    expect(screen.getAllByTestId("creative-row")).toHaveLength(2);
  });

  it("Delete creative removes a row", async () => {
    renderEditPage(campaignId);
    await waitFor(() => expect(screen.getAllByTestId("creative-row")).toHaveLength(1));
    await userEvent.click(screen.getByTestId("creative-delete"));
    expect(screen.queryAllByTestId("creative-row")).toHaveLength(0);
  });

  it("creative name and ad type are editable", async () => {
    renderEditPage(campaignId);
    await waitFor(() => expect(screen.getByDisplayValue("Banner1")).toBeInTheDocument());
    const nameInput = screen.getByLabelText(/creative name/i);
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, "NewName");
    expect(screen.getByDisplayValue("NewName")).toBeInTheDocument();
    const adType = screen.getByLabelText(/ad type/i);
    await userEvent.selectOptions(adType, "native");
    expect((adType as HTMLSelectElement).value).toBe("native");
  });
});

describe("CampaignEditPage — archived view-only (T059)", () => {
  beforeEach(() => {
    vi.mocked(campaignApi.get).mockResolvedValue({
      ...mockCampaign,
      status: "archive",
      ad_groups: [
        {
          id: "ag-1",
          campaign_id: campaignId,
          country_targets: "US",
          platform_targets: null,
          browser_targets: null,
          timezone_targets: null,
          ssp_id_whitelist: null,
          ssp_id_blacklist: null,
          source_id_whitelist: null,
          source_id_blacklist: null,
          sort_order: 0,
          created_at: "2026-01-01T00:00:00Z",
          updated_at: "2026-01-01T00:00:00Z",
          creatives: [],
        },
      ],
    });
  });

  it("shows archived notice and hides Save button", async () => {
    renderEditPage(campaignId);
    await waitFor(() => expect(screen.getByTestId("archived-notice")).toBeInTheDocument());
    expect(screen.getByText(/archived campaigns are view-only/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /save/i })).not.toBeInTheDocument();
  });

  it("all form inputs are disabled", async () => {
    renderEditPage(campaignId);
    await waitFor(() => expect(screen.getByDisplayValue("Test Camp")).toBeInTheDocument());
    expect(screen.getByLabelText(/name/i)).toBeDisabled();
    expect(screen.getByLabelText(/budget/i)).toBeDisabled();
    expect(screen.getByLabelText(/status/i)).toBeDisabled();
  });

  it("does not show add/delete ad group buttons", async () => {
    renderEditPage(campaignId);
    await waitFor(() => expect(screen.getByTestId("archived-notice")).toBeInTheDocument());
    expect(screen.queryByTestId("add-ad-group")).not.toBeInTheDocument();
    expect(screen.queryByTestId("ad-group-delete")).not.toBeInTheDocument();
  });
});
