// SearchService — central entry point for all AI-powered feature searches.
// Orchestrates: TavilyService → PromptBuilder → GeminiService → ResponseFormatter → CacheService
// Contains NO feature-specific logic. Feature modules pass everything via SearchRequest.

import { supabase } from '../supabase/client';
import TavilyService from '../ai/tavilyService';
import GeminiService from '../ai/geminiService';
import PromptBuilder from '../ai/promptBuilder';
import ResponseFormatter from '../ai/responseFormatter';
import CacheService from '../ai/cacheService';

import type {
  SearchRequest,
  SearchResponse,
  Recommendation,
  SearchCategory,
} from '../../types';
import type { SearchHistory } from '../../types/search.types';
import { logger } from '../../utils/logger';
import { parseError } from '../../utils/errorHandler';

const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

export interface SearchServiceResult<T = null> {
  data: T | null;
  error: string | null;
}

const SearchService = {
  /**
   * Main AI search pipeline.
   *
   * Flow:
   *   1. Check cache
   *   2. Build search query (PromptBuilder)
   *   3. Tavily web search
   *   4. Build Gemini prompt (PromptBuilder)
   *   5. Gemini analysis (GeminiService)
   *   6. Parse + format results (ResponseFormatter)
   *   7. Cache results
   *   8. Return SearchResponse
   */
  async search<T extends Recommendation = Recommendation>(
    request: SearchRequest,
  ): Promise<SearchResponse<T>> {
    const startTime = performance.now();

    // ── 1. Cache check ────────────────────────────────────────────────────
    const cacheKey = CacheService.buildKey(request);
    const cached = CacheService.get<T[]>(cacheKey);
    if (cached) {
      logger.info('SearchService', `Cache HIT for ${request.type}`);
      return {
        results: cached,
        query: cacheKey,
        featureType: request.type,
        totalFound: cached.length,
        cached: true,
        searchDurationMs: Math.round(performance.now() - startTime),
        error: null,
      };
    }

    // ── 2. Build Tavily search query ──────────────────────────────────────
    const query = PromptBuilder.buildSearchQuery(
      request.type,
      request.profile,
      request.featureInput,
    );
    logger.info('SearchService', `Starting search — type: ${request.type}, query: "${query}"`);

    // ── 3. Tavily web search ──────────────────────────────────────────────
    const tavilyResult = await TavilyService.search({
      query,
      preferredDomains: request.preferredDomains,
      maxResults: request.maxResults ?? 8,
      searchDepth: request.searchDepth ?? 'advanced',
    });

    if (tavilyResult.error || !tavilyResult.data) {
      logger.error('SearchService', 'Tavily search failed', tavilyResult.error);
      return SearchService.errorResponse(request, tavilyResult.error ?? 'Search failed.', startTime);
    }

    const searchResults = TavilyService.filterByScore(tavilyResult.data.results, 0.2);

    if (searchResults.length === 0) {
      logger.warn('SearchService', 'No usable Tavily results returned');
      return {
        results: [],
        query,
        featureType: request.type,
        totalFound: 0,
        cached: false,
        searchDurationMs: Math.round(performance.now() - startTime),
        error: null,
        warning: 'No relevant sources were found for this search. Try adjusting your inputs.',
      };
    }

    // ── 4. Build Gemini prompt ────────────────────────────────────────────
    const prompt = PromptBuilder.build({
      featureType: request.type,
      profile: request.profile,
      searchResults,
      featureInput: request.featureInput,
    });

    // ── 5. Gemini analysis ────────────────────────────────────────────────
    const geminiResult = await GeminiService.generate({
      prompt,
      searchResults,
    });

    if (geminiResult.error || !geminiResult.data) {
      logger.error('SearchService', 'Gemini generation failed', geminiResult.error);
      return SearchService.errorResponse(request, geminiResult.error ?? 'AI processing failed.', startTime);
    }

    // ── 6. Parse + format ─────────────────────────────────────────────────
    const recommendations = ResponseFormatter.parse<T>(
      geminiResult.data.text,
      request.type,
    );

    // ── 7. Cache ──────────────────────────────────────────────────────────
    if (recommendations.length > 0) {
      CacheService.set(cacheKey, recommendations, CACHE_TTL_MS);
    }

    const durationMs = Math.round(performance.now() - startTime);
    logger.info('SearchService', `Search complete — ${recommendations.length} results in ${durationMs}ms`);

    return {
      results: recommendations,
      query,
      featureType: request.type,
      totalFound: recommendations.length,
      cached: false,
      searchDurationMs: durationMs,
      error: null,
    };
  },

  // ── Search history (Supabase) ───────────────────────────────────────────

  async saveSearchHistory(
    userId: string,
    query: string,
    category?: SearchCategory,
    resultsCount?: number,
  ): Promise<SearchServiceResult> {
    const { error } = await supabase.from('search_history').insert({
      user_id: userId,
      query,
      category: category ?? null,
      results_count: resultsCount ?? null,
    });
    if (error) return { data: null, error: parseError(error) };
    return { data: null, error: null };
  },

  async getSearchHistory(
    userId: string,
    limit = 20,
  ): Promise<SearchServiceResult<SearchHistory[]>> {
    const { data, error } = await supabase
      .from('search_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) return { data: null, error: parseError(error) };
    return { data: data as SearchHistory[], error: null };
  },

  async clearSearchHistory(userId: string): Promise<SearchServiceResult> {
    const { error } = await supabase
      .from('search_history')
      .delete()
      .eq('user_id', userId);

    if (error) return { data: null, error: parseError(error) };
    return { data: null, error: null };
  },

  // ── Helpers ─────────────────────────────────────────────────────────────

  errorResponse<T extends Recommendation>(
    request: SearchRequest,
    error: string,
    startTime: number,
  ): SearchResponse<T> {
    return {
      results: [],
      query: '',
      featureType: request.type,
      totalFound: 0,
      cached: false,
      searchDurationMs: Math.round(performance.now() - startTime),
      error,
    };
  },

  /**
   * Check whether both AI services are ready.
   */
  isReady(): { ready: boolean; missing: string[] } {
    const missing: string[] = [];
    if (!TavilyService.isConfigured()) missing.push('VITE_TAVILY_API_KEY');
    if (!GeminiService.isConfigured()) missing.push('VITE_GEMINI_API_KEY');
    return { ready: missing.length === 0, missing };
  },
};

export default SearchService;
