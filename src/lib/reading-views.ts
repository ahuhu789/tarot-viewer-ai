/**
 * Builds the "views" of a finished (or ongoing) reading from the stored chat
 * messages: one per interpreted card, the synthesis, and the follow-up Q&A.
 * Pure and client-side only: revisiting a card never calls the AI again.
 */
import type { ChatMessage, DrawnCard, Spread } from '@/types/tarot';
import { cardMeaningVi } from '@/data/card-meanings-vi';

export type ViewId = number | 'summary' | 'qa';

export interface ReadingView {
  id: ViewId;
  /** Short tab label, e.g. "1 · Quá khứ". */
  label: string;
  /** Markdown shown in the reader panel. */
  text: string;
  /** What "Nghe lại" speaks (the interpretation itself, without the Q&A). */
  speech: string;
}

const isAssistant = (m: ChatMessage) => m.role === 'assistant';

/** The user message right before index i (the question an answer replies to). */
function questionBefore(messages: ChatMessage[], i: number): string {
  for (let j = i - 1; j >= 0; j--) {
    if (messages[j].role === 'user') return messages[j].content;
    if (messages[j].role === 'assistant') return '';
  }
  return '';
}

function qaBlock(question: string, answer: string, vietnamese: boolean): string {
  const q = question ? `**${vietnamese ? 'Bạn hỏi' : 'You asked'}:** ${question.replace(/\s+/g, ' ').trim()}\n\n` : '';
  return `${q}${answer}`;
}

/** Inserts an italic keyword line right after the server-rendered heading. */
function withKeywords(text: string, keywords: string, vietnamese: boolean): string {
  if (!keywords) return text;
  const line = `*${vietnamese ? 'Từ khóa' : 'Keywords'}: ${keywords}*`;
  const m = text.match(/^(###[^\n]*\n+)/);
  return m ? `${m[1]}${line}\n\n${text.slice(m[1].length)}` : `${line}\n\n${text}`;
}

export function buildReadingViews(
  messages: ChatMessage[],
  drawnCards: DrawnCard[],
  spread: Spread | undefined,
  vietnamese = true,
): ReadingView[] {
  const views: ReadingView[] = [];
  const cards = [...drawnCards].sort((a, b) => a.positionIndex - b.positionIndex);
  const multi = cards.length > 1;

  for (const card of cards) {
    const i = card.positionIndex;
    let interpretation = '';
    const chats: string[] = [];
    messages.forEach((m, idx) => {
      if (!isAssistant(m) || m.metadata?.activeCardIndex !== i) return;
      if (m.metadata.phase === 'interpreting') interpretation = m.content; // last one wins (retries)
      else if (m.metadata.phase === 'card_chat') chats.push(qaBlock(questionBefore(messages, idx), m.content, vietnamese));
    });
    if (!interpretation) continue; // not interpreted yet
    const pos = spread?.positions[i];
    const posName = (vietnamese ? pos?.name : pos?.nameEn) ?? `${vietnamese ? 'Lá' : 'Card'} ${i + 1}`;
    const meaning = vietnamese ? cardMeaningVi(card.cardNumber) : undefined;
    const keywords = meaning ? (card.isReversed ? meaning.reversed : meaning.upright) : '';
    views.push({
      id: i,
      label: multi ? `${i + 1} · ${posName}` : posName,
      text: [withKeywords(interpretation, keywords, vietnamese), ...chats].join('\n\n---\n\n'),
      speech: interpretation,
    });
  }

  const synthesis = [...messages].reverse().find((m) => isAssistant(m) && m.metadata?.phase === 'synthesis');
  if (synthesis) {
    views.push({ id: 'summary', label: vietnamese ? 'Tổng hợp' : 'Synthesis', text: synthesis.content, speech: synthesis.content });
  }

  // Follow-up answers (and the closing words), newest first so the latest is visible at once.
  const qa: { text: string; speech: string }[] = [];
  messages.forEach((m, idx) => {
    if (isAssistant(m) && (m.metadata?.phase === 'follow_up' || m.metadata?.phase === 'closing')) {
      qa.push({ text: qaBlock(questionBefore(messages, idx), m.content, vietnamese), speech: m.content });
    }
  });
  if (qa.length) {
    views.push({
      id: 'qa',
      label: `${vietnamese ? 'Hỏi đáp' : 'Q&A'} (${qa.length})`,
      text: [...qa].reverse().map((x) => x.text).join('\n\n---\n\n'),
      speech: qa[qa.length - 1].speech,
    });
  }
  return views;
}

/** The view shown when the seeker has not picked one: the newest content. */
export function defaultViewId(views: ReadingView[], messages: ChatMessage[]): ViewId | null {
  if (!views.length) return null;
  const last = [...messages].reverse().find(isAssistant);
  const phase = last?.metadata?.phase;
  const has = (id: ViewId) => views.some((v) => v.id === id);
  if ((phase === 'follow_up' || phase === 'closing') && has('qa')) return 'qa';
  if (has('summary')) return 'summary';
  return views[views.length - 1].id;
}
