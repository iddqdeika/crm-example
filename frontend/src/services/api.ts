const API_BASE = "/api";

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
    const msg = Array.isArray(err.detail) ? JSON.stringify(err.detail) : err.detail ?? res.statusText;
    const e = new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
    (e as Error & { status?: number }).status = res.status;
    throw e;
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
    const res = await fetch(`${API_BASE}/me/avatar`, {
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

export type CampaignSummary = {
  id: string;
  name: string;
  budget: number | string;
  status: string;
  owner_id: string;
  version: number;
  created_at: string;
  updated_at: string;
  owner_display_name?: string | null;
};

export type CreativeDto = {
  id: string;
  ad_group_id: string;
  name: string;
  ad_type: string;
  click_url: string | null;
  icon_storage_path: string | null;
  image_storage_path: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type AdGroupDto = {
  id: string;
  campaign_id: string;
  country_targets: string | null;
  platform_targets: string | null;
  browser_targets: string | null;
  timezone_targets: string | null;
  ssp_id_whitelist: string | null;
  ssp_id_blacklist: string | null;
  source_id_whitelist: string | null;
  source_id_blacklist: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
  creatives?: CreativeDto[];
};

export type CampaignDetail = CampaignSummary & { ad_groups?: AdGroupDto[] };

export type CreativeUpsert = {
  id?: string | null;
  name: string;
  ad_type: string;
  click_url?: string | null;
  icon_storage_path?: string | null;
  image_storage_path?: string | null;
  sort_order?: number;
};

export type AdGroupUpsert = {
  id?: string | null;
  country_targets?: string | null;
  platform_targets?: string | null;
  browser_targets?: string | null;
  timezone_targets?: string | null;
  ssp_id_whitelist?: string | null;
  ssp_id_blacklist?: string | null;
  source_id_whitelist?: string | null;
  source_id_blacklist?: string | null;
  sort_order?: number;
  creatives?: CreativeUpsert[];
};

export const campaignApi = {
  async list(params?: { search?: string; sort?: string; sort2?: string; owner_id?: string; page?: number; page_size?: number }) {
    const sp = new URLSearchParams();
    if (params?.search) sp.set("search", params.search);
    if (params?.sort) sp.set("sort", params.sort);
    if (params?.sort2) sp.set("sort2", params.sort2);
    if (params?.owner_id) sp.set("owner_id", params.owner_id);
    if (params?.page != null) sp.set("page", String(params.page));
    if (params?.page_size != null) sp.set("page_size", String(params.page_size));
    const q = sp.toString();
    return request<{ items: CampaignSummary[]; total: number }>(`/campaigns${q ? `?${q}` : ""}`);
  },
  async get(id: string) {
    return request<CampaignDetail>(`/campaigns/${id}`);
  },
  async create(data: { name: string; budget: number; status: string }) {
    return request<CampaignDetail>("/campaigns", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  async update(
    id: string,
    data: {
      name?: string;
      budget?: number;
      status?: string;
      owner_id?: string;
      version: number;
      ad_groups?: AdGroupUpsert[];
    }
  ) {
    return request<CampaignDetail>(`/campaigns/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },
};

export type ColumnConfig = {
  context: string;
  column_ids: string[];
};

export const columnConfigApi = {
  async get(context: string) {
    return request<ColumnConfig>(`/me/column-config?context=${encodeURIComponent(context)}`);
  },
  async save(context: string, column_ids: string[]) {
    return request<ColumnConfig>("/me/column-config", {
      method: "PUT",
      body: JSON.stringify({ context, column_ids }),
    });
  },
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
