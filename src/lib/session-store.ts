/**
 * Saves the reading in localStorage so a reload (or a phone locking the tab)
 * does not lose the cards. Nothing is sent anywhere; sessions expire after 12 h.
 */
import type { ChatMessage, ReadingPhase, TarotReadingState } from '@/types/tarot';

export const SESSION_KEY = 'tarot_session_v1';
export const SESSION_TTL_MS = 12 * 60 * 60 * 1000;

/** Phases in which an AI request was in flight: on restore they must be retried. */
export const IN_FLIGHT_PHASES: ReadingPhase[] = ['interpreting', 'synthesis'];

export interface SavedSession {
  v: 1;
  savedAt: number;
  state: TarotReadingState;
  messages: ChatMessage[];
}

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

function storage(): StorageLike | null {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    return null;
  }
}

export function saveSession(state: TarotReadingState, messages: ChatMessage[], store = storage(), now = Date.now()) {
  if (!store) return;
  // Only worth saving once the seeker has said something.
  if (!messages.some((m) => m.role === 'user')) return;
  try {
    const data: SavedSession = { v: 1, savedAt: now, state, messages: messages.slice(-60) };
    store.setItem(SESSION_KEY, JSON.stringify(data));
  } catch {
    /* quota or private mode: persistence is best effort */
  }
}

export function loadSession(store = storage(), now = Date.now()): SavedSession | null {
  if (!store) return null;
  try {
    const raw = store.getItem(SESSION_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as SavedSession;
    const valid =
      data?.v === 1 &&
      now - data.savedAt < SESSION_TTL_MS &&
      Array.isArray(data.messages) &&
      data.messages.length > 0 &&
      typeof data.state?.phase === 'string' &&
      Array.isArray(data.state.drawnCards);
    if (!valid) {
      store.removeItem(SESSION_KEY);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

export function clearSession(store = storage()) {
  try {
    store?.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
}
