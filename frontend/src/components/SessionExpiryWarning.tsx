import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";

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
  const isNearInactivity = inactivityMs < warnMs && inactivityMs < absoluteMs;
  const isNearAbsolute = absoluteMs < warnMs;

  if (!isNearInactivity && !isNearAbsolute) return null;

  if (isNearAbsolute) {
    const secsLeft = Math.max(0, Math.floor(absoluteMs / 1000));
    return (
      <div role="alert" className="session-warning session-warning--hard-cap">
        <p>
          Your session will expire in <strong>{formatSeconds(secsLeft)}</strong> and cannot be
          extended. Please save your work.
        </p>
      </div>
    );
  }

  const secsLeft = Math.max(0, Math.floor(inactivityMs / 1000));
  return (
    <div role="alert" className="session-warning session-warning--inactivity">
      <p>
        Your session will expire in <strong>{formatSeconds(secsLeft)}</strong> due to inactivity.
        Click anywhere to stay logged in.
      </p>
      <button
        className="session-warning__btn"
        onClick={() => void touchSession()}
      >
        Stay logged in
      </button>
    </div>
  );
}
