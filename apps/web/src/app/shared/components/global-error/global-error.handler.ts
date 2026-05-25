import { inject, Injectable, type ErrorHandler } from '@angular/core';
import { GlobalErrorService } from './global-error.service';

@Injectable()
export class SxgGlobalErrorHandler implements ErrorHandler {
  private readonly errors = inject(GlobalErrorService);

  handleError(error: unknown): void {
    this.errors.show({
      title: 'Algo saiu do esperado',
      message: 'A tela encontrou um problema. Tente novamente ou reporte para a comunidade.',
      details: error instanceof Error ? error.message : String(error),
    });
    console.error(error);
  }
}
