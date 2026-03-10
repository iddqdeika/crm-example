import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import Dashboard from "./Dashboard";

vi.mock("../contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "1", email: "u@example.com", display_name: "User" },
    profile: null,
    loading: false,
    loadProfile: vi.fn(),
    signup: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
  }),
}));

const { mockGetDashboardCounts } = vi.hoisted(() => ({
  mockGetDashboardCounts: vi.fn(),
}));
vi.mock("../services/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../services/api")>();
  return {
    ...actual,
    dashboardApi: { getDashboardCounts: mockGetDashboardCounts },
  };
});

function renderDashboard() {
  return render(
    <BrowserRouter>
      <Dashboard />
    </BrowserRouter>
  );
}

describe("Dashboard", () => {
  beforeEach(() => {
    mockGetDashboardCounts.mockResolvedValue({});
  });

  it("renders with BEM class names on container, heading, and welcome text", () => {
    const { container } = renderDashboard();
    expect(container.querySelector(".dashboard")).toBeInTheDocument();
    expect(container.querySelector(".dashboard__heading")).toBeInTheDocument();
    expect(container.querySelector(".dashboard__welcome")).toBeInTheDocument();
  });

  it("shows campaigns count when user is buyer (getDashboardCounts returns campaigns)", async () => {
    mockGetDashboardCounts.mockResolvedValue({ campaigns: 5 });
    renderDashboard();
    await expect(screen.findByTestId("dashboard-counts")).resolves.toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("Campaigns")).toBeInTheDocument();
  });

  it("shows loading state while counts are loading", () => {
    mockGetDashboardCounts.mockImplementation(() => new Promise(() => {}));
    renderDashboard();
    expect(screen.getByTestId("dashboard-counts-loading")).toBeInTheDocument();
  });

  it("shows error when getDashboardCounts fails", async () => {
    mockGetDashboardCounts.mockRejectedValue(new Error("Failed to load"));
    renderDashboard();
    await expect(screen.findByTestId("dashboard-counts-error")).resolves.toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(/fail/i);
  });

  it("shows drafts and published counts when user is content_manager", async () => {
    mockGetDashboardCounts.mockResolvedValue({ drafts: 2, published: 10 });
    renderDashboard();
    await expect(screen.findByTestId("dashboard-counts")).resolves.toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
    expect(screen.getByText("Drafts")).toBeInTheDocument();
    expect(screen.getByText("Published")).toBeInTheDocument();
  });

  it("shows campaigns, drafts, published, and users counts when user is admin", async () => {
    mockGetDashboardCounts.mockResolvedValue({
      campaigns: 12,
      drafts: 3,
      published: 15,
      users: 7,
    });
    renderDashboard();
    await expect(screen.findByTestId("dashboard-counts")).resolves.toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("15")).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();
    expect(screen.getByText("Campaigns")).toBeInTheDocument();
    expect(screen.getByText("Drafts")).toBeInTheDocument();
    expect(screen.getByText("Published")).toBeInTheDocument();
    expect(screen.getByText("Users")).toBeInTheDocument();
  });
});
