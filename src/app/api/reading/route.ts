import { HumanMessage, AIMessage, SystemMessage } from '@langchain/core/messages';
import { graph } from '@/lib/langgraph/graph';
import { ChatMessage, TarotReadingState } from '@/types/tarot';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages, state } = body as {
      messages: ChatMessage[];
      state: TarotReadingState;
    };

    // Convert messages to LangChain format
    const langchainMessages = messages.map((m) => {
      if (m.role === 'user') return new HumanMessage(m.content);
      if (m.role === 'system') return new SystemMessage(m.content);
      return new AIMessage(m.content);
    });

    const encoder = new TextEncoder();

    // Prepare inputs matching TarotReadingState
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

    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Use streamEvents v2 to capture real-time LLM token streams
          const eventStream = graph.streamEvents(inputs, { version: 'v2' });
          let finalState: any = null;

          for await (const event of eventStream) {
            // Check if it is a streaming chunk from Gemini
            if (event.event === 'on_chat_model_stream') {
              const chunkContent = event.data?.chunk?.content;
              if (chunkContent) {
                // Encode and stream chunk immediately
                controller.enqueue(
                  encoder.encode(`event: token\ndata: ${encodeURIComponent(chunkContent)}\n\n`)
                );
              }
            } else if (event.event === 'on_chain_end' && event.name === 'LangGraph') {
              // Capture the final state values compiled by the graph
              finalState = event.data?.output;
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
            controller.enqueue(
              encoder.encode(`event: state\ndata: ${JSON.stringify(stateUpdate)}\n\n`)
            );
          }
        } catch (err: any) {
          console.error('❌ Error inside SSE stream:', err);
          controller.enqueue(
            encoder.encode(`event: error\ndata: ${encodeURIComponent(err.message || String(err))}\n\n`)
          );
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
      },
    });
  } catch (error: any) {
    console.error('❌ Error in /api/reading route handler:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
