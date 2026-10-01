'use client';

import React from 'react';
import Image from 'next/image';

interface TarotCardProps {
  cardNumber: number;
  cardName: string;
  isReversed: boolean;
  isRevealed: boolean;
  isActive: boolean;
  onReveal: () => void;
  positionName?: string;
  positionDescription?: string;
  size?: 'small' | 'medium' | 'large';
  hideLabels?: boolean;
}

export const TarotCard: React.FC<TarotCardProps> = ({
  cardNumber,
  cardName,
  isReversed,
  isRevealed,
  isActive,
  onReveal,
  positionName = '',
  positionDescription = '',
  size = 'medium',
  hideLabels = false,
}) => {
  // Hardcode deck to '1909' edition
  const frontImageUrl = `/cards/1909/${cardNumber}.jpg`;
  const backImageUrl = `/cards/back.jpg`;

  const handleFlip = () => {
    if (!isRevealed) {
      onReveal();
    }
  };

  // Set card dimensions
  const dims = {
    small: { w: 32, h: 54, perspective: '300px' },
    medium: { w: 130, h: 220, perspective: '1000px' },
    large: { w: 260, h: 440, perspective: '1500px' },
  }[size];

  return (
    <div style={{ ...styles.cardContainer, width: `${dims.w}px` }}>
      {positionName && !hideLabels && size !== 'small' && (
        <div style={styles.positionLabel}>{positionName}</div>
      )}

      <div
        style={{
          perspective: dims.perspective,
          width: `${dims.w}px`,
          height: `${dims.h}px`,
        }}
        onClick={handleFlip}
      >
        <div
          className={`card-inner ${isRevealed ? 'is-flipped' : ''} ${isReversed ? 'is-reversed-card' : ''
            }`}
          style={{ width: '100%', height: '100%' }}
        >
          {/* Card Back Face */}
          <div className="card-face card-back">
            <Image
              src={backImageUrl}
              alt="Card Back"
              fill
              sizes={`${dims.w}px`}
              style={styles.image}
              priority
            />
          </div>

          {/* Card Front Face */}
          <div
            className={`card-face card-front ${isActive ? 'card-pulse-active' : ''}`}
            title={`${cardName} (${isReversed ? 'Reversed' : 'Upright'})`}
          >
            <Image
              src={frontImageUrl}
              alt={cardName}
              fill
              sizes={`${dims.w}px`}
              style={styles.image}
            />
          </div>
        </div>
      </div>

      {positionDescription && !hideLabels && size !== 'small' && (
        <div style={styles.descriptionLabel} title={positionDescription}>
          {isRevealed ? cardName : 'Click to Flip'}
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  cardContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.4rem',
  },
  positionLabel: {
    fontFamily: 'var(--font-heading)',
    fontSize: '0.75rem',
    letterSpacing: '0.1em',
    color: 'var(--gold-primary)',
    textAlign: 'center',
    width: '100%',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  descriptionLabel: {
    fontFamily: 'var(--font-ui)',
    fontSize: '0.7rem',
    color: 'var(--text-muted)',
    textAlign: 'center',
    cursor: 'pointer',
    width: '100%',
  },
  image: {
    objectFit: 'cover',
    borderRadius: '8px',
  },
};
