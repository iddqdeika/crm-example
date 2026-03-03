import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import BlogPage from "./BlogPage";

vi.mock("../services/api", () => ({
  blogApi: {
    list: vi.fn().mockResolvedValue({ items: [], total: 0 }),
  },
}));

const mockUseAuth = vi.hoisted(() => vi.fn());
vi.mock("../contexts/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

function renderPage(initialEntry = "/blog") {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <BlogPage />
    </MemoryRouter>
  );
}

const unauthenticatedAuth = {
  user: null,
  profile: null,
  loading: false,
  loadProfile: vi.fn(),
  signup: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
};

const authenticatedAuth = {
  user: { id: "u1", email: "u@example.com", display_name: "Test User" },
  profile: null,
  loading: false,
  loadProfile: vi.fn(),
  signup: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
};

describe("BlogPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    mockUseAuth.mockReturnValue(unauthenticatedAuth);
  });

  it("renders the Latest heading", async () => {
    renderPage();
    expect(screen.getByText(/latest/i)).toBeInTheDocument();
  });

  it("renders a search input", () => {
    renderPage();
    expect(screen.getByRole("searchbox", { name: /search/i })).toBeInTheDocument();
  });

  it("shows empty state when no posts", async () => {
    renderPage();
    expect(await screen.findByText(/no posts yet|no results/i)).toBeInTheDocument();
  });

  it("shows Log in and Register when user is null", async () => {
    renderPage();
    expect(screen.getByRole("link", { name: /log in/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /register/i })).toBeInTheDocument();
  });

  it("clicking Log in sets redirectAfterLogin to current path and navigates to /login", async () => {
    renderPage("/blog");
    const logInLink = screen.getByRole("link", { name: /log in/i });
    expect(logInLink).toHaveAttribute("href", "/login");
    await userEvent.click(logInLink);
    expect(sessionStorage.getItem("redirectAfterLogin")).toBe("/blog");
  });

  it("does not show Log in or Register when user is authenticated", () => {
    mockUseAuth.mockReturnValue(authenticatedAuth);
    renderPage();
    expect(screen.queryByRole("link", { name: /log in/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /register/i })).not.toBeInTheDocument();
  });
});
