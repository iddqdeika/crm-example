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
    <form onSubmit={handleSubmit} className="auth-form" data-testid="signup-form">
      <label>
        Display name
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          required
          autoComplete="name"
          data-testid="signup-display-name"
        />
      </label>
      <label>
        Email
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          data-testid="signup-email"
        />
      </label>
      <label>
        Password
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          autoComplete="new-password"
          data-testid="signup-password"
        />
      </label>
      {error && <p className="auth-form__error" role="alert">{error}</p>}
      <button type="submit" data-testid="signup-submit">
        Sign up
      </button>
    </form>
  );
}
