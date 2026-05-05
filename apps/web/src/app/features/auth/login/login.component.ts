import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { PoNotificationService } from '@po-ui/ng-components';
import {
  PoPageLoginAuthenticationType,
  PoPageLoginModule,
  type PoPageLogin,
  type PoPageLoginLiterals,
} from '@po-ui/ng-templates';
import { AuthService, mapAuthError } from '../../../core/services/auth.service';

@Component({
  selector: 'sxg-login',
  imports: [PoPageLoginModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private readonly authService = inject(AuthService);
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
      await this.authService.login(event.login, event.password, event.rememberUser ?? false);
      await this.router.navigate(['/']);
    } catch (err) {
      this.notification.error(mapAuthError(err));
    } finally {
      this.loading.set(false);
    }
  }
}
