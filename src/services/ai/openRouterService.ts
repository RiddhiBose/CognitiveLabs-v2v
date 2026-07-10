import { logger } from '../../utils/logger';
import { parseAIError } from '../../utils/errorHandler';
import type { GeminiRequest, GeminiRawResponse } from '../../types/ai.types';

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY as string | undefined;
const MODEL_NAME = (import.meta.env.VITE_OPENROUTER_MODEL as string | undefined)?.trim() || 'openai/gpt-4o-mini';

export interface OpenRouterServiceResult<T = unknown> {
  data: T | null;
  error: string | null;
}

const OpenRouterService = {
  isConfigured(): boolean {
    return !!OPENROUTER_API_KEY && OPENROUTER_API_KEY.trim() !== '';
  },

  async generate(request: GeminiRequest): Promise<OpenRouterServiceResult<GeminiRawResponse>> {
    if (!OpenRouterService.isConfigured()) {
      return {
        data: null,
        error: 'OpenRouter API key is not configured. Add VITE_OPENROUTER_API_KEY to your .env file.',
      };
    }

    if (!request.searchResults?.length) {
      return {
        data: null,
        error: 'No search results provided to OpenRouter. Cannot generate recommendations without source data.',
      };
    }

    const end = logger.time('OpenRouterService', 'generate');
    logger.info('OpenRouterService', `Sending prompt to ${MODEL_NAME} (${request.searchResults.length} search results)`);

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://localhost',
          'X-Title': 'ElevateHer AI',
        },
        body: JSON.stringify({
          model: MODEL_NAME,
          temperature: 0.1,
          max_tokens: 4096,
          messages: [
            {
              role: 'system',
              content:
                'You are an AI assistant for ElevateHer AI. Use only information from the supplied search results. Return valid JSON array only. Never invent details. If information is missing, use "Not available in current sources".',
            },
            {
              role: 'user',
              content: request.prompt,
            },
          ],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenRouter API error ${response.status}: ${errorText}`);
      }

      const data = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
        usage?: { prompt_tokens?: number; completion_tokens?: number };
      };

      const text = data.choices?.[0]?.message?.content?.trim() ?? '';
      if (!text) {
        return { data: null, error: 'OpenRouter returned an empty response.' };
      }

      end();

      return {
        data: {
          text,
          modelUsed: MODEL_NAME,
          promptTokens: data.usage?.prompt_tokens,
          candidateTokens: data.usage?.completion_tokens,
        },
        error: null,
      };
    } catch (err) {
      end();
      logger.error('OpenRouterService', 'Generation failed', err);
      return { data: null, error: parseAIError(err) };
    }
  },

  async ping(): Promise<{ ok: boolean; error: string | null }> {
    if (!OpenRouterService.isConfigured()) {
      return { ok: false, error: 'OpenRouter API key not configured.' };
    }

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://localhost',
          'X-Title': 'ElevateHer AI',
        },
        body: JSON.stringify({
          model: MODEL_NAME,
          messages: [{ role: 'user', content: 'Reply with: ok' }],
          max_tokens: 10,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenRouter API error ${response.status}: ${errorText}`);
      }

      return { ok: true, error: null };
    } catch (err) {
      return { ok: false, error: parseAIError(err) };
    }
  },
};

export default OpenRouterService;
