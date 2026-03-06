// src/lib/stores/auth.ts
import { writable } from 'svelte/store';
import type { User, AuthState } from '$lib/types';

function createAuthStore() {
  const { subscribe, set, update } = writable<AuthState>({
    isAuthenticated: false, user: null, token: null, loading: true,
  });

  return {
    subscribe,
    setAuth: (user: User, token: string) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_token', token);
        localStorage.setItem('auth_user', JSON.stringify(user));
      }
      set({ isAuthenticated: true, user, token, loading: false });
    },
    /** Call this after fetching /user/profile.php to sync latest user data (e.g. profile_picture_url) */
    updateUser: (partial: Partial<User>) => {
      update((s) => {
        if (!s.user) return s;
        const merged = { ...s.user, ...partial };
        if (typeof window !== 'undefined') {
          localStorage.setItem('auth_user', JSON.stringify(merged));
        }
        return { ...s, user: merged };
      });
    },
    clearAuth: () => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
      }
      set({ isAuthenticated: false, user: null, token: null, loading: false });
    },
    loadFromStorage: () => {
      if (typeof window === 'undefined') {
        set({ isAuthenticated: false, user: null, token: null, loading: false });
        return;
      }
      const token = localStorage.getItem('auth_token');
      const userStr = localStorage.getItem('auth_user');
      if (token && userStr) {
        try {
          const user = JSON.parse(userStr) as User;
          set({ isAuthenticated: true, user, token, loading: false });
        } catch {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth_user');
          set({ isAuthenticated: false, user: null, token: null, loading: false });
        }
      } else {
        set({ isAuthenticated: false, user: null, token: null, loading: false });
      }
    },
    setLoading: (loading: boolean) => update((s) => ({ ...s, loading })),
  };
}

export const auth = createAuthStore();
