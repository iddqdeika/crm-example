import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { profileApi } from "../services/api";
import AvatarUpload from "../components/AvatarUpload";
import PasswordChangeForm from "../components/PasswordChangeForm";

export default function Profile() {
  const { profile, loadProfile, user } = useAuth();
  const [passwordError, setPasswordError] = useState("");
  const [avatarError, setAvatarError] = useState("");

  useEffect(() => {
    if (user) loadProfile();
  }, [user, loadProfile]);

  if (!user) return null;
  const p = profile ?? { display_name: user.display_name || "", email: user.email, avatar_url: null };

  async function handlePasswordChange(data: {
    current_password: string;
    new_password: string;
  }) {
    setPasswordError("");
    try {
      await profileApi.updatePassword(data);
      setPasswordError("");
    } catch (e) {
      setPasswordError(e instanceof Error ? e.message : "Failed");
    }
  }

  async function handleAvatarUpload(file: File) {
    setAvatarError("");
    try {
      await profileApi.uploadAvatar(file);
      await loadProfile();
    } catch (e) {
      setAvatarError(e instanceof Error ? e.message : "Upload failed");
    }
  }

  async function handleAvatarRemove() {
    setAvatarError("");
    try {
      await profileApi.deleteAvatar();
      await loadProfile();
    } catch (e) {
      setAvatarError(e instanceof Error ? e.message : "Remove failed");
    }
  }

  return (
    <div className="profile-page" data-testid="profile-page">
      <h1>Profile</h1>
      <p data-testid="profile-display-name">{p.display_name}</p>
      <p data-testid="profile-email">{p.email}</p>
      {p.avatar_url ? (
        <img src={p.avatar_url} alt="Avatar" data-testid="profile-avatar" />
      ) : (
        <div data-testid="profile-avatar-placeholder">No avatar</div>
      )}
      <section>
        <h2>Change password</h2>
        <PasswordChangeForm onSubmit={handlePasswordChange} error={passwordError} />
      </section>
      <section>
        <h2>Avatar</h2>
        <AvatarUpload
          onUpload={handleAvatarUpload}
          onRemove={handleAvatarRemove}
          avatarUrl={p.avatar_url}
          error={avatarError}
        />
      </section>
    </div>
  );
}
