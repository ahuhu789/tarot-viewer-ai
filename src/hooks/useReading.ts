'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ChatMessage, TarotReadingState, SpreadId } from '@/types/tarot';
import { createTextStream, TextStream } from '@/lib/text-stream';

const INITIAL_STATE: TarotReadingState = {
  phase: 'greeting',
  userIntention: '',
  selectedSpread: null,
  drawnCards: [],
  currentCardIndex: 0,
  highestCardIndexReached: 0,
  readingComplete: false,
  followUpCount: 0,
  detectedLanguage: '',
};

const DEFAULT_ERROR = 'The connection to the reader was interrupted. Please try again.';

export interface ReadingError {
  message: string;
  canRetry: boolean;
}

type AssistantListener = ((text: string) => void) | null;

/** What to repeat when the user presses Retry. */
type RetryAction =
  | { kind: 'reading'; messages: ChatMessage[]; override?: Partial<TarotReadingState> }
  | { kind: 'draw' };

let idCounter = 0;
const newId = (prefix: string) => `${prefix}-${Date.now()}-${++idCounter}`;

/** Reads a JSON `{ error }` body if there is one, otherwise returns the fallback. */
async function readErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const data = await res.json();
    if (data && typeof data.error === 'string') return data.error;
  } catch {
    /* not JSON */
  }
  if (res.status === 429) return 'Too many requests. Please wait a moment and try again.';
  return fallback;
}

