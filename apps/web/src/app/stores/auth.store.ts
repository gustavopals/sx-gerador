import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { firstValueFrom } from 'rxjs';
import { AuthService, type CurrentUser } from '../core/services/auth.service';

type SessionUser = Pick<CurrentUser, 'id' | 'email' | 'emailVerified'> &
  Partial<Omit<CurrentUser, 'id' | 'email' | 'emailVerified'>>;

interface AuthState {
  user: SessionUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
};

export const AuthStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed((store) => ({
    isVerified: computed(() => store.user()?.emailVerified === true),
  })),
  withMethods((store, authService = inject(AuthService)) => ({
    initialize(): void {
      const user = userFromToken(authService.getAccessToken());
      patchState(store, {
        user,
        isAuthenticated: !!user,
      });
    },

    async login(email: string, password: string, remember: boolean): Promise<void> {
      patchState(store, { isLoading: true });
      try {
        const pair = await authService.login(email, password, remember);
        patchState(store, {
          user: userFromToken(pair.accessToken),
          isAuthenticated: true,
        });
      } finally {
        patchState(store, { isLoading: false });
      }
    },

    logout(): void {
      authService.logout();
      patchState(store, { user: null, isAuthenticated: false, isLoading: false });
    },

    async loadCurrentUser(): Promise<void> {
      if (!authService.getAccessToken()) {
        patchState(store, { user: null, isAuthenticated: false });
        return;
      }

      patchState(store, { isLoading: true });
      try {
        const user = await authService.getCurrentUser();
        patchState(store, { user, isAuthenticated: true });
      } finally {
        patchState(store, { isLoading: false });
      }
    },

    async updateProfile(input: { name?: string; locale?: string }): Promise<void> {
      patchState(store, { isLoading: true });
      try {
        const user = await authService.updateProfile(input);
        patchState(store, { user, isAuthenticated: true });
      } finally {
        patchState(store, { isLoading: false });
      }
    },

    async uploadAvatar(avatarUrl: string): Promise<void> {
      patchState(store, { isLoading: true });
      try {
        const user = await authService.uploadAvatar(avatarUrl);
        patchState(store, { user, isAuthenticated: true });
      } finally {
        patchState(store, { isLoading: false });
      }
    },

    async changePassword(input: { currentPassword: string; newPassword: string }): Promise<void> {
      patchState(store, { isLoading: true });
      try {
        await authService.changePassword(input);
        authService.clearSession();
        patchState(store, { user: null, isAuthenticated: false });
      } finally {
        patchState(store, { isLoading: false });
      }
    },

    async deleteAccount(): Promise<void> {
      patchState(store, { isLoading: true });
      try {
        await authService.deleteAccount('EXCLUIR');
        authService.clearSession();
        patchState(store, { user: null, isAuthenticated: false });
      } finally {
        patchState(store, { isLoading: false });
      }
    },

    async refreshToken(): Promise<void> {
      patchState(store, { isLoading: true });
      try {
        const pair = await firstValueFrom(authService.refreshSession());
        patchState(store, {
          user: userFromToken(pair.accessToken),
          isAuthenticated: true,
        });
      } catch (err) {
        authService.clearSession();
        patchState(store, { user: null, isAuthenticated: false });
        throw err;
      } finally {
        patchState(store, { isLoading: false });
      }
    },

    clearSession(): void {
      authService.clearSession();
      patchState(store, { user: null, isAuthenticated: false, isLoading: false });
    },
  })),
);

function userFromToken(token: string | null): SessionUser | null {
  const payload = decodeJwtPayload(token);
  if (!payload?.sub || !payload.email) return null;
  return {
    id: payload.sub,
    email: payload.email,
    emailVerified: true,
  };
}

function decodeJwtPayload(token: string | null): { sub?: string; email?: string } | null {
  const payload = token?.split('.')[1];
  if (!payload) return null;

  try {
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
    const decoded = JSON.parse(atob(padded)) as unknown;
    if (!decoded || typeof decoded !== 'object') return null;
    return decoded as { sub?: string; email?: string };
  } catch {
    return null;
  }
}
