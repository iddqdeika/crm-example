import { useState } from "react";
import { useNavigate } from "react-router-dom";
import SignUpForm from "../components/SignUpForm";
import { useAuth } from "../contexts/AuthContext";

export default function SignUp() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string>("");

  async function handleSubmit(data: {
    email: string;
    password: string;
    display_name: string;
  }) {
    setError("");
    try {
      await signup(data);
      navigate("/dashboard", { replace: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign up failed");
    }
  }

  return (
    <div className="auth-page">
      <h1>Sign up</h1>
      <SignUpForm onSubmit={handleSubmit} error={error} />
    </div>
  );
}
