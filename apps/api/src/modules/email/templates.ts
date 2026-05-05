/**
 * HTML email templates for transactional emails.
 * Keep styles inline — email clients do not support <style> blocks reliably.
 */

const BRAND_COLOR = '#0065a3'; // PO-UI primary blue
const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

function layout(title: string, bodyContent: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f5f5;font-family:${FONT};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
    style="background-color:#f5f5f5;padding:40px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0"
          style="background-color:#ffffff;border-radius:8px;overflow:hidden;
                 box-shadow:0 2px 8px rgba(0,0,0,0.08);max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background-color:${BRAND_COLOR};padding:28px 40px;">
              <span style="color:#ffffff;font-size:22px;font-weight:700;
                           letter-spacing:-0.5px;">SXGerador</span>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;">
              ${bodyContent}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;border-top:1px solid #e8e8e8;
                       background-color:#fafafa;">
              <p style="margin:0;font-size:12px;color:#8c8c8c;line-height:1.6;">
                Este e-mail foi enviado automaticamente. Por favor, não responda.<br />
                SXGerador — Plataforma open source para desenvolvedores TOTVS Protheus.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function button(href: string, label: string): string {
  return `<a href="${href}"
    style="display:inline-block;margin-top:24px;padding:14px 28px;
           background-color:${BRAND_COLOR};color:#ffffff;text-decoration:none;
           border-radius:6px;font-size:15px;font-weight:600;
           letter-spacing:0.2px;">
    ${label}
  </a>`;
}

function expiryNote(hours: number): string {
  return `<p style="margin-top:20px;font-size:13px;color:#8c8c8c;">
    Este link expira em <strong>${hours} hora${hours !== 1 ? 's' : ''}</strong>.
    Se você não solicitou isso, pode ignorar este e-mail com segurança.
  </p>`;
}

// ---------------------------------------------------------------------------
// Verification email
// ---------------------------------------------------------------------------

export function verificationEmailHtml(name: string, verifyUrl: string): string {
  const body = `
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#1a1a1a;">
      Confirme seu e-mail
    </h1>
    <p style="margin:0 0 4px;font-size:16px;color:#595959;line-height:1.6;">
      Olá, <strong>${name}</strong>!
    </p>
    <p style="margin:0;font-size:16px;color:#595959;line-height:1.6;">
      Obrigado por criar sua conta no SXGerador. Clique no botão abaixo para
      verificar seu e-mail e ativar sua conta.
    </p>
    ${button(verifyUrl, 'Verificar e-mail')}
    ${expiryNote(24)}
    <hr style="margin:28px 0;border:none;border-top:1px solid #e8e8e8;" />
    <p style="margin:0;font-size:13px;color:#8c8c8c;">
      Ou copie e cole este link no seu navegador:<br />
      <span style="color:${BRAND_COLOR};word-break:break-all;">${verifyUrl}</span>
    </p>
  `;
  return layout('Confirme seu e-mail — SXGerador', body);
}

export function verificationEmailText(name: string, verifyUrl: string): string {
  return [
    `Olá, ${name}!`,
    '',
    'Obrigado por criar sua conta no SXGerador.',
    'Acesse o link abaixo para verificar seu e-mail (expira em 24 horas):',
    '',
    verifyUrl,
    '',
    'Se você não criou esta conta, pode ignorar este e-mail.',
  ].join('\n');
}

// ---------------------------------------------------------------------------
// Password reset email
// ---------------------------------------------------------------------------

export function passwordResetEmailHtml(name: string, resetUrl: string): string {
  const body = `
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#1a1a1a;">
      Redefinição de senha
    </h1>
    <p style="margin:0 0 4px;font-size:16px;color:#595959;line-height:1.6;">
      Olá, <strong>${name}</strong>!
    </p>
    <p style="margin:0;font-size:16px;color:#595959;line-height:1.6;">
      Recebemos uma solicitação para redefinir a senha da sua conta.
      Clique no botão abaixo para criar uma nova senha.
    </p>
    ${button(resetUrl, 'Redefinir senha')}
    ${expiryNote(2)}
    <hr style="margin:28px 0;border:none;border-top:1px solid #e8e8e8;" />
    <p style="margin:0;font-size:13px;color:#8c8c8c;">
      Ou copie e cole este link no seu navegador:<br />
      <span style="color:${BRAND_COLOR};word-break:break-all;">${resetUrl}</span>
    </p>
  `;
  return layout('Redefinição de senha — SXGerador', body);
}

export function passwordResetEmailText(name: string, resetUrl: string): string {
  return [
    `Olá, ${name}!`,
    '',
    'Recebemos uma solicitação para redefinir a senha da sua conta.',
    'Acesse o link abaixo para criar uma nova senha (expira em 2 horas):',
    '',
    resetUrl,
    '',
    'Se você não solicitou isso, pode ignorar este e-mail com segurança.',
  ].join('\n');
}

// ---------------------------------------------------------------------------
// Account deletion email
// ---------------------------------------------------------------------------

export function accountDeletionEmailHtml(name: string, scheduledAt: Date): string {
  const scheduled = formatDate(scheduledAt);
  const body = `
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#1a1a1a;">
      Conta marcada para exclusão
    </h1>
    <p style="margin:0 0 4px;font-size:16px;color:#595959;line-height:1.6;">
      Olá, <strong>${name}</strong>.
    </p>
    <p style="margin:0;font-size:16px;color:#595959;line-height:1.6;">
      Confirmamos a solicitação de exclusão da sua conta no SXGerador.
      Seus acessos foram revogados e a remoção definitiva está agendada para
      <strong>${scheduled}</strong>.
    </p>
    <p style="margin-top:20px;font-size:13px;color:#8c8c8c;line-height:1.6;">
      Se você não solicitou isso, entre em contato com a manutenção do projeto o quanto antes.
    </p>
  `;
  return layout('Conta marcada para exclusão — SXGerador', body);
}

export function accountDeletionEmailText(name: string, scheduledAt: Date): string {
  return [
    `Olá, ${name}.`,
    '',
    'Confirmamos a solicitação de exclusão da sua conta no SXGerador.',
    `A remoção definitiva está agendada para ${formatDate(scheduledAt)}.`,
    '',
    'Se você não solicitou isso, entre em contato com a manutenção do projeto o quanto antes.',
  ].join('\n');
}

// ---------------------------------------------------------------------------
// Invitation email
// ---------------------------------------------------------------------------

export function invitationEmailHtml(
  inviterName: string,
  teamName: string,
  acceptUrl: string,
): string {
  const body = `
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#1a1a1a;">
      Convite para a equipe
    </h1>
    <p style="margin:0;font-size:16px;color:#595959;line-height:1.6;">
      <strong>${inviterName}</strong> convidou você para participar da equipe
      <strong>${teamName}</strong> no SXGerador.
    </p>
    ${button(acceptUrl, 'Aceitar convite')}
    ${expiryNote(48)}
    <hr style="margin:28px 0;border:none;border-top:1px solid #e8e8e8;" />
    <p style="margin:0;font-size:13px;color:#8c8c8c;">
      Ou copie e cole este link no seu navegador:<br />
      <span style="color:${BRAND_COLOR};word-break:break-all;">${acceptUrl}</span>
    </p>
  `;
  return layout(`Convite para ${teamName} — SXGerador`, body);
}

export function invitationEmailText(
  inviterName: string,
  teamName: string,
  acceptUrl: string,
): string {
  return [
    `${inviterName} convidou você para participar da equipe "${teamName}" no SXGerador.`,
    '',
    'Acesse o link abaixo para aceitar o convite (expira em 48 horas):',
    '',
    acceptUrl,
    '',
    'Se você não esperava este convite, pode ignorar este e-mail.',
  ].join('\n');
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'long',
    timeZone: 'America/Sao_Paulo',
  }).format(date);
}
