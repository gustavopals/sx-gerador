import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  PoButtonModule,
  PoButtonType,
  PoFieldModule,
  PoNotificationService,
} from '@po-ui/ng-components';
import { mapAuthError } from '../../../core/services/auth.service';
import { AuthStore } from '../../../stores/auth.store';

@Component({
  selector: 'sxg-login',
  imports: [ReactiveFormsModule, RouterLink, PoFieldModule, PoButtonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private readonly authStore = inject(AuthStore);
  private readonly route = inject(ActivatedRoute);
  private readonly notification = inject(PoNotificationService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  readonly loading = signal(false);
  readonly submitType = PoButtonType.Submit;
  readonly emailError = 'Informe um e-mail válido';
  readonly passwordError = 'Senha obrigatória';

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
    rememberUser: [false],
  });

  async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { email, password, rememberUser } = this.form.getRawValue();
    this.loading.set(true);
    try {
      await this.authStore.login(email, password, rememberUser);
      await this.router.navigateByUrl(this.returnUrl);
    } catch (err) {
      this.notification.error(mapAuthError(err));
    } finally {
      this.loading.set(false);
    }
  }

  private get returnUrl(): string {
    const value = this.route.snapshot.queryParamMap.get('returnUrl');
    return value?.startsWith('/') && !value.startsWith('//') ? value : '/';
  }
}
