// Centralized error handling utilities

export interface AppError {
  message: string;
  code?: string;
  status?: number;
}

// Parse Supabase or generic errors into a human-readable message
export const parseError = (error: unknown): string => {
  if (!error) return 'An unknown error occurred.';

  if (typeof error === 'string') return error;

  if (error instanceof Error) {
    return mapErrorMessage(error.message);
  }

  if (typeof error === 'object' && error !== null) {
    const err = error as Record<string, unknown>;
    if (typeof err.message === 'string') return mapErrorMessage(err.message);
    if (typeof err.error_description === 'string') return err.error_description;
    if (typeof err.msg === 'string') return err.msg;
  }

  return 'An unexpected error occurred. Please try again.';
};

// Map known Supabase / network error messages to user-friendly messages
const mapErrorMessage = (message: string): string => {
  const msg = message.toLowerCase();

  if (msg.includes('invalid login credentials') || msg.includes('invalid email or password')) {
    return 'Invalid email or password. Please check your credentials.';
  }
  if (msg.includes('email not confirmed')) {
    return 'Please verify your email address before logging in.';
  }
  if (msg.includes('user already registered') || msg.includes('already been registered')) {
    return 'An account with this email already exists. Please log in.';
  }
  if (msg.includes('password should be at least')) {
    return 'Password must be at least 8 characters long.';
  }
  if (msg.includes('signup is disabled')) {
    return 'Signup is currently disabled. Please contact support.';
  }
  if (msg.includes('jwt expired') || msg.includes('session_not_found') || msg.includes('token is expired')) {
    return 'Your session has expired. Please log in again.';
  }
  if (msg.includes('network') || msg.includes('fetch') || msg.includes('failed to fetch')) {
    return 'Network error. Please check your internet connection.';
  }
  if (msg.includes('rate limit')) {
    return 'Too many attempts. Please wait a moment and try again.';
  }
  if (msg.includes('permission denied') || msg.includes('not authorized')) {
    return 'You do not have permission to perform this action.';
  }
  if (msg.includes('violates row-level security')) {
    return 'Access denied. You are not authorized to access this data.';
  }
  if (msg.includes('unique constraint') || msg.includes('duplicate key')) {
    return 'This record already exists.';
  }

  return message;
};

// Check if env variables are configured
export const checkEnvConfig = (): { valid: boolean; missing: string[] } => {
  const required = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
    'VITE_GEMINI_API_KEY',
    'VITE_TAVILY_API_KEY',
  ];
  const missing = required.filter((key) => {
    const val = import.meta.env[key];
    return !val || val.trim() === '';
  });
  return { valid: missing.length === 0, missing };
};

// Check only AI-related keys (used by AI services at runtime)
export const checkAIConfig = (): { gemini: boolean; tavily: boolean } => {
  const gemini = !!import.meta.env.VITE_GEMINI_API_KEY?.trim();
  const tavily = !!import.meta.env.VITE_TAVILY_API_KEY?.trim();
  return { gemini, tavily };
};

// Parse AI / external API errors specifically
export const parseAIError = (error: unknown): string => {
  // Get original error message first before any mapping
  let originalMsg = '';
  if (typeof error === 'string') originalMsg = error;
  else if (error instanceof Error) originalMsg = error.message;
  else if (typeof error === 'object' && error !== null) {
    const err = error as Record<string, unknown>;
    if (typeof err.message === 'string') originalMsg = err.message;
  }
  const originalLower = originalMsg.toLowerCase();

  // Check AI-specific error patterns on the original message first
  if (originalLower.includes('429') || originalLower.includes('quota') || originalLower.includes('resource_exhausted')) {
    return 'AI service rate limit reached. Please wait a moment and try again.';
  }
  if (originalLower.includes('api_key') || originalLower.includes('api key') || originalLower.includes('invalid key')) {
    return 'AI service key is invalid or missing. Please check your configuration.';
  }
  if (originalLower.includes('safety') || originalLower.includes('blocked')) {
    return 'The request was blocked by safety filters. Please try a different query.';
  }
  if (originalLower.includes('model not found') || originalLower.includes('not supported')) {
    return 'The AI model is unavailable. Please try again later.';
  }
  if (originalLower.includes('context length') || originalLower.includes('too long')) {
    return 'The search returned too much data. Please narrow your query.';
  }

  // If none of the above, use the base error handling
  return parseError(error);
};
