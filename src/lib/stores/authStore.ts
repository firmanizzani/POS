import { writable, derived, get } from 'svelte/store';

export type UserRole = 'admin' | 'cashier';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  token: string;
}

// Persist login session to localStorage
function createAuthStore() {
  const stored = typeof localStorage !== 'undefined' ? localStorage.getItem('pos_auth') : null;
  const initial: AuthUser | null = stored ? JSON.parse(stored) : null;

  const { subscribe, set, update } = writable<AuthUser | null>(initial);

  return {
    subscribe,
    login: (user: AuthUser) => {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('pos_auth', JSON.stringify(user));
      }
      set(user);
    },
    logout: () => {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('pos_auth');
      }
      set(null);
    }
  };
}

export const authStore = createAuthStore();
export const isLoggedIn = derived(authStore, ($a) => $a !== null);
export const isAdmin = derived(authStore, ($a) => $a?.role === 'admin');
export const isCashier = derived(authStore, ($a) => $a?.role === 'cashier' || $a?.role === 'admin');
