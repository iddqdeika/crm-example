import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { authApi, profileApi, type ProfileDto } from "../services/api";

type User = { id: string; email: string; display_name: string } | null;

export type SessionInfo = {
  sessionInactivityExpiresAt: Date | null;
  sessionAbsoluteExpiresAt: Date | null;
  sessionWarningSecs: number;
};

type AuthContextValue = {
  user: User;
  profile: ProfileDto | null;
  loading: boolean;
  sessionInfo: SessionInfo;
  loadProfile: () => Promise<void>;
  touchSession: () => Promise<void>;
  signup: (data: {
    email: string;
    password: string;
    display_name: string;
  }) => Promise<void>;
  login: (data: { email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

/** Save the current path to sessionStorage and redirect to /login?reason=expired. */
export function handleUnauthorized(path: string): void {
  sessionStorage.setItem("redirectAfterLogin", path);
  window.location.href = "/login?reason=expired";
}

const DEFAULT_SESSION_INFO: SessionInfo = {
  sessionInactivityExpiresAt: null,
  sessionAbsoluteExpiresAt: null,
  sessionWarningSecs: 300,
};

function profileToSessionInfo(p: ProfileDto & {
  session_inactivity_expires_at?: string | null;
  session_absolute_expires_at?: string | null;
  session_warning_seconds?: number;
}): SessionInfo {
  return {
    sessionInactivityExpiresAt: p.session_inactivity_expires_at
      ? new Date(p.session_inactivity_expires_at)
      : null,
    sessionAbsoluteExpiresAt: p.session_absolute_expires_at
      ? new Date(p.session_absolute_expires_at)
      : null,
    sessionWarningSecs: p.session_warning_seconds ?? 300,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [profile, setProfile] = useState<ProfileDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionInfo, setSessionInfo] = useState<SessionInfo>(DEFAULT_SESSION_INFO);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const p = await profileApi.getProfile();
        if (cancelled) return;
        setUser({ id: p.id, email: p.email, display_name: p.display_name });
        setProfile(p);
        setSessionInfo(profileToSessionInfo(p as Parameters<typeof profileToSessionInfo>[0]));
      } catch {
        if (cancelled) return;
        setUser(null);
        setProfile(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const loadProfile = useCallback(async () => {
    try {
      const p = await profileApi.getProfile();
      setProfile(p);
      setSessionInfo(profileToSessionInfo(p as Parameters<typeof profileToSessionInfo>[0]));
    } catch {
      setProfile(null);
    }
  }, []);

  const touchSession = useCallback(async () => {
    try {
      const res = await profileApi.touchSession();
      if (res?.inactivity_expires_at) {
        setSessionInfo((prev) => ({
          ...prev,
          sessionInactivityExpiresAt: new Date(res.inactivity_expires_at),
        }));
      }
    } catch {
      // ignore touch failures — non-critical
    }
  }, []);

  const signup = useCallback(
    async (data: {
      email: string;
      password: string;
      display_name: string;
    }) => {
      await authApi.signup(data);
      const p = await profileApi.getProfile();
      setUser({ id: p.id, email: p.email, display_name: p.display_name });
      setProfile(p);
      setSessionInfo(profileToSessionInfo(p as Parameters<typeof profileToSessionInfo>[0]));
    },
    []
  );

  const login = useCallback(async (data: { email: string; password: string }) => {
    await authApi.login(data);
    const p = await profileApi.getProfile();
    setUser({ id: p.id, email: p.email, display_name: p.display_name });
    setProfile(p);
    setSessionInfo(profileToSessionInfo(p as Parameters<typeof profileToSessionInfo>[0]));

    const redirectTo = sessionStorage.getItem("redirectAfterLogin");
    if (redirectTo) {
      sessionStorage.removeItem("redirectAfterLogin");
      window.location.href = redirectTo;
    }
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout();
    setUser(null);
    setProfile(null);
    setSessionInfo(DEFAULT_SESSION_INFO);
  }, []);

  const value: AuthContextValue = {
    user,
    profile,
    loading,
    sessionInfo,
    loadProfile,
    touchSession,
    signup,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
