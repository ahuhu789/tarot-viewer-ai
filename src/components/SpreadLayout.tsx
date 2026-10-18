'use client';

import React, { memo } from 'react';
import { DrawnCard, SpreadId, TarotCard as TarotCardType } from '@/types/tarot';
import { TarotCard } from './TarotCard';
import { SPREADS } from '@/data/spreads';

interface SpreadLayoutProps {
  drawnCards: DrawnCard[];
  meaningsByNumber: Map<number, TarotCardType>;
  spreadId: SpreadId;
  currentCardIndex: number;
  onRevealCard: (index: number) => void;
  phase: string;
}

function SpreadLayoutBase({
  drawnCards,
  meaningsByNumber,
  spreadId,
  currentCardIndex,
  onRevealCard,
  phase,
}: SpreadLayoutProps) {
  const spread = SPREADS[spreadId];
  if (!spread) return null;

  return (
    <div className="spread-row">
      {drawnCards.map((card, i) => {
        const pos = spread.positions[i];
        if (!pos) return null;
        return (
          <TarotCard
            key={i}
            index={i}
            cardNumber={card.cardNumber}
            cardName={meaningsByNumber.get(card.cardNumber)?.cardName || ''}
            isReversed={card.isReversed}
            isRevealed={card.isRevealed}
            isActive={phase === 'interpreting' && currentCardIndex === i}
            onReveal={onRevealCard}
            positionName={pos.name}
            positionDescription={pos.description}
            size="medium"
          />
        );
      })}
    </div>
  );
}

export const SpreadLayout = memo(SpreadLayoutBase);
