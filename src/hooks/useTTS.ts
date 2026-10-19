'use client';

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { SpeechQueue } from '@/lib/speech-queue';

const STORAGE_KEY = 'tarot_voice_enabled';

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

/**
 * Voice for the reader. Replies are spoken while they stream: playback starts
 * after the first sentence (see SpeechQueue) instead of after the whole reply
 * and its whole audio file have been downloaded.
 */
export function useTTS(language: 'vi' | 'en' = 'vi') {
  const voiceEnabled = useSyncExternalStore(subscribePref, readPref, () => false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [queue] = useState(() => new SpeechQueue(setIsSpeaking));

  useEffect(() => {
    queue.setLanguage(language);
  }, [queue, language]);

  const stopSpeaking = useCallback(() => queue.stop(), [queue]);

  const beginStream = useCallback(() => {
    if (readPref()) queue.begin();
  }, [queue]);
  const updateStream = useCallback((text: string) => queue.update(text), [queue]);
  const endStream = useCallback((text: string) => queue.end(text), [queue]);

  const speak = useCallback(
    (text: string) => {
      if (readPref() && text) queue.speak(text);
    },
    [queue],
  );

  const toggleVoice = useCallback(() => {
    const next = !readPref();
    writePref(next);
    if (!next) queue.stop();
  }, [queue]);

  // Stop audio when the component using the hook unmounts.
  useEffect(() => () => queue.stop(), [queue]);

  return { voiceEnabled, isSpeaking, toggleVoice, speak, stopSpeaking, beginStream, updateStream, endStream };
}
