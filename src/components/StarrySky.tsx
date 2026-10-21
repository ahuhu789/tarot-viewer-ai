import React from 'react';

/** Hand-placed sparkling stars (small elements: cheap to animate). [x%, y%, delay s, size] */
const SPARKLES: [number, number, number, number][] = [
  [8, 14, 0, 1], [21, 32, -1.4, 0.7], [33, 9, -2.6, 0.8], [46, 22, -0.8, 0.6], [61, 12, -3.3, 1],
  [74, 28, -1.9, 0.7], [88, 10, -4.1, 0.9], [93, 41, -2.2, 0.6], [12, 56, -3.7, 0.8], [27, 74, -0.5, 0.6],
  [82, 63, -2.9, 1], [67, 84, -1.1, 0.7], [41, 88, -3.9, 0.6], [5, 86, -2.4, 0.9], [55, 47, -4.6, 0.5],
];

interface StarrySkyProps {
  /**
   * "full": home page (twinkling layers, parallax drift, shooting stars, drifting nebula).
   * "subtle": reading room (same sky, dimmer and almost still, so it never competes with the text).
   */
  variant?: 'full' | 'subtle';
}

/**
 * Pure-CSS night sky: star fields are static box-shadows (src/app/stars.generated.css),
 * motion is CSS keyframes on transform/opacity only. Decorative, hidden from assistive tech.
 */
export function StarrySky({ variant = 'full' }: StarrySkyProps) {
  const full = variant === 'full';
  return (
    <div className={`sky sky--${variant}`} aria-hidden="true">
      <div className="sky__nebula sky__nebula--a" />
      <div className="sky__nebula sky__nebula--b" />
      <div className="sky__nebula sky__nebula--c" />
      <div className="sky__layer sky__layer--far">
        <span className="sky__milkyway" />
        <span className="stars stars--tiny stars--m1" />
        <span className="stars stars--tiny stars--m2" />
        <span className="stars stars--tiny stars--t1" />
        <span className="stars stars--tiny stars--t2" />
        <span className="stars stars--tiny stars--t3" />
        <span className="stars stars--tiny stars--t4" />
      </div>
      <div className="sky__layer sky__layer--near">
        <span className="stars stars--small stars--s1" />
        <span className="stars stars--small stars--s2" />
        <span className="stars stars--small stars--s3" />
        <span className="stars stars--bright stars--b1" />
        <span className="stars stars--bright stars--b2" />
      </div>
      <div className="sky__sparkles">
        {(full ? SPARKLES : SPARKLES.slice(0, 6)).map(([x, y, d, size], i) => (
          <span
            key={i}
            className="sparkle"
            style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${d}s`, ['--s' as string]: size } as React.CSSProperties}
          />
        ))}
      </div>
      {full && (
        <div className="sky__meteors">
          <span className="meteor meteor--1" />
          <span className="meteor meteor--2" />
          <span className="meteor meteor--3" />
        </div>
      )}
      <div className="sky__vignette" />
    </div>
  );
}
