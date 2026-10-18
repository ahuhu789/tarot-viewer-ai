'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useReading } from '@/hooks/useReading';
import { VisualNovelScene } from '@/components/VisualNovelScene';
import { TarotCard } from '@/types/tarot';

export default function ReadingRoomPage() {
  const reading = useReading();
  const [cardMeanings, setCardMeanings] = useState<TarotCard[]>([]);

  // Load all card definitions once.
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/cards', { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.cards)) setCardMeanings(data.cards);
      })
      .catch((err) => {
        if (!controller.signal.aborted) console.error('❌ Error fetching card definitions:', err);
      });
    return () => controller.abort();
  }, []);

  // O(1) lookups instead of Array.find on every render.
  const meaningsByNumber = useMemo(
    () => new Map(cardMeanings.map((c) => [c.cardNumber, c] as const)),
    [cardMeanings],
  );

  return (
    <VisualNovelScene
      state={reading.state}
      messages={reading.messages}
      isTyping={reading.isTyping}
      streamStore={reading.streamStore}
      error={reading.error}
      meaningsByNumber={meaningsByNumber}
      onRetry={reading.retry}
      onDismissError={reading.dismissError}
      onSendMessage={reading.sendMessage}
      onSelectSpread={reading.selectSpread}
      onFinishShuffling={reading.finishShuffling}
      onSubmitCardSelection={reading.submitCardSelection}
      onFinishDrawing={reading.finishDrawing}
      onRevealCard={reading.revealCard}
      onAdvanceToNextCard={reading.advanceToNextCard}
      onGoToCard={reading.goToCard}
      onRestart={reading.restartReading}
      setOnAssistantMessage={reading.setOnAssistantMessage}
    />
  );
}
