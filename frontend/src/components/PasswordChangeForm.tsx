import { useState } from "react";
import type { FormEvent } from "react";

export type PasswordChangeSubmit = (data: {
  current_password: string;
  new_password: string;
}) => Promise<void>;

type Props = {
  onSubmit: PasswordChangeSubmit;
  error?: string;
};

export default function PasswordChangeForm({ onSubmit, error }: Props) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await onSubmit({
      current_password: currentPassword,
      new_password: newPassword,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="auth__form" data-testid="password-change-form">
      <label className="auth__field">
        <span className="auth__label">Current password</span>
        <input
          type="password"
          className="auth__input"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
          data-testid="current-password"
        />
      </label>
      <label className="auth__field">
        <span className="auth__label">New password</span>
        <input
          type="password"
          className="auth__input"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          minLength={8}
          data-testid="new-password"
        />
      </label>
      {error && <p className="auth__error" role="alert">{error}</p>}
      <button type="submit" className="auth__btn" data-testid="password-change-submit">
        Change password
      </button>
    </form>
  );
}
