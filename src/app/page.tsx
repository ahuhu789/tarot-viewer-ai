'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  return (
    <main style={styles.container}>
      <div className="starfield-ambient" />
      <div className="candle-glow-left" />
      <div className="candle-glow-right" />

      <div style={styles.content} className="welcome-section">
        <div style={styles.sigil}>✦</div>
        <h1 style={styles.mainTitle}>TAROT SANCTUARY</h1>
        <p style={styles.introText}>
          A quiet space for contemplation.<br />
          Pause, clear your mind, and ask the cards for clarity.
        </p>
        <p style={styles.langHint}>
          Speak in your own language — the cards will understand.
        </p>
        <button onClick={() => router.push('/reading')} className="btn-gold" style={styles.btn}>
          Enter the Sanctuary
        </button>
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'relative',
    minHeight: '100vh',
    width: '100vw',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    padding: '1.5rem',
  },
  content: {
    zIndex: 10,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    maxWidth: '650px',
  },
  sigil: {
    fontSize: '3rem',
    color: 'var(--gold-primary)',
    marginBottom: '1.5rem',
    textShadow: '0 0 30px rgba(230, 194, 98, 0.4)',
    animation: 'goldPulse 3s infinite alternate',
  },
  mainTitle: {
    fontSize: '2.8rem',
    fontWeight: '900',
    letterSpacing: '0.3em',
    marginBottom: '1rem',
    textAlign: 'center',
    lineHeight: '1.2',
  },
  introText: {
    fontFamily: 'var(--font-body)',
    fontSize: '1.35rem',
    color: 'var(--text-primary)',
    marginBottom: '1rem',
    lineHeight: '1.6',
  },
  langHint: {
    fontFamily: 'var(--font-ui)',
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
    marginBottom: '2.5rem',
    letterSpacing: '0.05em',
  },
  btn: {
    fontSize: '0.9rem',
    padding: '0.9rem 3rem',
  },
};
