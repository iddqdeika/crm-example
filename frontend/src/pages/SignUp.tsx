import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import SignUpForm from "../components/SignUpForm";
import { useAuth } from "../contexts/AuthContext";
import "./auth.css";

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
    <div className="auth">
      <h1 className="auth__heading">Sign up</h1>
      <SignUpForm onSubmit={handleSubmit} error={error} />
      <p className="auth__footer">
        Already have an account?{" "}
        <Link to="/login" className="auth__link">Sign in</Link>
      </p>
    </div>
  );
}
