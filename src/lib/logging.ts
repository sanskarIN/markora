import { sanitizeLogContext } from './security';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  event: string;
  context: Record<string, unknown>;
}

const configuredLevel = (import.meta.env.VITE_LOG_LEVEL ?? 'info') as LogLevel;
const levelWeight: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 };

function shouldLog(level: LogLevel): boolean {
  return levelWeight[level] >= (levelWeight[configuredLevel] ?? levelWeight.info);
}

function write(level: LogLevel, event: string, context: Record<string, unknown> = {}): void {
  if (!shouldLog(level)) return;

  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    event,
    context: sanitizeLogContext(context),
  };

  const output = JSON.stringify(entry);
  if (level === 'error') console.error(output);
  else if (level === 'warn') console.warn(output);
  else if (level === 'debug') console.debug(output);
  else console.info(output);
}

export const logger = {
  debug: (event: string, context?: Record<string, unknown>) => write('debug', event, context),
  info: (event: string, context?: Record<string, unknown>) => write('info', event, context),
  warn: (event: string, context?: Record<string, unknown>) => write('warn', event, context),
  error: (event: string, context?: Record<string, unknown>) => write('error', event, context),
};
