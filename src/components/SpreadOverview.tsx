'use client';

import React, { memo } from 'react';
import Image from 'next/image';
import { DrawnCard, SpreadPosition } from '@/types/tarot';
import { cardNameVi } from '@/data/card-names';
import { CARD_BACK_URL, cardImageUrl } from '@/lib/cards';

interface SpreadOverviewProps {
  drawnCards: DrawnCard[];
  positions: SpreadPosition[];
  currentCardIndex: number;
  highestCardIndexReached: number;
  canNavigate: boolean;
  onGoToCard: (index: number) => void;
}

/** Thumbnail strip of the drawn cards, shown inside the top bar (never overlapping it). */
function SpreadOverviewBase({
  drawnCards,
  positions,
  currentCardIndex,
  highestCardIndexReached,
  canNavigate,
  onGoToCard,
}: SpreadOverviewProps) {
  return (
    <nav className="vn-spread-overview" aria-label="Các lá trong trải bài">
      {drawnCards.map((c, i) => {
        const isCurrent = currentCardIndex === i;
        const isAccessible = canNavigate && i <= highestCardIndexReached;
        const name = `${cardNameVi(c.cardNumber)}${c.isReversed ? ' (ngược)' : ''}`;
        const position = `${i + 1}. ${positions[i]?.name ?? `Lá ${i + 1}`}`;
        return (
          <button
            key={i}
            type="button"
            className={`mini-card-slot ${isCurrent ? 'active' : ''}`}
            title={`${position}: ${c.isRevealed ? name : 'chưa lật'}`}
            aria-label={`${position}: ${c.isRevealed ? name : 'chưa lật'}`}
            aria-current={isCurrent ? 'true' : undefined}
            disabled={!isAccessible}
            onClick={() => onGoToCard(i)}
          >
            <Image
              src={c.isRevealed ? cardImageUrl(c.cardNumber) : CARD_BACK_URL}
              alt=""
              fill
              className={`mini-card-image ${c.isRevealed ? '' : 'is-back'}`}
              sizes="32px"
            />
          </button>
        );
      })}
    </nav>
  );
}

export const SpreadOverview = memo(SpreadOverviewBase);
