import pino from 'pino';

export type LogLevel = 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace';

export interface LoggerOptions {
  level?: LogLevel;
  name?: string;
  pretty?: boolean;
}

const isTest = process.env.NODE_ENV === 'test';
const isDevelopment = process.env.NODE_ENV === 'development';

export function createLogger(options: LoggerOptions = {}): pino.Logger {
  const level = options.level || (isTest ? 'silent' : isDevelopment ? 'debug' : 'info');

  const transport: { target: string; options: { colorize: boolean; translateTime: string; ignore: string } } | undefined = options.pretty || isDevelopment
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      }
    : undefined;

  return pino({
    name: options.name || 'agent-gateway',
    level,
    transport,
  });
}

export const logger: pino.Logger = createLogger();

export function setLogLevel(level: LogLevel): void {
  logger.level = level;
}

export function childLogger(bindings: pino.Bindings): pino.Logger {
  return logger.child(bindings);
}