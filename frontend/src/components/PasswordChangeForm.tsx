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
    <form onSubmit={handleSubmit} data-testid="password-change-form">
      <label>
        Current password
        <input
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
          data-testid="current-password"
        />
      </label>
      <label>
        New password
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          minLength={8}
          data-testid="new-password"
        />
      </label>
      {error && <p role="alert">{error}</p>}
      <button type="submit" data-testid="password-change-submit">
        Change password
      </button>
    </form>
  );
}
