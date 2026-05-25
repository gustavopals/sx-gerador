import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom, tap, throwError, type Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface CurrentUser {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  emailVerified: boolean;
  locale: string;
  prefs: {
    theme?: 'light' | 'dark' | 'system';
    language?: 'pt-BR' | 'en-US' | 'es-ES';
    [key: string]: unknown;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

const ACCESS_KEY = 'sxg_access_token';
const REFRESH_KEY = 'sxg_refresh_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  private readonly _accessToken = signal<string | null>(
    localStorage.getItem(ACCESS_KEY) ?? sessionStorage.getItem(ACCESS_KEY),
  );

  readonly isLoggedIn = computed(() => !!this._accessToken());

  async verifyEmail(token: string): Promise<void> {
    await firstValueFrom(this.http.post(`${environment.apiUrl}/auth/verify-email`, { token }));
  }

  async resendVerificationEmail(email: string): Promise<void> {
    await firstValueFrom(
      this.http.post(`${environment.apiUrl}/auth/resend-verification`, { email }),
    );
  }

  async forgotPassword(email: string): Promise<void> {
    await firstValueFrom(this.http.post(`${environment.apiUrl}/auth/forgot-password`, { email }));
  }

  async resetPassword(token: string, password: string): Promise<void> {
    await firstValueFrom(
      this.http.post(`${environment.apiUrl}/auth/reset-password`, { token, password }),
    );
  }

  async getCurrentUser(): Promise<CurrentUser> {
    const response = await firstValueFrom(
      this.http.get<{ user: CurrentUser }>(`${environment.apiUrl}/users/me`),
    );
    return response.user;
  }

  async updateProfile(input: {
    name?: string;
    locale?: string;
    prefs?: Record<string, unknown>;
  }): Promise<CurrentUser> {
    const response = await firstValueFrom(
      this.http.patch<{ user: CurrentUser }>(`${environment.apiUrl}/users/me`, input),
    );
    return response.user;
  }

  async uploadAvatar(avatarUrl: string): Promise<CurrentUser> {
    const response = await firstValueFrom(
      this.http.post<{ user: CurrentUser }>(`${environment.apiUrl}/users/me/avatar`, {
        avatarUrl,
      }),
    );
    return response.user;
  }

  async changePassword(input: { currentPassword: string; newPassword: string }): Promise<void> {
    await firstValueFrom(this.http.post(`${environment.apiUrl}/users/me/change-password`, input));
  }

  async deleteAccount(confirmation: 'EXCLUIR'): Promise<{ hardDeleteScheduledAt: string }> {
    return firstValueFrom(
      this.http.delete<{ hardDeleteScheduledAt: string }>(`${environment.apiUrl}/users/me`, {
        body: { confirmation },
      }),
    );
  }

  async signup(input: {
    name: string;
    email: string;
    password: string;
    locale?: string;
    acceptedTerms: true;
  }): Promise<void> {
    await firstValueFrom(this.http.post(`${environment.apiUrl}/auth/signup`, input));
  }

  async login(email: string, password: string, remember: boolean): Promise<TokenPair> {
    const pair = await firstValueFrom(
      this.http.post<TokenPair>(`${environment.apiUrl}/auth/login`, { email, password }),
    );
    this.storeTokens(pair, remember);
    return pair;
  }

  refreshSession(): Observable<TokenPair> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return throwError(() => new Error('Refresh token ausente.'));
    }

    const remember = localStorage.getItem(REFRESH_KEY) === refreshToken;
    return this.http
      .post<TokenPair>(`${environment.apiUrl}/auth/refresh`, { refreshToken })
      .pipe(tap((pair) => this.storeTokens(pair, remember)));
  }

  logout(): void {
    const refresh = localStorage.getItem(REFRESH_KEY) ?? sessionStorage.getItem(REFRESH_KEY);
    if (refresh) {
      this.http
        .post(`${environment.apiUrl}/auth/logout`, { refreshToken: refresh })
        .subscribe({ error: () => undefined });
    }
    this.clearTokens();
  }

  clearSession(): void {
    this.clearTokens();
  }

  getAccessToken(): string | null {
    return this._accessToken();
  }

  private getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_KEY) ?? sessionStorage.getItem(REFRESH_KEY);
  }

  private storeTokens(pair: TokenPair, remember: boolean): void {
    this.clearTokens();
    const storage = remember ? localStorage : sessionStorage;
    storage.setItem(ACCESS_KEY, pair.accessToken);
    storage.setItem(REFRESH_KEY, pair.refreshToken);
    this._accessToken.set(pair.accessToken);
  }

  private clearTokens(): void {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    sessionStorage.removeItem(ACCESS_KEY);
    sessionStorage.removeItem(REFRESH_KEY);
    this._accessToken.set(null);
  }
}

export function mapAuthError(err: unknown): string {
  if (err instanceof HttpErrorResponse) {
    if (err.status === 401) return 'E-mail ou senha inválidos.';
    if (err.status === 403) return 'Verifique seu e-mail antes de entrar.';
    if (err.status === 409) return 'Este e-mail já está cadastrado.';
    if (err.status === 0) return 'Sem conexão com o servidor.';
  }
  return 'Erro inesperado. Tente novamente.';
}
