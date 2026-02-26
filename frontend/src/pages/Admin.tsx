import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { adminApi, type AdminUserSummary } from "../services/api";

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
      .listUsers()
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
    return <div>Access denied.</div>;
  }
  if (loading) return <div>Loading...</div>;
  if (error) return <div role="alert">Error: {error}</div>;

  return (
    <div className="admin-page" data-testid="admin-page">
      <h1>Admin – Users</h1>
      <p>Total: {total}</p>
      <ul data-testid="admin-user-list">
        {users.map((u) => (
          <li key={u.id}>
            <button
              type="button"
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
            adminApi.listUsers().then((r) => setUsers(r.items));
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
    <div data-testid="admin-user-detail">
      <h2>{user.email}</h2>
      <p>{user.display_name}</p>
      <label>
        Role
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          data-testid="admin-edit-role"
        >
          <option value="standard">standard</option>
          <option value="admin">admin</option>
        </select>
      </label>
      <label>
        <input
          type="checkbox"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
          data-testid="admin-edit-is-active"
        />
        Active
      </label>
      <button type="button" onClick={handleSave} disabled={saving} data-testid="admin-save">
        Save
      </button>
      <button type="button" onClick={onClose}>
        Close
      </button>
    </div>
  );
}
