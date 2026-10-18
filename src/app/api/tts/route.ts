import { ttsRequestSchema } from '@/lib/validation';
import { clientIp, rateLimit, tooManyRequests } from '@/lib/rate-limit';
import { toSpeakableText } from '@/lib/tts-text';

export const runtime = 'nodejs';

/** Flash v2.5 is the fastest ElevenLabs model and one of the few that supports Vietnamese ('vi'). */
const DEFAULT_MODEL = 'eleven_flash_v2_5';
/** Default voice (Sarah). For native Vietnamese pronunciation set ELEVENLABS_VOICE_ID to a Vietnamese voice. */
const DEFAULT_VOICE = 'EXAVITQu4vr4xnSDxMaL';
/** 64 kbps is plenty for speech and half the bytes of the 128 kbps default, so playback starts sooner. */
const OUTPUT_FORMAT = 'mp3_44100_64';

export async function POST(req: Request) {
  // The client sends one request per sentence group, so the limit is per chunk.
  const limit = rateLimit(`tts:${clientIp(req)}`, 45, 60_000);
  if (!limit.ok) return tooManyRequests(limit.retryAfterSeconds);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Yêu cầu không hợp lệ.' }, { status: 400 });
  }

  const parsed = ttsRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: 'Văn bản trống hoặc quá dài.' }, { status: 400 });
  }

  const apiKey = process.env.ELEVENLABS_API_KEY?.trim();
  if (!apiKey) {
    // Voice is optional: 204 tells the client to stay in text-only mode.
    return new Response(null, { status: 204 });
  }

  const language = parsed.data.language === 'en' ? 'en' : 'vi';
  // Normalised again on the server so markdown / English card names never reach the voice.
  const text = toSpeakableText(parsed.data.text, language === 'vi');
  if (!text) return new Response(null, { status: 204 });
  const previousText = parsed.data.previousText ? toSpeakableText(parsed.data.previousText, language === 'vi').slice(-300) : undefined;

  const voiceId = process.env.ELEVENLABS_VOICE_ID?.trim() || DEFAULT_VOICE;
  const modelId = process.env.ELEVENLABS_MODEL_ID?.trim() || DEFAULT_MODEL;

  try {
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}/stream?output_format=${OUTPUT_FORMAT}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'xi-api-key': apiKey, 'content-type': 'application/json' },
      body: JSON.stringify({
        text,
        model_id: modelId,
        // Enforces Vietnamese pronunciation and number/date normalisation (supported by Flash/Turbo v2.5).
        language_code: language,
        // Context from the previous chunk keeps intonation continuous across chunks (not billed).
        ...(previousText ? { previous_text: previousText } : {}),
        // style > 0 adds latency (ElevenLabs docs); a slightly slower pace helps tonal clarity.
        voice_settings: { stability: 0.5, similarity_boost: 0.8, style: 0, use_speaker_boost: true, speed: 0.95 },
      }),
      signal: req.signal,
    });

    if (!response.ok || !response.body) {
      console.error('❌ ElevenLabs API error:', response.status, (await response.text().catch(() => '')).slice(0, 300));
      return Response.json({ error: 'Giọng đọc tạm thời không khả dụng.' }, { status: 502 });
    }

    return new Response(response.body, {
      headers: { 'Content-Type': 'audio/mpeg', 'Cache-Control': 'no-store' },
    });
  } catch (error: unknown) {
    if (req.signal.aborted) return new Response(null, { status: 499 });
    console.error('❌ TTS route error:', error);
    return Response.json({ error: 'Giọng đọc tạm thời không khả dụng.' }, { status: 502 });
  }
}
