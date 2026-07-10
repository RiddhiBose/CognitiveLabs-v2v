import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import SavedItemsService from '../services/SavedItemsService';

interface SavedContextValue {
  savedCount: number;
  refreshCount: () => Promise<void>;
  /** Optimistically increment or decrement the count without a DB round-trip */
  adjustCount: (delta: number) => void;
  /**
   * Bumps every time an item is saved so SavedPage can re-fetch
   * without needing a page reload.
   */
  savedVersion: number;
}

const SavedContext = createContext<SavedContextValue | undefined>(undefined);

export const SavedProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [savedCount, setSavedCount] = useState(0);
  const [savedVersion, setSavedVersion] = useState(0);

  const refreshCount = useCallback(async () => {
    if (!user?.id) { setSavedCount(0); return; }
    const res = await SavedItemsService.getCount(user.id);
    if (!res.error) setSavedCount(res.data ?? 0);
  }, [user?.id]);

  const adjustCount = useCallback((delta: number) => {
    setSavedCount((prev) => Math.max(0, prev + delta));
    // Bump version on save (delta > 0) so SavedPage knows to re-fetch
    if (delta > 0) setSavedVersion((v) => v + 1);
  }, []);

  useEffect(() => { refreshCount(); }, [refreshCount]);

  return (
    <SavedContext.Provider value={{ savedCount, refreshCount, adjustCount, savedVersion }}>
      {children}
    </SavedContext.Provider>
  );
};

export const useSaved = (): SavedContextValue => {
  const ctx = useContext(SavedContext);
  if (!ctx) throw new Error('useSaved must be used within SavedProvider');
  return ctx;
};
