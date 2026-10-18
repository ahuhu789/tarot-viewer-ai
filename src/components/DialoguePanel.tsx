'use client';

import React, { memo, useCallback, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react';
import ReactMarkdown from 'react-markdown';
import { ReadingPhase } from '@/types/tarot';
import type { TextStream } from '@/lib/text-stream';
import type { ReadingError } from '@/hooks/useReading';
import { LIMITS } from '@/lib/limits';

// Only simple formatting from the model is rendered; links, images and raw HTML are dropped.
const ALLOWED_ELEMENTS = ['p', 'strong', 'em', 'ul', 'ol', 'li', 'br', 'blockquote', 'h1', 'h2', 'h3', 'h4', 'hr'];

const Markdown = memo(function Markdown({ text }: { text: string }) {
  return (
    <ReactMarkdown allowedElements={ALLOWED_ELEMENTS} unwrapDisallowed skipHtml>
      {text}
    </ReactMarkdown>
  );
});

const noopSubscribe = () => () => {};
const emptySnapshot = () => '';

interface DialogueTextProps {
  text: string;
  isTyping: boolean;
  streamStore: TextStream;
  placeholder: string;
}

/**
 * The only component that re-renders while tokens stream in. Auto-scrolls to the
 * newest text unless the reader has scrolled up to re-read something.
 */
const DialogueText = memo(function DialogueText({ text, isTyping, streamStore, placeholder }: DialogueTextProps) {
  const streamed = useSyncExternalStore(
    isTyping ? streamStore.subscribe : noopSubscribe,
    isTyping ? streamStore.getSnapshot : emptySnapshot,
    emptySnapshot,
  );
  const scrollRef = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);
  const wasTyping = useRef(false);

  const content = isTyping ? streamed : text;

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 48;
  }, []);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (isTyping) {
      if (!wasTyping.current) {
        // A new reply started: begin at the top and follow it as it grows.
        stickToBottom.current = true;
        el.scrollTop = 0;
      } else if (stickToBottom.current) {
        el.scrollTop = el.scrollHeight;
      }
    } else if (!wasTyping.current) {
      // Switched to a different finished message (e.g. another card): show its start.
      el.scrollTop = 0;
    }
    wasTyping.current = isTyping;
  }, [content, isTyping]);

  return (
    <div
      ref={scrollRef}
      className="vn-text-box"
      onScroll={handleScroll}
      aria-live="polite"
      aria-busy={isTyping}
      tabIndex={0}
    >
      {content ? <Markdown text={content} /> : <p className="vn-placeholder">{placeholder}</p>}
      {isTyping && <span className="vn-cursor" aria-hidden="true">✦</span>}
    </div>
  );
});

const DialogueInput = memo(function DialogueInput({
  disabled,
  placeholder,
  onSend,
}: {
  disabled: boolean;
  placeholder: string;
  onSend: (text: string) => void;
}) {
  const [value, setValue] = useState('');
  const canSend = !disabled && value.trim().length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSend) return;
    onSend(value.trim());
    setValue('');
  };

  return (
    <form onSubmit={handleSubmit} className="vn-input-form">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={disabled}
        maxLength={LIMITS.messageChars}
        placeholder={placeholder}
        aria-label="Your message to the reader"
        className="vn-text-input"
      />
      <button type="submit" className="btn-gold vn-send-btn" disabled={!canSend}>
        ✦ Send
      </button>
    </form>
  );
});

export interface DialoguePanelProps {
  phase: ReadingPhase;
  text: string;
  isTyping: boolean;
  streamStore: TextStream;
  error: ReadingError | null;
  isSpeaking: boolean;
  layout: 'side' | 'bottom' | 'expanded';
  revealedCount: number;
  totalCards: number;
  isLastCard: boolean;
  onSend: (text: string) => void;
  onRetry: () => void;
  onDismissError: () => void;
  onFinishDrawing: () => void;
  onAdvance: () => void;
  onRestart: () => void;
}

const PLACEHOLDERS: Partial<Record<ReadingPhase, string>> = {
  intention: 'State your question or seek general guidance...',
  card_chat: 'Ask about this card, or move on when ready...',
  follow_up: 'Ask a follow-up question, or say thank you to close...',
};

function DialoguePanelBase({
  phase,
  text,
  isTyping,
  streamStore,
  error,
  isSpeaking,
  layout,
  revealedCount,
  totalCards,
  isLastCard,
  onSend,
  onRetry,
  onDismissError,
  onFinishDrawing,
  onAdvance,
  onRestart,
}: DialoguePanelProps) {
  const inputPlaceholder = PLACEHOLDERS[phase];
  const allRevealed = totalCards > 0 && revealedCount === totalCards;

  return (
    <section
      className={`vn-dialogue-panel vn-dialogue-panel--${layout} ${isSpeaking ? 'speaker-active' : ''}`}
      aria-label="Conversation with the card reader"
    >
      <div className="vn-name-box">🌙 The Card Reader</div>

      <DialogueText
        text={text}
        isTyping={isTyping}
        streamStore={streamStore}
        placeholder={isTyping ? 'Whispering to the cards...' : 'Welcoming your presence...'}
      />

      {error && (
        <div className="vn-error" role="alert">
          <span>{error.message}</span>
          <div className="vn-error__actions">
            {error.canRetry && (
              <button type="button" className="vn-error__retry" onClick={onRetry}>
                Retry
              </button>
            )}
            <button type="button" className="vn-error__dismiss" onClick={onDismissError} aria-label="Dismiss">
              ✕
            </button>
          </div>
        </div>
      )}

      <div className="vn-controls">
        {inputPlaceholder && <DialogueInput disabled={isTyping} placeholder={inputPlaceholder} onSend={onSend} />}

        <div className="vn-buttons-row">
          {phase === 'drawing' && allRevealed && (
            <button type="button" onClick={onFinishDrawing} className="btn-gold vn-action-btn">
              Begin Interpretation ✦
            </button>
          )}
          {phase === 'drawing' && !allRevealed && (
            <div className="vn-hint">
              Reveal all cards to begin ({revealedCount}/{totalCards} revealed)
            </div>
          )}
          {phase === 'card_chat' && (
            <button type="button" onClick={onAdvance} className="btn-gold vn-action-btn" disabled={isTyping}>
              {isLastCard ? 'Request Final Synthesis ✦' : 'Move to Next Card ➔'}
            </button>
          )}
          {phase === 'closing' && !isTyping && (
            <button type="button" onClick={onRestart} className="btn-gold vn-action-btn">
              Begin Another Journey ✦
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

export const DialoguePanel = memo(DialoguePanelBase);
