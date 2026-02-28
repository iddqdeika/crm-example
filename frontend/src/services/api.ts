const API_BASE = "";

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(Array.isArray(err.detail) ? JSON.stringify(err.detail) : err.detail ?? res.statusText);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export type ProfileDto = {
  id: string;
  display_name: string;
  email: string;
  avatar_url: string | null;
  role?: string;
  session_inactivity_expires_at?: string | null;
  session_absolute_expires_at?: string | null;
  session_warning_seconds?: number;
};

export const authApi = {
  async signup(data: { email: string; password: string; display_name: string }) {
    return request<{ message?: string }>("/auth/signup", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  async login(data: { email: string; password: string }) {
    return request<{ message?: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  async logout() {
    return request<void>("/auth/logout", { method: "POST" });
  },
};

export const profileApi = {
  async getProfile() {
    return request<ProfileDto>("/me/profile");
  },
  async touchSession() {
    return request<{ inactivity_expires_at: string }>("/me/session/touch", {
      method: "POST",
    });
  },
  async updatePassword(data: { current_password: string; new_password: string }) {
    return request<void>("/me/password", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },
  async uploadAvatar(file: File) {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/me/avatar", {
      method: "POST",
      credentials: "include",
      body: form,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail ?? res.statusText);
    }
    return res.json() as Promise<{ id: string; url: string }>;
  },
  async deleteAvatar() {
    return request<void>("/me/avatar", { method: "DELETE" });
  },
};

export type AdminUserSummary = {
  id: string;
  email: string;
  display_name: string;
  role: string;
  is_active: boolean;
};

export const adminApi = {
  async listUsers(params?: { page?: number; page_size?: number; email?: string }) {
    const sp = new URLSearchParams();
    if (params?.page != null) sp.set("page", String(params.page));
    if (params?.page_size != null) sp.set("page_size", String(params.page_size));
    if (params?.email) sp.set("email", params.email);
    const q = sp.toString();
    return request<{ items: AdminUserSummary[]; total: number }>(
      `/admin/users${q ? `?${q}` : ""}`
    );
  },
  async getUser(userId: string) {
    return request<AdminUserSummary & { id: string }>(`/admin/users/${userId}`);
  },
  async updateUser(userId: string, data: { role?: string; is_active?: boolean }) {
    return request<void>(`/admin/users/${userId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },
};
