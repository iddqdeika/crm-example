import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import "./BlogAuthLinks.css";

const REDIRECT_KEY = "redirectAfterLogin";

export default function BlogAuthLinks() {
  const { user } = useAuth();
  const { pathname } = useLocation();

  if (user) return null;

  function handleAuthClick() {
    sessionStorage.setItem(REDIRECT_KEY, pathname);
  }

  return (
    <div className="blog-auth-links" data-testid="blog-auth-links">
      <Link to="/login" className="blog-auth-links__link" onClick={handleAuthClick}>
        Log in
      </Link>
      <Link to="/signup" className="blog-auth-links__link" onClick={handleAuthClick}>
        Register
      </Link>
    </div>
  );
}
