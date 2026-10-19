'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ChatMessage, TarotReadingState, SpreadId } from '@/types/tarot';
import { createTextStream, TextStream } from '@/lib/text-stream';
import { SPREADS } from '@/data/spreads';
import { clearSession, IN_FLIGHT_PHASES, loadSession, saveSession, type SavedSession } from '@/lib/session-store';

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

/**
 * The opening greeting is fixed text shown instantly, so a session costs no AI
 * call until the seeker actually writes something. Vietnamese by default; the
 * reader switches language automatically if the seeker replies in another one.
 */
export const OPENING_GREETING = `Chào mừng bạn đến với không gian tĩnh lặng này. ✨

Những lá bài Tarot ở đây không định đoạt số phận của bạn. Chúng là tấm gương giúp bạn lắng nghe chính mình, nhìn rõ hơn điều đang diễn ra và những hướng đi đang mở ra phía trước.

Hãy hít một hơi thật sâu và chia sẻ điều bạn đang trăn trở: công việc, tình cảm, một lựa chọn sắp tới, hay đơn giản là thông điệp bạn cần cho hôm nay. *(You can also write in English.)*`;

const DEFAULT_ERROR = 'Kết nối với người đọc bài bị gián đoạn. Bạn thử lại nhé.';
const DRAW_ERROR = 'Không rút được bài. Bạn thử lại nhé.';

export interface ReadingError {
  message: string;
  canRetry: boolean;
}

/** Receives the AI reply while it streams (used to start text-to-speech early). */
export interface AssistantListener {
  begin: () => void;
  update: (textSoFar: string) => void;
  end: (fullText: string) => void;
}

/** What to repeat when the user presses Retry. */
type RetryAction =
  | { kind: 'reading'; messages: ChatMessage[]; override?: Partial<TarotReadingState> }
  | { kind: 'draw'; picks?: number[] };

function greetingMessage(): ChatMessage {
  return {
    id: newId('ai-greeting'),
    role: 'assistant',
    content: OPENING_GREETING,
    timestamp: new Date().toISOString(),
    metadata: { phase: 'greeting', activeCardIndex: 0 },
  };
}

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
  if (res.status === 429) return 'Bạn thao tác hơi nhanh. Chờ một chút rồi thử lại nhé.';
  return fallback;
}

