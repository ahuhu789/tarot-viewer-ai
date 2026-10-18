'use client';

import React, { useMemo, useState } from 'react';
import { getImageProps } from 'next/image';
import { SpreadId } from '@/types/tarot';
import { SPREADS } from '@/data/spreads';
import { CARD_BACK_URL } from '@/lib/cards';

interface SeventyEightCardsSpreadProps {
  spreadId: SpreadId;
  onSelectComplete: () => void;
}

const DECK_SIZE = 78;

export function SeventyEightCardsSpread({ spreadId, onSelectComplete }: SeventyEightCardsSpreadProps) {
  const [selected, setSelected] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const requiredCount = SPREADS[spreadId]?.positions.length ?? 1;
  const remaining = requiredCount - selected.length;
  const complete = remaining === 0;

  // One small optimized thumbnail URL shared by all 78 card backs (CSS background, no 78 <img> elements).
  const backgroundImage = useMemo(() => {
    const { props } = getImageProps({ src: CARD_BACK_URL, alt: '', width: 96, height: 166, quality: 75 });
    return `url("${props.src}")`;
  }, []);

  const toggle = (index: number) => {
    setSelected((prev) => {
      if (prev.includes(index)) return prev.filter((i) => i !== index);
      if (prev.length >= requiredCount) return prev;
      return [...prev, index];
    });
  };

  const confirm = async () => {
    if (!complete || submitting) return;
    setSubmitting(true);
    try {
      await onSelectComplete();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pick-panel">
      <p className="pick-prompt" aria-live="polite">
        {complete ? 'Cards selected. Confirm to proceed.' : `Select ${remaining} more card${remaining > 1 ? 's' : ''}`}
      </p>

      <div className="pick-grid" role="group" aria-label="Face-down deck">
        {Array.from({ length: DECK_SIZE }, (_, i) => {
          const isSelected = selected.includes(i);
          return (
            <button
              key={i}
              type="button"
              className={`pick-card ${isSelected ? 'is-selected' : ''} ${complete && !isSelected ? 'is-dimmed' : ''}`}
              style={{ backgroundImage }}
              aria-pressed={isSelected}
              aria-label={`Card ${i + 1}`}
              onClick={() => toggle(i)}
            />
          );
        })}
      </div>

      <button type="button" onClick={confirm} className="btn-gold" disabled={!complete || submitting}>
        Confirm Selection ✦
      </button>
    </div>
  );
}
