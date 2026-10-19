import { Spread } from '@/types/tarot';

/**
 * Spreads and their positions. Position order === draw order === interpretation
 * order (index 0 is always read first). Labels are shown in the UI, given to the
 * AI verbatim and rendered in the server-side card headings.
 */
export const SPREADS: Record<string, Spread> = {
  single: {
    id: 'single',
    name: 'Lá bài của ngày',
    nameEn: 'Daily Draw',
    description: 'Một lá bài cho thông điệp cốt lõi, năng lượng của hôm nay hoặc câu trả lời trực diện.',
    positions: [
      {
        index: 0,
        name: 'Thông điệp',
        nameEn: 'The Core Message',
        description: 'Năng lượng, bài học hoặc lời nhắn chính bạn cần tập trung lúc này.',
        descriptionEn: 'The central energy, theme or message to focus on right now.',
      },
    ],
  },
  three: {
    id: 'three',
    name: 'Quá khứ – Hiện tại – Tương lai',
    nameEn: 'Past, Present & Future',
    description: 'Ba lá theo dòng thời gian: điều đã dẫn bạn đến đây, bạn đang ở đâu, và bạn đang hướng tới đâu.',
    positions: [
      {
        index: 0,
        name: 'Quá khứ',
        nameEn: 'Past',
        description: 'Nền tảng, trải nghiệm hoặc sự kiện đã dẫn đến tình huống hiện tại.',
        descriptionEn: 'The foundation or past events that led to the current situation.',
      },
      {
        index: 1,
        name: 'Hiện tại',
        nameEn: 'Present',
        description: 'Trạng thái, hoàn cảnh và điều bạn đang trải qua ngay lúc này.',
        descriptionEn: 'Your current state and what you are experiencing right now.',
      },
      {
        index: 2,
        name: 'Tương lai',
        nameEn: 'Future',
        description: 'Hướng đi sắp tới hoặc kết quả có thể xảy ra nếu mọi thứ tiếp tục như hiện nay.',
        descriptionEn: 'Where things are heading if nothing changes.',
      },
    ],
  },
  love: {
    id: 'love',
    name: 'Tình yêu – 3 lá',
    nameEn: 'Love (3 cards)',
    description: 'Ba lá cho chuyện tình cảm: bạn, người ấy, và hướng đi của mối quan hệ.',
    positions: [
      {
        index: 0,
        name: 'Bạn',
        nameEn: 'You',
        description: 'Cảm xúc, mong muốn và vai trò của bạn trong chuyện này.',
        descriptionEn: 'Your feelings, wishes and part in this.',
      },
      {
        index: 1,
        name: 'Người ấy',
        nameEn: 'The other person',
        description: 'Cảm xúc hoặc góc nhìn của người ấy (hoặc người bạn sẽ gặp).',
        descriptionEn: 'The other person\'s feelings or point of view (or someone you will meet).',
      },
      {
        index: 2,
        name: 'Mối quan hệ',
        nameEn: 'The relationship',
        description: 'Năng lượng chung và hướng đi có thể của mối quan hệ.',
        descriptionEn: 'The shared energy and likely direction of the relationship.',
      },
    ],
  },
  choice: {
    id: 'choice',
    name: 'Hai lựa chọn – 3 lá',
    nameEn: 'Two options (3 cards)',
    description: 'Khi bạn đứng giữa hai hướng: điều mỗi lựa chọn mang lại và lời khuyên.',
    positions: [
      {
        index: 0,
        name: 'Lựa chọn A',
        nameEn: 'Option A',
        description: 'Lựa chọn thứ nhất bạn nêu trong câu hỏi (hoặc giữ nguyên hiện trạng): điều nó mang lại.',
        descriptionEn: 'The first option in the question (or keeping things as they are): what it brings.',
      },
      {
        index: 1,
        name: 'Lựa chọn B',
        nameEn: 'Option B',
        description: 'Lựa chọn thứ hai (hoặc thay đổi): điều nó mang lại.',
        descriptionEn: 'The second option (or making the change): what it brings.',
      },
      {
        index: 2,
        name: 'Lời khuyên',
        nameEn: 'Advice',
        description: 'Điều bạn cần cân nhắc để chọn đúng với mình.',
        descriptionEn: 'What to weigh to choose what is right for you.',
      },
    ],
  },
};
