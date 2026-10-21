'use client';

import React, { useMemo, useState } from 'react';
import { getImageProps } from 'next/image';
import { SpreadId } from '@/types/tarot';
import { SPREADS } from '@/data/spreads';
import { CARD_BACK_URL } from '@/lib/cards';
import { DECK_SIZE } from '@/lib/draw';

interface SeventyEightCardsSpreadProps {
  spreadId: SpreadId;
  /** Called with the indices of the picked face-down cards, in position order. */
  onSelectComplete: (picks: number[]) => void | Promise<void>;
}


export function SeventyEightCardsSpread({ spreadId, onSelectComplete }: SeventyEightCardsSpreadProps) {
  const [selected, setSelected] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const positions = SPREADS[spreadId]?.positions ?? [];
  const requiredCount = positions.length || 1;
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
      await onSelectComplete(selected);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pick-panel">
      <p className="pick-prompt" aria-live="polite">
        {complete
          ? 'Đã chọn đủ. Xác nhận để lật bài nhé.'
          : requiredCount > 1
            ? `Chọn lá cho vị trí ${selected.length + 1} · ${positions[selected.length]?.name ?? ''} (còn ${remaining} lá)`
            : 'Hãy lắng nghe trực giác và chọn 1 lá'}
      </p>

      <div className="pick-grid" role="group" aria-label="Bộ bài úp">
        {Array.from({ length: DECK_SIZE }, (_, i) => {
          const order = selected.indexOf(i);
          const isSelected = order >= 0;
          return (
            <button
              key={i}
              type="button"
              className={`pick-card ${isSelected ? 'is-selected' : ''} ${complete && !isSelected ? 'is-dimmed' : ''}`}
              style={{ backgroundImage }}
              aria-pressed={isSelected}
              aria-label={isSelected ? `Lá ${i + 1}, đã chọn cho ${positions[order]?.name ?? ''}` : `Lá ${i + 1}`}
              onClick={() => toggle(i)}
            >
              {isSelected && requiredCount > 1 && <span className="pick-card__order">{order + 1}</span>}
            </button>
          );
        })}
      </div>

      <button type="button" onClick={confirm} className="btn-primary" disabled={!complete || submitting}>
        {submitting ? 'Đang rút bài…' : 'Xác nhận ✦'}
      </button>
    </div>
  );
}
