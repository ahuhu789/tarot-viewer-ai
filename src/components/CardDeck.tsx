'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { CARD_BACK_URL } from '@/lib/cards';

interface CardDeckProps {
  onDraw: () => void;
}

export const CardDeck: React.FC<CardDeckProps> = ({ onDraw }) => {
  const [shuffling, setShuffling] = useState(false);

  const handleShuffleAndDraw = () => {
    if (shuffling) return;

    setShuffling(true);

    // Shuffle for 1.6s, then trigger drawing callback
    setTimeout(() => {
      setShuffling(false);
      onDraw();
    }, 1600);
  };

  return (
    <div style={styles.container}>
      <p style={styles.prompt}>
        {shuffling ? 'Mixing the energies of the cards...' : 'Focus your intention and click the deck to shuffle'}
      </p>

      <div style={styles.deckWrapper} onClick={handleShuffleAndDraw}>
        <div className="deck-stack">
          {/* Render 5 cards to represent the fanned stack */}
          {[0, 1, 2, 3, 4].map((i) => {
            // Apply offset rotations for a fan effect
            let rotate = (i - 2) * 4;
            let translate = (i - 2) * 5;

            // Apply shuffle animations if shuffling
            let animClass = '';
            if (shuffling) {
              animClass = i % 2 === 0 ? 'shuffling-left' : 'shuffling-right';
            }

            return (
              <div
                key={i}
                className={`deck-card-stacked ${animClass}`}
                style={{
                  transform: shuffling
                    ? undefined
                    : `rotate(${rotate}deg) translateX(${translate}px)`,
                  zIndex: i,
                  cursor: shuffling ? 'default' : 'pointer',
                }}
              >
                <Image
                  src={CARD_BACK_URL}
                  alt="Card Back"
                  fill
                  style={styles.cardBackImage}
                  sizes="130px"
                  priority
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    width: '100%',
    minHeight: '280px',
  },
  prompt: {
    fontSize: '0.95rem',
    letterSpacing: '0.08em',
    color: 'var(--gold-primary)',
    marginBottom: '2rem',
    textAlign: 'center',
    fontFamily: 'var(--font-heading)',
    height: '24px', // fixed height to prevent layout shifts
  },
  deckWrapper: {
    cursor: 'pointer',
    position: 'relative',
    width: '130px',
    height: '220px',
  },
  cardBackImage: {
    objectFit: 'cover',
    borderRadius: '8px',
  },
};
