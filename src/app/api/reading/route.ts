import { HumanMessage, AIMessage } from '@langchain/core/messages';
import { graph } from '@/lib/langgraph/graph';
import { INTERNAL_TAG, isAIConfigured } from '@/lib/langgraph/model';
import { readingRequestSchema, userMessagesWithinLimit } from '@/lib/validation';
import { clientIp, rateLimit, tooManyRequests } from '@/lib/rate-limit';
import { deterministicPrefix } from '@/lib/reading-script';
import { foreignMentions, repairCardNames } from '@/lib/card-guard';
import type { TarotReadingState } from '@/types/tarot';

export const runtime = 'nodejs';
export const maxDuration = 60;

const GENERIC_STREAM_ERROR = 'Kết nối với người đọc bài bị gián đoạn. Bạn thử lại nhé.';
/** Longest provider rate-limit wait we absorb on the server before giving up. */
const MAX_WAIT_SECONDS = 25;

function sse(event: string, data: string): string {
  return `event: ${event}\ndata: ${data}\n\n`;
}

/** Recognises provider rate-limit errors (Groq free tier: 1k output tokens/min, 1k requests/day). */
function rateLimitInfo(err: unknown): { seconds: number; daily: boolean } | null {
  const e = err as { status?: number; code?: string; lc_error_code?: string; message?: string; error?: { message?: string } };
  const is429 = e?.status === 429 || e?.code === 'rate_limit_exceeded' || e?.lc_error_code === 'MODEL_RATE_LIMIT';
  if (!is429) return null;
  const msg = `${e?.error?.message ?? ''} ${e?.message ?? ''}`;
  const m = msg.match(/try again in (?:(\d+)m)?([\d.]+)s/i);
  const seconds = m ? Number(m[1] ?? 0) * 60 + Number(m[2]) : 20;
  return { seconds: Math.ceil(seconds), daily: /per day|RPD|TPD/i.test(msg) };
}

const sleep = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve) => {
    const t = setTimeout(resolve, ms);
    signal.addEventListener('abort', () => {
      clearTimeout(t);
      resolve();
    });
  });

/** Card numbers the AI may name in this step, and the card being read (if exactly one). */
function allowedCards(state: TarotReadingState): { allowed: number[]; target: number | null } {
  const cards = state.drawnCards;
  if (state.phase === 'interpreting' || state.phase === 'card_chat') {
    const target = cards.find((c) => c.positionIndex === state.currentCardIndex);
    const allowed = cards.filter((c) => c.positionIndex <= state.currentCardIndex).map((c) => c.cardNumber);
    return { allowed, target: target?.cardNumber ?? null };
  }
  return { allowed: cards.map((c) => c.cardNumber), target: null };
}

