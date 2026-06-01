import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface User {
  id: number;
  name: string;
  username?: string | null;
  avatar_url?: string | null;
  onboarded: boolean;
  enabled_modules: string[];
  goals: string[];
}

interface AuthState {
  access: string | null;
  refresh: string | null;
  user: User | null;
  setSession: (access: string, refresh: string, user: User) => void;
  setUser: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      access: null,
      refresh: null,
      user: null,
      setSession: (access, refresh, user) => set({ access, refresh, user }),
      setUser: (user) => set({ user }),
      logout: () => set({ access: null, refresh: null, user: null }),
    }),
    { name: "ai-coach-auth" },
  ),
);
