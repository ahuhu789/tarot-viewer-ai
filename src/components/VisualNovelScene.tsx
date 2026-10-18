'use client';

import React, { memo, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { ChatMessage, ReadingPhase, SpreadId, TarotReadingState, TarotCard as TarotCardType } from '@/types/tarot';
import type { TextStream } from '@/lib/text-stream';
import type { ReadingError } from '@/hooks/useReading';
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
  meaningsByNumber: Map<number, TarotCardType>;
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
  setOnAssistantMessage: (listener: ((text: string) => void) | null) => void;
}

const READING_PHASES: ReadingPhase[] = ['interpreting', 'card_chat'];
const SPREAD_VISIBLE_PHASES: ReadingPhase[] = ['drawing', 'synthesis', 'follow_up', 'closing'];

/** Local guidance shown while the user is acting on the cards (no AI call in these phases). */
const PHASE_GUIDANCE: Partial<Record<ReadingPhase, string>> = {
  shuffling: 'Hold your question in mind, then tap the deck to shuffle.',
  manual_selection: 'Let your intuition guide you — pick the cards that call to you.',
  drawing: 'Tap each card to reveal it. When all are face up, we will begin.',
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
  meaningsByNumber,
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
  const { voiceEnabled, isSpeaking, toggleVoice, speak, stopSpeaking } = useTTS();

  // Read completed AI replies aloud (when voice is enabled).
  useEffect(() => {
    setOnAssistantMessage(speak);
    return () => {
      setOnAssistantMessage(null);
      stopSpeaking();
    };
  }, [setOnAssistantMessage, speak, stopSpeaking]);

  const { phase, drawnCards, currentCardIndex } = state;
  const activeSpread = SPREADS[state.selectedSpread || 'three'];
  const revealedCount = drawnCards.filter((c) => c.isRevealed).length;
  const readerText = useMemo(() => selectReaderText(messages, state), [messages, state]);

  const isReading = READING_PHASES.includes(phase);
  const activeCard = drawnCards[currentCardIndex];
  const activePosition = activeCard ? activeSpread?.positions[activeCard.positionIndex] : undefined;
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
      onSend={onSendMessage}
      onRetry={onRetry}
      onDismissError={onDismissError}
      onFinishDrawing={onFinishDrawing}
      onAdvance={onAdvanceToNextCard}
      onRestart={onRestart}
    />
  );

  return (
    <div className="vn-stage">
      <Ambience />

      <header className="vn-topbar">
        <Link href="/" className="vn-exit-btn" aria-label="Exit Sanctuary">
          ✦ Exit<span className="vn-exit-btn__long"> Sanctuary</span>
        </Link>

        <div className="vn-topbar__right">
          {activeSpread && drawnCards.length > 0 && (
            <SpreadOverview
              drawnCards={drawnCards}
              positions={activeSpread.positions}
              currentCardIndex={currentCardIndex}
              highestCardIndexReached={state.highestCardIndexReached}
              canNavigate={isReading && !isTyping}
              meaningsByNumber={meaningsByNumber}
              onGoToCard={onGoToCard}
            />
          )}
          <button
            type="button"
            className="voice-toggle"
            onClick={toggleVoice}
            aria-pressed={voiceEnabled}
            aria-label={voiceEnabled ? 'Turn voice off' : 'Turn voice on'}
          >
            {voiceEnabled ? '🔊 Voice: on' : '🔇 Voice: off'}
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
                meaningsByNumber={meaningsByNumber}
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
                cardName={meaningsByNumber.get(activeCard.cardNumber)?.cardName || ''}
                isReversed={activeCard.isReversed}
                isRevealed={activeCard.isRevealed}
                isActive={isSpeaking}
                onReveal={onRevealCard}
                positionName={activePosition?.name}
                positionDescription={activePosition?.description}
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
