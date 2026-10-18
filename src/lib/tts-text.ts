/**
 * Turns reader text (markdown, mixed Vietnamese/English card names) into text
 * that ElevenLabs pronounces well in Vietnamese, and splits it into chunks so
 * playback can start after the first sentence instead of after the whole reply.
 */
import { CARD_NAMES_EN, cardNameViSpoken } from '../data/card-names';

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Longest first so "Queen of Cups" wins over shorter names.
const EN_NAME_RES = CARD_NAMES_EN.map((name, n) => ({ n, name }))
  .sort((a, b) => b.name.length - a.name.length)
  .map(({ n, name }) => ({ n, re: new RegExp(`\\b${escape(name)}\\b`, 'gi') }));

const VI_REPLACEMENTS: [RegExp, string][] = [
  [/\bTarot\b/gi, 'Ta-rô'],
  [/\bUpright\b/gi, 'xuôi'],
  [/\bReversed\b/gi, 'ngược'],
  [/\bVD\b\.?:?/g, 'ví dụ'],
  [/\bv\.v\.?/gi, 'vân vân'],
  [/\bko\b/gi, 'không'],
  [/\bk\b(?=\s)/g, 'không'],
  [/\s&\s/g, ' và '],
  [/(\p{L})\/(\p{L})/gu, '$1 hoặc $2'],
  [/\b(\d+)\s*\/\s*(\d+)\b/g, 'lá $1 trên $2'],
  [/%/g, ' phần trăm'],
];

/** "2/3 · Hiện tại — Bảy Cốc (Seven of Cups) · Ngược" -> "Lá thứ 2, Hiện tại: Bảy Cốc (Seven of Cups), chiều ngược." */
function speakHeading(h: string, vietnamese: boolean): string {
  const m = h.match(/^(?:(\d+)\/\d+\s*·\s*)?(.+?)\s+—\s+(.+?)\s+·\s+(\S+)\s*$/);
  if (!m) return `${h.replace(/\s*[·—–|]\s*/g, '. ')}.`;
  const [, n, pos, name, orient] = m;
  if (!vietnamese) return `${n ? `Card ${n}, ` : ''}${pos}: ${name}, ${orient.toLowerCase()}.`;
  return `${n ? `Lá thứ ${n}, ` : ''}${pos}: ${name}, chiều ${orient.toLowerCase()}.`;
}

export function toSpeakableText(text: string, vietnamese = true): string {
  let t = text
    // Headings rendered by the server: "### 2/3 · Hiện tại — Mười Gậy (Ten of Wands) · Xuôi"
    .replace(/^#{1,6}\s*(.*)$/gm, (_, h: string) => speakHeading(h, vietnamese))
    .replace(/\s*(?:→|⟶|->)\s*/g, ', ')
    .replace(/\*\*|__|[*_`>#~]/g, '')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    // Emoji and decorative symbols.
    .replace(/[\p{Extended_Pictographic}\u2600-\u27BF\uFE0F\u200D✦✧★☆→⟶•]/gu, ' ');

  if (vietnamese) {
    // "Mười Gậy (Ten of Wands)" -> "Mười Gậy": the English name in brackets is for the eyes only.
    t = t.replace(/\s*\((?:The\s)?[A-Z][A-Za-z]+(?:\s(?:of|[A-Z][a-z]+))*\)/g, '');
    // Stand-alone English card names -> their Vietnamese name.
    for (const { n, re } of EN_NAME_RES) t = t.replace(re, cardNameViSpoken(n));
    // "7 Cốc" -> "Bảy Cốc" for card names written with digits.
    t = t.replace(/\b(10|[2-9])\s(Gậy|Cốc|Kiếm|Tiền)\b/g, (_, d: string, s: string) => {
      const words: Record<string, string> = { '2': 'Hai', '3': 'Ba', '4': 'Bốn', '5': 'Năm', '6': 'Sáu', '7': 'Bảy', '8': 'Tám', '9': 'Chín', '10': 'Mười' };
      return `${words[d]} ${s}`;
    });
    for (const [re, rep] of VI_REPLACEMENTS) t = t.replace(re, rep);
  }

  return t
    .replace(/["“”]/g, '')
    .replace(/\.(\s*\.)+/g, '.')
    .replace(/\s+([,.!?;:])/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Sentence boundaries (keeps the punctuation with the sentence). */
const SENTENCE_RE = /[^.!?…]+(?:[.!?…]+|$)/g;

/**
 * Splits speakable text into chunks: a short first chunk (fast start), then
 * larger ones (fewer requests, better prosody). Never splits inside a sentence
 * unless the sentence itself is longer than `max`.
 */
export function chunkForSpeech(text: string, firstMax = 160, max = 420): string[] {
  const sentences = (text.match(SENTENCE_RE) ?? []).map((s) => s.trim()).filter(Boolean);
  const chunks: string[] = [];
  let cur = '';
  for (const s of sentences) {
    const limit = chunks.length === 0 ? firstMax : max;
    if (cur && (cur + ' ' + s).length > limit) {
      chunks.push(cur);
      cur = s;
    } else {
      cur = cur ? `${cur} ${s}` : s;
    }
  }
  if (cur) chunks.push(cur);
  return chunks.flatMap((c) => (c.length <= max ? [c] : c.match(new RegExp(`.{1,${max}}(\\s|$)`, 'g')) ?? [c]));
}
