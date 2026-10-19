'use client';

import React, { memo } from 'react';
import { DrawnCard, SpreadId } from '@/types/tarot';
import { TarotCard } from './TarotCard';
import { SPREADS } from '@/data/spreads';

interface SpreadLayoutProps {
  drawnCards: DrawnCard[];
  spreadId: SpreadId;
  currentCardIndex: number;
  onRevealCard: (index: number) => void;
  phase: string;
}

/**
 * The drawn spread. Cards are turned strictly in reading order (1 → 2 → 3), the
 * same order in which they are interpreted, so the ritual and the reading match.
 */
function SpreadLayoutBase({ drawnCards, spreadId, currentCardIndex, onRevealCard, phase }: SpreadLayoutProps) {
  const spread = SPREADS[spreadId];
  if (!spread) return null;
  const cards = [...drawnCards].sort((a, b) => a.positionIndex - b.positionIndex);
  const nextToReveal = cards.find((c) => !c.isRevealed)?.positionIndex ?? -1;
  const multi = cards.length > 1;

  return (
    <div className="spread-row">
      {cards.map((card) => {
        const pos = spread.positions[card.positionIndex];
        if (!pos) return null;
        return (
          <TarotCard
            key={card.positionIndex}
            index={card.positionIndex}
            cardNumber={card.cardNumber}
            isReversed={card.isReversed}
            isRevealed={card.isRevealed}
            isActive={phase === 'interpreting' && currentCardIndex === card.positionIndex}
            onReveal={onRevealCard}
            positionName={pos.name}
            positionBadge={multi ? String(card.positionIndex + 1) : ''}
            locked={phase === 'drawing' && card.positionIndex !== nextToReveal}
            isNext={phase === 'drawing' && card.positionIndex === nextToReveal}
            size="medium"
          />
        );
      })}
    </div>
  );
}

export const SpreadLayout = memo(SpreadLayoutBase);
