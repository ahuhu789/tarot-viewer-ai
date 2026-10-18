'use client';

import React, { memo, useCallback, useEffect, useMemo } from 'react';
import { isVietnamese } from '@/lib/reading-script';
import Link from 'next/link';
import { ChatMessage, ReadingPhase, SpreadId, TarotReadingState } from '@/types/tarot';
import type { TextStream } from '@/lib/text-stream';
import type { AssistantListener, ReadingError } from '@/hooks/useReading';
import { useTTS } from '@/hooks/useTTS';
import { SpreadPicker } from './SpreadPicker';
import { CardDeck } from './CardDeck';
import { SeventyEightCardsSpread } from './SeventyEightCardsSpread';
import { SpreadLayout } from './SpreadLayout';
import { SpreadOverview } from './SpreadOverview';
import { TarotCard } from './TarotCard';
import { DialoguePanel } from './DialoguePanel';
import { SPREADS } from '@/data/spreads';

interface VisualNovelSceneProps {
  state: TarotReadingState;
  messages: ChatMessage[];
  isTyping: boolean;
  streamStore: TextStream;
  error: ReadingError | null;
  notice: string | null;
  onRetry: () => void;
  onDismissError: () => void;
  onSendMessage: (text: string) => void;
  onSelectSpread: (spreadId: SpreadId) => void;
  onFinishShuffling: () => void;
  onSubmitCardSelection: () => void;
  onFinishDrawing: () => void;
  onRevealCard: (index: number) => void;
  onAdvanceToNextCard: () => void;
  onGoToCard: (index: number) => void;
  onRestart: () => void;
  setOnAssistantMessage: (listener: AssistantListener | null) => void;
}

const READING_PHASES: ReadingPhase[] = ['interpreting', 'card_chat'];
const SPREAD_VISIBLE_PHASES: ReadingPhase[] = ['drawing', 'synthesis', 'follow_up', 'closing'];

/** Local guidance shown while the user is acting on the cards (no AI call in these phases). */
const PHASE_GUIDANCE: Partial<Record<ReadingPhase, string>> = {
  shuffling: 'Giữ câu hỏi trong tâm trí, rồi chạm vào bộ bài để xáo.',
  manual_selection: 'Hãy để trực giác dẫn đường: chọn những lá bài đang gọi bạn. Thứ tự bạn chọn là thứ tự các vị trí.',
  drawing: 'Lật từng lá theo thứ tự. Khi tất cả đã ngửa, mình sẽ bắt đầu giải bài từ lá đầu tiên.',
};

/** Decorative background; memoized so it never re-renders. */
const Ambience = memo(function Ambience() {
  return (
    <div aria-hidden="true">
      <div className="starfield-ambient" />
      <div className="candle-glow-left" />
      <div className="candle-glow-right" />
    </div>
  );
});

/** Picks the reader text to show: only assistant messages, matched to the current card when reading. */
function selectReaderText(messages: ChatMessage[], state: TarotReadingState): string {
  const guidance = PHASE_GUIDANCE[state.phase];
  if (guidance) return guidance;

  const assistant = messages.filter((m) => m.role === 'assistant');
  if (READING_PHASES.includes(state.phase)) {
    for (let i = assistant.length - 1; i >= 0; i--) {
      const meta = assistant[i].metadata;
      if (
        meta?.activeCardIndex === state.currentCardIndex &&
        (meta.phase === 'interpreting' || meta.phase === 'card_chat')
      ) {
        return assistant[i].content;
      }
    }
  }
  return assistant[assistant.length - 1]?.content ?? '';
}

