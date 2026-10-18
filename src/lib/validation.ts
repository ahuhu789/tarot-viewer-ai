import { z } from 'zod';

/** Hard limits for anything the browser sends to the AI / TTS routes. */
export const LIMITS = {
  messageChars: 2000,
  messages: 60,
  intentionChars: 600,
  ttsChars: 2500,
} as const;

const phaseSchema = z.enum([
  'greeting',
  'intention',
  'spread_selection',
  'shuffling',
  'manual_selection',
  'drawing',
  'interpreting',
  'card_chat',
  'synthesis',
  'follow_up',
  'closing',
]);

const spreadSchema = z.enum(['single', 'three']);

const drawnCardSchema = z.object({
  cardNumber: z.number().int().min(0).max(77),
  isReversed: z.boolean(),
  positionIndex: z.number().int().min(0).max(9),
  isRevealed: z.boolean(),
});

/**
 * Only user and assistant turns are accepted from the client. System prompts are
 * always built on the server, so a client cannot smuggle in its own instructions.
 */
const chatMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().max(LIMITS.messageChars * 3), // assistant replies can be long
});

export const readingRequestSchema = z.object({
  messages: z.array(chatMessageSchema).max(LIMITS.messages),
  state: z.object({
    phase: phaseSchema,
    userIntention: z.string().max(LIMITS.intentionChars * 4).default(''),
    selectedSpread: spreadSchema.nullable().default(null),
    drawnCards: z.array(drawnCardSchema).max(10).default([]),
    currentCardIndex: z.number().int().min(0).max(9).default(0),
    readingComplete: z.boolean().default(false),
    followUpCount: z.number().int().min(0).max(50).default(0),
    detectedLanguage: z.string().max(40).default(''),
  }),
});

export const drawRequestSchema = z.object({
  spreadId: spreadSchema,
});

export const ttsRequestSchema = z.object({
  text: z.string().trim().min(1).max(LIMITS.ttsChars),
});

export type ReadingRequest = z.infer<typeof readingRequestSchema>;

/** Last user turns may not exceed the per-message limit. */
export function userMessagesWithinLimit(req: ReadingRequest): boolean {
  return req.messages.every((m) => m.role !== 'user' || m.content.length <= LIMITS.messageChars);
}
