'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { CARD_BACK_URL } from '@/lib/cards';

interface CardDeckProps {
  onDraw: () => void;
}

const SHUFFLE_MS = 1600;
const FAN = [0, 1, 2, 3, 4];

export function CardDeck({ onDraw }: CardDeckProps) {
  const [shuffling, setShuffling] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const handleShuffleAndDraw = () => {
    if (shuffling) return;
    setShuffling(true);
    timer.current = setTimeout(() => {
      setShuffling(false);
      onDraw();
    }, SHUFFLE_MS);
  };

  return (
    <div className="deck-panel">
      <p className="deck-prompt" aria-live="polite">
        {shuffling ? 'Đang xáo bài…' : 'Giữ câu hỏi trong tâm trí rồi chạm vào bộ bài để xáo'}
      </p>

      <button
        type="button"
        className="deck-button"
        onClick={handleShuffleAndDraw}
        disabled={shuffling}
        aria-label="Xáo bài"
      >
        <div className="deck-stack">
          {FAN.map((i) => (
            <div
              key={i}
              className={`deck-card-stacked ${shuffling ? (i % 2 === 0 ? 'shuffling-left' : 'shuffling-right') : ''}`}
              style={{
                transform: shuffling ? undefined : `rotate(${(i - 2) * 4}deg) translateX(${(i - 2) * 5}px)`,
                zIndex: i,
              }}
            >
              <Image src={CARD_BACK_URL} alt="" fill className="card-image" sizes="130px" priority={i === 4} />
            </div>
          ))}
        </div>
      </button>
    </div>
  );
}
