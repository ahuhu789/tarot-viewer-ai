import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { CARD_NAMES_EN, CARD_NAMES_VI, cardDisplayName, cardNameVi } from '@/data/card-names';
import { CARD_MEANINGS_VI, cardMeaningVi } from '@/data/card-meanings-vi';
import { loadTarotDeck } from '@/lib/csv-parser';
import { SPREADS } from '@/data/spreads';
import { cardImageUrl } from '@/lib/cards';

describe('card names', () => {
  it('has 78 unique English and Vietnamese names', () => {
    expect(CARD_NAMES_EN).toHaveLength(78);
    expect(CARD_NAMES_VI).toHaveLength(78);
    expect(new Set(CARD_NAMES_EN).size).toBe(78);
    expect(new Set(CARD_NAMES_VI).size).toBe(78);
  });

  it('matches the card names in the CSV deck (index = card number)', () => {
    const deck = loadTarotDeck();
    expect(deck).toHaveLength(78);
    for (const card of deck) expect(CARD_NAMES_EN[card.cardNumber]).toBe(card.cardName);
  });

  it('uses the agreed Vietnamese names', () => {
    expect(cardNameVi(0)).toBe('Chàng Khờ');
    expect(cardNameVi(19)).toBe('Mặt Trời');
    expect(cardDisplayName(19)).toContain('The Sun');
  });

  it('has the image file for every card', () => {
    for (let n = 0; n < 78; n++) {
      const file = path.join(process.cwd(), 'public', cardImageUrl(n));
      expect(fs.existsSync(file), file).toBe(true);
    }
  });
});

describe('Vietnamese meanings', () => {
  it('has four non-empty fields for all 78 cards', () => {
    expect(CARD_MEANINGS_VI).toHaveLength(78);
    for (let n = 0; n < 78; n++) {
      const m = cardMeaningVi(n)!;
      for (const v of [m.upright, m.reversed, m.love, m.career]) expect(v.trim().length).toBeGreaterThan(5);
    }
    expect(cardMeaningVi(78)).toBeUndefined();
  });
});

describe('spreads', () => {
  it('every position has Vietnamese and English name + description', () => {
    for (const spread of Object.values(SPREADS)) {
      expect(spread.positions.length).toBeGreaterThan(0);
      for (const p of spread.positions) {
        expect(p.name && p.nameEn && p.description && p.descriptionEn).toBeTruthy();
      }
    }
  });

  it('three-card spread reads past → present → future', () => {
    expect(SPREADS.three.positions.map((p) => p.nameEn)).toEqual(['Past', 'Present', 'Future']);
  });
});
