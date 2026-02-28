import { useState } from "react";
import type { FormEvent } from "react";

export type SignUpSubmit = (data: {
  email: string;
  password: string;
  display_name: string;
}) => Promise<void>;

type Props = {
  onSubmit: SignUpSubmit;
  error?: string;
};

export default function SignUpForm({ onSubmit, error }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await onSubmit({ email, password, display_name: displayName });
  }

  return (
    <form onSubmit={handleSubmit} className="auth__form" data-testid="signup-form">
      <label className="auth__field">
        <span className="auth__label">Display name</span>
        <input
          type="text"
          className="auth__input"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          required
          autoComplete="name"
          data-testid="signup-display-name"
        />
      </label>
      <label className="auth__field">
        <span className="auth__label">Email</span>
        <input
          type="email"
          className="auth__input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          data-testid="signup-email"
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
          minLength={8}
          autoComplete="new-password"
          data-testid="signup-password"
        />
      </label>
      {error && <p className="auth__error" role="alert">{error}</p>}
      <button type="submit" className="auth__btn" data-testid="signup-submit">
        Sign up
      </button>
    </form>
  );
}
