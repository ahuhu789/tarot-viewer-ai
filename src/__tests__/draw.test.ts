import { describe, expect, it } from 'vitest';
import { DECK_SIZE, drawCards, shuffledDeck } from '@/lib/draw';
import { drawRequestSchema } from '@/lib/validation';

/** Deterministic PRNG (mulberry32) so the tests are repeatable. */
function seeded(seed: number) {
  let a = seed;
  return (max: number) => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return Math.floor((((t ^ (t >>> 14)) >>> 0) / 4294967296) * max);
  };
}

describe('shuffledDeck', () => {
  it('is a permutation of the 78 cards', () => {
    const deck = shuffledDeck(seeded(1));
    expect([...deck].sort((a, b) => a - b)).toEqual(Array.from({ length: DECK_SIZE }, (_, i) => i));
  });
});

describe('drawCards', () => {
  it('maps the picks to the shuffled deck, in position order', () => {
    const picks = [5, 40, 77];
    const deck = shuffledDeck(seeded(7));
    const cards = drawCards(3, seeded(7), picks);
    expect(cards.map((c) => c.cardNumber)).toEqual(picks.map((p) => deck[p]));
    expect(cards.map((c) => c.positionIndex)).toEqual([0, 1, 2]);
    expect(cards.every((c) => !c.isRevealed)).toBe(true);
  });

  it('different picks give different cards for the same shuffle', () => {
    const a = drawCards(1, seeded(3), [0])[0].cardNumber;
    const b = drawCards(1, seeded(3), [1])[0].cardNumber;
    expect(a).not.toBe(b);
  });

  it('always returns distinct cards, also without picks', () => {
    for (let seed = 0; seed < 200; seed++) {
      const cards = drawCards(3, seeded(seed));
      expect(new Set(cards.map((c) => c.cardNumber)).size).toBe(3);
    }
  });

  it('fills missing picks and ignores invalid/duplicate ones', () => {
    const cards = drawCards(3, seeded(9), [4, 4, -1, 200]);
    expect(cards).toHaveLength(3);
    expect(new Set(cards.map((c) => c.cardNumber)).size).toBe(3);
  });

  it('reverses roughly 30% of cards', () => {
    const rand = seeded(42);
    let reversed = 0;
    for (let i = 0; i < 2000; i++) if (drawCards(1, rand)[0].isReversed) reversed++;
    expect(reversed / 2000).toBeGreaterThan(0.25);
    expect(reversed / 2000).toBeLessThan(0.35);
  });
});

describe('drawRequestSchema', () => {
  it('accepts valid picks and no picks', () => {
    expect(drawRequestSchema.safeParse({ spreadId: 'three', picks: [1, 2, 3] }).success).toBe(true);
    expect(drawRequestSchema.safeParse({ spreadId: 'single' }).success).toBe(true);
    expect(drawRequestSchema.safeParse({ spreadId: 'love', picks: [0, 1, 77] }).success).toBe(true);
  });

  it('rejects duplicates, out-of-range and unknown spreads', () => {
    expect(drawRequestSchema.safeParse({ spreadId: 'three', picks: [1, 1, 2] }).success).toBe(false);
    expect(drawRequestSchema.safeParse({ spreadId: 'three', picks: [1, 2, 78] }).success).toBe(false);
    expect(drawRequestSchema.safeParse({ spreadId: 'three', picks: [1.5] }).success).toBe(false);
    expect(drawRequestSchema.safeParse({ spreadId: 'celtic' }).success).toBe(false);
  });
});
