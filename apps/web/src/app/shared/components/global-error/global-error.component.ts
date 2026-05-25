import { Component, inject } from '@angular/core';
import { PoButtonModule } from '@po-ui/ng-components';
import { I18nService } from '../../../core/i18n/i18n.service';
import { GlobalErrorService } from './global-error.service';

@Component({
  selector: 'sxg-global-error',
  imports: [PoButtonModule],
  templateUrl: './global-error.component.html',
  styleUrl: './global-error.component.scss',
})
export class GlobalErrorComponent {
  readonly errors = inject(GlobalErrorService);
  private readonly i18n = inject(I18nService);

  readonly reportProblemLabel = () => this.i18n.t('reportProblem', 'Reportar problema');

  report(): void {
    const error = this.errors.error();
    const body = encodeURIComponent(
      `Descreva o que estava fazendo:\n\nDetalhes técnicos:\n${error?.details ?? 'n/a'}`,
    );
    globalThis.open(
      `https://github.com/gustavopals/sx-gerador/issues/new?template=bug_report.yml&body=${body}`,
      '_blank',
      'noopener',
    );
  }
}
