'use client';

import React from 'react';
import { useReading } from '@/hooks/useReading';
import { VisualNovelScene } from '@/components/VisualNovelScene';

export default function ReadingRoomPage() {
  const reading = useReading();

  // Card names come from the bundled canonical list (src/data/card-names.ts),
  // so the page no longer downloads the whole meanings CSV as JSON.
  return (
    <VisualNovelScene
      state={reading.state}
      messages={reading.messages}
      isTyping={reading.isTyping}
      streamStore={reading.streamStore}
      error={reading.error}
      notice={reading.notice}
      restored={reading.restored}
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
