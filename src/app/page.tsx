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
          Một không gian tĩnh lặng để chiêm nghiệm.
          <br />
          Dừng lại, thả lỏng tâm trí và hỏi các lá bài để nhìn rõ hơn.
        </p>
        <p className="landing__hint">Bạn có thể trò chuyện bằng tiếng Việt hoặc tiếng Anh · You can also write in English.</p>
        <Link href="/reading" className="btn-gold landing__cta">
          Bước vào phòng đọc bài
        </Link>
      </div>
    </main>
  );
}