export async function POST(req: Request) {
  const limit = rateLimit(`reading:${clientIp(req)}`, 20, 60_000);
  if (!limit.ok) return tooManyRequests(limit.retryAfterSeconds);

  if (!isAIConfigured()) {
    console.error('❌ /api/reading: ALIBABA_API_KEY is not set (see .env.example).');
    return Response.json(
      { error: 'Người đọc bài AI chưa được cấu hình trên máy chủ. Vui lòng liên hệ quản trị viên.' },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Yêu cầu không hợp lệ.' }, { status: 400 });
  }

  const parsed = readingRequestSchema.safeParse(body);
  if (!parsed.success || !userMessagesWithinLimit(parsed.data)) {
    return Response.json({ error: 'Tin nhắn quá dài hoặc yêu cầu không hợp lệ.' }, { status: 400 });
  }

  const { messages, state } = parsed.data;
  const langchainMessages = messages.map((m) =>
    m.role === 'user' ? new HumanMessage(m.content) : new AIMessage(m.content),
  );

  const inputs = {
    messages: langchainMessages,
    phase: state.phase,
    userIntention: state.userIntention,
    selectedSpread: state.selectedSpread,
    drawnCards: state.drawnCards,
    currentCardIndex: state.currentCardIndex,
    readingComplete: state.readingComplete,
    followUpCount: state.followUpCount,
    detectedLanguage: state.detectedLanguage,
  };

  const readingState = { ...state, highestCardIndexReached: state.currentCardIndex } as TarotReadingState;
  const prefix = deterministicPrefix(readingState);
  const { allowed, target } = allowedCards(readingState);

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: string) => controller.enqueue(encoder.encode(sse(event, data)));
      let modelText = '';
      try {
        // Server-rendered heading (position, exact card name, orientation): the model never writes it.
        if (prefix) send('token', encodeURIComponent(prefix));

        let finalState: Record<string, unknown> | null = null;
        for (let attempt = 0; ; attempt++) {
          try {
            const eventStream = graph.streamEvents(inputs, { version: 'v2', signal: req.signal });
            for await (const event of eventStream) {
              if (event.event === 'on_chat_model_stream') {
                if (event.tags?.includes(INTERNAL_TAG)) continue;
                const chunkContent = event.data?.chunk?.content;
                if (typeof chunkContent === 'string' && chunkContent) {
                  modelText += chunkContent;
                  send('token', encodeURIComponent(chunkContent));
                }
              } else if (event.event === 'on_chat_model_end' && process.env.TAROT_LOG_USAGE) {
                // Opt-in token accounting (useful to measure cost per step; never logs content).
                const usage = event.data?.output?.usage_metadata;
                if (usage) console.info(`📊 ${state.phase}: in=${usage.input_tokens} out=${usage.output_tokens}`);
              } else if (event.event === 'on_chain_end' && event.name === 'LangGraph') {
                finalState = (event.data?.output ?? null) as Record<string, unknown> | null;
              }
            }
            break;
          } catch (err) {
            const rl = rateLimitInfo(err);
            // Retry once, silently for the user except for a short notice, if nothing was streamed yet.
            if (rl && !rl.daily && !modelText && attempt === 0 && rl.seconds <= MAX_WAIT_SECONDS && !req.signal.aborted) {
              console.warn(`⏳ AI rate limit, waiting ${rl.seconds}s before retrying`);
              send('status', JSON.stringify({ kind: 'rate_limit_wait', seconds: rl.seconds }));
              await sleep(rl.seconds * 1000 + 300, req.signal);
              continue;
            }
            throw err;
          }
        }

        // Deterministic name check: a card that is not in this spread must never be named.
        if (modelText && allowed.length) {
          const bad = foreignMentions(modelText, allowed);
          if (bad.length) {
            console.warn('⚠️ AI named cards outside the spread:', bad.map((b) => b.name).join(', '));
            if (target !== null) {
              send('replace', encodeURIComponent(prefix + repairCardNames(modelText, target, allowed)));
            }
          }
        }

        if (finalState) {
          const stateUpdate = {
            phase: finalState.phase,
            userIntention: finalState.userIntention,
            selectedSpread: finalState.selectedSpread,
            drawnCards: finalState.drawnCards,
            currentCardIndex: finalState.currentCardIndex,
            readingComplete: finalState.readingComplete,
            followUpCount: finalState.followUpCount,
            detectedLanguage: finalState.detectedLanguage,
          };
          send('state', JSON.stringify(stateUpdate));
        }
      } catch (err: unknown) {
        if (req.signal.aborted) return; // client navigated away / cancelled
        const rl = rateLimitInfo(err);
        console.error('❌ Error inside reading stream:', rl ? `rate limit (${rl.seconds}s)` : err);
        const message = rl
          ? rl.daily
            ? 'Hôm nay người đọc bài đã dùng hết lượt AI miễn phí. Bạn quay lại sau nhé.'
            : `Người đọc bài đang hơi quá tải (giới hạn AI miễn phí). Bạn chờ khoảng ${rl.seconds} giây rồi bấm Thử lại nhé.`
          : GENERIC_STREAM_ERROR;
        send('error', encodeURIComponent(message));
      } finally {
        try {
          controller.close();
        } catch {
          /* stream already closed */
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
