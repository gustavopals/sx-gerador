import { DOCUMENT } from '@angular/common';
import { computed, effect, inject, Injectable, signal } from '@angular/core';
import enUs from './translations/en-US.json';
import esEs from './translations/es-ES.json';
import ptBr from './translations/pt-BR.json';

export type SxgLanguage = 'pt-BR' | 'en-US' | 'es-ES';

interface TranslationCatalog {
  ui: Record<string, string>;
  phrases: Record<string, string>;
}

const STORAGE_KEY = 'sxg_language';
const DEFAULT_LANGUAGE: SxgLanguage = 'pt-BR';
const CATALOGS: Record<SxgLanguage, TranslationCatalog> = {
  'pt-BR': ptBr,
  'en-US': enUs,
  'es-ES': esEs,
};

@Injectable({ providedIn: 'root' })
export class I18nService {
  private readonly document = inject(DOCUMENT);
  private readonly languageSignal = signal<SxgLanguage>(readStoredLanguage());

  readonly language = this.languageSignal.asReadonly();
  readonly catalog = computed(() => CATALOGS[this.language()]);

  constructor() {
    effect(() => {
      const language = this.language();
      localStorage.setItem(STORAGE_KEY, language);
      this.document.documentElement.lang = language;
    });
  }

  setLanguage(language: SxgLanguage): void {
    this.languageSignal.set(language);
  }

  hydrateFromUser(locale: string | null | undefined, prefs?: { language?: string } | null): void {
    const preferred = normalizeLanguage(prefs?.language) ?? normalizeLanguage(locale);
    if (preferred) this.setLanguage(preferred);
  }

  t(key: string, fallback = key): string {
    return this.catalog().ui[key] ?? fallback;
  }

  phrase(source: string): string {
    if (this.language() === DEFAULT_LANGUAGE) return source;
    return this.catalog().phrases[source] ?? source;
  }
}

function readStoredLanguage(): SxgLanguage {
  return normalizeLanguage(localStorage.getItem(STORAGE_KEY)) ?? DEFAULT_LANGUAGE;
}

function normalizeLanguage(value: string | null | undefined): SxgLanguage | null {
  if (value === 'pt-BR' || value === 'en-US' || value === 'es-ES') return value;
  if (value === 'pt') return 'pt-BR';
  if (value === 'en') return 'en-US';
  if (value === 'es') return 'es-ES';
  return null;
}