export function useReading() {
  const [state, setStateRaw] = useState<TarotReadingState>(INITIAL_STATE);
  const [messages, setMessagesRaw] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<ReadingError | null>(null);
  const [streamStore] = useState<TextStream>(() => createTextStream());
  /** Short-lived status line, e.g. while the server waits out an AI rate limit. */
  const [notice, setNotice] = useState<string | null>(null);
  /** True when the reading was resumed from localStorage. */
  const [restored, setRestored] = useState(false);

  // Refs mirror the latest state so the (stable) callbacks below never read stale values.
  const stateRef = useRef<TarotReadingState>(INITIAL_STATE);
  const messagesRef = useRef<ChatMessage[]>([]);
  const abortRef = useRef<AbortController | null>(null);
  const retryRef = useRef<RetryAction | null>(null);
  const assistantListenerRef = useRef<AssistantListener | null>(null);

  const updateState = useCallback((update: (prev: TarotReadingState) => TarotReadingState) => {
    stateRef.current = update(stateRef.current);
    setStateRaw(stateRef.current);
    saveSession(stateRef.current, messagesRef.current);
  }, []);

  const updateMessages = useCallback((update: (prev: ChatMessage[]) => ChatMessage[]) => {
    messagesRef.current = update(messagesRef.current);
    setMessagesRaw(messagesRef.current);
    saveSession(stateRef.current, messagesRef.current);
  }, []);

  /** Lets the scene register a listener (e.g. text-to-speech) for completed AI replies. */
  const setOnAssistantMessage = useCallback((listener: AssistantListener | null) => {
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
      setNotice(null);
      streamStore.reset();
      let listenerStarted = false;

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
                if (!listenerStarted) {
                  listenerStarted = true;
                  setNotice(null);
                  assistantListenerRef.current?.begin();
                }
                assistantListenerRef.current?.update(accumulatedText);
              } else if (currentEvent === 'replace') {
                // The server repaired a card name: show the corrected text.
                accumulatedText = decodeURIComponent(dataStr);
                streamStore.reset();
                streamStore.append(accumulatedText);
              } else if (currentEvent === 'status') {
                const status = JSON.parse(dataStr) as { kind?: string; seconds?: number };
                if (status.kind === 'rate_limit_wait') {
                  setNotice(`Người đọc bài đang lấy lại hơi thở… (khoảng ${status.seconds ?? 10} giây)`);
                }
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
        // Always close the spoken reply (also after an error mid-stream).
        if (listenerStarted && !controller.signal.aborted) assistantListenerRef.current?.end(accumulatedText);
        if (abortRef.current === controller) {
          abortRef.current = null;
          setIsTyping(false);
          setNotice(null);
          streamStore.reset();
        }
      }
    },
    [streamStore, updateMessages, updateState],
  );

  /** Resume a reading saved in localStorage (e.g. after a reload). */
  const restoreSession = useCallback(
    (saved: SavedSession) => {
      updateMessages(() => saved.messages);
      updateState(() => ({ ...INITIAL_STATE, ...saved.state }));
      setRestored(true);
      if (IN_FLIGHT_PHASES.includes(saved.state.phase)) {
        // The page was closed while the reader was answering: offer to repeat that step.
        retryRef.current = {
          kind: 'reading',
          messages: saved.messages,
          override: { phase: saved.state.phase, currentCardIndex: saved.state.currentCardIndex },
        };
        setError({ message: 'Phiên trước bị gián đoạn khi đang giải bài. Bấm Thử lại để tiếp tục.', canRetry: true });
      }
    },
    [updateMessages, updateState],
  );

  // Start the session once with the fixed greeting (no network request).
  useEffect(() => {
    // Show the fixed greeting locally (no API call) and move straight to the
    // intention phase. Guarded so Strict Mode's double effect adds it only once.
    if (messagesRef.current.length === 0) {
      const saved = loadSession();
      if (saved) {
        // Resume the previous reading (e.g. after a reload). Deferred one microtask
        // so the state updates do not run synchronously inside the effect.
        messagesRef.current = saved.messages;
        queueMicrotask(() => restoreSession(saved));
      } else {
        updateMessages(() => [greetingMessage()]);
        updateState((prev) => ({ ...prev, phase: 'intention' }));
      }
    }
    return () => {
      abortRef.current?.abort();
      abortRef.current = null;
    };
  }, [restoreSession, updateMessages, updateState]);

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
          content: `Mình chọn kiểu trải bài: ${SPREADS[spreadId]?.name ?? spreadId}.`,
          timestamp: new Date().toISOString(),
        },
      ]);
    },
    [updateMessages, updateState],
  );

  const finishShuffling = useCallback(() => {
    updateState((prev) => ({ ...prev, phase: 'manual_selection' }));
  }, [updateState]);

  const submitCardSelection = useCallback(async (picks?: number[]) => {
    const spreadId = stateRef.current.selectedSpread;
    if (!spreadId) return;
    setError(null);
    try {
      const res = await fetch('/api/reading/draw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spreadId, picks }),
      });
      if (!res.ok) throw new Error(await readErrorMessage(res, DRAW_ERROR));
      const data = await res.json();
      if (!Array.isArray(data.drawnCards)) throw new Error(DRAW_ERROR);
      updateState((prev) => ({ ...prev, drawnCards: data.drawnCards, phase: 'drawing' }));
    } catch (e) {
      console.error('❌ Error drawing cards:', e);
      retryRef.current = { kind: 'draw', picks };
      setError({
        message: e instanceof Error && e.message ? e.message : DRAW_ERROR,
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
      if (s.drawnCards.length === 1) {
        // A single card already ends with advice: no separate synthesis call is needed.
        updateState((prev) => ({ ...prev, phase: 'follow_up', readingComplete: true }));
        return;
      }
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
    retryRef.current = null;
    stateRef.current = { ...INITIAL_STATE, phase: 'intention' };
    messagesRef.current = [greetingMessage()];
    setStateRaw(stateRef.current);
    setMessagesRaw(messagesRef.current);
    setError(null);
    setNotice(null);
    setRestored(false);
    streamStore.reset();
    clearSession();
  }, [streamStore]);

  const retry = useCallback(() => {
    const action = retryRef.current;
    if (!action) return;
    if (action.kind === 'draw') void submitCardSelection(action.picks);
    else void runReadingStep(action.messages, action.override);
  }, [runReadingStep, submitCardSelection]);

  const dismissError = useCallback(() => setError(null), []);

  return {
    state,
    messages,
    isTyping,
    streamStore,
    error,
    notice,
    restored,
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
