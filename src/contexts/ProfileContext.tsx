import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { ProfileService } from '../services/profile';
import type { Profile } from '../types';
import { useAuth } from './AuthContext';

interface ProfileContextValue {
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  isProfileComplete: boolean;
  refreshProfile: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: string | null }>;
  clearError: () => void;
}

const ProfileContext = createContext<ProfileContextValue | undefined>(undefined);

export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async (userId: string) => {
    setLoading(true);
    setError(null);
    const result = await ProfileService.getMyProfile(userId);
    if (result.error) {
      // Profile may not exist yet (new user)
      setProfile(null);
    } else {
      setProfile(result.data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (user?.id) {
      fetchProfile(user.id);
    } else {
      setProfile(null);
    }
  }, [user?.id, fetchProfile]);

  const refreshProfile = useCallback(async () => {
    if (user?.id) await fetchProfile(user.id);
  }, [user?.id, fetchProfile]);

  const updateProfile = useCallback(
    async (updates: Partial<Profile>) => {
      if (!user?.id) return { error: 'Not authenticated' };
      setError(null);
      const result = await ProfileService.updateProfile(user.id, updates);
      if (result.error) {
        setError(result.error);
        return { error: result.error };
      }
      setProfile(result.data);
      return { error: null };
    },
    [user?.id],
  );

  const clearError = useCallback(() => setError(null), []);

  const isProfileComplete = profile?.is_profile_complete ?? false;

  return (
    <ProfileContext.Provider
      value={{ profile, loading, error, isProfileComplete, refreshProfile, updateProfile, clearError }}
    >
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = (): ProfileContextValue => {
  const context = useContext(ProfileContext);
  if (!context) throw new Error('useProfile must be used within a ProfileProvider');
  return context;
};
