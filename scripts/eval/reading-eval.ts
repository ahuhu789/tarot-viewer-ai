/**
 * End-to-end evaluation of a full reading against a running server (local or deployed).
 * No secrets needed: it only calls the public API routes.
 *
 *   npx tsx scripts/eval/reading-eval.ts --base http://localhost:3000 --spread three \
 *     --question "Tôi có nên nghỉ việc?" [--followup "..."] [--log server.log] [--out result.json]
 *
 * Checks every step: the card named first is the card at that position, no card outside
 * the spread is named, the synthesis follows position order, and how often the text
 * refers back to the seeker's question. With --log (a server log written with
 * TAROT_LOG_USAGE=1) it also sums the tokens used per step.
 */
import fs from 'node:fs';
import { findCardMentions } from '../../src/lib/card-guard';
import { cardNameEn } from '../../src/data/card-names';
import { questionReference } from './relevance';
import { SPREADS } from '../../src/data/spreads';

type Drawn = { cardNumber: number; isReversed: boolean; positionIndex: number; isRevealed: boolean };
type Step = { phase: string; card?: number; ms: number; text: string; verdict?: string; refersToQuestion?: boolean; refersEarly?: boolean };

const args = new Map<string, string>();
for (let i = 2; i < process.argv.length; i += 2) args.set(process.argv[i].replace(/^--/, ''), process.argv[i + 1]);
const BASE = args.get('base') ?? 'http://localhost:3000';
const spread = args.get('spread') ?? 'three';
const question = args.get('question') ?? 'Tôi đang phân vân có nên nghỉ việc để tự kinh doanh không?';
const followup = args.get('followup');
const logPath = args.get('log');
const RETRY_WAIT_MS = 25_000;

let state: Record<string, unknown> = {
  phase: 'intention', userIntention: '', selectedSpread: null, drawnCards: [], currentCardIndex: 0,
  readingComplete: false, followUpCount: 0, detectedLanguage: '',
};
const messages: { role: 'user' | 'assistant'; content: string }[] = [];

async function once(override: Record<string, unknown>) {
  const t0 = Date.now();
  const res = await fetch(`${BASE}/api/reading`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ messages, state: { ...state, ...override } }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  const body = await res.text();
  let text = ''; let ev = '';
  for (const line of body.split('\n')) {
    if (line.startsWith('event: ')) ev = line.slice(7).trim();
    else if (line.startsWith('data: ')) {
      const d = line.slice(6).trim();
      if (ev === 'token') text += decodeURIComponent(d);
      else if (ev === 'replace') text = decodeURIComponent(d);
      else if (ev === 'state') state = { ...state, ...JSON.parse(d) };
      else if (ev === 'error') throw new Error(`stream error: ${decodeURIComponent(d)}`);
    }
  }
  if (text) messages.push({ role: 'assistant', content: text });
  return { text, ms: Date.now() - t0 };
}

async function step(override: Record<string, unknown>, tries = 3): Promise<{ text: string; ms: number }> {
  try {
    return await once(override);
  } catch (e) {
    if (tries <= 1) throw e;
    console.error(`  retry in ${RETRY_WAIT_MS / 1000}s: ${(e as Error).message.slice(0, 120)}`);
    await new Promise((r) => setTimeout(r, RETRY_WAIT_MS));
    return step(override, tries - 1);
  }
}

