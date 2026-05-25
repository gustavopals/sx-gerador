import { Injectable, signal } from '@angular/core';

export interface GlobalErrorState {
  title: string;
  message: string;
  details?: string;
}

@Injectable({ providedIn: 'root' })
export class GlobalErrorService {
  private readonly errorSignal = signal<GlobalErrorState | null>(null);
  readonly error = this.errorSignal.asReadonly();

  show(error: GlobalErrorState): void {
    this.errorSignal.set(error);
  }

  clear(): void {
    this.errorSignal.set(null);
  }
}
