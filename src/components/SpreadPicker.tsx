'use client';

import React from 'react';
import { SpreadId } from '@/types/tarot';
import { SPREADS } from '@/data/spreads';

interface SpreadPickerProps {
  onSelect: (spreadId: SpreadId) => void;
}

const ORDER: SpreadId[] = ['single', 'three', 'love', 'choice'];

export function SpreadPicker({ onSelect }: SpreadPickerProps) {
  return (
    <div>
      <h3 className="spread-picker__title">CHỌN KIỂU TRẢI BÀI</h3>
      <div className="spread-picker__list">
        {ORDER.map((id) => {
          const spread = SPREADS[id];
          const n = spread.positions.length;
          return (
            <button key={id} type="button" onClick={() => onSelect(id)} className="spread-option">
              <span className="spread-option__icon" aria-hidden="true">
                {Array.from({ length: n }, (_, i) => (
                  <span key={i} className="spread-option__mini" />
                ))}
              </span>
              <span className="spread-option__name">{spread.name}</span>
              <span className="spread-option__badge">{n} lá</span>
              <span className="spread-option__desc">{spread.description}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
