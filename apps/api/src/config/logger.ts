import { pino } from 'pino';
import { env } from './env';

export const logger = pino({
  level: env.logLevel,
  transport: env.isProduction
    ? undefined
    : {
        target: 'pino-pretty',
        options: {
          colorize: true,
          ignore: 'pid,hostname',
          translateTime: 'SYS:standard',
        },
      },
});
