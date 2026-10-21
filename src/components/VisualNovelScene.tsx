'use client';

import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { buildReadingViews, defaultViewId, type ViewId } from '@/lib/reading-views';
import { isVietnamese } from '@/lib/reading-script';
import { cardMeaningVi } from '@/data/card-meanings-vi';
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
import { StarrySky } from './StarrySky';
import { SPREADS } from '@/data/spreads';

interface VisualNovelSceneProps {
  state: TarotReadingState;
  messages: ChatMessage[];
  isTyping: boolean;
  streamStore: TextStream;
  error: ReadingError | null;
  notice: string | null;
  restored?: boolean;
  onRetry: () => void;
  onDismissError: () => void;
  onSendMessage: (text: string) => void;
  onSelectSpread: (spreadId: SpreadId) => void;
  onFinishShuffling: () => void;
  onSubmitCardSelection: (picks: number[]) => void | Promise<void>;
  onFinishDrawing: () => void;
  onRevealCard: (index: number) => void;
  onAdvanceToNextCard: () => void;
  onGoToCard: (index: number) => void;
  onRestart: () => void;
  setOnAssistantMessage: (listener: AssistantListener | null) => void;
}

const READING_PHASES: ReadingPhase[] = ['interpreting', 'card_chat'];
const SPREAD_VISIBLE_PHASES: ReadingPhase[] = ['drawing', 'synthesis', 'follow_up', 'closing'];
/** After all cards are read: the stored parts of the reading can be revisited. */
const REVIEW_PHASES: ReadingPhase[] = ['synthesis', 'follow_up', 'closing'];

/** Local guidance shown while the user is acting on the cards (no AI call in these phases). */
const PHASE_GUIDANCE: Partial<Record<ReadingPhase, string>> = {
  shuffling: 'Giữ câu hỏi trong tâm trí, rồi chạm vào bộ bài để xáo.',
  manual_selection: 'Hãy để trực giác dẫn đường: chọn những lá bài đang gọi bạn. Thứ tự bạn chọn là thứ tự các vị trí.',
  drawing: 'Lật từng lá theo thứ tự. Khi tất cả đã ngửa, mình sẽ bắt đầu giải bài từ lá đầu tiên.',
};

/** The same night sky as the home page, dimmer and nearly still; memoized so it never re-renders. */
const Ambience = memo(function Ambience() {
  return <StarrySky variant="subtle" />;
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
  restored = false,
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
  const latestText = useMemo(() => selectReaderText(messages, state), [messages, state]);
  const vietnamese = ttsLanguage === 'vi';

  const isReading = READING_PHASES.includes(phase);
  const isReview = REVIEW_PHASES.includes(phase);

  // --- Revisit: every interpreted card, the synthesis and the Q&A, rebuilt from the
  // stored messages (no AI call). A pick is tied to the newest reply, so a new answer
  // (follow-up, synthesis) is shown automatically and the pick resets.
  const views = useMemo(
    () => buildReadingViews(messages, drawnCards, activeSpread, vietnamese),
    [messages, drawnCards, activeSpread, vietnamese],
  );
  const lastAssistantId = useMemo(() => [...messages].reverse().find((m) => m.role === 'assistant')?.id ?? '', [messages]);
  const [picked, setPicked] = useState<{ view: ViewId; after: string } | null>(null);
  const pickedView = picked && picked.after === lastAssistantId && views.some((v) => v.id === picked.view) ? picked.view : null;
  const reviewViewId = isReview ? (pickedView ?? defaultViewId(views, messages)) : null;
  const reviewView = isReview && !isTyping ? views.find((v) => v.id === reviewViewId) : undefined;
  const readerText = reviewView ? reviewView.text : latestText;
  const speechText = reviewView ? reviewView.speech : latestText;

  const selectView = useCallback(
    (id: ViewId) => {
      if (isReading) {
        if (typeof id === 'number') onGoToCard(id); // during the reading a tab = going back to that card
        return;
      }
      setPicked({ view: id, after: lastAssistantId });
    },
    [isReading, lastAssistantId, onGoToCard],
  );
  const tabs = useMemo(() => {
    const list = isReading ? views.filter((v) => typeof v.id === 'number') : isReview ? views : [];
    return list.map((v) => ({ id: v.id, label: v.label }));
  }, [isReading, isReview, views]);
  const activeTab: ViewId | null = isReading ? currentCardIndex : reviewViewId;
  const selectedCardIndex = typeof reviewViewId === 'number' ? reviewViewId : -1;
  const activeCard = drawnCards[currentCardIndex];
  const activePosition = activeCard ? activeSpread?.positions[activeCard.positionIndex] : undefined;
  const nextPosition = activeSpread?.positions[currentCardIndex + 1];
  const hasStarted = messages.some((m) => m.role === 'user');
  const handleRestart = useCallback(() => {
    // Only ask when a reading is in progress; after it is complete just start over.
    if (!state.readingComplete && state.drawnCards.length > 0 && !window.confirm('Bỏ trải bài đang đọc và bắt đầu lại?')) return;
    stopSpeaking();
    onRestart();
  }, [onRestart, state.readingComplete, state.drawnCards.length, stopSpeaking]);
  const activeMeaningVi = activeCard && ttsLanguage === 'vi' ? cardMeaningVi(activeCard.cardNumber) : undefined;
  const activeKeywords = activeMeaningVi ? (activeCard?.isReversed ? activeMeaningVi.reversed : activeMeaningVi.upright) : '';
  const handleReplay = useCallback(() => {
    if (isSpeaking) stopSpeaking();
    else speak(speechText);
  }, [isSpeaking, speechText, speak, stopSpeaking]);
  // Switching view stops the voice of the previous one.
  const handleSelectView = useCallback(
    (id: ViewId) => {
      if (isSpeaking) stopSpeaking();
      selectView(id);
    },
    [isSpeaking, selectView, stopSpeaking],
  );
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
      tabs={tabs}
      activeTab={activeTab}
      onSelectTab={handleSelectView}
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
        <div className="vn-topbar__left">
          <Link href="/" className="vn-exit-btn" aria-label="Rời phòng đọc bài">
            ✦ Rời<span className="vn-exit-btn__long"> phòng</span>
          </Link>
          {hasStarted && (
            <button type="button" className="vn-restart-btn" onClick={handleRestart} title="Bắt đầu một trải bài mới">
              ↺ Trải bài mới
            </button>
          )}
          {restored && <span className="vn-restored-pill">Đã khôi phục phiên trước</span>}
        </div>

        <div className="vn-topbar__right">
          {activeSpread && drawnCards.length > 0 && (
            <SpreadOverview
              drawnCards={drawnCards}
              positions={activeSpread.positions}
              currentCardIndex={isReview ? selectedCardIndex : currentCardIndex}
              highestCardIndexReached={state.highestCardIndexReached}
              canNavigate={(isReading || isReview) && !isTyping}
              onGoToCard={handleSelectView}
            />
          )}
          <button
            type="button"
            className="voice-toggle"
            onClick={toggleVoice}
            aria-pressed={voiceEnabled}
            aria-label={voiceEnabled ? 'Tắt giọng đọc' : 'Bật giọng đọc'}
          >
            <span aria-hidden="true">{voiceEnabled ? '🔊' : '🔇'}</span>
            <span className="voice-toggle__label">{voiceEnabled ? 'Giọng đọc: bật' : 'Giọng đọc: tắt'}</span>
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
                selectedIndex={selectedCardIndex}
                onSelectCard={isReview && !isTyping ? handleSelectView : undefined}
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
                keywords={activeKeywords}
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
