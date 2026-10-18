/**
 * Minimal in-memory sliding-window rate limiter (per IP, per route).
 *
 * Good enough for a single Node instance / thesis demo. For multi-instance
 * deployments (e.g. Vercel with many lambdas) swap this for a shared store
 * such as Upstash Redis.
 */
type Bucket = number[];

const buckets = new Map<string, Bucket>();
let lastSweep = Date.now();

export interface RateLimitResult {
  ok: boolean;
  retryAfterSeconds: number;
}

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const cutoff = now - windowMs;

  // Periodically drop idle keys so the map cannot grow without bound.
  if (now - lastSweep > 60_000) {
    for (const [k, hits] of buckets) {
      if (!hits.length || hits[hits.length - 1] < cutoff) buckets.delete(k);
    }
    lastSweep = now;
  }

  const hits = (buckets.get(key) ?? []).filter((t) => t > cutoff);
  if (hits.length >= limit) {
    buckets.set(key, hits);
    return { ok: false, retryAfterSeconds: Math.max(1, Math.ceil((hits[0] + windowMs - now) / 1000)) };
  }
  hits.push(now);
  buckets.set(key, hits);
  return { ok: true, retryAfterSeconds: 0 };
}

export function clientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.headers.get('x-real-ip') ?? 'local';
}

export function tooManyRequests(retryAfterSeconds: number): Response {
  return Response.json(
    { error: 'Too many requests. Please wait a moment and try again.' },
    { status: 429, headers: { 'Retry-After': String(retryAfterSeconds) } },
  );
}
