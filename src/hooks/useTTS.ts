'use client';

import { useState, useEffect, useRef } from 'react';

export function useTTS() {
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Load user preference on mount
  useEffect(() => {
    const saved = localStorage.getItem('tarot_voice_enabled');
    if (saved) {
      setVoiceEnabled(saved === 'true');
    }
  }, []);

  const toggleVoice = () => {
    setVoiceEnabled((prev) => {
      const next = !prev;
      localStorage.setItem('tarot_voice_enabled', String(next));
      if (!next) {
        stopSpeaking();
      }
      return next;
    });
  };

  const speak = async (text: string) => {
    if (!voiceEnabled || !text) return;

    // Stop current playback
    stopSpeaking();

    setIsSpeaking(true);

    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      if (res.status === 204) {
        // ElevenLabs key is not set
        setIsSpeaking(false);
        return;
      }

      if (!res.ok) {
        throw new Error('Failed to fetch TTS audio');
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      const audio = new Audio(url);
      audioRef.current = audio;

      audio.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(url);
      };

      audio.onerror = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(url);
      };

      await audio.play();
    } catch (err) {
      console.error('❌ Error playing TTS audio:', err);
      setIsSpeaking(false);
    }
  };

  const stopSpeaking = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setIsSpeaking(false);
    }
  };

  return {
    voiceEnabled,
    isSpeaking,
    toggleVoice,
    speak,
    stopSpeaking,
  };
}
