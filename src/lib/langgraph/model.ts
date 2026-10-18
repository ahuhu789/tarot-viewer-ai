import { ChatOpenAI } from '@langchain/openai';

export class AIConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AIConfigError';
  }
}

export function isAIConfigured(): boolean {
  return Boolean(process.env.ALIBABA_API_KEY?.trim());
}

const cache = new Map<number, ChatOpenAI>();

/** Default output budget. Each node passes its own, smaller cap (Groq free tier: ~1k output tokens/min). */
export const DEFAULT_MAX_TOKENS = 500;

/**
 * Lazily creates the chat client (one per output budget). There is deliberately
 * no dummy-key fallback: a missing key fails fast with a clear message.
 */
export function getModel(maxTokens: number = DEFAULT_MAX_TOKENS): ChatOpenAI {
  const cached = cache.get(maxTokens);
  if (cached) return cached;
  const apiKey = process.env.ALIBABA_API_KEY?.trim();
  if (!apiKey) {
    throw new AIConfigError(
      'ALIBABA_API_KEY is not set. Copy .env.example to .env.local and add your DashScope key.',
    );
  }
  const model = new ChatOpenAI({
    model: process.env.ALIBABA_MODEL || 'qwen-plus',
    maxTokens,
    // Rate-limit errors are handled (and explained to the user) by the API route.
    maxRetries: 0,
    temperature: 0.7,
    streaming: true,
    apiKey,
    // Optional: lets thinking models (e.g. Gemini) skip hidden reasoning so the
    // whole token budget goes to the visible reply. Values: none | low | medium | high.
    ...(process.env.AI_REASONING_EFFORT
      ? { modelKwargs: { reasoning_effort: process.env.AI_REASONING_EFFORT } }
      : {}),
    configuration: {
      baseURL: process.env.ALIBABA_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    },
  });
  cache.set(maxTokens, model);
  return model;
}

/** Tag used for helper LLM calls whose tokens must never reach the user. */
export const INTERNAL_TAG = 'internal';
