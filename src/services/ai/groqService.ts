import { logger } from '../../utils/logger';
import { parseAIError } from '../../utils/errorHandler';
import type { GeminiRequest, GeminiRawResponse } from '../../types/ai.types';

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY as string | undefined;
const MODEL_NAME = (import.meta.env.VITE_GROQ_MODEL as string | undefined)?.trim() || 'llama-3.3-70b-versatile';

export interface GroqServiceResult<T = unknown> {
  data: T | null;
  error: string | null;
}

const GroqService = {
  isConfigured(): boolean {
    return !!GROQ_API_KEY && GROQ_API_KEY.trim() !== '';
  },

  async generate(request: GeminiRequest): Promise<GroqServiceResult<GeminiRawResponse>> {
    if (!GroqService.isConfigured()) {
      return {
        data: null,
        error: 'Groq API key is not configured. Add VITE_GROQ_API_KEY to your .env file.',
      };
    }

    if (!request.searchResults?.length) {
      return {
        data: null,
        error: 'No search results provided to Groq. Cannot generate recommendations without source data.',
      };
    }

    const end = logger.time('GroqService', 'generate');
    logger.info('GroqService', `Sending prompt to ${MODEL_NAME} (${request.searchResults.length} search results)`);

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
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
        throw new Error(`Groq API error ${response.status}: ${errorText}`);
      }

      const data = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
        usage?: { prompt_tokens?: number; completion_tokens?: number };
      };

      const text = data.choices?.[0]?.message?.content?.trim() ?? '';
      if (!text) {
        return { data: null, error: 'Groq returned an empty response.' };
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
      logger.error('GroqService', 'Generation failed', err);
      return { data: null, error: parseAIError(err) };
    }
  },

  async ping(): Promise<{ ok: boolean; error: string | null }> {
    if (!GroqService.isConfigured()) {
      return { ok: false, error: 'Groq API key not configured.' };
    }

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: MODEL_NAME,
          messages: [{ role: 'user', content: 'Reply with: ok' }],
          max_tokens: 10,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Groq API error ${response.status}: ${errorText}`);
      }

      return { ok: true, error: null };
    } catch (err) {
      return { ok: false, error: parseAIError(err) };
    }
  },
};

export default GroqService;
