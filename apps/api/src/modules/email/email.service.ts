import { createTransport, type Transporter } from 'nodemailer';
import { logger } from '../../config/logger';
import {
  invitationEmailHtml,
  invitationEmailText,
  passwordResetEmailHtml,
  passwordResetEmailText,
  verificationEmailHtml,
  verificationEmailText,
} from './templates';

// ---------------------------------------------------------------------------
// Public interface
// ---------------------------------------------------------------------------

export interface EmailService {
  sendVerificationEmail(to: string, name: string, token: string): Promise<void>;
  sendPasswordResetEmail(to: string, name: string, token: string): Promise<void>;
  sendInvitationEmail(
    to: string,
    inviterName: string,
    teamName: string,
    token: string,
  ): Promise<void>;
}

// ---------------------------------------------------------------------------
// Config shape (read from env)
// ---------------------------------------------------------------------------

export interface EmailConfig {
  /** Sender display name + address, e.g. "SXGerador <noreply@sxgerador.dev>" */
  from: string;
  /** Base URL of the frontend app, e.g. "https://app.sxgerador.dev" */
  appUrl: string;
  /** SMTP host. Leave undefined to use dev/console mode. */
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPassword?: string;
  /** Whether SMTP uses SSL/TLS (port 465). When false, uses STARTTLS (port 587). */
  smtpSecure?: boolean;
}

// ---------------------------------------------------------------------------
// Dev (console) transport
// ---------------------------------------------------------------------------

class DevEmailService implements EmailService {
  constructor(private readonly appUrl: string) {}

  async sendVerificationEmail(to: string, name: string, token: string): Promise<void> {
    const url = `${this.appUrl}/verify-email/${token}?email=${encodeURIComponent(to)}`;
    logger.info(
      { to, name, url },
      '[DEV] sendVerificationEmail — link would be sent by email in production',
    );
  }

  async sendPasswordResetEmail(to: string, name: string, token: string): Promise<void> {
    const url = `${this.appUrl}/reset-password/${token}`;
    logger.info(
      { to, name, url },
      '[DEV] sendPasswordResetEmail — link would be sent by email in production',
    );
  }

  async sendInvitationEmail(
    to: string,
    inviterName: string,
    teamName: string,
    token: string,
  ): Promise<void> {
    const url = `${this.appUrl}/accept-invite/${token}`;
    logger.info(
      { to, inviterName, teamName, url },
      '[DEV] sendInvitationEmail — link would be sent by email in production',
    );
  }
}

// ---------------------------------------------------------------------------
// Production (SMTP / Nodemailer) transport
// ---------------------------------------------------------------------------

class SmtpEmailService implements EmailService {
  private readonly transport: Transporter;

  constructor(private readonly config: Required<EmailConfig>) {
    this.transport = createTransport({
      host: config.smtpHost,
      port: config.smtpPort,
      secure: config.smtpSecure,
      auth: {
        user: config.smtpUser,
        pass: config.smtpPassword,
      },
    });
  }

  async sendVerificationEmail(to: string, name: string, token: string): Promise<void> {
    const url = `${this.config.appUrl}/verify-email/${token}?email=${encodeURIComponent(to)}`;
    await this.transport.sendMail({
      from: this.config.from,
      to,
      subject: 'Confirme seu e-mail — SXGerador',
      html: verificationEmailHtml(name, url),
      text: verificationEmailText(name, url),
    });
    logger.info({ to }, 'Verification email sent');
  }

  async sendPasswordResetEmail(to: string, name: string, token: string): Promise<void> {
    const url = `${this.config.appUrl}/reset-password/${token}`;
    await this.transport.sendMail({
      from: this.config.from,
      to,
      subject: 'Redefinição de senha — SXGerador',
      html: passwordResetEmailHtml(name, url),
      text: passwordResetEmailText(name, url),
    });
    logger.info({ to }, 'Password reset email sent');
  }

  async sendInvitationEmail(
    to: string,
    inviterName: string,
    teamName: string,
    token: string,
  ): Promise<void> {
    const url = `${this.config.appUrl}/accept-invite/${token}`;
    await this.transport.sendMail({
      from: this.config.from,
      to,
      subject: `Convite para ${teamName} — SXGerador`,
      html: invitationEmailHtml(inviterName, teamName, url),
      text: invitationEmailText(inviterName, teamName, url),
    });
    logger.info({ to, teamName }, 'Invitation email sent');
  }
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Creates an EmailService based on the provided config.
 * When `smtpHost` is absent (or NODE_ENV is not production), returns
 * a dev service that logs emails to the console instead of sending them.
 */
export function createEmailService(config: EmailConfig): EmailService {
  if (!config.smtpHost) {
    return new DevEmailService(config.appUrl);
  }

  const full: Required<EmailConfig> = {
    from: config.from,
    appUrl: config.appUrl,
    smtpHost: config.smtpHost,
    smtpPort: config.smtpPort ?? 587,
    smtpUser: config.smtpUser ?? '',
    smtpPassword: config.smtpPassword ?? '',
    smtpSecure: config.smtpSecure ?? false,
  };

  return new SmtpEmailService(full);
}
