// Renders the galaxy card back (SVG → WebP, 600×1039) used everywhere a card is face-down.
// Run: node scripts/generate-card-back.mjs
import fs from 'node:fs';
import sharp from 'sharp';

const W = 600, H = 1039;
let seed = 7;
const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

const stars = Array.from({ length: 140 }, () => {
  const x = (30 + rand() * (W - 60)).toFixed(1);
  const y = (30 + rand() * (H - 60)).toFixed(1);
  const r = (rand() < 0.85 ? 0.6 + rand() * 1.0 : 1.6 + rand() * 1.2).toFixed(2);
  const o = (0.35 + rand() * 0.6).toFixed(2);
  const c = rand() < 0.15 ? '#f4d999' : rand() < 0.4 ? '#ddd2ff' : '#ffffff';
  return `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}" opacity="${o}"/>`;
}).join('');

// 8-pointed star path centred at (cx, cy)
const sparkle = (cx, cy, R, r) => {
  const pts = [];
  for (let i = 0; i < 16; i++) {
    const a = (Math.PI / 8) * i - Math.PI / 2;
    const rad = i % 2 === 0 ? (i % 4 === 0 ? R : R * 0.55) : r;
    pts.push(`${(cx + rad * Math.cos(a)).toFixed(1)},${(cy + rad * Math.sin(a)).toFixed(1)}`);
  }
  return `<polygon points="${pts.join(' ')}"/>`;
};

const cx = W / 2, cy = H / 2;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<defs>
  <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#1d1047"/><stop offset="0.55" stop-color="#0e0828"/><stop offset="1" stop-color="#070414"/>
  </linearGradient>
  <radialGradient id="neb1" cx="0.3" cy="0.3" r="0.55"><stop offset="0" stop-color="#7c3aed" stop-opacity="0.55"/><stop offset="1" stop-color="#7c3aed" stop-opacity="0"/></radialGradient>
  <radialGradient id="neb2" cx="0.75" cy="0.75" r="0.5"><stop offset="0" stop-color="#4f46e5" stop-opacity="0.45"/><stop offset="1" stop-color="#4f46e5" stop-opacity="0"/></radialGradient>
  <radialGradient id="halo" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#c4b5fd" stop-opacity="0.45"/><stop offset="1" stop-color="#c4b5fd" stop-opacity="0"/></radialGradient>
  <radialGradient id="moon" cx="0.38" cy="0.35" r="0.75"><stop offset="0" stop-color="#fbf7ff"/><stop offset="0.5" stop-color="#d9ccff"/><stop offset="1" stop-color="#8b5cf6"/></radialGradient>
  <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f7e3ae"/><stop offset="1" stop-color="#c9a24f"/></linearGradient>
</defs>
<rect width="${W}" height="${H}" rx="28" fill="url(#bg)"/>
<rect width="${W}" height="${H}" rx="28" fill="url(#neb1)"/>
<rect width="${W}" height="${H}" rx="28" fill="url(#neb2)"/>
${stars}
<rect x="22" y="22" width="${W - 44}" height="${H - 44}" rx="20" fill="none" stroke="url(#gold)" stroke-width="3" opacity="0.85"/>
<rect x="36" y="36" width="${W - 72}" height="${H - 72}" rx="14" fill="none" stroke="#c4b5fd" stroke-width="1.5" opacity="0.5"/>
<g fill="url(#gold)" opacity="0.9">${sparkle(36, 36, 16, 4)}${sparkle(W - 36, 36, 16, 4)}${sparkle(36, H - 36, 16, 4)}${sparkle(W - 36, H - 36, 16, 4)}</g>
<circle cx="${cx}" cy="${cy}" r="190" fill="url(#halo)"/>
<circle cx="${cx}" cy="${cy}" r="150" fill="none" stroke="#c4b5fd" stroke-width="1.5" stroke-dasharray="4 10" opacity="0.7"/>
<circle cx="${cx}" cy="${cy}" r="118" fill="none" stroke="url(#gold)" stroke-width="2" opacity="0.8"/>
<g fill="#ddd2ff" opacity="0.85">${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => { const a = (Math.PI / 4) * i; return `<circle cx="${(cx + 150 * Math.cos(a)).toFixed(1)}" cy="${(cy + 150 * Math.sin(a)).toFixed(1)}" r="4"/>`; }).join('')}</g>
<path d="M ${cx + 22} ${cy - 78} A 80 80 0 1 0 ${cx + 22} ${cy + 78} A 64 64 0 1 1 ${cx + 22} ${cy - 78} Z" fill="url(#moon)"/>
<g fill="url(#gold)">${sparkle(cx + 40, cy, 44, 9)}</g>
<g fill="url(#gold)" opacity="0.9">${sparkle(cx, cy - 250, 26, 6)}${sparkle(cx, cy + 250, 26, 6)}</g>
<line x1="${cx}" y1="${cy - 214}" x2="${cx}" y2="${cy - 168}" stroke="#c4b5fd" stroke-width="1.5" opacity="0.6"/>
<line x1="${cx}" y1="${cy + 168}" x2="${cx}" y2="${cy + 214}" stroke="#c4b5fd" stroke-width="1.5" opacity="0.6"/>
</svg>`;

fs.writeFileSync(new URL('../public/cards/back-galaxy.svg', import.meta.url), svg);
await sharp(Buffer.from(svg)).webp({ quality: 86 }).toFile(new URL('../public/cards/web/back-galaxy.webp', import.meta.url).pathname);
console.log('back-galaxy.webp', (fs.statSync(new URL('../public/cards/web/back-galaxy.webp', import.meta.url)).size / 1024).toFixed(1), 'KB');
