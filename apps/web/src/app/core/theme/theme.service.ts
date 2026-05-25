import { DOCUMENT } from '@angular/common';
import { effect, inject, Injectable, signal } from '@angular/core';
import { AuthService } from '../services/auth.service';

export type SxgTheme = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'sxg_theme';
const DEFAULT_THEME: SxgTheme = 'system';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly authService = inject(AuthService);
  private readonly themeSignal = signal<SxgTheme>(readStoredTheme());
  private readonly media = globalThis.matchMedia?.('(prefers-color-scheme: dark)');

  readonly theme = this.themeSignal.asReadonly();

  constructor() {
    this.media?.addEventListener('change', () => this.applyTheme());

    effect(() => {
      const theme = this.theme();
      localStorage.setItem(STORAGE_KEY, theme);
      this.applyTheme();
    });
  }

  setTheme(theme: SxgTheme, options: { syncUser?: boolean } = { syncUser: true }): void {
    this.themeSignal.set(theme);
    if (options.syncUser) void this.syncUserPrefs(theme);
  }

  hydrateFromUser(prefs?: { theme?: string } | null): void {
    const theme = normalizeTheme(prefs?.theme);
    if (theme) this.setTheme(theme, { syncUser: false });
  }

  private applyTheme(): void {
    const resolved = this.resolveTheme(this.theme());
    this.document.documentElement.dataset['theme'] = resolved;
    this.document.body.classList.toggle('sxg-theme-dark', resolved === 'dark');
    this.document.body.classList.toggle('sxg-theme-light', resolved === 'light');
  }

  private resolveTheme(theme: SxgTheme): 'light' | 'dark' {
    if (theme === 'system') return this.media?.matches ? 'dark' : 'light';
    return theme;
  }

  private async syncUserPrefs(theme: SxgTheme): Promise<void> {
    if (!this.authService.getAccessToken()) return;
    try {
      const user = await this.authService.getCurrentUser();
      await this.authService.updateProfile({
        prefs: {
          ...(user.prefs ?? {}),
          theme,
        },
      });
    } catch {
      /* local preference remains authoritative for the current session */
    }
  }
}

function readStoredTheme(): SxgTheme {
  return normalizeTheme(localStorage.getItem(STORAGE_KEY)) ?? DEFAULT_THEME;
}

function normalizeTheme(value: string | null | undefined): SxgTheme | null {
  if (value === 'light' || value === 'dark' || value === 'system') return value;
  return null;
}
