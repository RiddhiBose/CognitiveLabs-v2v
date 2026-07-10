// SearchService — central entry point for all AI-powered feature searches.
// Orchestrates: TavilyService → PromptBuilder → GeminiService → ResponseFormatter → CacheService
// Contains NO feature-specific logic. Feature modules pass everything via SearchRequest.

import { supabase } from '../supabase/client';
import TavilyService from '../ai/tavilyService';
import GeminiService from '../ai/geminiService';
import GroqService from '../ai/groqService';
import OpenRouterService from '../ai/openRouterService';
import PromptBuilder from '../ai/promptBuilder';
import ResponseFormatter from '../ai/responseFormatter';
import CacheService from '../ai/cacheService';

import type {
  SearchRequest,
  SearchResponse,
  Recommendation,
  SearchCategory,
} from '../../types';
import type { TavilySearchResult } from '../../types/ai.types';
import type { SearchHistory } from '../../types/search.types';
import { logger } from '../../utils/logger';
import { parseError } from '../../utils/errorHandler';

const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

function buildFallbackRecommendations(searchResults: TavilySearchResult[]): Recommendation[] {
  return searchResults.slice(0, 6).map((result) => {
    let sourceHost = 'web search';
    try {
      sourceHost = new URL(result.url).hostname.replace(/^www\./, '');
    } catch {
      // Keep the default fallback host
    }

    return {
      title: result.title || 'Search result',
      summary: result.content?.slice(0, 220) || 'No summary available.',
      matchScore: Math.max(40, Math.round(result.score * 100)),
      reason: 'This result was retrieved from live web search because AI summarization is temporarily unavailable.',
      officialWebsite: result.url,
      applicationLink: result.url,
      source: sourceHost,
      location: null,
      metadata: {
        sourceUrl: result.url,
        publishedDate: result.publishedDate ?? null,
        fallback: true,
      },
    };
  });
}

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
    console.log('[SearchService] cache key:', cacheKey);
    const cached = CacheService.get<T[]>(cacheKey);
    if (cached) {
      console.log('[SearchService] Cache hit!');
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
    console.log('[SearchService] Built Tavily search query:', query);
    logger.info('SearchService', `Starting search — type: ${request.type}, query: "${query}"`);

    // ── 3. Tavily web search ──────────────────────────────────────────────
    console.log('[SearchService] Calling TavilyService.search...');
    const tavilyResult = await TavilyService.search({
      query,
      preferredDomains: request.preferredDomains,
      maxResults: request.maxResults ?? 8,
      searchDepth: request.searchDepth ?? 'advanced',
    });
    console.log('[SearchService] Tavily result:', tavilyResult);

    if (tavilyResult.error || !tavilyResult.data) {
      console.error('[SearchService] Tavily search failed!', tavilyResult.error);
      logger.error('SearchService', 'Tavily search failed', tavilyResult.error);
      return SearchService.errorResponse(request, tavilyResult.error ?? 'Search failed.', startTime);
    }

    const searchResults = TavilyService.filterByScore(tavilyResult.data.results, 0.2);
    console.log('[SearchService] Filtered Tavily results (score >=0.2):', searchResults);

    if (searchResults.length === 0) {
      console.warn('[SearchService] No usable Tavily results');
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
    console.log('[SearchService] Built Gemini prompt (first 500 chars):', prompt.slice(0, 500));

    // ── 5. Gemini analysis ────────────────────────────────────────────────
    console.log('[SearchService] Calling GeminiService.generate...');
    let aiResult = await GeminiService.generate({
      prompt,
      searchResults,
    });
    console.log('[SearchService] Gemini result:', aiResult);

    if (aiResult.error || !aiResult.data) {
      console.warn('[SearchService] Gemini generation failed, trying Groq fallback...', aiResult.error);
      logger.warn('SearchService', 'Gemini generation failed, trying Groq fallback', aiResult.error);

      if (GroqService.isConfigured()) {
        aiResult = await GroqService.generate({
          prompt,
          searchResults,
        });
        console.log('[SearchService] Groq result:', aiResult);
      }
    }

    if (aiResult.error || !aiResult.data) {
      console.warn('[SearchService] Groq generation failed, trying OpenRouter fallback...', aiResult.error);
      logger.warn('SearchService', 'Groq generation failed, trying OpenRouter fallback', aiResult.error);

      if (OpenRouterService.isConfigured()) {
        aiResult = await OpenRouterService.generate({
          prompt,
          searchResults,
        });
        console.log('[SearchService] OpenRouter result:', aiResult);
      }
    }

    if (aiResult.error || !aiResult.data) {
      console.error('[SearchService] AI generation failed!', aiResult.error);
      logger.error('SearchService', 'AI generation failed', aiResult.error);

      const fallbackResults = buildFallbackRecommendations(searchResults) as T[];
      return {
        results: fallbackResults,
        query,
        featureType: request.type,
        totalFound: fallbackResults.length,
        cached: false,
        searchDurationMs: Math.round(performance.now() - startTime),
        error: null,
        warning: 'AI summarization is temporarily unavailable. Showing live web results instead.',
      };
    }

    // ── 6. Parse + format ─────────────────────────────────────────────────
    console.log('[SearchService] Calling ResponseFormatter.parse with text:', aiResult.data.text);
    const recommendations = ResponseFormatter.parse<T>(
      aiResult.data.text,
      request.type,
    );
    console.log('[SearchService] Parsed recommendations:', recommendations);

    // ── 7. Cache ──────────────────────────────────────────────────────────
    if (recommendations.length > 0) {
      console.log('[SearchService] Saving to cache');
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
