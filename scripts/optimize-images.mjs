#!/usr/bin/env node
/**
 * Generates web-optimized WebP versions of the card images the app uses.
 *
 * Source:  public/cards/<deck>/<n>.jpg and public/cards/back.jpg (high-res scans, ~2.5 MB each)
 * Output:  public/cards/web/<deck>/<n>.webp and public/cards/web/back.webp (~600px wide, ~60-120 KB)
 *
 * Usage:   npm run images            (default deck: 1909)
 *          npm run images -- 1910    (other deck ids)
 */
import { readdir, mkdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CARDS_DIR = path.join(ROOT, 'public', 'cards');
const OUT_DIR = path.join(CARDS_DIR, 'web');
const WIDTH = 600;
const QUALITY = 80;

const decks = process.argv.slice(2).length ? process.argv.slice(2) : ['1909'];

async function convert(src, dest) {
  await sharp(src)
    .rotate()
    .resize({ width: WIDTH, withoutEnlargement: true })
    .webp({ quality: QUALITY, effort: 5 })
    .toFile(dest);
  const [a, b] = await Promise.all([stat(src), stat(dest)]);
  return { before: a.size, after: b.size };
}

async function main() {
  let totalBefore = 0;
  let totalAfter = 0;
  await mkdir(OUT_DIR, { recursive: true });

  const back = await convert(path.join(CARDS_DIR, 'back.jpg'), path.join(OUT_DIR, 'back.webp'));
  totalBefore += back.before;
  totalAfter += back.after;

  for (const deck of decks) {
    const srcDir = path.join(CARDS_DIR, deck);
    const outDir = path.join(OUT_DIR, deck);
    await mkdir(outDir, { recursive: true });
    const files = (await readdir(srcDir)).filter((f) => /\.jpe?g$/i.test(f));
    for (const file of files) {
      const name = file.replace(/\.jpe?g$/i, '.webp');
      const r = await convert(path.join(srcDir, file), path.join(outDir, name));
      totalBefore += r.before;
      totalAfter += r.after;
    }
    console.log(`✓ deck ${deck}: ${files.length} cards`);
  }

  const mb = (n) => (n / 1024 / 1024).toFixed(1) + ' MB';
  console.log(`Done. ${mb(totalBefore)} → ${mb(totalAfter)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
