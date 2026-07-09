// Authentication related types

export interface AuthUser {
  id: string;
  email: string;
  created_at: string;
  updated_at?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials {
  email: string;
  password: string;
  confirmPassword: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface AuthError {
  message: string;
  status?: number;
}

export interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
}

export interface SessionData {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
  user: AuthUser;
}
