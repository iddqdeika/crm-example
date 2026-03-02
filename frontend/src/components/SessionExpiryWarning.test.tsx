import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import SessionExpiryWarning from "./SessionExpiryWarning";

const mockTouchSession = vi.fn();

vi.mock("../contexts/AuthContext", () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from "../contexts/AuthContext";
const mockUseAuth = useAuth as ReturnType<typeof vi.fn>;

function makeSessionInfo(options: {
  inactivitySecsFromNow?: number;
  absoluteSecsFromNow?: number;
  warningSecs?: number;
}) {
  const now = Date.now();
  return {
    sessionInactivityExpiresAt: options.inactivitySecsFromNow != null
      ? new Date(now + options.inactivitySecsFromNow * 1000)
      : null,
    sessionAbsoluteExpiresAt: options.absoluteSecsFromNow != null
      ? new Date(now + options.absoluteSecsFromNow * 1000)
      : null,
    sessionWarningSecs: options.warningSecs ?? 300,
  };
}

beforeEach(() => {
  vi.useFakeTimers();
  mockTouchSession.mockClear();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("SessionExpiryWarning", () => {
  it("T037: renders nothing when session is not near expiry", () => {
    mockUseAuth.mockReturnValue({
      sessionInfo: makeSessionInfo({ inactivitySecsFromNow: 1800, absoluteSecsFromNow: 28800, warningSecs: 300 }),
      touchSession: mockTouchSession,
    });

    const { container } = render(<SessionExpiryWarning />);
    expect(container.firstChild).toBeNull();
  });

  it("T035: shows inactivity warning when near inactivity expiry (popup, after grace)", async () => {
    mockUseAuth.mockReturnValue({
      sessionInfo: makeSessionInfo({ inactivitySecsFromNow: 200, absoluteSecsFromNow: 28800, warningSecs: 300 }),
      touchSession: mockTouchSession,
    });

    render(<SessionExpiryWarning />);
    await act(async () => {
      vi.advanceTimersByTime(61 * 1000); // Past 60s grace so popup is shown
    });
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText(/click below to stay logged in/i)).toBeInTheDocument();
  });

  it("T036: shows hard-cap warning when near absolute expiry (not extendable)", async () => {
    mockUseAuth.mockReturnValue({
      sessionInfo: makeSessionInfo({ inactivitySecsFromNow: 1800, absoluteSecsFromNow: 200, warningSecs: 300 }),
      touchSession: mockTouchSession,
    });

    render(<SessionExpiryWarning />);
    await act(async () => {
      vi.advanceTimersByTime(61 * 1000);
    });
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText(/cannot be extended/i)).toBeInTheDocument();
  });

  it("T038: clicking dismiss on inactivity warning calls touchSession", async () => {
    mockUseAuth.mockReturnValue({
      sessionInfo: makeSessionInfo({ inactivitySecsFromNow: 200, absoluteSecsFromNow: 28800, warningSecs: 300 }),
      touchSession: mockTouchSession,
    });

    render(<SessionExpiryWarning />);
    await act(async () => {
      vi.advanceTimersByTime(61 * 1000);
    });

    const dismissBtn = screen.getByRole("button", { name: /stay logged in/i });
    fireEvent.click(dismissBtn);

    expect(mockTouchSession).toHaveBeenCalledTimes(1);
  });
});
