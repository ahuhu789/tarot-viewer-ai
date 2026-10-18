'use client';

import React from 'react';
import { DrawnCard, SpreadId, TarotCard as TarotCardType } from '@/types/tarot';
import { TarotCard } from './TarotCard';
import { SPREADS } from '@/data/spreads';

interface SpreadLayoutProps {
  drawnCards: DrawnCard[];
  cardMeanings: TarotCardType[];
  spreadId: SpreadId;
  currentCardIndex: number;
  onRevealCard: (index: number) => void;
  phase: string;
}

export const SpreadLayout: React.FC<SpreadLayoutProps> = ({
  drawnCards,
  cardMeanings,
  spreadId,
  currentCardIndex,
  onRevealCard,
  phase,
}) => {
  const spread = SPREADS[spreadId];
  if (!spread) return null;

  // Render Single Card layout
  if (spreadId === 'single') {
    const card = drawnCards[0];
    if (!card) return null;
    const meaning = cardMeanings.find((m) => m.cardNumber === card.cardNumber);
    const pos = spread.positions[0];

    return (
      <div style={styles.flexCenter}>
        <TarotCard
          cardNumber={card.cardNumber}
          cardName={meaning?.cardName || ''}
          isReversed={card.isReversed}
          isRevealed={card.isRevealed}
          isActive={phase === 'interpreting' && currentCardIndex === 0}
          onReveal={() => onRevealCard(0)}
          positionName={pos.name}
          positionDescription={pos.description}
        />
      </div>
    );
  }

  // Render Three Card layout
  if (spreadId === 'three') {
    return (
      <div style={styles.threeCardRow}>
        {drawnCards.map((card, i) => {
          const meaning = cardMeanings.find((m) => m.cardNumber === card.cardNumber);
          const pos = spread.positions[i];
          if (!pos) return null;

          return (
            <TarotCard
              key={i}
              cardNumber={card.cardNumber}
              cardName={meaning?.cardName || ''}
              isReversed={card.isReversed}
              isRevealed={card.isRevealed}
              isActive={phase === 'interpreting' && currentCardIndex === i}
              onReveal={() => onRevealCard(i)}
              positionName={pos.name}
              positionDescription={pos.description}
            />
          );
        })}
      </div>
    );
  }

  return null;
};

const styles: Record<string, React.CSSProperties> = {
  flexCenter: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '260px',
    width: '100%',
  },
  threeCardRow: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '1.5rem',
    flexWrap: 'wrap',
    minHeight: '260px',
    width: '100%',
  },
};
