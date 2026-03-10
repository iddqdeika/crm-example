import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import "./AppHeader.css";

export default function AppHeader() {
  const { user, profile, logout } = useAuth();

  if (!user) {
    return (
      <header className="app-header" data-testid="app-header">
        <nav className="app-header__nav" aria-label="Visitor navigation">
          <Link to="/blog" className="app-header__link">Blog</Link>
          <Link to="/login" className="app-header__link app-header__link--secondary">Sign in</Link>
          <Link to="/signup" className="app-header__link app-header__link--primary">Sign up</Link>
        </nav>
      </header>
    );
  }

  const displayName = profile?.display_name ?? user.display_name ?? user.email ?? "User";
  return (
    <header className="app-header" data-testid="app-header">
      <nav className="app-header__nav">
        <Link to="/dashboard" className="app-header__link">Dashboard</Link>
        <Link to="/blog" className="app-header__link" data-testid="header-blog-link">Blog</Link>
        <Link to="/profile" className="app-header__link">Profile</Link>
        {(profile?.role === "admin" || profile?.role === "buyer") && (
          <Link to="/campaigns" className="app-header__link" data-testid="header-campaigns-link">Campaigns</Link>
        )}
        {(profile?.role === "content_manager" || profile?.role === "admin") && (
          <Link to="/blog/manage" className="app-header__link" data-testid="header-manage-posts-link">Manage posts</Link>
        )}
        {profile?.role === "admin" && (
          <Link to="/admin" className="app-header__link" data-testid="header-admin-link">Admin</Link>
        )}
      </nav>
      <span className="app-header__user" data-testid="header-user">{displayName}</span>
      <button type="button" className="app-header__logout" onClick={() => logout()} data-testid="header-logout">
        Log out
      </button>
    </header>
  );
}
