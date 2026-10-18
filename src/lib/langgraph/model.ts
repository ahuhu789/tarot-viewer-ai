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

let cached: ChatOpenAI | null = null;

/**
 * Lazily creates the Qwen client. There is deliberately no dummy-key fallback:
 * a missing key fails fast with a clear message instead of an opaque 401 later.
 */
export function getModel(): ChatOpenAI {
  if (cached) return cached;
  const apiKey = process.env.ALIBABA_API_KEY?.trim();
  if (!apiKey) {
    throw new AIConfigError(
      'ALIBABA_API_KEY is not set. Copy .env.example to .env.local and add your DashScope key.',
    );
  }
  cached = new ChatOpenAI({
    model: process.env.ALIBABA_MODEL || 'qwen-plus',
    maxTokens: 1200,
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
  return cached;
}

/** Tag used for helper LLM calls whose tokens must never reach the user. */
export const INTERNAL_TAG = 'internal';
