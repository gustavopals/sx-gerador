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

export const env = {
  nodeEnv,
  isProduction: nodeEnv === 'production',
  port: parsePort(process.env['PORT']),
  logLevel: process.env['LOG_LEVEL'] ?? (nodeEnv === 'production' ? 'info' : 'debug'),
  corsOrigin: process.env['CORS_ORIGIN'] ?? 'http://localhost:4200',
} as const;
