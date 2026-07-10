// GeminiService — Google Gemini 2.0 Flash integration
// Receives Tavily search results + built prompt → returns structured JSON text.

import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import type { GeminiRequest, GeminiRawResponse } from '../../types/ai.types';
import { logger } from '../../utils/logger';
import { withRetry } from '../../utils/retry';
import { parseAIError } from '../../utils/errorHandler';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string;
const MODEL_NAME = 'gemini-2.0-flash';

// Lazy-initialise client so missing key doesn't crash at module load
let _client: GoogleGenerativeAI | null = null;

function getClient(): GoogleGenerativeAI {
  if (!_client) {
    _client = new GoogleGenerativeAI(GEMINI_API_KEY);
  }
  return _client;
}

export interface GeminiServiceResult<T = unknown> {
  data: T | null;
  error: string | null;
}

const GeminiService = {
  isConfigured(): boolean {
    return !!GEMINI_API_KEY && GEMINI_API_KEY.trim() !== '';
  },

  /**
   * Send a prompt + search results to Gemini 2.0 Flash.
   * Returns the raw text response — call ResponseFormatter.parse() on the result.
   */
  async generate(request: GeminiRequest): Promise<GeminiServiceResult<GeminiRawResponse>> {
    if (!GeminiService.isConfigured()) {
      return {
        data: null,
        error: 'Gemini API key is not configured. Add VITE_GEMINI_API_KEY to your .env file.',
      };
    }

    if (!request.searchResults?.length) {
      return {
        data: null,
        error: 'No search results provided to Gemini. Cannot generate recommendations without source data.',
      };
    }

    const end = logger.time('GeminiService', 'generate');
    logger.info('GeminiService', `Sending prompt to ${MODEL_NAME} (${request.searchResults.length} search results)`);

    try {
      const result = await withRetry(
        async () => {
          const model = getClient().getGenerativeModel({
            model: MODEL_NAME,
            safetySettings: [
              {
                category: HarmCategory.HARM_CATEGORY_HARASSMENT,
                threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
              },
              {
                category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
              },
              {
                category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
                threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
              },
              {
                category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
              },
            ],
            generationConfig: {
              temperature: 0.1,       // Low temp for factual, consistent output
              topP: 0.8,
              topK: 40,
              maxOutputTokens: 4096,
              responseMimeType: 'application/json',
            },
          });

          return model.generateContent(request.prompt);
        },
        'GeminiService',
        {
          maxAttempts: 3,
          initialDelayMs: 1000,
          retryOn: (err) => {
            const msg = String((err as { message?: string })?.message ?? '').toLowerCase();
            return msg.includes('429') || msg.includes('503') || msg.includes('network');
          },
        },
      );

      end();

      const text = result.response.text();
      const usage = result.response.usageMetadata;

      logger.info('GeminiService', `Response received — ${text.length} chars, tokens: ${usage?.totalTokenCount ?? 'unknown'}`);

      return {
        data: {
          text,
          modelUsed: MODEL_NAME,
          promptTokens: usage?.promptTokenCount,
          candidateTokens: usage?.candidatesTokenCount,
        },
        error: null,
      };
    } catch (err) {
      end();
      logger.error('GeminiService', 'Generation failed', err);
      return { data: null, error: parseAIError(err) };
    }
  },

  /**
   * Check if Gemini is reachable with a minimal test prompt.
   * Used for health checks / settings page.
   */
  async ping(): Promise<{ ok: boolean; error: string | null }> {
    if (!GeminiService.isConfigured()) {
      return { ok: false, error: 'Gemini API key not configured.' };
    }
    try {
      const model = getClient().getGenerativeModel({ model: MODEL_NAME });
      await model.generateContent('Reply with: ok');
      return { ok: true, error: null };
    } catch (err) {
      return { ok: false, error: parseAIError(err) };
    }
  },
};

export default GeminiService;
