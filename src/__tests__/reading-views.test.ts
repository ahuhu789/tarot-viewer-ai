import { describe, expect, it } from 'vitest';
import { buildReadingViews, defaultViewId } from '@/lib/reading-views';
import { SPREADS } from '@/data/spreads';
import { loadSession, saveSession } from '@/lib/session-store';
import type { ChatMessage, DrawnCard, ReadingPhase, TarotReadingState } from '@/types/tarot';

let n = 0;
const ai = (content: string, phase: ReadingPhase, activeCardIndex = 0): ChatMessage => ({
  id: `a${n++}`, role: 'assistant', content, timestamp: '', metadata: { phase, activeCardIndex },
});
const user = (content: string): ChatMessage => ({ id: `u${n++}`, role: 'user', content, timestamp: '' });

const cards: DrawnCard[] = [
  { cardNumber: 19, isReversed: false, positionIndex: 0, isRevealed: true },
  { cardNumber: 18, isReversed: true, positionIndex: 1, isRevealed: true },
  { cardNumber: 0, isReversed: false, positionIndex: 2, isRevealed: true },
];

const threeCardMessages = (): ChatMessage[] => [
  ai('Chào bạn', 'greeting'),
  user('Mình có nên đổi việc không?'),
  ai('Mình hiểu…', 'intention'),
  user('Mình chọn kiểu trải bài: Quá khứ – Hiện tại – Tương lai'),
  ai('### 1/3 · Quá khứ — Mặt Trời (The Sun) · Xuôi\n\nLá 1 nói về việc cũ.', 'interpreting', 0),
  user('Lá này có ý nghĩa gì với sếp mình?'),
  ai('Với sếp, lá này…', 'card_chat', 0),
  ai('### 2/3 · Hiện tại — Mặt Trăng (The Moon) · Ngược\n\nLá 2 nói về hiện tại.', 'interpreting', 1),
  ai('### 3/3 · Tương lai — Chàng Khờ (The Fool) · Xuôi\n\nLá 3 nói về tương lai.', 'interpreting', 2),
  ai('### Tổng hợp trải bài\n\nCó, nhưng chuẩn bị kỹ. Gợi ý: …', 'synthesis', 2),
];

describe('buildReadingViews', () => {
  it('makes one view per interpreted card, then the synthesis, in position order', () => {
    const views = buildReadingViews(threeCardMessages(), cards, SPREADS.three);
    expect(views.map((v) => v.id)).toEqual([0, 1, 2, 'summary']);
    expect(views.map((v) => v.label)).toEqual(['1 · Quá khứ', '2 · Hiện tại', '3 · Tương lai', 'Tổng hợp']);
  });

  it('shows the full saved interpretation with keywords and the card Q&A', () => {
    const [first, second] = buildReadingViews(threeCardMessages(), cards, SPREADS.three);
    expect(first.text).toMatch(/^### 1\/3 · Quá khứ — Mặt Trời/);
    expect(first.text).toMatch(/\*Từ khóa: [^*]+\*/);
    expect(first.text).toContain('Lá 1 nói về việc cũ.');
    expect(first.text).toContain('**Bạn hỏi:** Lá này có ý nghĩa gì với sếp mình?');
    expect(first.text).toContain('Với sếp, lá này…');
    // "Nghe lại" speaks only the interpretation.
    expect(first.speech).not.toContain('Với sếp');
    expect(second.text).toContain('Lá 2 nói về hiện tại.');
  });

  it('only lists cards that were already interpreted (during the reading)', () => {
    const partial = threeCardMessages().slice(0, 8);
    expect(buildReadingViews(partial, cards, SPREADS.three).map((v) => v.id)).toEqual([0, 1]);
  });

  it('uses the last interpretation when a step was retried', () => {
    const msgs = [...threeCardMessages(), ai('### 2/3 …\n\nBản thử lại.', 'interpreting', 1)];
    expect(buildReadingViews(msgs, cards, SPREADS.three)[1].text).toContain('Bản thử lại.');
  });

  it('adds a newest-first Q&A view after follow-ups and defaults to it', () => {
    const msgs = [...threeCardMessages(), user('Tuần này làm gì?'), ai('Hãy cập nhật CV.', 'follow_up', 2), user('Cảm ơn'), ai('Chúc bạn may mắn.', 'follow_up', 2)];
    const views = buildReadingViews(msgs, cards, SPREADS.three);
    const qa = views.find((v) => v.id === 'qa')!;
    expect(qa.label).toBe('Hỏi đáp (2)');
    expect(qa.text.indexOf('Cảm ơn')).toBeLessThan(qa.text.indexOf('Tuần này làm gì?'));
    expect(defaultViewId(views, msgs)).toBe('qa');
    expect(defaultViewId(views, threeCardMessages())).toBe('summary');
  });

  it('works for the single-card spread (no synthesis)', () => {
    const one = [cards[0]];
    const msgs = [user('Hôm nay?'), ai('### Thông điệp — Mặt Trời\n\nMột lá.', 'interpreting', 0)];
    const views = buildReadingViews(msgs, one, SPREADS.single);
    expect(views).toHaveLength(1);
    expect(views[0].label).toBe(SPREADS.single.positions[0].name);
    expect(defaultViewId(views, msgs)).toBe(0);
  });

  it('uses the position names of the love and choice spreads', () => {
    for (const id of ['love', 'choice'] as const) {
      const labels = buildReadingViews(threeCardMessages(), cards, SPREADS[id]).map((v) => v.label);
      expect(labels.slice(0, 3)).toEqual(SPREADS[id].positions.map((p, i) => `${i + 1} · ${p.name}`));
    }
  });

  it('survives the saved-session round trip (no AI needed to rebuild)', () => {
    const m = new Map<string, string>();
    const store = { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), removeItem: (k: string) => void m.delete(k) };
    const state = { phase: 'follow_up', drawnCards: cards, currentCardIndex: 2, selectedSpread: 'three' } as unknown as TarotReadingState;
    saveSession(state, threeCardMessages(), store);
    const saved = loadSession(store)!;
    const views = buildReadingViews(saved.messages, saved.state.drawnCards, SPREADS.three);
    expect(views.map((v) => v.id)).toEqual([0, 1, 2, 'summary']);
  });

  it('labels in English for English readings', () => {
    expect(buildReadingViews(threeCardMessages(), cards, SPREADS.three, false).map((v) => v.label)).toEqual([
      '1 · Past', '2 · Present', '3 · Future', 'Synthesis',
    ]);
  });
});
