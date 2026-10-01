import { NextResponse } from 'next/server';
import { loadTarotDeck } from '@/lib/csv-parser';

export async function GET() {
  try {
    const deck = loadTarotDeck();
    return NextResponse.json({ cards: deck });
  } catch (error) {
    console.error('❌ Failed to load cards list:', error);
    return NextResponse.json({ error: 'Failed to load card meanings' }, { status: 500 });
  }
}
