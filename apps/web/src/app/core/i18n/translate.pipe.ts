import { inject, Pipe, type PipeTransform } from '@angular/core';
import { I18nService } from './i18n.service';

@Pipe({
  name: 'sxgT',
  standalone: true,
  pure: false,
})
export class SxgTranslatePipe implements PipeTransform {
  private readonly i18n = inject(I18nService);

  transform(key: string, fallback?: string): string {
    return this.i18n.t(key, fallback);
  }
}
