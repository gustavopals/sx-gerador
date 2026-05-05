import { Component, computed, inject, signal, type OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, type AbstractControl } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  PoButtonModule,
  PoButtonType,
  PoFieldModule,
  PoNotificationService,
} from '@po-ui/ng-components';
import { PoPageBackgroundModule } from '@po-ui/ng-templates';
import { AuthService, mapAuthError } from '../../../core/services/auth.service';

function strongPasswordValidator(control: AbstractControl): { weak: true } | null {
  const v: string = control.value ?? '';
  const ok = v.length >= 8 && /[A-Z]/.test(v) && /[0-9]/.test(v);
  return ok ? null : { weak: true };
}

function passwordMatchValidator(control: AbstractControl): { mismatch: true } | null {
  const parent = control.parent;
  if (!parent) return null;
  return control.value === parent.get('password')?.value ? null : { mismatch: true };
}

@Component({
  selector: 'sxg-reset-password',
  imports: [ReactiveFormsModule, RouterLink, PoPageBackgroundModule, PoButtonModule, PoFieldModule],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss',
})
export class ResetPasswordComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly authService = inject(AuthService);
  private readonly notification = inject(PoNotificationService);

  readonly loading = signal(false);
  readonly done = signal(false);
  readonly token = signal('');
  readonly passwordValue = signal('');
  readonly submitType = PoButtonType.Submit;

  readonly form = new FormBuilder().group({
    password: ['', [Validators.required, strongPasswordValidator]],
    confirmPassword: ['', [Validators.required, passwordMatchValidator]],
  });

  readonly strength = computed(() => {
    const password = this.passwordValue();
    return [password.length >= 8, /[A-Z]/.test(password), /[0-9]/.test(password)].filter(Boolean)
      .length;
  });

  ngOnInit(): void {
    this.token.set(this.route.snapshot.paramMap.get('token') ?? '');
    this.form.controls.password.valueChanges.subscribe((value) => {
      this.passwordValue.set(value ?? '');
      this.form.controls.confirmPassword.updateValueAndValidity({ emitEvent: false });
    });
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
    if (!this.token()) {
      this.notification.error('Link inválido. Solicite uma nova recuperação de senha.');
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    try {
      await this.authService.resetPassword(this.token(), this.form.value.password!);
      this.done.set(true);
    } catch (err) {
      this.notification.error(mapAuthError(err));
    } finally {
      this.loading.set(false);
    }
  }
}
