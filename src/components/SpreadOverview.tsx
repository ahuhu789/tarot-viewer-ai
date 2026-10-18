'use client';

import React, { memo } from 'react';
import Image from 'next/image';
import { DrawnCard, SpreadPosition, TarotCard as TarotCardType } from '@/types/tarot';
import { CARD_BACK_URL, cardImageUrl } from '@/lib/cards';

interface SpreadOverviewProps {
  drawnCards: DrawnCard[];
  positions: SpreadPosition[];
  currentCardIndex: number;
  highestCardIndexReached: number;
  canNavigate: boolean;
  meaningsByNumber: Map<number, TarotCardType>;
  onGoToCard: (index: number) => void;
}

/** Thumbnail strip of the drawn cards, shown inside the top bar (never overlapping it). */
function SpreadOverviewBase({
  drawnCards,
  positions,
  currentCardIndex,
  highestCardIndexReached,
  canNavigate,
  meaningsByNumber,
  onGoToCard,
}: SpreadOverviewProps) {
  return (
    <nav className="vn-spread-overview" aria-label="Cards in this spread">
      {drawnCards.map((c, i) => {
        const isCurrent = currentCardIndex === i;
        const isAccessible = canNavigate && i <= highestCardIndexReached;
        const name = meaningsByNumber.get(c.cardNumber)?.cardName || 'Card';
        const position = positions[i]?.name ?? `Card ${i + 1}`;
        return (
          <button
            key={i}
            type="button"
            className={`mini-card-slot ${isCurrent ? 'active' : ''}`}
            title={`${position}: ${c.isRevealed ? name : 'not revealed'}`}
            aria-label={`${position}: ${c.isRevealed ? name : 'not revealed'}`}
            aria-current={isCurrent ? 'true' : undefined}
            disabled={!isAccessible}
            onClick={() => onGoToCard(i)}
          >
            <Image
              src={c.isRevealed ? cardImageUrl(c.cardNumber) : CARD_BACK_URL}
              alt=""
              fill
              className="mini-card-image"
              sizes="32px"
            />
          </button>
        );
      })}
    </nav>
  );
}

export const SpreadOverview = memo(SpreadOverviewBase);
