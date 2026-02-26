import { useState } from "react";
import { useNavigate } from "react-router-dom";
import LoginForm from "../components/LoginForm";
import { useAuth } from "../contexts/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string>("");

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
    <div className="auth-page">
      <h1>Sign in</h1>
      <LoginForm onSubmit={handleSubmit} error={error} />
    </div>
  );
}
