import { HumanMessage, AIMessage } from '@langchain/core/messages';
import { graph } from '@/lib/langgraph/graph';
import { INTERNAL_TAG, isAIConfigured } from '@/lib/langgraph/model';
import { readingRequestSchema, userMessagesWithinLimit } from '@/lib/validation';
import { clientIp, rateLimit, tooManyRequests } from '@/lib/rate-limit';

export const runtime = 'nodejs';

const GENERIC_STREAM_ERROR = 'The reader lost connection to the cards. Please try again.';

function sse(event: string, data: string): string {
  return `event: ${event}\ndata: ${data}\n\n`;
}

export async function POST(req: Request) {
  const limit = rateLimit(`reading:${clientIp(req)}`, 20, 60_000);
  if (!limit.ok) return tooManyRequests(limit.retryAfterSeconds);

  if (!isAIConfigured()) {
    console.error('❌ /api/reading: ALIBABA_API_KEY is not set (see .env.example).');
    return Response.json(
      { error: 'The AI reader is not configured on the server yet. Please contact the administrator.' },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const parsed = readingRequestSchema.safeParse(body);
  if (!parsed.success || !userMessagesWithinLimit(parsed.data)) {
    return Response.json(
      { error: 'Your message is too long or the request is invalid.' },
      { status: 400 },
    );
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

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const eventStream = graph.streamEvents(inputs, { version: 'v2', signal: req.signal });
        let finalState: Record<string, unknown> | null = null;

        for await (const event of eventStream) {
          if (event.event === 'on_chat_model_stream') {
            // Helper calls (e.g. language detection) are tagged internal: never show them.
            if (event.tags?.includes(INTERNAL_TAG)) continue;
            const chunkContent = event.data?.chunk?.content;
            if (typeof chunkContent === 'string' && chunkContent) {
              controller.enqueue(encoder.encode(sse('token', encodeURIComponent(chunkContent))));
            }
          } else if (event.event === 'on_chain_end' && event.name === 'LangGraph') {
            finalState = (event.data?.output ?? null) as Record<string, unknown> | null;
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
          controller.enqueue(encoder.encode(sse('state', JSON.stringify(stateUpdate))));
        }
      } catch (err: unknown) {
        if (req.signal.aborted) return; // client navigated away / cancelled
        console.error('❌ Error inside reading stream:', err);
        controller.enqueue(encoder.encode(sse('error', encodeURIComponent(GENERIC_STREAM_ERROR))));
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
