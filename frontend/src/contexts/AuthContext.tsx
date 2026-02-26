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

type AuthContextValue = {
  user: User;
  profile: ProfileDto | null;
  loading: boolean;
  loadProfile: () => Promise<void>;
  signup: (data: {
    email: string;
    password: string;
    display_name: string;
  }) => Promise<void>;
  login: (data: { email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [profile, setProfile] = useState<ProfileDto | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    try {
      const p = await profileApi.getProfile();
      setProfile(p);
    } catch {
      setProfile(null);
    }
  }, []);

  const signup = useCallback(
    async (data: {
      email: string;
      password: string;
      display_name: string;
    }) => {
      await authApi.signup(data);
      setUser({ id: "", email: data.email, display_name: data.display_name });
      await loadProfile();
    },
    [loadProfile]
  );

  const login = useCallback(
    async (data: { email: string; password: string }) => {
      await authApi.login(data);
      setUser({ id: "", email: data.email, display_name: "" });
      await loadProfile();
    },
    [loadProfile]
  );

  const logout = useCallback(async () => {
    await authApi.logout();
    setUser(null);
    setProfile(null);
  }, []);

  useEffect(() => {
    setLoading(false);
  }, []);

  const value: AuthContextValue = {
    user,
    profile,
    loading,
    loadProfile,
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
