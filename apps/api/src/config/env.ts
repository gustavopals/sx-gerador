import { config } from 'dotenv';

config();

function parsePort(value: string | undefined): number {
  const port = Number(value ?? 3000);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`PORT must be an integer between 1 and 65535. Received: ${value}`);
  }

  return port;
}

const nodeEnv = process.env['NODE_ENV'] ?? 'development';

function requireEnv(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback;
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
}

export const env = {
  nodeEnv,
  isProduction: nodeEnv === 'production',
  port: parsePort(process.env['PORT']),
  logLevel: process.env['LOG_LEVEL'] ?? (nodeEnv === 'production' ? 'info' : 'debug'),
  corsOrigin: process.env['CORS_ORIGIN'] ?? 'http://localhost:4200',
  jwtAccessSecret: requireEnv('JWT_ACCESS_SECRET', 'dev-access-secret-change-in-production'),
  jwtRefreshSecret: requireEnv('JWT_REFRESH_SECRET', 'dev-refresh-secret-change-in-production'),
  jwtAccessExpiresIn: process.env['JWT_ACCESS_EXPIRES_IN'] ?? '15m',
  jwtRefreshExpiresIn: process.env['JWT_REFRESH_EXPIRES_IN'] ?? '30d',
  // Email
  emailFrom: process.env['EMAIL_FROM'] ?? 'SXGerador <noreply@sxgerador.dev>',
  appUrl: process.env['APP_URL'] ?? 'http://localhost:4200',
  smtpHost: process.env['SMTP_HOST'],
  smtpPort: process.env['SMTP_PORT'] ? Number(process.env['SMTP_PORT']) : undefined,
  smtpUser: process.env['SMTP_USER'],
  smtpPassword: process.env['SMTP_PASSWORD'],
  smtpSecure: process.env['SMTP_SECURE'] === 'true',
} as const;
