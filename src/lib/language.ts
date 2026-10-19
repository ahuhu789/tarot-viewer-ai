/**
 * Local language detection: no AI call. Vietnamese is recognised from its
 * diacritics or, when typed without accents, from very common words.
 */
const VIETNAMESE_CHARS = /[ăâđêôơưạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ]/i;
const VIETNAMESE_WORDS = /\b(toi|minh|ban|em|anh|chi|co|khong|nen|lam|viec|tinh|yeu|cong|nguoi|duoc|muon|hoi|gi|nao|sao|nhu|cua|va|voi|cho|ve|nay|la|se|da|dang|chua)\b/gi;
const ENGLISH_WORDS = /\b(i|my|me|the|is|are|should|what|how|will|my|about|love|job|work|career|and|do|does|can|to|of|in|for)\b/gi;

export function detectLanguage(text: string): string {
  const t = text.trim();
  if (!t || VIETNAMESE_CHARS.test(t)) return 'Vietnamese';
  const vi = t.match(VIETNAMESE_WORDS)?.length ?? 0;
  const en = t.match(ENGLISH_WORDS)?.length ?? 0;
  if (en > vi) return 'English';
  if (vi > 0 || /^[\x00-\x7F]*$/.test(t)) return 'Vietnamese';
  // Other scripts: let the model mirror the seeker.
  return "the same language as the seeker's last message";
}
