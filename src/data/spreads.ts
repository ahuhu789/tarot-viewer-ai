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
};
