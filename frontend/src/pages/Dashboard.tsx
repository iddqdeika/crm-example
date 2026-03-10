import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { dashboardApi, type DashboardCounts } from "../services/api";
import "./Dashboard.css";

const COUNT_LABELS: Record<keyof DashboardCounts, string> = {
  campaigns: "Campaigns",
  drafts: "Drafts",
  published: "Published",
  users: "Users",
};

export default function Dashboard() {
  const { user } = useAuth();
  const [counts, setCounts] = useState<DashboardCounts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    dashboardApi
      .getDashboardCounts()
      .then((data) => {
        if (!cancelled) setCounts(data);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load counts");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const countEntries = counts ? Object.entries(counts).filter(([, v]) => typeof v === "number") as [keyof DashboardCounts, number][] : [];

  return (
    <div className="dashboard">
      <h1 className="dashboard__heading">Personal area</h1>
      {user && (
        <p className="dashboard__welcome">
          Welcome, {user.display_name || user.email}.
        </p>
      )}
      {loading && (
        <p className="dashboard__counts-loading" data-testid="dashboard-counts-loading">
          Loading…
        </p>
      )}
      {error && (
        <p className="dashboard__counts-error" role="alert" data-testid="dashboard-counts-error">
          {error}
        </p>
      )}
      {!loading && !error && countEntries.length > 0 && (
        <ul className="dashboard__counts" role="list" data-testid="dashboard-counts">
          {countEntries.map(([key, value]) => (
            <li key={key} className="dashboard__count-item">
              <span className="dashboard__count-value">{value}</span>
              <span className="dashboard__count-label">{COUNT_LABELS[key]}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
