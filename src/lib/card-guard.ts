/**
 * Deterministic safeguard against wrong card names in AI text.
 * Finds every card name (Vietnamese or English, longest match first) in a text
 * and reports the ones that are not part of the allowed set.
 */
import { CARD_NAMES_EN, CARD_NAMES_VI, cardNameVi, cardNameEn } from '../data/card-names';

interface Pattern {
  cardNumber: number;
  name: string;
  re: RegExp;
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Case-sensitive on purpose: card names are written in Title Case, while words
// such as "sức mạnh" or "death" also occur in normal prose.
const PATTERNS: Pattern[] = [
  ...CARD_NAMES_EN.map((name, cardNumber) => ({ cardNumber, name })),
  ...CARD_NAMES_VI.map((name, cardNumber) => ({ cardNumber, name })),
]
  .sort((a, b) => b.name.length - a.name.length)
  .map(({ cardNumber, name }) => ({
    cardNumber,
    name,
    re: new RegExp(`(?<![\\p{L}\\d])${escape(name)}(?![\\p{L}\\d])`, 'gu'),
  }));

export interface CardMention {
  cardNumber: number;
  name: string;
  index: number;
}

export function findCardMentions(text: string): CardMention[] {
  let masked = text;
  const found: CardMention[] = [];
  for (const p of PATTERNS) {
    masked = masked.replace(p.re, (m, offset: number) => {
      found.push({ cardNumber: p.cardNumber, name: m, index: offset });
      return '\u0000'.repeat(m.length); // mask so shorter names inside it are not matched again
    });
  }
  return found.sort((a, b) => a.index - b.index);
}

export function foreignMentions(text: string, allowed: number[]): CardMention[] {
  const ok = new Set(allowed);
  return findCardMentions(text).filter((m) => !ok.has(m.cardNumber));
}

/**
 * Rewrites names of cards that are not in the spread to the card actually being
 * read (used for single-card steps, where any other name can only be a slip).
 */
export function repairCardNames(text: string, targetCard: number, allowed: number[]): string {
  const bad = foreignMentions(text, allowed);
  if (!bad.length) return text;
  let out = '';
  let last = 0;
  for (const m of bad) {
    const isEnglish = CARD_NAMES_EN[m.cardNumber] === m.name;
    out += text.slice(last, m.index) + (isEnglish ? cardNameEn(targetCard) : cardNameVi(targetCard));
    last = m.index + m.name.length;
  }
  return out + text.slice(last);
}
