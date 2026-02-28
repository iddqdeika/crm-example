import { useState } from "react";

type Props = {
  onUpload: (file: File) => Promise<void>;
  onRemove: () => Promise<void>;
  avatarUrl: string | null;
  error?: string;
};

export default function AvatarUpload({ onUpload, onRemove, avatarUrl, error }: Props) {
  const [uploading, setUploading] = useState(false);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await onUpload(file);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  return (
    <div className="profile__avatar-upload" data-testid="avatar-upload">
      {avatarUrl ? (
        <img src={avatarUrl} alt="Avatar" className="profile__avatar" data-testid="avatar-image" />
      ) : (
        <div className="profile__avatar-placeholder" data-testid="avatar-placeholder">No avatar</div>
      )}
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        disabled={uploading}
        data-testid="avatar-file-input"
      />
      {avatarUrl && (
        <button
          type="button"
          className="auth__btn"
          onClick={() => onRemove()}
          data-testid="avatar-remove"
        >
          Remove avatar
        </button>
      )}
      {error && <p className="auth__error" role="alert">{error}</p>}
    </div>
  );
}