export function useReading() {
  const [state, setStateRaw] = useState<TarotReadingState>(INITIAL_STATE);
  const [messages, setMessagesRaw] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<ReadingError | null>(null);
  const [streamStore] = useState<TextStream>(() => createTextStream());

  // Refs mirror the latest state so the (stable) callbacks below never read stale values.
  const stateRef = useRef<TarotReadingState>(INITIAL_STATE);
  const messagesRef = useRef<ChatMessage[]>([]);
  const abortRef = useRef<AbortController | null>(null);
  const retryRef = useRef<RetryAction | null>(null);
  const assistantListenerRef = useRef<AssistantListener>(null);

  const updateState = useCallback((update: (prev: TarotReadingState) => TarotReadingState) => {
    stateRef.current = update(stateRef.current);
    setStateRaw(stateRef.current);
  }, []);

  const updateMessages = useCallback((update: (prev: ChatMessage[]) => ChatMessage[]) => {
    messagesRef.current = update(messagesRef.current);
    setMessagesRaw(messagesRef.current);
  }, []);

  /** Lets the scene register a listener (e.g. text-to-speech) for completed AI replies. */
  const setOnAssistantMessage = useCallback((listener: AssistantListener) => {
    assistantListenerRef.current = listener;
  }, []);

  const runReadingStep = useCallback(
    async (currentMessages: ChatMessage[], overrideState?: Partial<TarotReadingState>) => {
      // Only one request at a time: cancel whatever is still streaming.
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      retryRef.current = { kind: 'reading', messages: currentMessages, override: overrideState };

      const requestState = { ...stateRef.current, ...overrideState };
      setIsTyping(true);
      setError(null);
      streamStore.reset();

      let accumulatedText = '';
      let streamError: string | null = null;
      let receivedState = false;

      try {
        const response = await fetch('/api/reading', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            // Only conversational turns are sent; local notices never reach the AI.
            messages: currentMessages
              .filter((m) => m.role === 'user' || m.role === 'assistant')
              .map(({ role, content }) => ({ role, content })),
            state: requestState,
          }),
        });

        if (!response.ok || !response.body) {
          throw new Error(await readErrorMessage(response, DEFAULT_ERROR));
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let currentEvent = '';

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const cleanLine = line.trim();
            if (cleanLine.startsWith('event: ')) {
              currentEvent = cleanLine.slice(7).trim();
            } else if (cleanLine.startsWith('data: ')) {
              const dataStr = cleanLine.slice(6).trim();
              if (currentEvent === 'token') {
                const token = decodeURIComponent(dataStr);
                accumulatedText += token;
                streamStore.append(token); // batched per animation frame
              } else if (currentEvent === 'state') {
                receivedState = true;
                const stateUpdate = JSON.parse(dataStr) as Partial<TarotReadingState>;
                updateState((prev) => ({ ...prev, ...stateUpdate }));
              } else if (currentEvent === 'error') {
                streamError = decodeURIComponent(dataStr);
              }
            }
          }
        }
        streamStore.flush();

        if (accumulatedText) {
          const newMsg: ChatMessage = {
            id: newId('ai'),
            role: 'assistant',
            content: accumulatedText,
            timestamp: new Date().toISOString(),
            metadata: {
              phase: requestState.phase,
              activeCardIndex: requestState.currentCardIndex,
            },
          };
          updateMessages((prev) => [...prev, newMsg]);
          assistantListenerRef.current?.(accumulatedText);
        }

        if (streamError) {
          setError({ message: streamError, canRetry: true });
        } else if (!accumulatedText && !receivedState) {
          setError({ message: DEFAULT_ERROR, canRetry: true });
        }
      } catch (err) {
        if (controller.signal.aborted) return; // superseded or unmounted: not an error
        console.error('❌ Reading request failed:', err);
        setError({
          message: err instanceof Error && err.message ? err.message : DEFAULT_ERROR,
          canRetry: true,
        });
      } finally {
        if (abortRef.current === controller) {
          abortRef.current = null;
          setIsTyping(false);
          streamStore.reset();
        }
      }
    },
    [streamStore, updateMessages, updateState],
  );

  // Start the session once. In React Strict Mode the effect runs twice in dev;
  // the cleanup aborts the first request so only one greeting is generated.
  useEffect(() => {
    // Starting a network request on mount is a legitimate effect (syncing with the
    // server); the synchronous setState calls only mark the request as in-flight.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void runReadingStep([]);
    return () => {
      abortRef.current?.abort();
      abortRef.current = null;
    };
  }, [runReadingStep]);

  const sendMessage = useCallback(
    async (content: string) => {
      const text = content.trim();
      if (!text || abortRef.current) return;
      const userMsg: ChatMessage = {
        id: newId('user'),
        role: 'user',
        content: text,
        timestamp: new Date().toISOString(),
      };
      updateMessages((prev) => [...prev, userMsg]);
      await runReadingStep(messagesRef.current);
    },
    [runReadingStep, updateMessages],
  );

  const selectSpread = useCallback(
    (spreadId: SpreadId) => {
      updateState((prev) => ({ ...prev, selectedSpread: spreadId, phase: 'shuffling' }));
      updateMessages((prev) => [
        ...prev,
        {
          id: newId('user-select'),
          role: 'user',
          content: `I select the ${spreadId === 'single' ? 'Daily Draw' : 'Past, Present & Future'} spread.`,
          timestamp: new Date().toISOString(),
        },
      ]);
    },
    [updateMessages, updateState],
  );

  const finishShuffling = useCallback(() => {
    updateState((prev) => ({ ...prev, phase: 'manual_selection' }));
  }, [updateState]);

  const submitCardSelection = useCallback(async () => {
    const spreadId = stateRef.current.selectedSpread;
    if (!spreadId) return;
    setError(null);
    try {
      const res = await fetch('/api/reading/draw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spreadId }),
      });
      if (!res.ok) throw new Error(await readErrorMessage(res, 'Could not draw the cards.'));
      const data = await res.json();
      if (!Array.isArray(data.drawnCards)) throw new Error('Could not draw the cards.');
      updateState((prev) => ({ ...prev, drawnCards: data.drawnCards, phase: 'drawing' }));
    } catch (e) {
      console.error('❌ Error drawing cards:', e);
      retryRef.current = { kind: 'draw' };
      setError({
        message: e instanceof Error && e.message ? e.message : 'Could not draw the cards.',
        canRetry: true,
      });
    }
  }, [updateState]);

  const finishDrawing = useCallback(async () => {
    const override = { phase: 'interpreting' as const, currentCardIndex: 0, highestCardIndexReached: 0 };
    updateState((prev) => ({ ...prev, ...override }));
    await runReadingStep(messagesRef.current, override);
  }, [runReadingStep, updateState]);

  const goToCard = useCallback(
    (index: number) => {
      const s = stateRef.current;
      if (index < 0 || index > s.highestCardIndexReached || index >= s.drawnCards.length) return;
      // 'card_chat' (not 'interpreting') so a follow-up question chats about this
      // card instead of re-running the interpretation.
      updateState((prev) => ({ ...prev, currentCardIndex: index, phase: 'card_chat' }));
    },
    [updateState],
  );

  const advanceToNextCard = useCallback(async () => {
    const s = stateRef.current;
    const nextIndex = s.currentCardIndex + 1;

    if (nextIndex >= s.drawnCards.length) {
      updateState((prev) => ({ ...prev, phase: 'synthesis' }));
      await runReadingStep(messagesRef.current, { phase: 'synthesis' });
      return;
    }

    // Already interpreted (user navigated back): just move forward.
    if (nextIndex <= s.highestCardIndexReached) {
      goToCard(nextIndex);
      return;
    }

    const override = {
      phase: 'interpreting' as const,
      currentCardIndex: nextIndex,
      highestCardIndexReached: nextIndex,
    };
    updateState((prev) => ({ ...prev, ...override }));
    await runReadingStep(messagesRef.current, override);
  }, [goToCard, runReadingStep, updateState]);

  const revealCard = useCallback(
    (index: number) => {
      updateState((prev) => ({
        ...prev,
        drawnCards: prev.drawnCards.map((c) =>
          c.positionIndex === index ? { ...c, isRevealed: true } : c,
        ),
      }));
    },
    [updateState],
  );

  const restartReading = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    stateRef.current = INITIAL_STATE;
    messagesRef.current = [];
    setStateRaw(INITIAL_STATE);
    setMessagesRaw([]);
    setError(null);
    void runReadingStep([]);
  }, [runReadingStep]);

  const retry = useCallback(() => {
    const action = retryRef.current;
    if (!action) return;
    if (action.kind === 'draw') void submitCardSelection();
    else void runReadingStep(action.messages, action.override);
  }, [runReadingStep, submitCardSelection]);

  const dismissError = useCallback(() => setError(null), []);

  return {
    state,
    messages,
    isTyping,
    streamStore,
    error,
    retry,
    dismissError,
    sendMessage,
    selectSpread,
    finishShuffling,
    submitCardSelection,
    finishDrawing,
    revealCard,
    advanceToNextCard,
    goToCard,
    restartReading,
    setOnAssistantMessage,
  };
}
