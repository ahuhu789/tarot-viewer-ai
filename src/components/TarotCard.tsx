'use client';

import React, { memo, useCallback } from 'react';
import Image from 'next/image';
import { CARD_BACK_URL, cardImageUrl } from '@/lib/cards';

export type CardSize = 'small' | 'medium' | 'large';

interface TarotCardProps {
  cardNumber: number;
  cardName: string;
  isReversed: boolean;
  isRevealed: boolean;
  isActive: boolean;
  /** Position of this card in the spread; passed back to onReveal so callers can pass a stable callback. */
  index: number;
  onReveal: (index: number) => void;
  positionName?: string;
  positionDescription?: string;
  size?: CardSize;
  hideLabels?: boolean;
}

// Rendered widths are controlled by CSS (see .tarot-card--* in globals.css);
// these values are only hints for next/image's srcset selection.
const IMAGE_SIZES: Record<CardSize, string> = {
  small: '32px',
  medium: '(max-width: 600px) 26vw, 130px',
  large: '(max-width: 900px) 40vw, 260px',
};

function TarotCardBase({
  cardNumber,
  cardName,
  isReversed,
  isRevealed,
  isActive,
  index,
  onReveal,
  positionName = '',
  positionDescription = '',
  size = 'medium',
  hideLabels = false,
}: TarotCardProps) {
  const showLabels = !hideLabels && size !== 'small';
  const orientation = isReversed ? 'reversed' : 'upright';

  const handleFlip = useCallback(() => {
    if (!isRevealed) onReveal(index);
  }, [index, isRevealed, onReveal]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleFlip();
      }
    },
    [handleFlip],
  );

  const label = isRevealed
    ? `${positionName ? positionName + ': ' : ''}${cardName || 'Card'} (${orientation})`
    : `${positionName ? positionName + ': ' : ''}face-down card, press to reveal`;

  return (
    <div className={`tarot-card tarot-card--${size}`}>
      {positionName && showLabels && (
        <div className="tarot-card__position" title={positionName}>
          {positionName}
        </div>
      )}

      <div
        className={`tarot-card__scene ${isActive ? 'is-active' : ''}`}
        onClick={handleFlip}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={isRevealed ? -1 : 0}
        aria-label={label}
        aria-pressed={isRevealed}
      >
        <div className={`card-inner ${isRevealed ? 'is-flipped' : ''} ${isReversed ? 'is-reversed-card' : ''}`}>
          <div className="card-face card-back">
            <Image src={CARD_BACK_URL} alt="" fill sizes={IMAGE_SIZES[size]} className="card-image" />
          </div>
          <div className="card-face card-front" title={`${cardName} (${orientation})`}>
            <Image
              src={cardImageUrl(cardNumber)}
              alt={isRevealed ? `${cardName} (${orientation})` : ''}
              fill
              sizes={IMAGE_SIZES[size]}
              className="card-image"
            />
          </div>
        </div>
      </div>

      {positionDescription && showLabels && (
        <div className="tarot-card__caption" title={positionDescription}>
          {isRevealed ? cardName : 'Tap to reveal'}
        </div>
      )}
    </div>
  );
}

export const TarotCard = memo(TarotCardBase);
