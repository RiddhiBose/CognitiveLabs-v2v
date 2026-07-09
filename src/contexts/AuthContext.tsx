import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '../services/supabase/client';
import { AuthService } from '../services/auth';
import type { LoginCredentials, SignupCredentials, ForgotPasswordPayload } from '../types';

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  signUp: (credentials: SignupCredentials) => Promise<{ error: string | null }>;
  signIn: (credentials: LoginCredentials) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  forgotPassword: (payload: ForgotPasswordPayload) => Promise<{ error: string | null }>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load initial session
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    // Listen to auth state changes
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      setLoading(false);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const signUp = useCallback(async (credentials: SignupCredentials) => {
    setError(null);
    const result = await AuthService.signUp(credentials);
    if (result.error) {
      setError(result.error);
      return { error: result.error };
    }
    return { error: null };
  }, []);

  const signIn = useCallback(async (credentials: LoginCredentials) => {
    setError(null);
    const result = await AuthService.signIn(credentials);
    if (result.error) {
      setError(result.error);
      return { error: result.error };
    }
    return { error: null };
  }, []);

  const signOut = useCallback(async () => {
    setError(null);
    await AuthService.signOut();
    setUser(null);
    setSession(null);
  }, []);

  const forgotPassword = useCallback(async (payload: ForgotPasswordPayload) => {
    setError(null);
    const result = await AuthService.forgotPassword(payload);
    if (result.error) {
      setError(result.error);
      return { error: result.error };
    }
    return { error: null };
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return (
    <AuthContext.Provider
      value={{ user, session, loading, error, signUp, signIn, signOut, forgotPassword, clearError }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
