import Link from 'next/link';

export default function Home() {
  return (
    <main className="landing">
      <div aria-hidden="true">
        <div className="starfield-ambient" />
        <div className="candle-glow-left" />
        <div className="candle-glow-right" />
      </div>

      <div className="welcome-section">
        <div className="landing__sigil" aria-hidden="true">
          ✦
        </div>
        <h1 className="landing__title">TAROT SANCTUARY</h1>
        <p className="landing__intro">
          A quiet space for contemplation.
          <br />
          Pause, clear your mind, and ask the cards for clarity.
        </p>
        <p className="landing__hint">Speak in your own language — the cards will understand.</p>
        <Link href="/reading" className="btn-gold landing__cta">
          Enter the Sanctuary
        </Link>
      </div>
    </main>
  );
}
