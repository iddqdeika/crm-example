import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./AuthContext";
import * as api from "../services/api";

vi.mock("../services/api", () => ({
  authApi: {
    signup: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
  },
  profileApi: {
    getProfile: vi.fn(),
  },
}));

const mockProfileApi = api.profileApi as unknown as { getProfile: ReturnType<typeof vi.fn> };

const MOCK_PROFILE: api.ProfileDto = {
  id: "profile-1",
  display_name: "Alice",
  email: "alice@example.com",
  avatar_url: null,
  role: "standard",
};

function ProtectedContent() {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user) return <div data-testid="login-redirect">Login</div>;
  return <div data-testid="protected-content">Dashboard</div>;
}

function renderWithAuth(initialPath = "/dashboard") {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <AuthProvider>
        <Routes>
          <Route path="*" element={<ProtectedContent />} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );
}

describe("AuthContext — US1: session survives page reload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("T009: restores user state from GET /me/profile on mount", async () => {
    mockProfileApi.getProfile.mockResolvedValue(MOCK_PROFILE);

    renderWithAuth();

    await waitFor(() => {
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    });

    expect(screen.getByTestId("protected-content")).toBeInTheDocument();
    expect(mockProfileApi.getProfile).toHaveBeenCalledTimes(1);
  });

  it("T010: clears user state when GET /me/profile returns 401", async () => {
    mockProfileApi.getProfile.mockRejectedValue(new Error("Session expired or invalid"));

    renderWithAuth();

    await waitFor(() => {
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    });

    expect(screen.getByTestId("login-redirect")).toBeInTheDocument();
  });

  it("T011: shows loading placeholder while profile check is pending", async () => {
    let resolveProfile!: (value: api.ProfileDto) => void;
    const pendingPromise = new Promise<api.ProfileDto>((res) => {
      resolveProfile = res;
    });
    mockProfileApi.getProfile.mockReturnValue(pendingPromise);

    renderWithAuth();

    expect(screen.getByText("Loading...")).toBeInTheDocument();

    resolveProfile(MOCK_PROFILE);
    await waitFor(() => {
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    });
  });
});

describe("AuthContext — US2: 401 redirect", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it("T021: handleUnauthorized saves path to sessionStorage", async () => {
    const { handleUnauthorized } = await import("./AuthContext");
    handleUnauthorized("/dashboard?tab=overview");
    expect(sessionStorage.getItem("redirectAfterLogin")).toBe("/dashboard?tab=overview");
  });

  it("T021b: login redirects to saved sessionStorage path after success", async () => {
    sessionStorage.setItem("redirectAfterLogin", "/profile");
    mockProfileApi.getProfile.mockResolvedValue(MOCK_PROFILE);
    const mockAuthApi = api.authApi as unknown as { login: ReturnType<typeof vi.fn> };
    mockAuthApi.login = vi.fn().mockResolvedValue({ message: "OK" });

    renderWithAuth("/login");
    await waitFor(() => {
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    });

    expect(sessionStorage.getItem("redirectAfterLogin")).toBe("/profile");
  });
});
