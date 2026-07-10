// TavilyService — live web search using the Tavily API
// Docs: https://docs.tavily.com/docs/tavily-api/rest_api

import type { TavilySearchParams, TavilyResponse, TavilySearchResult } from '../../types/ai.types';
import { logger } from '../../utils/logger';
import { withRetry } from '../../utils/retry';
import { parseError } from '../../utils/errorHandler';

const TAVILY_API_URL = 'https://api.tavily.com/search';
const TAVILY_API_KEY = import.meta.env.VITE_TAVILY_API_KEY as string;

// Raw shape returned by Tavily REST API
interface TavilyRawResult {
  title: string;
  url: string;
  content: string;
  score: number;
  published_date?: string;
}

interface TavilyRawResponse {
  results: TavilyRawResult[];
  query: string;
  response_time: number;
  answer?: string;
}

export interface TavilyServiceResult {
  data: TavilyResponse | null;
  error: string | null;
}

const TavilyService = {
  isConfigured(): boolean {
    return !!TAVILY_API_KEY && TAVILY_API_KEY.trim() !== '';
  },

  /**
   * Execute a live web search via Tavily.
   *
   * @param params - query, preferred domains, max results, search depth
   * @returns Normalised TavilyResponse
   */
  async search(params: TavilySearchParams): Promise<TavilyServiceResult> {
    if (!TavilyService.isConfigured()) {
      return { data: null, error: 'Tavily API key is not configured. Add VITE_TAVILY_API_KEY to your .env file.' };
    }

    const {
      query,
      preferredDomains = [],
      maxResults = 8,
      searchDepth = 'advanced',
    } = params;

    if (!query.trim()) {
      return { data: null, error: 'Search query cannot be empty.' };
    }

    const end = logger.time('TavilyService', `search: "${query}"`);

    try {
      const raw = await withRetry<TavilyRawResponse>(
        async () => {
          const response = await fetch(TAVILY_API_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${TAVILY_API_KEY}`,
            },
            body: JSON.stringify({
              query,
              search_depth: searchDepth,
              max_results: maxResults,
              include_domains: preferredDomains.length > 0 ? preferredDomains : undefined,
              include_answer: false,
              include_raw_content: false,
            }),
          });

          if (!response.ok) {
            const errorBody = await response.text().catch(() => '');
            throw new Error(`Tavily API error ${response.status}: ${errorBody}`);
          }

          const body = await response.text();
          return JSON.parse(body) as TavilyRawResponse;
        },
        'TavilyService',
        {
          maxAttempts: 3,
          retryOn: (err) => {
            const msg = String((err as { message?: string })?.message ?? '').toLowerCase();
            // Retry on network errors and 5xx, not on 4xx (except 429)
            return msg.includes('429') || msg.includes('network') || msg.includes('5');
          },
        },
      );

      end();

      const results: TavilySearchResult[] = (raw.results ?? []).map((r) => ({
        title: r.title ?? '',
        url: r.url ?? '',
        content: r.content ?? '',
        score: r.score ?? 0,
        publishedDate: r.published_date,
      }));

      logger.info('TavilyService', `Returned ${results.length} results for query: "${query}"`);

      return {
        data: {
          results,
          query: raw.query ?? query,
          responseTime: raw.response_time ?? 0,
        },
        error: null,
      };
    } catch (err) {
      end();
      logger.error('TavilyService', 'Search failed', err);
      const msg = parseError(err);

      if (msg.includes('401') || msg.includes('403')) {
        return { data: null, error: 'Invalid Tavily API key. Please check VITE_TAVILY_API_KEY.' };
      }
      if (msg.includes('429')) {
        return { data: null, error: 'Tavily rate limit reached. Please wait a moment and try again.' };
      }
      return { data: null, error: `Search failed: ${msg}` };
    }
  },

  /**
   * Filter results by minimum relevance score.
   */
  filterByScore(results: TavilySearchResult[], minScore = 0.3): TavilySearchResult[] {
    return results.filter((r) => r.score >= minScore);
  },

  /**
   * Format search results into a compact text block for the AI prompt.
   */
  formatForPrompt(results: TavilySearchResult[]): string {
    return results
      .map((r, i) =>
        `[${i + 1}] ${r.title}\nURL: ${r.url}\n${r.content.slice(0, 600).trim()}`,
      )
      .join('\n\n---\n\n');
  },
};

export default TavilyService;
