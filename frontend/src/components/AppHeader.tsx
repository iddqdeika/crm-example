import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function AppHeader() {
  const { user, profile, logout } = useAuth();
  if (!user) return null;
  const displayName = profile?.display_name ?? user.display_name ?? user.email ?? "User";
  return (
    <header className="app-header" data-testid="app-header">
      <Link to="/dashboard">Dashboard</Link>
      <Link to="/profile">Profile</Link>
      {profile?.role === "admin" && (
        <Link to="/admin" data-testid="header-admin-link">Admin</Link>
      )}
      <span data-testid="header-user">{displayName}</span>
      <button type="button" onClick={() => logout()} data-testid="header-logout">
        Log out
      </button>
    </header>
  );
}
