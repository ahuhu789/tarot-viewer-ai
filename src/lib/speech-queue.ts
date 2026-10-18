/**
 * Browser-side speech pipeline (no React): starts talking after the first
 * sentence of a reply that is still streaming, fetches the next chunk while the
 * current one plays, and caches generated audio so a replay costs no credits.
 */
import { chunkForSpeech, toSpeakableText } from './tts-text';

const MAX_TTS_CHARS = 2500;
/** At most this many chunk requests in flight (ElevenLabs free tier allows few concurrent requests). */
const PREFETCH = 2;
/** Do not start speaking a streaming reply before this many characters are complete. */
const MIN_FIRST_CHUNK = 60;

type Lang = 'vi' | 'en';

interface Item {
  text: string;
  audio: Promise<Blob | null> | null;
}

interface Utterance {
  text: string;
  consumed: number;
  finished: boolean;
  queue: Item[];
  playing: boolean;
  controller: AbortController;
  previous: string;
}

const audioCache = new Map<string, Promise<Blob | null>>();

export class SpeechQueue {
  private utt: Utterance | null = null;
  private audio: HTMLAudioElement | null = null;
  private url: string | null = null;
  private lang: Lang = 'vi';

  constructor(private onSpeakingChange: (speaking: boolean) => void) {}

  setLanguage(lang: Lang) {
    this.lang = lang;
  }

  /** Begin a new spoken reply (stops whatever is playing). */
  begin() {
    this.stop();
    this.utt = { text: '', consumed: 0, finished: false, queue: [], playing: false, controller: new AbortController(), previous: '' };
    this.onSpeakingChange(true);
  }

  /** Feed the full reply text received so far. */
  update(fullText: string) {
    const u = this.utt;
    if (!u || u.finished) return;
    u.text = toSpeakableText(fullText.slice(0, MAX_TTS_CHARS), this.lang === 'vi');
    this.enqueueReady(u);
  }

  end(fullText: string) {
    const u = this.utt;
    if (!u) return;
    u.text = toSpeakableText(fullText.slice(0, MAX_TTS_CHARS), this.lang === 'vi');
    if (u.text.length < u.consumed) u.consumed = u.text.length; // text was repaired by the server
    u.finished = true;
    this.enqueueReady(u);
    if (!u.queue.length && !u.playing) this.finish(u);
  }

  /** Speak a complete text at once (replay). */
  speak(text: string) {
    this.begin();
    this.end(text);
  }

  stop() {
    this.utt?.controller.abort();
    this.utt = null;
    this.releaseAudio();
    this.onSpeakingChange(false);
  }

  private finish(u: Utterance) {
    if (this.utt !== u) return;
    this.utt = null;
    this.onSpeakingChange(false);
  }

  private releaseAudio() {
    if (this.audio) {
      this.audio.onended = null;
      this.audio.onerror = null;
      this.audio.pause();
      this.audio = null;
    }
    if (this.url) {
      URL.revokeObjectURL(this.url);
      this.url = null;
    }
  }

  private enqueueReady(u: Utterance) {
    const pending = u.text.slice(u.consumed);
    // While streaming, only complete sentences are spoken.
    const cut = u.finished
      ? pending.length
      : Math.max(pending.lastIndexOf('. '), pending.lastIndexOf('? '), pending.lastIndexOf('! '), pending.lastIndexOf(': ')) + 1;
    if (cut <= 0) return;
    const ready = pending.slice(0, cut).trim();
    const isFirst = u.consumed === 0;
    if (!u.finished && isFirst && ready.length < MIN_FIRST_CHUNK) return;
    u.consumed += cut;
    if (ready) for (const c of chunkForSpeech(ready, isFirst ? 160 : 420)) u.queue.push({ text: c, audio: null });
    this.pump(u);
    void this.playNext(u);
  }

  private fetchChunk(text: string, previous: string, signal: AbortSignal): Promise<Blob | null> {
    const key = `${this.lang}|${text}`;
    const cached = audioCache.get(key);
    if (cached) return cached;
    const p = fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, previousText: previous || undefined, language: this.lang }),
      signal,
    })
      .then(async (res) => {
        if (res.status === 204 || !res.ok) {
          if (!res.ok) console.warn('TTS unavailable:', res.status);
          return null;
        }
        return res.blob();
      })
      .catch(() => null);
    void p.then((b) => {
      if (!b) audioCache.delete(key); // never cache failures
    });
    audioCache.set(key, p);
    return p;
  }

  private pump(u: Utterance) {
    let ahead = 0;
    for (const item of u.queue) {
      if (ahead >= PREFETCH) break;
      if (!item.audio) {
        item.audio = this.fetchChunk(item.text, u.previous, u.controller.signal);
        u.previous = item.text;
      }
      ahead++;
    }
  }

  private async playNext(u: Utterance) {
    if (this.utt !== u || u.playing) return;
    const item = u.queue[0];
    if (!item) {
      if (u.finished) this.finish(u);
      return;
    }
    u.playing = true;
    this.pump(u);
    const blob = await item.audio;
    if (this.utt !== u) return; // stopped meanwhile
    u.queue.shift();
    if (!blob) {
      this.finish(u); // voice not configured or failed: stay silent
      return;
    }
    this.releaseAudio();
    this.url = URL.createObjectURL(blob);
    const audio = new Audio(this.url);
    this.audio = audio;
    const next = () => {
      if (this.utt !== u) return;
      u.playing = false;
      void this.playNext(u);
    };
    audio.onended = next;
    audio.onerror = next;
    this.pump(u);
    try {
      await audio.play();
    } catch (err) {
      console.warn('Audio playback failed:', err); // e.g. autoplay blocked
      if (this.utt === u) this.stop();
    }
  }
}
