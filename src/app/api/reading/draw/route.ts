import { randomInt } from 'node:crypto';
import { SPREADS } from '@/data/spreads';
import { drawRequestSchema } from '@/lib/validation';
import { drawCards } from '@/lib/draw';
import { clientIp, rateLimit, tooManyRequests } from '@/lib/rate-limit';

export async function POST(req: Request) {
  const limit = rateLimit(`draw:${clientIp(req)}`, 30, 60_000);
  if (!limit.ok) return tooManyRequests(limit.retryAfterSeconds);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Yêu cầu không hợp lệ.' }, { status: 400 });
  }

  const parsed = drawRequestSchema.safeParse(body);
  const spread = parsed.success ? SPREADS[parsed.data.spreadId] : undefined;
  if (!parsed.success || !spread) {
    return Response.json({ error: 'Kiểu trải bài hoặc lá đã chọn không hợp lệ.' }, { status: 400 });
  }
  const picks = parsed.data.picks;
  if (picks && picks.length !== spread.positions.length) {
    return Response.json(
      { error: `Cần chọn đúng ${spread.positions.length} lá cho kiểu trải bài này.` },
      { status: 400 },
    );
  }

  // Cryptographic randomness; the deck is shuffled server-side so the client cannot choose cards.
  const drawnCards = drawCards(spread.positions.length, (max) => randomInt(max), picks);
  return Response.json({ drawnCards }, { headers: { 'Cache-Control': 'no-store' } });
}
