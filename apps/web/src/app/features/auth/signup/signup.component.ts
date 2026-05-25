import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, type AbstractControl } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  PoButtonModule,
  PoButtonType,
  PoCheckboxModule,
  PoFieldModule,
  PoNotificationService,
} from '@po-ui/ng-components';
import { AuthService, mapAuthError } from '../../../core/services/auth.service';

function passwordMatchValidator(control: AbstractControl): { mismatch: true } | null {
  const parent = control.parent;
  if (!parent) return null;
  return control.value === parent.get('password')?.value ? null : { mismatch: true };
}

function strongPasswordValidator(control: AbstractControl): { weak: true } | null {
  const v: string = control.value ?? '';
  const ok = v.length >= 8 && /[A-Z]/.test(v) && /[0-9]/.test(v);
  return ok ? null : { weak: true };
}

@Component({
  selector: 'sxg-signup',
  imports: [ReactiveFormsModule, RouterLink, PoButtonModule, PoCheckboxModule, PoFieldModule],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.scss',
})
export class SignupComponent {
  private readonly authService = inject(AuthService);
  private readonly notification = inject(PoNotificationService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly submitType = PoButtonType.Submit;

  readonly form = new FormBuilder().group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, strongPasswordValidator]],
    confirmPassword: ['', [Validators.required, passwordMatchValidator]],
    acceptedTerms: [false, [Validators.requiredTrue]],
  });

  get nameError(): string {
    const c = this.form.controls.name;
    if (c.touched && c.hasError('required')) return 'Nome é obrigatório';
    if (c.touched && c.hasError('minlength')) return 'Mínimo 2 caracteres';
    return '';
  }

  get emailError(): string {
    const c = this.form.controls.email;
    if (c.touched && c.hasError('required')) return 'E-mail é obrigatório';
    if (c.touched && c.hasError('email')) return 'E-mail inválido';
    return '';
  }

  get passwordError(): string {
    const c = this.form.controls.password;
    if (c.touched && c.hasError('required')) return 'Senha é obrigatória';
    if (c.touched && c.hasError('weak')) return 'Mínimo 8 caracteres, 1 maiúscula e 1 número';
    return '';
  }

  get confirmError(): string {
    const c = this.form.controls.confirmPassword;
    if (c.touched && c.hasError('required')) return 'Confirme sua senha';
    if (c.touched && c.hasError('mismatch')) return 'Senhas não coincidem';
    return '';
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    try {
      const { name, email, password } = this.form.value;
      await this.authService.signup({
        name: name!,
        email: email!,
        password: password!,
        acceptedTerms: true,
      });
      await this.router.navigate(['/signup/verify-email-sent']);
    } catch (err) {
      this.notification.error(mapAuthError(err));
    } finally {
      this.loading.set(false);
    }
  }
}
