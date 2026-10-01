'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { SpreadId } from '@/types/tarot';
import { SPREADS } from '@/data/spreads';

interface SeventyEightCardsSpreadProps {
  spreadId: SpreadId;
  onSelectComplete: () => void;
}

export const SeventyEightCardsSpread: React.FC<SeventyEightCardsSpreadProps> = ({
  spreadId,
  onSelectComplete,
}) => {
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  
  const spread = SPREADS[spreadId];
  const requiredCount = spread ? spread.positions.length : 1;

  const handleCardClick = (index: number) => {
    if (selectedIndices.includes(index)) {
      setSelectedIndices(selectedIndices.filter((i) => i !== index));
    } else {
      if (selectedIndices.length < requiredCount) {
        setSelectedIndices([...selectedIndices, index]);
      }
    }
  };

  return (
    <div style={styles.container}>
      <p style={styles.prompt}>
        {selectedIndices.length === requiredCount
          ? 'Cards selected. Confirm to proceed.'
          : `Select ${requiredCount - selectedIndices.length} more card${requiredCount - selectedIndices.length > 1 ? 's' : ''}`}
      </p>

      <div style={styles.grid}>
        {Array.from({ length: 78 }).map((_, i) => {
          const isSelected = selectedIndices.includes(i);
          return (
            <div
              key={i}
              onClick={() => handleCardClick(i)}
              style={{
                ...styles.cardWrapper,
                transform: isSelected ? 'translateY(-10px) scale(1.05)' : 'none',
                boxShadow: isSelected ? '0 0 15px var(--gold-primary)' : 'none',
                opacity: selectedIndices.length === requiredCount && !isSelected ? 0.5 : 1,
              }}
            >
              <Image
                src="/cards/back.jpg"
                alt="Tarot Card Back"
                fill
                style={styles.cardImage}
                sizes="40px"
              />
            </div>
          );
        })}
      </div>

      <div style={styles.actionRow}>
        <button
          onClick={onSelectComplete}
          className="btn-gold"
          disabled={selectedIndices.length < requiredCount}
          style={{
            ...styles.confirmBtn,
            opacity: selectedIndices.length === requiredCount ? 1 : 0,
            pointerEvents: selectedIndices.length === requiredCount ? 'auto' : 'none',
          }}
        >
          Confirm Selection ✦
        </button>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
  },
  prompt: {
    fontSize: '1.1rem',
    color: 'var(--gold-primary)',
    marginBottom: '1.5rem',
    fontFamily: 'var(--font-heading)',
    textAlign: 'center',
    textShadow: '0 0 10px rgba(230, 194, 98, 0.3)',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(13, 1fr)',
    gap: '6px',
    justifyContent: 'center',
    width: '100%',
    maxWidth: '800px',
  },
  cardWrapper: {
    position: 'relative',
    aspectRatio: '1 / 1.7',
    width: '100%',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  cardImage: {
    objectFit: 'cover',
  },
  actionRow: {
    marginTop: '2rem',
    height: '45px',
    display: 'flex',
    justifyContent: 'center',
    width: '100%',
  },
  confirmBtn: {
    transition: 'opacity 0.4s ease',
  },
};
