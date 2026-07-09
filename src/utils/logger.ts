// Centralised logging utility
// Never logs API keys, tokens or passwords.

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

const isDev = import.meta.env.DEV;

function formatMessage(level: LogLevel, context: string, message: string): string {
  const ts = new Date().toISOString();
  return `[${ts}] [${level.toUpperCase()}] [${context}] ${message}`;
}

function sanitise(data: unknown): unknown {
  if (!data || typeof data !== 'object') return data;

  const REDACTED_KEYS = [
    'api_key', 'apikey', 'key', 'token', 'password', 'secret',
    'authorization', 'auth', 'credential', 'access_token',
  ];

  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data as Record<string, unknown>)) {
    if (REDACTED_KEYS.some((r) => k.toLowerCase().includes(r))) {
      out[k] = '[REDACTED]';
    } else if (typeof v === 'object') {
      out[k] = sanitise(v);
    } else {
      out[k] = v;
    }
  }
  return out;
}

export const logger = {
  info(context: string, message: string, data?: unknown): void {
    if (!isDev) return;
    console.info(formatMessage('info', context, message), data ? sanitise(data) : '');
  },

  warn(context: string, message: string, data?: unknown): void {
    console.warn(formatMessage('warn', context, message), data ? sanitise(data) : '');
  },

  error(context: string, message: string, error?: unknown): void {
    console.error(formatMessage('error', context, message), error ?? '');
  },

  debug(context: string, message: string, data?: unknown): void {
    if (!isDev) return;
    console.debug(formatMessage('debug', context, message), data ? sanitise(data) : '');
  },

  // Log API request timing without exposing key
  time(context: string, label: string): () => void {
    const start = performance.now();
    return () => {
      const ms = Math.round(performance.now() - start);
      logger.info(context, `${label} completed in ${ms}ms`);
    };
  },
};
