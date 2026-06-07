import { api } from "@/lib/api";
import { getTelegramInitData } from "@/lib/telegram";
import { useAuthStore, type User } from "@/store/auth";

interface TokenPair {
  access: string;
  refresh: string;
  user: User;
}

export function useAuth() {
  const { access, user, setSession, logout } = useAuthStore();

  async function loginTelegram(): Promise<boolean> {
    const initData = getTelegramInitData();
    if (!initData) return false;
    const res = await api.post<TokenPair>("/auth/telegram", { init_data: initData });
    setSession(res.access, res.refresh, res.user);
    return true;
  }

  async function loginEmail(email: string, password: string) {
    const res = await api.post<TokenPair>("/auth/login", { email, password });
    setSession(res.access, res.refresh, res.user);
  }

  async function registerEmail(name: string, email: string, password: string) {
    const res = await api.post<TokenPair>("/auth/register", { name, email, password });
    setSession(res.access, res.refresh, res.user);
  }

  return {
    isAuthenticated: Boolean(access),
    user,
    loginTelegram,
    loginEmail,
    registerEmail,
    logout,
  };
}
