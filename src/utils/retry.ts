// Retry utility with exponential backoff

import { logger } from './logger';

export interface RetryOptions {
  maxAttempts?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffFactor?: number;
  retryOn?: (error: unknown) => boolean;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  initialDelayMs: 500,
  maxDelayMs: 8000,
  backoffFactor: 2,
  retryOn: () => true,
};

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRateLimitError(error: unknown): boolean {
  if (!error) return false;
  const msg = String((error as { message?: string })?.message ?? error).toLowerCase();
  return msg.includes('429') || msg.includes('rate limit') || msg.includes('quota');
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  context: string,
  options: RetryOptions = {},
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: unknown;
  let delayMs = opts.initialDelayMs;

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;

      // Don't retry if the error isn't retriable
      if (!opts.retryOn(err)) {
        logger.warn(context, `Non-retriable error on attempt ${attempt}`, err);
        throw err;
      }

      if (attempt === opts.maxAttempts) break;

      // Extra back-off for rate limit errors
      const waitMs = isRateLimitError(err) ? Math.min(delayMs * 4, opts.maxDelayMs) : delayMs;

      logger.warn(context, `Attempt ${attempt} failed — retrying in ${waitMs}ms`, err);
      await delay(waitMs);
      delayMs = Math.min(delayMs * opts.backoffFactor, opts.maxDelayMs);
    }
  }

  logger.error(context, `All ${opts.maxAttempts} attempts failed`, lastError);
  throw lastError;
}
