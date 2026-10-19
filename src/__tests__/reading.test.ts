import { describe, expect, it } from 'vitest';
import { cardHeading, deterministicPrefix, orderedCards, synthesisHeading } from '@/lib/reading-script';
import { SPREADS } from '@/data/spreads';
import {
  getFollowUpPrompt,
  getInterpretationPrompt,
  getSynthesisPrompt,
  getSystemPromptBase,
} from '@/lib/langgraph/prompts';
import { BUDGET } from '@/lib/langgraph/graph';
import { loadSession, saveSession, SESSION_KEY, SESSION_TTL_MS, clearSession } from '@/lib/session-store';
import type { DrawnCard, TarotReadingState } from '@/types/tarot';

const cards: DrawnCard[] = [
  { cardNumber: 19, isReversed: false, positionIndex: 2, isRevealed: true },
  { cardNumber: 0, isReversed: true, positionIndex: 0, isRevealed: true },
  { cardNumber: 18, isReversed: false, positionIndex: 1, isRevealed: true },
];

describe('reading script', () => {
  it('orders cards by position', () => {
    expect(orderedCards(cards).map((c) => c.cardNumber)).toEqual([0, 18, 19]);
  });

  it('renders the card heading from the data, in Vietnamese', () => {
    const h = cardHeading(cards[1], SPREADS.three, 'Vietnamese');
    expect(h).toContain('1/3 · Quá khứ');
    expect(h).toContain('Chàng Khờ');
    expect(h).toContain('Ngược');
  });

  it('renders the English heading for English readings', () => {
    expect(cardHeading(cards[0], SPREADS.three, 'English')).toContain('The Sun');
  });

  it('prefixes interpreting with the current card and synthesis with the path', () => {
    const base = { selectedSpread: 'three', drawnCards: cards, detectedLanguage: 'Vietnamese' } as unknown as TarotReadingState;
    expect(deterministicPrefix({ ...base, phase: 'interpreting', currentCardIndex: 1 })).toContain('Mặt Trăng');
    const syn = synthesisHeading(base);
    expect(syn.indexOf('Chàng Khờ')).toBeLessThan(syn.indexOf('Mặt Trăng'));
    expect(syn.indexOf('Mặt Trăng')).toBeLessThan(syn.indexOf('Mặt Trời'));
    expect(deterministicPrefix({ ...base, phase: 'follow_up' })).toBe('');
  });
});

describe('prompts v3 (focused)', () => {
  it('keeps the focus and anti-filler rules in the base prompt', () => {
    const p = getSystemPromptBase('vi');
    expect(p).toMatch(/FOCUS/);
    expect(p).toMatch(/NO preamble/);
    expect(p).toMatch(/Vietnamese/);
    expect(getSystemPromptBase('en')).toMatch(/ONLY in English/);
  });

  it('caps the length of each step', () => {
    expect(getInterpretationPrompt('vi', false)).toMatch(/max 70 words/);
    expect(getInterpretationPrompt('vi', true)).toMatch(/max 90 words/);
    expect(getSynthesisPrompt('vi')).toMatch(/Gợi ý:/);
    expect(getFollowUpPrompt('vi')).toMatch(/original question/);
  });

  it('keeps output token budgets low (Groq free tier)', () => {
    const total = BUDGET.intention + 3 * BUDGET.interpret + BUDGET.synthesis;
    expect(total).toBeLessThanOrEqual(1000);
    for (const v of Object.values(BUDGET)) expect(v).toBeLessThanOrEqual(240);
  });
});

describe('session store', () => {
  const mem = () => {
    const m = new Map<string, string>();
    return {
      getItem: (k: string) => m.get(k) ?? null,
      setItem: (k: string, v: string) => void m.set(k, v),
      removeItem: (k: string) => void m.delete(k),
      raw: m,
    };
  };
  const state = { phase: 'card_chat', drawnCards: cards, currentCardIndex: 1 } as unknown as TarotReadingState;
  const msgs = [
    { id: 'a', role: 'assistant' as const, content: 'Chào bạn', timestamp: '' },
    { id: 'u', role: 'user' as const, content: 'Câu hỏi', timestamp: '' },
  ];

  it('round-trips a session', () => {
    const s = mem();
    saveSession(state, msgs, s, 1000);
    expect(loadSession(s, 2000)?.state.currentCardIndex).toBe(1);
    clearSession(s);
    expect(s.raw.has(SESSION_KEY)).toBe(false);
  });

  it('does not save before the seeker has written anything', () => {
    const s = mem();
    saveSession(state, msgs.slice(0, 1), s);
    expect(s.raw.size).toBe(0);
  });

  it('expires old or broken sessions', () => {
    const s = mem();
    saveSession(state, msgs, s, 0);
    expect(loadSession(s, SESSION_TTL_MS + 1)).toBeNull();
    s.setItem(SESSION_KEY, '{oops');
    expect(loadSession(s)).toBeNull();
  });
});
