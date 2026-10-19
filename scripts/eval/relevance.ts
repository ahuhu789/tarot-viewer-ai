/**
 * Cheap heuristic: does an answer refer back to the seeker's question?
 * Vietnamese words are multi-syllable, so we look for shared syllable pairs
 * ("nghỉ việc", "kinh doanh"); for English, shared content words.
 */
const VI_STOP = new Set(
  'tôi mình bạn em anh chị có không nên là và của cho với về này đó thì mà như được đang sẽ đã rồi gì nào sao thế làm một những các để trong khi hay hoặc nếu vậy ạ nhé à ơi lắm rất quá'.split(' '),
);
const EN_STOP = new Set('should would could what when where which about there their with from that this have will your into been being does over more than then they them very just'.split(' '));

function syllables(t: string): string[] {
  return t.toLowerCase().normalize('NFC').replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/).filter(Boolean);
}

export function questionReference(question: string, answer: string): boolean {
  const q = syllables(question);
  const a = syllables(answer);
  const aText = ` ${a.join(' ')} `;
  const isVi = /[ăâđêôơưạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ]/i.test(question);
  if (isVi) {
    for (let i = 0; i + 1 < q.length; i++) {
      if (VI_STOP.has(q[i]) && VI_STOP.has(q[i + 1])) continue;
      if (aText.includes(` ${q[i]} ${q[i + 1]} `)) return true;
    }
    return false;
  }
  const content = q.filter((w) => w.length >= 4 && !EN_STOP.has(w));
  const stems = content.map((w) => w.slice(0, 5));
  return stems.filter((s) => a.some((w) => w.startsWith(s))).length >= 1;
}
