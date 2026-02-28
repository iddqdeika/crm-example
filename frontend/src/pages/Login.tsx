import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import LoginForm from "../components/LoginForm";
import { useAuth } from "../contexts/AuthContext";
import "./auth.css";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string>("");

  const isExpired = searchParams.get("reason") === "expired";

  async function handleSubmit(data: { email: string; password: string }) {
    setError("");
    try {
      await login(data);
      navigate("/dashboard", { replace: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign in failed");
    }
  }

  return (
    <div className="auth">
      <h1 className="auth__heading">Sign in</h1>
      {isExpired && (
        <p className="auth__notice auth__notice--warning">
          Your session expired due to inactivity. Please log in again.
        </p>
      )}
      <LoginForm onSubmit={handleSubmit} error={error} />
      <p className="auth__footer">
        Don't have an account?{" "}
        <Link to="/signup" className="auth__link">Sign up</Link>
      </p>
    </div>
  );
}