const body = (t: string) => t.replace(/^#{1,6} .*$/gm, '').replace(/^\*.*\*$/gm, '').trim();
const firstSentences = (t: string, n: number) => (t.match(/[^.!?…]+[.!?…]*/g) ?? [t]).slice(0, n).join(' ');
const words = (t: string) => body(t).split(/\s+/).filter(Boolean).length;

(async () => {
  const logStart = logPath && fs.existsSync(logPath) ? fs.statSync(logPath).size : 0;
  const steps: Step[] = [];

  messages.push({ role: 'user', content: question });
  let r = await step({});
  steps.push({ phase: 'intention', ...r });

  const n = SPREADS[spread]?.positions.length ?? 1;
  // Distinct random picks out of the 78 face-down cards, as a real user would make.
  const picks: number[] = [];
  while (picks.length < n) {
    const p = Math.floor(Math.random() * 78);
    if (!picks.includes(p)) picks.push(p);
  }
  const draw = await (await fetch(`${BASE}/api/reading/draw`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ spreadId: spread, picks }),
  })).json();
  if (!Array.isArray(draw.drawnCards)) throw new Error(`draw failed: ${JSON.stringify(draw)}`);
  const drawn: Drawn[] = draw.drawnCards.map((c: Drawn) => ({ ...c, isRevealed: true }));
  state = { ...state, selectedSpread: spread, phase: 'shuffling', drawnCards: drawn };
  messages.push({ role: 'user', content: `Mình chọn trải bài ${spread}.` });

  for (let i = 0; i < drawn.length; i++) {
    r = await step({ phase: 'interpreting', currentCardIndex: i });
    steps.push({ phase: 'interpreting', card: i, ...r });
  }
  if (drawn.length > 1) {
    r = await step({ phase: 'synthesis' });
    steps.push({ phase: 'synthesis', ...r });
  }
  if (followup) {
    messages.push({ role: 'user', content: followup });
    r = await step({ phase: 'follow_up', readingComplete: true });
    steps.push({ phase: 'follow_up', ...r });
  }

  // --- Validation ---------------------------------------------------------------
  const nums = drawn.map((c) => c.cardNumber);
  let pass = true;
  for (const s of steps) {
    if (s.phase === 'intention') continue;
    const mentions = findCardMentions(s.text);
    let verdict = 'ok';
    if (s.phase === 'interpreting') {
      const expected = nums[s.card!];
      if (mentions[0]?.cardNumber !== expected) verdict = `WRONG first card (expected ${cardNameEn(expected)})`;
      const foreign = mentions.filter((m) => !nums.slice(0, s.card! + 1).includes(m.cardNumber));
      if (foreign.length) verdict += ` FOREIGN ${foreign.map((f) => f.name).join(', ')}`;
    } else {
      const foreign = mentions.filter((m) => !nums.includes(m.cardNumber));
      if (foreign.length) verdict = `FOREIGN ${foreign.map((f) => f.name).join(', ')}`;
      if (s.phase === 'synthesis') {
        const firstIdx = nums.map((n) => body(s.text).indexOf(findCardMentions(body(s.text)).find((m) => m.cardNumber === n)?.name ?? '\u0000'));
        if (firstIdx.some((x) => x < 0)) verdict += ' (not all cards named)';
        else if (firstIdx.some((x, i) => i > 0 && x < firstIdx[i - 1])) verdict += ' OUT OF ORDER';
      }
    }
    s.verdict = verdict;
    s.refersToQuestion = questionReference(question, body(s.text));
    // Stricter: does the answer tie back to the question in its first two sentences?
    s.refersEarly = questionReference(question, firstSentences(body(s.text), 2));
    if (verdict !== 'ok' && !verdict.startsWith('ok')) pass = false;
  }

  // --- Tokens from the server log -----------------------------------------------
  let tokens: { phase: string; input: number; output: number }[] = [];
  if (logPath && fs.existsSync(logPath)) {
    const appended = fs.readFileSync(logPath).subarray(logStart).toString('utf8'); // byte offset, not chars
    tokens = [...appended.matchAll(/📊 (\w+): in=(\d+) out=(\d+)/g)].map((m) => ({ phase: m[1], input: +m[2], output: +m[3] }));
  }

  const cardSteps = steps.filter((s) => s.phase === 'interpreting');
  const summary = {
    base: BASE, spread, question, pass,
    drawn: drawn.map((c) => `${c.positionIndex + 1}:${cardNameEn(c.cardNumber)}${c.isReversed ? ' (R)' : ''}`),
    avgWordsPerCard: Math.round(cardSteps.reduce((a, s) => a + words(s.text), 0) / cardSteps.length),
    synthesisWords: steps.find((s) => s.phase === 'synthesis') ? words(steps.find((s) => s.phase === 'synthesis')!.text) : null,
    questionReferenced: `${steps.filter((s) => s.phase !== 'intention' && s.refersToQuestion).length}/${steps.filter((s) => s.phase !== 'intention').length}`,
    questionReferencedEarly: `${steps.filter((s) => s.phase !== 'intention' && s.refersEarly).length}/${steps.filter((s) => s.phase !== 'intention').length}`,
    totalWords: steps.reduce((a, s) => a + words(s.text), 0),
    tokensIn: tokens.reduce((a, t) => a + t.input, 0),
    tokensOut: tokens.reduce((a, t) => a + t.output, 0),
  };
  const out = args.get('out');
  if (out) fs.writeFileSync(out, JSON.stringify({ summary, steps, tokens }, null, 1));
  for (const s of steps) console.log(`  ${s.phase}${s.card ?? ''} [${s.ms}ms, ${words(s.text)}w] ${s.verdict ?? ''} ${s.phase !== 'intention' ? (s.refersToQuestion ? '· question✓' : '· question✗') : ''}`);
  console.log(JSON.stringify(summary));
  process.exit(pass ? 0 : 1);
})().catch((e) => {
  console.error(e);
  process.exit(2);
});
