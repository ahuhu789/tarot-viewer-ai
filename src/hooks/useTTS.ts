'use client';

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';

const STORAGE_KEY = 'tarot_voice_enabled';
const MAX_TTS_CHARS = 2500;

// --- Voice preference as an external store (no setState-in-effect, SSR safe) ---
const prefListeners = new Set<() => void>();

function subscribePref(listener: () => void) {
  prefListeners.add(listener);
  window.addEventListener('storage', listener);
  return () => {
    prefListeners.delete(listener);
    window.removeEventListener('storage', listener);
  };
}

function readPref(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

function writePref(value: boolean) {
  try {
    window.localStorage.setItem(STORAGE_KEY, String(value));
  } catch {
    /* storage unavailable (private mode) */
  }
  prefListeners.forEach((l) => l());
}

/** Strips markdown so the voice does not read out asterisks and hashes. */
function toSpeakableText(text: string): string {
  return text
    .replace(/[*_`#>]+/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_TTS_CHARS);
}

export function useTTS() {
  const voiceEnabled = useSyncExternalStore(subscribePref, readPref, () => false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);
  const fetchRef = useRef<AbortController | null>(null);

  const stopSpeaking = useCallback(() => {
    fetchRef.current?.abort();
    fetchRef.current = null;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }
    setIsSpeaking(false);
  }, []);

  const speak = useCallback(
    async (text: string) => {
      const speakable = toSpeakableText(text);
      if (!readPref() || !speakable) return;

      stopSpeaking();
      const controller = new AbortController();
      fetchRef.current = controller;
      setIsSpeaking(true);

      try {
        const res = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: speakable }),
          signal: controller.signal,
        });

        if (res.status === 204 || !res.ok) {
          // 204: voice not configured on the server — stay in text mode silently.
          if (!res.ok) console.warn('TTS unavailable:', res.status);
          setIsSpeaking(false);
          return;
        }

        const blob = await res.blob();
        if (controller.signal.aborted) return;
        const url = URL.createObjectURL(blob);
        urlRef.current = url;
        const audio = new Audio(url);
        audioRef.current = audio;
        const done = () => {
          if (audioRef.current === audio) stopSpeaking();
        };
        audio.onended = done;
        audio.onerror = done;
        await audio.play();
      } catch (err) {
        if (controller.signal.aborted) return;
        console.error('❌ Error playing TTS audio:', err);
        setIsSpeaking(false);
      }
    },
    [stopSpeaking],
  );

  const toggleVoice = useCallback(() => {
    const next = !readPref();
    writePref(next);
    if (!next) stopSpeaking();
  }, [stopSpeaking]);

  // Stop audio when the component using the hook unmounts.
  useEffect(() => stopSpeaking, [stopSpeaking]);

  return { voiceEnabled, isSpeaking, toggleVoice, speak, stopSpeaking };
}
