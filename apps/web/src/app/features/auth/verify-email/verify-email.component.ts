import { Component, computed, inject, signal, type OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PoButtonModule, PoNotificationService } from '@po-ui/ng-components';
import { PoPageBackgroundModule } from '@po-ui/ng-templates';
import { AuthService, mapAuthError } from '../../../core/services/auth.service';

type VerifyState = 'loading' | 'success' | 'error';

const RESEND_COOLDOWN_SECS = 60;

@Component({
  selector: 'sxg-verify-email',
  imports: [RouterLink, PoPageBackgroundModule, PoButtonModule],
  templateUrl: './verify-email.component.html',
  styleUrl: './verify-email.component.scss',
})
export class VerifyEmailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly authService = inject(AuthService);
  private readonly notification = inject(PoNotificationService);

  readonly state = signal<VerifyState>('loading');
  readonly errorMessage = signal('');
  readonly resendCooldown = signal(0);
  readonly isResending = signal(false);
  readonly canResend = computed(() => this.resendCooldown() === 0 && !this.isResending());

  private cooldownInterval: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    const token = this.route.snapshot.paramMap.get('token') ?? '';
    this.verify(token);
  }

  private async verify(token: string): Promise<void> {
    if (!token) {
      this.errorMessage.set('Link inválido. Verifique se copiou o endereço completo.');
      this.state.set('error');
      return;
    }

    try {
      await this.authService.verifyEmail(token);
      this.state.set('success');
    } catch (err) {
      this.errorMessage.set(mapAuthError(err));
      this.state.set('error');
    }
  }

  async resend(): Promise<void> {
    const email = this.route.snapshot.queryParamMap.get('email') ?? '';
    if (!email) {
      this.notification.warning(
        'Não foi possível identificar o e-mail. Tente fazer o cadastro novamente.',
      );
      return;
    }

    this.isResending.set(true);
    try {
      await this.authService.resendVerificationEmail(email);
      this.notification.success('E-mail de verificação reenviado! Verifique sua caixa de entrada.');
      this.startCooldown();
    } catch {
      this.notification.error('Não foi possível reenviar o e-mail. Tente novamente em instantes.');
    } finally {
      this.isResending.set(false);
    }
  }

  private startCooldown(): void {
    this.resendCooldown.set(RESEND_COOLDOWN_SECS);
    this.cooldownInterval = setInterval(() => {
      const next = this.resendCooldown() - 1;
      if (next <= 0) {
        this.resendCooldown.set(0);
        clearInterval(this.cooldownInterval!);
        this.cooldownInterval = null;
      } else {
        this.resendCooldown.set(next);
      }
    }, 1000);
  }
}
