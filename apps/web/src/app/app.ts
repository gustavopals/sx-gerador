import { Component, effect, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PoA11yService } from './core/a11y/po-a11y.service';
import { I18nDomService } from './core/i18n/i18n-dom.service';
import { I18nService } from './core/i18n/i18n.service';
import { ThemeService } from './core/theme/theme.service';
import { GlobalErrorComponent } from './shared/components/global-error/global-error.component';
import { AuthStore } from './stores/auth.store';

@Component({
  selector: 'sxg-root',
  imports: [RouterOutlet, GlobalErrorComponent],
  template: '<router-outlet /><sxg-global-error />',
})
export class App {
  private readonly authStore = inject(AuthStore);
  private readonly theme = inject(ThemeService);
  private readonly i18n = inject(I18nService);
  private readonly i18nDom = inject(I18nDomService);
  private readonly poA11y = inject(PoA11yService);

  constructor() {
    void this.theme;
    void this.i18n;
    this.poA11y.start();
    this.authStore.initialize();
    effect(() => {
      if (this.i18n.language() !== 'pt-BR') this.i18nDom.start();
    });
  }
}
