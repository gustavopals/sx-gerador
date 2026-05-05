import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PoNotificationService } from '@po-ui/ng-components';
import {
  PoPageLoginAuthenticationType,
  PoPageLoginModule,
  type PoPageLogin,
  type PoPageLoginLiterals,
} from '@po-ui/ng-templates';
import { mapAuthError } from '../../../core/services/auth.service';
import { AuthStore } from '../../../stores/auth.store';

@Component({
  selector: 'sxg-login',
  imports: [PoPageLoginModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private readonly authStore = inject(AuthStore);
  private readonly route = inject(ActivatedRoute);
  private readonly notification = inject(PoNotificationService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly authType = PoPageLoginAuthenticationType.Basic;

  readonly literals: PoPageLoginLiterals = {
    loginPlaceholder: 'Seu e-mail',
    passwordPlaceholder: 'Sua senha',
    submitLabel: 'Entrar',
    forgotPassword: 'Esqueci minha senha',
    registerUrl: 'Criar conta grátis',
    loginErrorPattern: 'E-mail inválido',
    passwordErrorPattern: 'Senha obrigatória',
    highlightInfo: 'Gere migrations Protheus com velocidade e rastreabilidade.',
    welcome: 'Bem-vindo ao SXGerador',
  };

  readonly recovery = '/forgot-password';
  readonly registerUrl = '/signup';

  async onLoginSubmit(event: PoPageLogin): Promise<void> {
    this.loading.set(true);
    try {
      await this.authStore.login(event.login, event.password, event.rememberUser ?? false);
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
