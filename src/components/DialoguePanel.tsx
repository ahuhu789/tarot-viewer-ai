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
  const lastAutoScrollTop = useRef(0);
  const wasTyping = useRef(false);

  const content = isTyping ? streamed : text;

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 48) {
      stickToBottom.current = true; // back at the bottom: follow new text again
    } else if (el.scrollTop < lastAutoScrollTop.current - 2) {
      stickToBottom.current = false; // the reader scrolled up on purpose
    }
  }, []);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (isTyping) {
      if (!wasTyping.current) {
        // A new reply started: begin at the top and follow it as it grows.
        stickToBottom.current = true;
        el.scrollTop = 0;
        lastAutoScrollTop.current = 0;
      }
      // No auto-follow: replies stream in about a second and are read (and spoken)
      // from the top, where the server-rendered card heading is.
    } else if (!wasTyping.current) {
      // Switched to a different finished message (e.g. another card): show its start.
      el.scrollTop = 0;
      lastAutoScrollTop.current = 0;
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
        aria-label="Tin nhắn gửi người đọc bài"
        className="vn-text-input"
      />
      <button type="submit" className="btn-gold vn-send-btn" disabled={!canSend}>
        ✦ Gửi
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
  /** Position name of the next card ("Hiện tại"), for the advance button. */
  nextPositionName?: string;
  /** Status line while waiting (e.g. AI rate limit). */
  notice?: string | null;
  voiceEnabled?: boolean;
  onReplay?: () => void;
  onSend: (text: string) => void;
  onRetry: () => void;
  onDismissError: () => void;
  onFinishDrawing: () => void;
  onAdvance: () => void;
  onRestart: () => void;
}

const PLACEHOLDERS: Partial<Record<ReadingPhase, string>> = {
  intention: 'Chia sẻ điều bạn đang trăn trở…',
  card_chat: 'Hỏi thêm về lá này…',
  follow_up: 'Hỏi thêm về trải bài, hoặc nói “cảm ơn” để kết thúc…',
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
  nextPositionName,
  notice,
  voiceEnabled,
  onReplay,
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
      aria-label="Trò chuyện với người đọc bài"
    >
      <div className="vn-name-row">
        <div className="vn-name-box">🌙 Người đọc bài</div>
        {voiceEnabled && onReplay && !isTyping && text && (
          <button type="button" className="vn-replay-btn" onClick={onReplay} aria-label="Nghe lại">
            {isSpeaking ? '■ Dừng' : '↻ Nghe lại'}
          </button>
        )}
      </div>

      <DialogueText
        text={text}
        isTyping={isTyping}
        streamStore={streamStore}
        placeholder={notice || (isTyping ? 'Đang lắng nghe các lá bài…' : 'Chào mừng bạn…')}
      />
      {notice && isTyping && (
        <div className="vn-notice" role="status">
          {notice}
        </div>
      )}

      {error && (
        <div className="vn-error" role="alert">
          <span>{error.message}</span>
          <div className="vn-error__actions">
            {error.canRetry && (
              <button type="button" className="vn-error__retry" onClick={onRetry}>
                Thử lại
              </button>
            )}
            <button type="button" className="vn-error__dismiss" onClick={onDismissError} aria-label="Đóng">
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
              Bắt đầu giải bài ✦
            </button>
          )}
          {phase === 'drawing' && !allRevealed && (
            <div className="vn-hint">
              {totalCards > 1
                ? `Lật lần lượt từng lá theo thứ tự (${revealedCount}/${totalCards})`
                : 'Chạm vào lá bài để lật'}
            </div>
          )}
          {phase === 'card_chat' && (
            <button type="button" onClick={onAdvance} className="btn-gold vn-action-btn" disabled={isTyping}>
              {isLastCard
                ? totalCards > 1
                  ? 'Xem tổng hợp trải bài ✦'
                  : 'Hoàn tất trải bài ✦'
                : `Lá tiếp theo${nextPositionName ? `: ${nextPositionName}` : ''} ➔`}
            </button>
          )}
          {(phase === 'closing' || phase === 'follow_up') && !isTyping && (
            <button
              type="button"
              onClick={onRestart}
              className={phase === 'closing' ? 'btn-gold vn-action-btn' : 'vn-secondary-btn'}
            >
              Bắt đầu hành trình mới ✦
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

export const DialoguePanel = memo(DialoguePanelBase);
