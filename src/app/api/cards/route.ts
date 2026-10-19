import { loadTarotDeck } from '@/lib/csv-parser';
import { cardNameVi } from '@/data/card-names';
import { cardMeaningVi } from '@/data/card-meanings-vi';

export async function GET() {
  const deck = loadTarotDeck();
  if (!deck.length) {
    return Response.json({ error: 'Không tải được ý nghĩa lá bài.' }, { status: 500 });
  }
  // English data from the CSV plus the Vietnamese name and meanings for each card.
  const cards = deck.map((card) => ({
    ...card,
    cardNameVi: cardNameVi(card.cardNumber),
    meaningVi: cardMeaningVi(card.cardNumber),
  }));
  return Response.json({ cards }, { headers: { 'Cache-Control': 'public, max-age=3600' } });
}
