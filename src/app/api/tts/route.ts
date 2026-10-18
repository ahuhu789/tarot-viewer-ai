import { ttsRequestSchema } from '@/lib/validation';
import { clientIp, rateLimit, tooManyRequests } from '@/lib/rate-limit';

export async function POST(req: Request) {
  const limit = rateLimit(`tts:${clientIp(req)}`, 12, 60_000);
  if (!limit.ok) return tooManyRequests(limit.retryAfterSeconds);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const parsed = ttsRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: 'Text is missing or too long.' }, { status: 400 });
  }

  const apiKey = process.env.ELEVENLABS_API_KEY?.trim();
  if (!apiKey) {
    // Voice is optional: 204 tells the client to stay in text-only mode.
    return new Response(null, { status: 204 });
  }

  // Default warm/expressive voice (Bella - EXAVITQu4vr4xnSDxMaL)
  const voiceId = process.env.ELEVENLABS_VOICE_ID || 'EXAVITQu4vr4xnSDxMaL';

  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`, {
      method: 'POST',
      headers: { 'xi-api-key': apiKey, 'content-type': 'application/json' },
      body: JSON.stringify({
        text: parsed.data.text,
        model_id: 'eleven_flash_v2_5',
        voice_settings: { stability: 0.45, similarity_boost: 0.75, style: 0.6, use_speaker_boost: true },
      }),
      signal: req.signal,
    });

    if (!response.ok || !response.body) {
      console.error('❌ ElevenLabs API error:', response.status, await response.text().catch(() => ''));
      return Response.json({ error: 'Voice is unavailable right now.' }, { status: 502 });
    }

    return new Response(response.body, {
      headers: { 'Content-Type': 'audio/mpeg', 'Cache-Control': 'no-store' },
    });
  } catch (error: unknown) {
    console.error('❌ TTS route error:', error);
    return Response.json({ error: 'Voice is unavailable right now.' }, { status: 502 });
  }
}
