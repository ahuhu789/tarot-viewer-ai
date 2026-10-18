import { loadTarotDeck } from '@/lib/csv-parser';

export async function GET() {
  const deck = loadTarotDeck();
  if (!deck.length) {
    return Response.json({ error: 'Card meanings are unavailable.' }, { status: 500 });
  }
  return Response.json(
    { cards: deck },
    { headers: { 'Cache-Control': 'public, max-age=3600' } },
  );
}
