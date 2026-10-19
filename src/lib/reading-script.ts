/**
 * Deterministic parts of a reading, shared by the server (prompts, headings) and
 * the client (labels). Nothing here calls the AI.
 */
import type { DrawnCard, Spread, SpreadPosition, TarotReadingState } from '@/types/tarot';
import { SPREADS } from '@/data/spreads';
import { cardDisplayName, cardNameEn, cardNameVi } from '@/data/card-names';

export function isVietnamese(lang: string | null | undefined): boolean {
  return !lang || /viet/i.test(lang);
}

export function spreadOf(state: Pick<TarotReadingState, 'selectedSpread'>): Spread {
  return SPREADS[state.selectedSpread || 'three'];
}

export function orientationLabel(isReversed: boolean, vietnamese = true): string {
  if (vietnamese) return isReversed ? 'Ngược' : 'Xuôi';
  return isReversed ? 'Reversed' : 'Upright';
}

export function positionLabel(position: SpreadPosition | undefined, vietnamese = true): string {
  if (!position) return '';
  return vietnamese ? position.name : position.nameEn;
}

/**
 * Markdown heading rendered by the server in front of every card
 * interpretation, e.g. "### 2/3 · Hiện tại — Mười Gậy (Ten of Wands) · Xuôi".
 * The model never has to produce the card name in the title, so it cannot get it wrong.
 */
export function cardHeading(card: DrawnCard, spread: Spread, lang: string): string {
  const vi = isVietnamese(lang);
  const pos = spread.positions[card.positionIndex];
  const total = spread.positions.length;
  const prefix = total > 1 ? `${card.positionIndex + 1}/${total} · ${positionLabel(pos, vi)}` : positionLabel(pos, vi);
  return `### ${prefix} — ${cardDisplayName(card.cardNumber, vi)} · ${orientationLabel(card.isReversed, vi)}\n\n`;
}

export function synthesisHeading(state: Pick<TarotReadingState, 'selectedSpread' | 'drawnCards' | 'detectedLanguage'>): string {
  const vi = isVietnamese(state.detectedLanguage);
  const spread = spreadOf(state);
  const path = orderedCards(state.drawnCards)
    .map((c) => `${positionLabel(spread.positions[c.positionIndex], vi)}: ${vi ? cardNameVi(c.cardNumber) : cardNameEn(c.cardNumber)}${c.isReversed ? ` (${orientationLabel(true, vi)})` : ''}`)
    .join(' → ');
  return `### ${vi ? 'Tổng hợp trải bài' : 'Reading synthesis'}\n\n*${path}*\n\n`;
}

/** Cards sorted by spread position, the only order they are ever read in. */
export function orderedCards(cards: DrawnCard[]): DrawnCard[] {
  return [...cards].sort((a, b) => a.positionIndex - b.positionIndex);
}

/** The text the server emits before the model's own tokens for a given phase. */
export function deterministicPrefix(state: TarotReadingState): string {
  if (state.phase === 'interpreting') {
    const card = state.drawnCards.find((c) => c.positionIndex === state.currentCardIndex);
    return card ? cardHeading(card, spreadOf(state), state.detectedLanguage) : '';
  }
  if (state.phase === 'synthesis' && state.drawnCards.length > 0) return synthesisHeading(state);
  return '';
}
