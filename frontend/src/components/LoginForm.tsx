import { useState } from "react";
import type { FormEvent } from "react";

export type LoginSubmit = (data: { email: string; password: string }) => Promise<void>;

type Props = {
  onSubmit: LoginSubmit;
  error?: string;
};

export default function LoginForm({ onSubmit, error }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await onSubmit({ email, password });
  }

  return (
    <form onSubmit={handleSubmit} className="auth__form" data-testid="login-form">
      <label className="auth__field">
        <span className="auth__label">Email</span>
        <input
          type="email"
          className="auth__input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          data-testid="login-email"
        />
      </label>
      <label className="auth__field">
        <span className="auth__label">Password</span>
        <input
          type="password"
          className="auth__input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          data-testid="login-password"
        />
      </label>
      {error && <p className="auth__error" role="alert">{error}</p>}
      <button type="submit" className="auth__btn" data-testid="login-submit">
        Sign in
      </button>
    </form>
  );
}
