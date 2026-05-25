import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  PoButtonModule,
  PoButtonType,
  PoFieldModule,
  PoNotificationService,
} from '@po-ui/ng-components';
import { AuthService, mapAuthError } from '../../../core/services/auth.service';

@Component({
  selector: 'sxg-forgot-password',
  imports: [ReactiveFormsModule, RouterLink, PoButtonModule, PoFieldModule],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss',
})
export class ForgotPasswordComponent {
  private readonly authService = inject(AuthService);
  private readonly notification = inject(PoNotificationService);

  readonly loading = signal(false);
  readonly sent = signal(false);
  readonly submitType = PoButtonType.Submit;

  readonly form = new FormBuilder().group({
    email: ['', [Validators.required, Validators.email]],
  });

  get emailError(): string {
    const c = this.form.controls.email;
    if (c.touched && c.hasError('required')) return 'E-mail é obrigatório';
    if (c.touched && c.hasError('email')) return 'E-mail inválido';
    return '';
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    try {
      await this.authService.forgotPassword(this.form.value.email!);
      this.sent.set(true);
    } catch (err) {
      this.notification.error(mapAuthError(err));
    } finally {
      this.loading.set(false);
    }
  }
}
