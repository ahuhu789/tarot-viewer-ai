import fs from 'fs';
import path from 'path';
import { TarotCard } from '@/types/tarot';

function parseCSV(csvText: string): string[][] {
  const result: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        cell += '"';
        i++; // skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push(cell.trim());
      cell = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') i++;
      row.push(cell.trim());
      result.push(row);
      row = [];
      cell = '';
    } else {
      cell += char;
    }
  }
  if (row.length > 0 || cell) {
    row.push(cell.trim());
    result.push(row);
  }
  return result;
}

let cachedCards: TarotCard[] | null = null;

export function loadTarotDeck(): TarotCard[] {
  if (cachedCards) return cachedCards;

  try {
    const csvPath = path.join(process.cwd(), 'tarot meaning', 'tarot_card_meanings.csv');
    const csvText = fs.readFileSync(csvPath, 'utf-8');
    const rows = parseCSV(csvText);

    // Filter out header row if present
    const dataRows = rows.slice(1).filter((r) => r.length >= 10);

    const cards: TarotCard[] = dataRows.map((cols) => {
      const cardNumber = parseInt(cols[0], 10);
      return {
        cardNumber,
        cardName: cols[1] || '',
        arcana: (cols[2] as 'Major' | 'Minor') || 'Major',
        suit: cols[3] || '',
        element: cols[4] || '',
        uprightMeaning: cols[5] || '',
        reversedMeaning: cols[6] || '',
        loveMeaning: cols[7] || '',
        careerMeaning: cols[8] || '',
        yesOrNo: cols[9] || '',
        zodiacSign: cols[10] || '',
        guideUrl: cols[11] || '',
      };
    });

    // Sort by card number to be absolutely safe
    cards.sort((a, b) => a.cardNumber - b.cardNumber);

    cachedCards = cards;
    return cards;
  } catch (error) {
    console.error('❌ Failed to load tarot card meanings CSV:', error);
    return [];
  }
}

export function getCardByNumber(cardNumber: number): TarotCard | undefined {
  const deck = loadTarotDeck();
  return deck.find((c) => c.cardNumber === cardNumber);
}