export function VisualNovelScene({
  state,
  messages,
  isTyping,
  streamStore,
  error,
  notice,
  onRetry,
  onDismissError,
  onSendMessage,
  onSelectSpread,
  onFinishShuffling,
  onSubmitCardSelection,
  onFinishDrawing,
  onRevealCard,
  onAdvanceToNextCard,
  onGoToCard,
  onRestart,
  setOnAssistantMessage,
}: VisualNovelSceneProps) {
  const ttsLanguage = isVietnamese(state.detectedLanguage) ? 'vi' : 'en';
  const { voiceEnabled, isSpeaking, toggleVoice, speak, stopSpeaking, beginStream, updateStream, endStream } =
    useTTS(ttsLanguage);

  // Speak AI replies while they stream in (first sentence plays before the reply is complete).
  useEffect(() => {
    setOnAssistantMessage({ begin: beginStream, update: updateStream, end: endStream });
    return () => {
      setOnAssistantMessage(null);
      stopSpeaking();
    };
  }, [setOnAssistantMessage, beginStream, updateStream, endStream, stopSpeaking]);

  const { phase, drawnCards, currentCardIndex } = state;
  const activeSpread = SPREADS[state.selectedSpread || 'three'];
  const revealedCount = drawnCards.filter((c) => c.isRevealed).length;
  const readerText = useMemo(() => selectReaderText(messages, state), [messages, state]);

  const isReading = READING_PHASES.includes(phase);
  const activeCard = drawnCards[currentCardIndex];
  const activePosition = activeCard ? activeSpread?.positions[activeCard.positionIndex] : undefined;
  const nextPosition = activeSpread?.positions[currentCardIndex + 1];
  const handleReplay = useCallback(() => {
    if (isSpeaking) stopSpeaking();
    else speak(readerText);
  }, [isSpeaking, readerText, speak, stopSpeaking]);
  const panelLayout = isReading ? 'side' : phase === 'greeting' || phase === 'intention' ? 'expanded' : 'bottom';

  const dialoguePanel = (
    <DialoguePanel
      phase={phase}
      text={readerText}
      isTyping={isTyping}
      streamStore={streamStore}
      error={error}
      isSpeaking={isSpeaking}
      layout={panelLayout}
      revealedCount={revealedCount}
      totalCards={drawnCards.length}
      isLastCard={currentCardIndex + 1 >= drawnCards.length}
      nextPositionName={nextPosition?.name}
      notice={notice}
      voiceEnabled={voiceEnabled}
      onReplay={handleReplay}
      onSend={onSendMessage}
      onRetry={onRetry}
      onDismissError={onDismissError}
      onFinishDrawing={onFinishDrawing}
      onAdvance={onAdvanceToNextCard}
      onRestart={onRestart}
    />
  );

  return (
    <div className={`vn-stage ${panelLayout === 'expanded' ? 'vn-stage--chat' : ''}`}>
      <Ambience />

      <header className="vn-topbar">
        <Link href="/" className="vn-exit-btn" aria-label="Rời phòng đọc bài">
          ✦ Rời<span className="vn-exit-btn__long"> phòng</span>
        </Link>

        <div className="vn-topbar__right">
          {activeSpread && drawnCards.length > 0 && (
            <SpreadOverview
              drawnCards={drawnCards}
              positions={activeSpread.positions}
              currentCardIndex={currentCardIndex}
              highestCardIndexReached={state.highestCardIndexReached}
              canNavigate={isReading && !isTyping}
              onGoToCard={onGoToCard}
            />
          )}
          <button
            type="button"
            className="voice-toggle"
            onClick={toggleVoice}
            aria-pressed={voiceEnabled}
            aria-label={voiceEnabled ? 'Tắt giọng đọc' : 'Bật giọng đọc'}
          >
            {voiceEnabled ? '🔊 Giọng đọc: bật' : '🔇 Giọng đọc: tắt'}
          </button>
        </div>
      </header>

      <main className="vn-main-stage">
        {!isReading && (
          <div className="vn-stage-center">
            {phase === 'spread_selection' && (
              <div className="vn-modal">
                <SpreadPicker onSelect={onSelectSpread} />
              </div>
            )}
            {phase === 'shuffling' && (
              <div className="vn-modal">
                <CardDeck onDraw={onFinishShuffling} />
              </div>
            )}
            {phase === 'manual_selection' && state.selectedSpread && (
              <SeventyEightCardsSpread spreadId={state.selectedSpread} onSelectComplete={onSubmitCardSelection} />
            )}
            {SPREAD_VISIBLE_PHASES.includes(phase) && (
              <SpreadLayout
                drawnCards={drawnCards}
                spreadId={state.selectedSpread || 'three'}
                currentCardIndex={currentCardIndex}
                onRevealCard={onRevealCard}
                phase={phase}
              />
            )}
          </div>
        )}

        {isReading && activeCard && (
          <div className="vn-reading-layout">
            <div className="vn-col-left">
              <TarotCard
                index={currentCardIndex}
                cardNumber={activeCard.cardNumber}
                isReversed={activeCard.isReversed}
                isRevealed={activeCard.isRevealed}
                isActive={isSpeaking}
                onReveal={onRevealCard}
                positionName={activePosition?.name}
                positionBadge={drawnCards.length > 1 ? `${currentCardIndex + 1}/${drawnCards.length}` : ''}
                size="large"
              />
            </div>
            <div className="vn-col-right">{dialoguePanel}</div>
          </div>
        )}
      </main>

      {!isReading && dialoguePanel}
    </div>
  );
}
