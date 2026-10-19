import { describe, expect, it } from 'vitest';
import { findCardMentions, foreignMentions, repairCardNames } from '@/lib/card-guard';
import { chunkForSpeech, toSpeakableText } from '@/lib/tts-text';
import { detectLanguage } from '@/lib/language';
import { isYesNoQuestion, questionTopic } from '@/lib/question-topic';
import { questionReference } from '../../scripts/eval/relevance';

describe('card-guard', () => {
  it('finds Vietnamese and English names, longest first', () => {
    const m = findCardMentions('Lá Mặt Trời (The Sun) rồi tới Mặt Trăng.');
    expect(m.map((x) => x.cardNumber)).toEqual([19, 19, 18]);
  });

  it('does not match a shorter name inside a longer one', () => {
    // "Vua Cốc" must not also count as a Cups pip or anything else.
    const m = findCardMentions('Vua Cốc xuất hiện.');
    expect(m).toHaveLength(1);
  });

  it('reports and repairs cards outside the spread', () => {
    const text = 'Lá Mặt Trăng cho thấy bạn đang mơ hồ.';
    expect(foreignMentions(text, [19]).map((m) => m.cardNumber)).toEqual([18]);
    expect(repairCardNames(text, 19, [19])).toBe('Lá Mặt Trời cho thấy bạn đang mơ hồ.');
    expect(repairCardNames('Mặt Trời sáng.', 19, [19])).toBe('Mặt Trời sáng.');
  });
});

describe('tts-text', () => {
  it('drops markdown and keeps the words', () => {
    const out = toSpeakableText('### 1/3 · Quá khứ — Mặt Trời\n\n**Ánh sáng** đang tới.');
    expect(out).not.toMatch(/[#*]/);
    expect(out).toContain('Ánh sáng đang tới');
  });

  it('chunks long text with a short first chunk', () => {
    const text = Array.from({ length: 30 }, (_, i) => `Câu thứ ${i} khá dài để kiểm tra việc chia đoạn.`).join(' ');
    const chunks = chunkForSpeech(text);
    expect(chunks.length).toBeGreaterThan(2);
    expect(chunks[0].length).toBeLessThanOrEqual(160);
    for (const c of chunks) expect(c.length).toBeLessThanOrEqual(420);
    expect(chunks.join(' ').replace(/\s+/g, ' ')).toBe(text);
  });
});

describe('language + question topic', () => {
  it('detects Vietnamese and English locally', () => {
    expect(detectLanguage('Mình có nên đổi việc không?')).toBe('Vietnamese');
    expect(detectLanguage('Should I move abroad next year?')).toBe('English');
  });

  it('classifies the question topic with whole words', () => {
    expect(questionTopic('Người yêu cũ có quay lại với mình không?')).toBe('love');
    expect(questionTopic('Mình có nên nghỉ việc để khởi nghiệp không?')).toBe('career');
    expect(questionTopic('Mình nên làm gì để bình tâm hơn?')).toBe('general');
    expect(questionTopic('Will my ex come back?')).toBe('love');
    // "không" contains "ôn" and "thích" contains "thi": no false career match.
    expect(questionTopic('Anh ấy có thích mình không?')).not.toBe('career');
  });

  it('recognises yes/no questions', () => {
    expect(isYesNoQuestion('Mình có nên đổi việc không?')).toBe(true);
    expect(isYesNoQuestion('Should I take the offer?')).toBe(true);
    expect(isYesNoQuestion('Điều gì đang cản trở mình?')).toBe(false);
  });
});

describe('eval relevance heuristic', () => {
  it('sees the question in a related answer and not in an unrelated one', () => {
    const q = 'Mình có nên nghỉ việc để khởi nghiệp không?';
    expect(questionReference(q, 'Lá này cho thấy việc khởi nghiệp cần chuẩn bị tài chính trước khi nghỉ việc.')).toBe(true);
    expect(questionReference(q, 'Hôm nay trời đẹp, hãy đi dạo.')).toBe(false);
  });
});
