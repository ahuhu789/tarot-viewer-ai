import { NextResponse } from 'next/server';
import { SpreadId, DrawnCard } from '@/types/tarot';
import { SPREADS } from '@/data/spreads';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { spreadId } = body as { spreadId: SpreadId };

    const spread = SPREADS[spreadId];
    if (!spread) {
      return NextResponse.json({ error: 'Invalid spread selection' }, { status: 400 });
    }

    const totalCardsToDraw = spread.positions.length;
    const drawn: DrawnCard[] = [];
    const chosenIndices = new Set<number>();

    while (drawn.length < totalCardsToDraw) {
      const cardNum = Math.floor(Math.random() * 78);
      if (!chosenIndices.has(cardNum)) {
        chosenIndices.add(cardNum);
        
        // 30% chance for a card to be reversed
        const isReversed = Math.random() > 0.7;

        drawn.push({
          cardNumber: cardNum,
          isReversed,
          positionIndex: drawn.length,
          isRevealed: false,
        });
      }
    }

    return NextResponse.json({ drawnCards: drawn });
  } catch (error) {
    console.error('❌ Error drawing cards:', error);
    return NextResponse.json({ error: 'Failed to draw cards' }, { status: 500 });
  }
}
