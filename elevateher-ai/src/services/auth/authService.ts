import { supabase } from '../supabase/client';
import type { LoginCredentials, SignupCredentials, ForgotPasswordPayload } from '../../types';
import { parseError } from '../../utils/errorHandler';

export interface AuthServiceResult<T = unknown> {
  data: T | null;
  error: string | null;
}

const AuthService = {
  /**
   * Sign up a new user with email and password.
   */
  async signUp(credentials: SignupCredentials): Promise<AuthServiceResult> {
    const { email, password } = credentials;
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { data: null, error: parseError(error) };
    return { data, error: null };
  },

  /**
   * Sign in with email and password.
   */
  async signIn(credentials: LoginCredentials): Promise<AuthServiceResult> {
    const { email, password } = credentials;
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { data: null, error: parseError(error) };
    return { data, error: null };
  },

  /**
   * Sign out the current user.
   */
  async signOut(): Promise<AuthServiceResult> {
    const { error } = await supabase.auth.signOut();
    if (error) return { data: null, error: parseError(error) };
    return { data: null, error: null };
  },

  /**
   * Send a password reset email.
   */
  async forgotPassword(payload: ForgotPasswordPayload): Promise<AuthServiceResult> {
    const { email } = payload;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) return { data: null, error: parseError(error) };
    return { data: null, error: null };
  },

  /**
   * Get the current session.
   */
  async getSession(): Promise<AuthServiceResult> {
    const { data, error } = await supabase.auth.getSession();
    if (error) return { data: null, error: parseError(error) };
    return { data: data.session, error: null };
  },

  /**
   * Get the current authenticated user.
   */
  async getCurrentUser(): Promise<AuthServiceResult> {
    const { data, error } = await supabase.auth.getUser();
    if (error) return { data: null, error: parseError(error) };
    return { data: data.user, error: null };
  },

  /**
   * Delete the current user's account.
   * Phase 1: sign out only. Full account deletion via admin API will be added later.
   */
  async deleteAccount(): Promise<AuthServiceResult> {
    const { error } = await supabase.auth.signOut();
    if (error) return { data: null, error: parseError(error) };
    return { data: null, error: null };
  },
};

export default AuthService;
