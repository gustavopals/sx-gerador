import { registerLocaleData } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import localePt from '@angular/common/locales/pt';
import {
  importProvidersFrom,
  LOCALE_ID,
  makeEnvironmentProviders,
  provideBrowserGlobalErrorListeners,
  type ApplicationConfig,
  type EnvironmentProviders,
} from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { PoI18nModule, type PoI18nConfig } from '@po-ui/ng-components';
import { routes } from './app.routes';

registerLocaleData(localePt);

const poI18nConfig: PoI18nConfig = {
  default: {
    language: 'pt',
  },
  contexts: {},
};

export function providePoLocale(): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: LOCALE_ID, useValue: 'pt-BR' },
    importProvidersFrom(PoI18nModule.config(poI18nConfig)),
  ]);
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(),
    provideAnimations(),
    providePoLocale(),
    provideRouter(routes),
  ],
};
