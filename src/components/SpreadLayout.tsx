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

  // Render Celtic Cross layout (Absolute positions on desktop, stack on mobile)
  return (
    <div style={styles.celticCrossContainer}>
      <div style={styles.celticCanvas} className="celtic-desktop-canvas">
        {drawnCards.map((card, i) => {
          const meaning = cardMeanings.find((m) => m.cardNumber === card.cardNumber);
          const pos = spread.positions[i];
          if (!pos) return null;

          // Determine absolute styles for Celtic Cross
          const customStyle = styles[`celticCard${i}`] || {};

          return (
            <div key={i} style={{ ...styles.absoluteWrapper, ...customStyle }}>
              {/* Rotate the cross card 2 (which crosses Present) if it is card 1 */}
              <div style={i === 1 ? styles.crossRotate : undefined}>
                <TarotCard
                  cardNumber={card.cardNumber}
                  cardName={meaning?.cardName || ''}
                  isReversed={card.isReversed}
                  isRevealed={card.isRevealed}
                  isActive={phase === 'interpreting' && currentCardIndex === i}
                  onReveal={() => onRevealCard(i)}
                  positionName={pos.name}
                  positionDescription={pos.description}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
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
  celticCrossContainer: {
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
  },
  celticCanvas: {
    position: 'relative',
    width: '100%',
    maxWidth: '560px',
    height: '490px',
  },
  absoluteWrapper: {
    position: 'absolute',
    transform: 'translate(-50%, -50%)',
    transition: 'all 0.3s ease',
  },
  crossRotate: {
    transform: 'rotate(90deg)',
  },

  // Coordinate mappings for 10-card Celtic Cross
  celticCard0: { left: '35%', top: '50%' },        // Present (Center)
  celticCard1: { left: '35%', top: '50%', zIndex: 10 }, // Challenge (Crosses center)
  celticCard2: { left: '35%', top: '82%' },        // Subconscious (Below)
  celticCard3: { left: '10%', top: '50%' },        // Past (Left)
  celticCard4: { left: '35%', top: '18%' },        // Conscious (Above)
  celticCard5: { left: '60%', top: '50%' },        // Near Future (Right)

  celticCard6: { left: '88%', top: '82%' },        // Self (Staff Bottom)
  celticCard7: { left: '88%', top: '62%' },        // Environment
  celticCard8: { left: '88%', top: '42%' },        // Hopes/Fears
  celticCard9: { left: '88%', top: '22%' },        // Outcome (Staff Top)
};
