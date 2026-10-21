import Link from 'next/link';
import { StarrySky } from '@/components/StarrySky';

const FEATURES = [
  { icon: '✦', text: '78 lá Rider–Waite' },
  { icon: '☾', text: 'Giải bài theo đúng câu hỏi của bạn' },
  { icon: '♪', text: 'Giọng đọc tiếng Việt' },
];

export default function Home() {
  return (
    <main className="landing">
      <StarrySky variant="full" />

      <div className="hero">
        <div className="hero__orbit" aria-hidden="true">
          <span className="hero__ring hero__ring--outer" />
          <span className="hero__ring hero__ring--inner" />
          <span className="hero__moon" />
          <span className="hero__planet" />
        </div>

        <p className="hero__eyebrow">✦ Phòng đọc bài Tarot cùng AI ✦</p>
        <h1 className="hero__title">
          Tarot <span className="hero__title-accent">Sanctuary</span>
        </h1>
        <p className="hero__tagline">
          Dưới bầu trời đầy sao, hãy lắng lòng và hỏi điều bạn đang trăn trở.
          <br className="hero__br" /> Các lá bài sẽ soi sáng con đường phía trước.
        </p>

        <Link href="/reading" className="btn-primary btn-primary--glow hero__cta">
          Bước vào phòng đọc bài <span aria-hidden="true">✦</span>
        </Link>
        <p className="hero__hint">Trò chuyện bằng tiếng Việt hoặc tiếng Anh · You can also write in English.</p>

        <ul className="hero__features" aria-label="Điểm nổi bật">
          {FEATURES.map((f) => (
            <li key={f.text} className="hero__feature">
              <span className="hero__feature-icon" aria-hidden="true">
                {f.icon}
              </span>
              {f.text}
            </li>
          ))}
        </ul>
      </div>

      <footer className="landing__footer">Tarot là tấm gương để chiêm nghiệm, không phải lời phán định mệnh.</footer>
    </main>
  );
}
