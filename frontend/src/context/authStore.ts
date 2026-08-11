import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User, Role } from '../types/user';

// ─── sessionStorage key used by Zustand persist ───────────────────────────────
const STORAGE_KEY = 'auth-storage';

interface AuthState {
  user: User | null;
  token: string | null;
  role: Role | null;

  // Actions
  setAuth: (user: User, token: string) => void;
  logout: () => void;

  // Role helpers
  isSuperAdmin: () => boolean;
  isAdmin: () => boolean;
  isSubAdmin: () => boolean;
  isStudent: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      role: null,

      setAuth: (user, token) => {
        // Write to Zustand state (persist middleware saves to sessionStorage automatically)
        set({ user, token, role: user.role });
      },

      logout: () => {
        // Clear Zustand state
        set({ user: null, token: null, role: null });
        // Explicitly remove the persisted key from sessionStorage so no stale token survives
        try {
          sessionStorage.removeItem(STORAGE_KEY);
        } catch (_) {
          // sessionStorage may be unavailable in some environments — ignore
        }
      },

      // Super admin: full access
      isSuperAdmin: () => get().role === 'super_admin',

      // Admin or above: can manage events, users, etc.
      isAdmin: () => {
        const r = get().role;
        return r === 'super_admin' || r === 'admin';
      },

      // Sub admin or above: can mark attendance, view registrations
      isSubAdmin: () => {
        const r = get().role;
        return r === 'super_admin' || r === 'admin' || r === 'sub_admin';
      },

      // Student only
      isStudent: () => get().role === 'student',
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => sessionStorage),
      // Only persist auth data — NOT any ephemeral UI flags
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        role: state.role,
      }),
    }
  )
);
