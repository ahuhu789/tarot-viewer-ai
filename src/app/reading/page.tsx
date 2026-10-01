'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useReading } from '@/hooks/useReading';
import { VisualNovelScene } from '@/components/VisualNovelScene';
import { TarotCard } from '@/types/tarot';

function ReadingRoomContent() {
  const {
    state,
    messages,
    isTyping,
    typingContent,
    sendMessage,
    selectSpread,
    finishShuffling,
    submitCardSelection,
    finishDrawing,
    revealCard,
    advanceToNextCard,
    goToCard,
    restartReading,
    onNewMessageCallback,
  } = useReading();

  const [cardMeanings, setCardMeanings] = useState<TarotCard[]>([]);

  // Load all card definitions from CSV endpoint on mount
  useEffect(() => {
    async function fetchCards() {
      try {
        const res = await fetch('/api/cards');
        const data = await res.json();
        if (data.cards) {
          setCardMeanings(data.cards);
        }
      } catch (err) {
        console.error('❌ Error fetching card definitions:', err);
      }
    }
    fetchCards();
  }, []);

  return (
    <VisualNovelScene
      state={state}
      messages={messages}
      isTyping={isTyping}
      typingContent={typingContent}
      onSendMessage={sendMessage}
      onSelectSpread={selectSpread}
      onFinishShuffling={finishShuffling}
      onSubmitCardSelection={submitCardSelection}
      onFinishDrawing={finishDrawing}
      onRevealCard={revealCard}
      onAdvanceToNextCard={advanceToNextCard}
      onGoToCard={goToCard}
      onRestart={restartReading}
      cardMeanings={cardMeanings}
      onNewMessageCallback={onNewMessageCallback}
    />
  );
}

export default function ReadingRoomPage() {
  return (
    <Suspense fallback={<div style={styles.loadingScreen}>Entering the sanctuary...</div>}>
      <ReadingRoomContent />
    </Suspense>
  );
}

const styles: Record<string, React.CSSProperties> = {
  loadingScreen: {
    width: '100vw',
    height: '100vh',
    backgroundColor: '#030308',
    color: '#e6c262',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'var(--font-heading)',
    fontSize: '1.2rem',
    letterSpacing: '0.2em',
  },
};
