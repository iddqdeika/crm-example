import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { profileApi } from "../services/api";
import AvatarUpload from "../components/AvatarUpload";
import PasswordChangeForm from "../components/PasswordChangeForm";
import "./Profile.css";
import "./auth.css";

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
    <div className="profile" data-testid="profile-page">
      <h1 className="profile__heading">Profile</h1>
      <div className="profile__info">
        {p.avatar_url ? (
          <img src={p.avatar_url} alt="Avatar" className="profile__avatar" data-testid="profile-avatar" />
        ) : (
          <div className="profile__avatar-placeholder" data-testid="profile-avatar-placeholder">No avatar</div>
        )}
        <div>
          <p className="profile__name" data-testid="profile-display-name">{p.display_name}</p>
          <p className="profile__email" data-testid="profile-email">{p.email}</p>
        </div>
      </div>
      <section className="profile__section">
        <h2 className="profile__section-heading">Change password</h2>
        <PasswordChangeForm onSubmit={handlePasswordChange} error={passwordError} />
      </section>
      <section className="profile__section">
        <h2 className="profile__section-heading">Avatar</h2>
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
