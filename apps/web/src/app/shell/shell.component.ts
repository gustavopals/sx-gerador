import { Component, computed, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {
  PoMenuModule,
  PoToolbarModule,
  type PoMenuItem,
  type PoToolbarAction,
} from '@po-ui/ng-components';
import { I18nService, type SxgLanguage } from '../core/i18n/i18n.service';
import { ThemeService, type SxgTheme } from '../core/theme/theme.service';
import { AuthStore } from '../stores/auth.store';

@Component({
  selector: 'sxg-shell',
  imports: [RouterOutlet, PoMenuModule, PoToolbarModule],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
})
export class ShellComponent {
  private readonly authStore = inject(AuthStore);
  private readonly i18n = inject(I18nService);
  private readonly theme = inject(ThemeService);

  readonly menus = computed<PoMenuItem[]>(() => [
    { label: this.i18n.phrase('Dashboard'), icon: 'an an-house', shortLabel: 'Home', link: '/' },
    {
      label: this.i18n.phrase('Projetos'),
      icon: 'an an-folder',
      shortLabel: 'Proj.',
      link: '/projects',
    },
    {
      label: this.i18n.phrase('Equipes'),
      icon: 'an an-users',
      shortLabel: 'Teams',
      link: '/teams',
    },
    {
      label: this.i18n.phrase('Templates'),
      icon: 'an an-copy',
      shortLabel: 'Tmpl.',
      link: '/templates',
    },
    {
      label: this.i18n.phrase('Migrations'),
      icon: 'an an-code',
      shortLabel: 'Migr.',
      link: '/migrations',
    },
    {
      label: this.i18n.phrase('Perfil'),
      icon: 'an an-user',
      shortLabel: 'Perfil',
      link: '/settings/profile',
    },
  ]);

  readonly toolbarActions = computed<PoToolbarAction[]>(() => [
    {
      label: this.i18n.t('themeLight'),
      icon: 'an an-sun',
      action: () => this.setTheme('light'),
    },
    {
      label: this.i18n.t('themeDark'),
      icon: 'an an-moon',
      action: () => this.setTheme('dark'),
    },
    {
      label: this.i18n.t('themeSystem'),
      icon: 'an an-desktop',
      action: () => this.setTheme('system'),
    },
    {
      label: this.i18n.t('languagePt'),
      icon: 'an an-translate',
      action: () => this.setLanguage('pt-BR'),
    },
    {
      label: this.i18n.t('languageEn'),
      icon: 'an an-translate',
      action: () => this.setLanguage('en-US'),
    },
    {
      label: this.i18n.t('languageEs'),
      icon: 'an an-translate',
      action: () => this.setLanguage('es-ES'),
    },
    {
      label: this.i18n.phrase('Sair'),
      icon: 'an an-sign-out',
      action: () => this.authStore.logout(),
    },
    {
      label: this.i18n.phrase('Roadmap'),
      icon: 'an an-map-trifold',
      url: 'https://github.com/gustavopals/sx-gerador',
    },
  ]);

  setTheme(theme: SxgTheme): void {
    this.theme.setTheme(theme);
  }

  setLanguage(language: SxgLanguage): void {
    this.i18n.setLanguage(language);
    const user = this.authStore.user();
    if (user) {
      void this.authStore.updateProfile({
        locale: language,
        prefs: { ...(user.prefs ?? {}), language },
      });
    }
  }
}
