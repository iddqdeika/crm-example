import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { adminApi, type AdminUserSummary } from "../services/api";
import "./Admin.css";

export default function Admin() {
  const { profile } = useAuth();
  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState<AdminUserSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (profile?.role !== "admin") return;
    let cancelled = false;
    adminApi
      .listUsers({ page_size: 100 })
      .then((r) => {
        if (!cancelled) {
          setUsers(r.items);
          setTotal(r.total);
        }
      })
      .catch((e) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [profile?.role]);

  if (profile?.role !== "admin") {
    return <div className="admin"><p className="auth__error">Access denied.</p></div>;
  }
  if (loading) return <div className="admin"><p className="admin__count">Loading...</p></div>;
  if (error) return <div className="admin"><p className="auth__error" role="alert">Error: {error}</p></div>;

  return (
    <div className="admin" data-testid="admin-page">
      <h1 className="admin__heading">Admin – Users</h1>
      <p className="admin__count">Total: {total}</p>
      <ul className="admin__list" data-testid="admin-user-list">
        {users.map((u) => (
          <li key={u.id} className="admin__item">
            <button
              type="button"
              className={`admin__user-btn${u.is_active ? "" : " admin__user-btn--inactive"}`}
              onClick={() => setSelected(u)}
              data-testid={`admin-user-${u.id}`}
            >
              {u.email} – {u.role} {u.is_active ? "" : "(inactive)"}
            </button>
          </li>
        ))}
      </ul>
      {selected && (
        <AdminUserDetail
          user={selected}
          onClose={() => setSelected(null)}
          onUpdated={() => {
            setSelected(null);
            adminApi.listUsers({ page_size: 100 }).then((r) => setUsers(r.items));
          }}
        />
      )}
    </div>
  );
}

function AdminUserDetail({
  user,
  onClose,
  onUpdated,
}: {
  user: AdminUserSummary;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [role, setRole] = useState(user.role);
  const [isActive, setIsActive] = useState(user.is_active);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await adminApi.updateUser(user.id, { role, is_active: isActive });
      onUpdated();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="admin__detail" data-testid="admin-user-detail">
      <h2 className="admin__detail-heading">{user.email}</h2>
      <p className="admin__detail-name">{user.display_name}</p>
      <label className="admin__detail-field">
        Role
        <select
          className="admin__detail-select"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          data-testid="admin-edit-role"
        >
          <option value="standard">standard</option>
          <option value="buyer">buyer</option>
          <option value="admin">admin</option>
        </select>
      </label>
      <label className="admin__detail-field">
        <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <input
            type="checkbox"
            className="admin__detail-checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            data-testid="admin-edit-is-active"
          />
          Active
        </span>
      </label>
      <div className="admin__detail-actions">
        <button type="button" className="admin__btn admin__btn--primary" onClick={handleSave} disabled={saving} data-testid="admin-save">
          Save
        </button>
        <button type="button" className="admin__btn admin__btn--ghost" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}
