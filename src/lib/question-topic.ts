/**
 * Very small keyword classifier for the seeker's question. Only the card data
 * relevant to the question is sent to the model: fewer tokens and less material
 * to wander off into (e.g. no love meanings for a career question).
 */
export type QuestionTopic = 'love' | 'career' | 'general';

/** Whole-word match (Vietnamese letters included) so "ôn" does not match inside "không". */
const words = (list: string[]) => new RegExp(`(?<!\\p{L})(${list.join('|')})(?!\\p{L})`, 'iu');

const LOVE = words(['yêu', 'người yêu', 'người ấy', 'crush', 'bạn trai', 'bạn gái', 'vợ', 'chồng', 'hôn nhân', 'cưới', 'chia tay', 'người cũ', 'tình cảm', 'tình yêu', 'tình duyên', 'nhân duyên', 'quay lại', 'hẹn hò', 'love', 'relationship', 'partner', 'boyfriend', 'girlfriend', 'marriage', 'ex', 'dating']);
const CAREER = words(['công việc', 'việc làm', 'nghỉ việc', 'đổi việc', 'đi làm', 'sự nghiệp', 'kinh doanh', 'khởi nghiệp', 'thăng chức', 'lương', 'tiền', 'tài chính', 'đầu tư', 'học', 'thi', 'ôn thi', 'trường', 'phỏng vấn', 'dự án', 'sếp', 'đồng nghiệp', 'career', 'job', 'work', 'business', 'money', 'finance', 'study', 'exam', 'school', 'interview', 'promotion', 'salary']);
const YES_NO = /(có nên|nên không|có .{1,40} không\??$|liệu .{1,60}\?|được không|should i|will (i|he|she|they)|is it|can i|do (i|you)|does (he|she))/i;

export function questionTopic(question: string): QuestionTopic {
  const q = question.normalize('NFC');
  const love = LOVE.test(q);
  const career = CAREER.test(q);
  if (love && !career) return 'love';
  if (career && !love) return 'career';
  return 'general';
}

export function isYesNoQuestion(question: string): boolean {
  return YES_NO.test(question.trim());
}
