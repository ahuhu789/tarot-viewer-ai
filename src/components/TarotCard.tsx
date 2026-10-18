'use client';

import React, { memo, useCallback } from 'react';
import Image from 'next/image';
import { CARD_BACK_URL, cardImageUrl } from '@/lib/cards';
import { cardNameEn, cardNameVi } from '@/data/card-names';

export type CardSize = 'small' | 'medium' | 'large';

interface TarotCardProps {
  cardNumber: number;
  isReversed: boolean;
  isRevealed: boolean;
  isActive: boolean;
  /** Position of this card in the spread; passed back to onReveal so callers can pass a stable callback. */
  index: number;
  onReveal: (index: number) => void;
  positionName?: string;
  /** "1/3" badge in multi-card spreads. */
  positionBadge?: string;
  /** Face-down and not yet allowed to be turned (cards are revealed in reading order). */
  locked?: boolean;
  /** The next card to reveal: highlighted. */
  isNext?: boolean;
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
  isReversed,
  isRevealed,
  isActive,
  index,
  onReveal,
  positionName = '',
  positionBadge = '',
  locked = false,
  isNext = false,
  size = 'medium',
  hideLabels = false,
}: TarotCardProps) {
  const showLabels = !hideLabels && size !== 'small';
  const orientation = isReversed ? 'Ngược' : 'Xuôi';
  const nameVi = cardNameVi(cardNumber);
  const nameEn = cardNameEn(cardNumber);
  const canFlip = !isRevealed && !locked;

  const handleFlip = useCallback(() => {
    if (canFlip) onReveal(index);
  }, [canFlip, index, onReveal]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleFlip();
      }
    },
    [handleFlip],
  );

  const where = positionName ? `${positionName}: ` : '';
  const label = isRevealed
    ? `${where}${nameVi} (${nameEn}), ${orientation.toLowerCase()}`
    : locked
      ? `${where}lá úp, hãy lật các lá trước theo thứ tự`
      : `${where}lá úp, nhấn để lật`;

  return (
    <div className={`tarot-card tarot-card--${size}`}>
      {positionName && showLabels && (
        <div className="tarot-card__position" title={positionName}>
          {positionBadge && <span className="tarot-card__badge">{positionBadge}</span>}
          {positionName}
        </div>
      )}

      <div
        className={`tarot-card__scene ${isActive ? 'is-active' : ''} ${isNext && !isRevealed ? 'is-next' : ''} ${locked && !isRevealed ? 'is-locked' : ''}`}
        onClick={handleFlip}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={canFlip ? 0 : -1}
        aria-label={label}
        aria-disabled={!canFlip}
        aria-pressed={isRevealed}
      >
        <div className={`card-inner ${isRevealed ? 'is-flipped' : ''} ${isReversed ? 'is-reversed-card' : ''}`}>
          <div className="card-face card-back">
            <Image src={CARD_BACK_URL} alt="" fill sizes={IMAGE_SIZES[size]} className="card-image" />
          </div>
          <div className="card-face card-front">
            {isRevealed && (
              <Image
                src={cardImageUrl(cardNumber)}
                alt={`${nameVi} (${nameEn}), ${orientation.toLowerCase()}`}
                fill
                sizes={IMAGE_SIZES[size]}
                className="card-image"
              />
            )}
          </div>
        </div>
      </div>

      {showLabels && (
        <div className="tarot-card__caption" aria-hidden={!isRevealed}>
          {isRevealed ? (
            <>
              <span className="tarot-card__name">{nameVi}</span>
              <span className="tarot-card__name-en">{nameEn}</span>
              <span className={`tarot-card__orient ${isReversed ? 'is-reversed' : ''}`}>{orientation}</span>
            </>
          ) : locked ? (
            'Chờ lượt'
          ) : (
            'Chạm để lật'
          )}
        </div>
      )}
    </div>
  );
}

export const TarotCard = memo(TarotCardBase);
