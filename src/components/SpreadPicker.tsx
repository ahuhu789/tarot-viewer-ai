'use client';

import React from 'react';
import { SpreadId } from '@/types/tarot';

interface SpreadPickerProps {
  onSelect: (spreadId: SpreadId) => void;
}

const box: React.CSSProperties = {
  width: '12px',
  height: '20px',
  border: '1px solid var(--gold-primary)',
  borderRadius: '2px',
  backgroundColor: 'var(--gold-primary)',
};

const SPREADS_LIST: { id: SpreadId; name: string; description: string; layout: string; cards: number }[] = [
  {
    id: 'single',
    name: 'Daily Draw',
    description:
      'Draw a single card to capture the theme of your day or get a quick, direct response to a single question.',
    layout: '1 Card',
    cards: 1,
  },
  {
    id: 'three',
    name: 'Past, Present & Future',
    description:
      'Explore the timeline of your question, understanding where you came from, where you are, and where you are heading.',
    layout: '3 Cards',
    cards: 3,
  },
];

export function SpreadPicker({ onSelect }: SpreadPickerProps) {
  return (
    <div>
      <h3 className="spread-picker__title">SELECT SPREAD LAYOUT</h3>
      <div className="spread-picker__list">
        {SPREADS_LIST.map((spread) => (
          <button key={spread.id} type="button" onClick={() => onSelect(spread.id)} className="spread-option">
            <span style={{ display: 'flex', gap: '4px', justifyContent: 'center' }} aria-hidden="true">
              {Array.from({ length: spread.cards }, (_, i) => (
                <span key={i} style={box} />
              ))}
            </span>
            <span className="spread-option__name">{spread.name}</span>
            <span className="spread-option__badge">{spread.layout}</span>
            <span className="spread-option__desc">{spread.description}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
