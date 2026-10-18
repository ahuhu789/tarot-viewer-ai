import { randomInt } from 'node:crypto';
import { DrawnCard } from '@/types/tarot';
import { SPREADS } from '@/data/spreads';
import { drawRequestSchema } from '@/lib/validation';
import { clientIp, rateLimit, tooManyRequests } from '@/lib/rate-limit';

export async function POST(req: Request) {
  const limit = rateLimit(`draw:${clientIp(req)}`, 30, 60_000);
  if (!limit.ok) return tooManyRequests(limit.retryAfterSeconds);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const parsed = drawRequestSchema.safeParse(body);
  const spread = parsed.success ? SPREADS[parsed.data.spreadId] : undefined;
  if (!spread) {
    return Response.json({ error: 'Invalid spread selection.' }, { status: 400 });
  }

  const chosen = new Set<number>();
  const drawn: DrawnCard[] = [];
  while (drawn.length < spread.positions.length) {
    const cardNumber = randomInt(78);
    if (chosen.has(cardNumber)) continue;
    chosen.add(cardNumber);
    drawn.push({
      cardNumber,
      isReversed: randomInt(10) < 3, // 30% chance of a reversed card
      positionIndex: drawn.length,
      isRevealed: false,
    });
  }

  return Response.json({ drawnCards: drawn });
}
