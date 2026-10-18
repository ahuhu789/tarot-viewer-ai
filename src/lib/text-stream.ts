/**
 * Tiny external store for the text that is currently being streamed from the AI.
 *
 * Tokens arrive dozens of times per second. Putting them in React state at the
 * top of the tree re-rendered the whole reading scene (cards, images, spread
 * overview) for every token. Instead tokens are buffered here and flushed at
 * most once per animation frame, and only the component that displays the text
 * subscribes (via useSyncExternalStore).
 */
export interface TextStream {
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => string;
  append: (chunk: string) => void;
  reset: () => void;
  /** Flush any buffered tokens immediately (e.g. when the stream ends). */
  flush: () => void;
}

export function createTextStream(): TextStream {
  let text = '';
  let pending = '';
  let frame: number | null = null;
  const listeners = new Set<() => void>();

  const emit = () => listeners.forEach((l) => l());

  const flush = () => {
    if (frame !== null) {
      cancelAnimationFrame(frame);
      frame = null;
    }
    if (!pending) return;
    text += pending;
    pending = '';
    emit();
  };

  return {
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getSnapshot: () => text,
    append(chunk) {
      pending += chunk;
      if (frame === null) {
        frame = requestAnimationFrame(() => {
          frame = null;
          flush();
        });
      }
    },
    reset() {
      if (frame !== null) cancelAnimationFrame(frame);
      frame = null;
      pending = '';
      if (text) {
        text = '';
        emit();
      }
    },
    flush,
  };
}
