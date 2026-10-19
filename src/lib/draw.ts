import type { DrawnCard } from '@/types/tarot';

export const DECK_SIZE = 78;
/** Share of reversed cards. */
export const REVERSED_PROBABILITY = 0.3;

/** Random integer in [0, max). Injected so the draw is testable. */
export type RandomInt = (max: number) => number;

/** Fisher–Yates shuffle of the 78 card numbers. */
export function shuffledDeck(randomInt: RandomInt): number[] {
  const deck = Array.from({ length: DECK_SIZE }, (_, i) => i);
  for (let i = deck.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

/**
 * Draws one card per position. The deck is shuffled on the server, and the
 * seeker's picks (indices of the face-down cards they touched, in position
 * order) decide which cards of that shuffled deck they get. Without picks
 * (old clients) random distinct slots are used.
 */
export function drawCards(positions: number, randomInt: RandomInt, picks?: number[]): DrawnCard[] {
  const deck = shuffledDeck(randomInt);
  const slots: number[] = [];
  for (const p of picks ?? []) {
    if (slots.length >= positions) break;
    if (Number.isInteger(p) && p >= 0 && p < DECK_SIZE && !slots.includes(p)) slots.push(p);
  }
  while (slots.length < positions) {
    const p = randomInt(DECK_SIZE);
    if (!slots.includes(p)) slots.push(p);
  }
  return slots.map((slot, positionIndex) => ({
    cardNumber: deck[slot],
    isReversed: randomInt(1000) < REVERSED_PROBABILITY * 1000,
    positionIndex,
    isRevealed: false,
  }));
}
