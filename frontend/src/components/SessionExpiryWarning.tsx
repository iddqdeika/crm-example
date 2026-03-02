import { useEffect, useRef, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import "./SessionExpiryWarning.css";

const GRACE_SECONDS = 60; // Don't show warning in the first 60s after session info is available (avoids flash right after login)

function formatSeconds(secs: number): string {
  if (secs <= 0) return "0:00";
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function SessionExpiryWarning() {
  const { sessionInfo, touchSession } = useAuth();
  const { sessionInactivityExpiresAt, sessionAbsoluteExpiresAt, sessionWarningSecs } = sessionInfo;

  const [, setTick] = useState(0);
  const firstValidAt = useRef<number | null>(null);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  if (!sessionInactivityExpiresAt && !sessionAbsoluteExpiresAt) return null;

  const now = Date.now();
  const inactivityMs = sessionInactivityExpiresAt
    ? sessionInactivityExpiresAt.getTime() - now
    : Infinity;
  const absoluteMs = sessionAbsoluteExpiresAt
    ? sessionAbsoluteExpiresAt.getTime() - now
    : Infinity;

  const warnMs = sessionWarningSecs * 1000;
  const isNearInactivity = inactivityMs > 0 && inactivityMs < warnMs && inactivityMs < absoluteMs;
  const isNearAbsolute = absoluteMs > 0 && absoluteMs < warnMs;

  if (!isNearInactivity && !isNearAbsolute) return null;

  // Don't show in the first GRACE_SECONDS after we have valid session info (avoids "0:00" right after login)
  if (firstValidAt.current === null) firstValidAt.current = now;
  if (now - firstValidAt.current < GRACE_SECONDS * 1000) return null;

  if (isNearAbsolute) {
    const secsLeft = Math.max(0, Math.floor(absoluteMs / 1000));
    if (secsLeft <= 0) return null;
    return (
      <div role="alert" className="session-warning-popup" aria-modal="true">
        <div className="session-warning-popup__backdrop" />
        <div className="session-warning-popup__box session-warning-popup__box--hard-cap">
          <p>
            Your session will expire in <strong>{formatSeconds(secsLeft)}</strong> and cannot be
            extended. Please save your work.
          </p>
        </div>
      </div>
    );
  }

  const secsLeft = Math.max(0, Math.floor(inactivityMs / 1000));
  if (secsLeft <= 0) return null;

  return (
    <div role="alert" className="session-warning-popup" aria-modal="true">
      <div className="session-warning-popup__backdrop" />
      <div className="session-warning-popup__box session-warning-popup__box--inactivity">
        <p>
          Your session will expire in <strong>{formatSeconds(secsLeft)}</strong> due to inactivity.
          Click below to stay logged in.
        </p>
        <button
          type="button"
          className="session-warning-popup__btn"
          onClick={() => void touchSession()}
        >
          Stay logged in
        </button>
      </div>
    </div>
  );
}
