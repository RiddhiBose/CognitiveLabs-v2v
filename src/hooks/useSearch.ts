// useSearch — reusable React hook for all AI-powered feature searches.
// Feature modules call this hook with their specific type, input and domains.

import { useState, useCallback, useRef } from 'react';
import SearchService from '../services/search/searchService';
import { useAuth } from '../contexts/AuthContext';
import { useProfile } from '../contexts/ProfileContext';
import type {
  SearchRequest,
  SearchResponse,
  Recommendation,
  FeatureType,
  UserProfileForSearch,
} from '../types';
import { PREFERRED_DOMAINS } from '../types/search.types';
import { logger } from '../utils/logger';

export interface UseSearchOptions {
  featureType: FeatureType;
  preferredDomains?: string[];
  maxResults?: number;
  searchDepth?: 'basic' | 'advanced';
  saveToHistory?: boolean;
}

export interface UseSearchState<T extends Recommendation = Recommendation> {
  results: T[];
  loading: boolean;
  error: string | null;
  warning: string | null;
  cached: boolean;
  searchDurationMs: number | null;
  lastQuery: string | null;
  hasSearched: boolean;
}

export interface UseSearchReturn<T extends Recommendation = Recommendation>
  extends UseSearchState<T> {
  search: (featureInput: Record<string, unknown>) => Promise<void>;
  reset: () => void;
  isReady: boolean;
  missingKeys: string[];
}

const INITIAL_STATE = <T extends Recommendation>(): UseSearchState<T> => ({
  results: [],
  loading: false,
  error: null,
  warning: null,
  cached: false,
  searchDurationMs: null,
  lastQuery: null,
  hasSearched: false,
});

export function useSearch<T extends Recommendation = Recommendation>(
  options: UseSearchOptions,
): UseSearchReturn<T> {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [state, setState] = useState<UseSearchState<T>>(INITIAL_STATE<T>());
  const abortRef = useRef<boolean>(false);

  const { ready, missing } = SearchService.isReady();

  const search = useCallback(
    async (featureInput: Record<string, unknown>) => {
      if (!profile) {
        setState((prev) => ({
          ...prev,
          error: 'Please complete your profile before searching.',
          hasSearched: true,
        }));
        return;
      }

      abortRef.current = false;
      setState((prev) => ({
        ...prev,
        loading: true,
        error: null,
        warning: null,
        hasSearched: true,
      }));

      // Map profile to the minimal AI-facing shape
      const profileForSearch: UserProfileForSearch = {
        full_name: profile.full_name,
        role: profile.role,
        qualification: profile.qualification ?? null,
        qualification_other: profile.qualification_other ?? null,
        specialization: profile.specialization ?? null,
        occupation: profile.occupation ?? null,
        experience: profile.experience ?? null,
        annual_income: profile.annual_income ?? null,
        category: profile.category ?? null,
        pwd_status: profile.pwd_status ?? null,
        state: profile.state ?? null,
        city: profile.city ?? null,
        bio: profile.bio ?? null,
        job_title: profile.job_title ?? null,
        industry: profile.industry ?? null,
      };

      const domains =
        options.preferredDomains ??
        PREFERRED_DOMAINS[options.featureType] ??
        [];

      const request: SearchRequest = {
        type: options.featureType,
        profile: profileForSearch,
        featureInput,
        preferredDomains: domains,
        maxResults: options.maxResults ?? 6,
        searchDepth: options.searchDepth ?? 'advanced',
      };

      logger.info('useSearch', `Initiating search — type: ${options.featureType}`);

      const response: SearchResponse<T> = await SearchService.search<T>(request);

      if (abortRef.current) return; // Component unmounted mid-search

      setState({
        results: response.results,
        loading: false,
        error: response.error,
        warning: response.warning ?? null,
        cached: response.cached,
        searchDurationMs: response.searchDurationMs,
        lastQuery: response.query,
        hasSearched: true,
      });

      // Persist to search history if enabled and user is logged in
      if (options.saveToHistory !== false && user?.id && response.results.length > 0) {
        SearchService.saveSearchHistory(
          user.id,
          response.query,
          options.featureType as never,
          response.totalFound,
        ).catch((err) => logger.warn('useSearch', 'Failed to save search history', err));
      }
    },
    [profile, user?.id, options],
  );

  const reset = useCallback(() => {
    abortRef.current = true;
    setState(INITIAL_STATE<T>());
  }, []);

  return {
    ...state,
    search,
    reset,
    isReady: ready,
    missingKeys: missing,
  };
}
