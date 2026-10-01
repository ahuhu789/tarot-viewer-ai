import { Spread } from '@/types/tarot';

export const SPREADS: Record<string, Spread> = {
  single: {
    id: 'single',
    name: 'Daily Draw (Single Card)',
    description: 'A single card for general guidance, a daily focus, or a direct answer to a specific question.',
    positions: [
      {
        name: 'The Core Lesson',
        description: 'The central energy, theme, or message that you need to focus on today.',
        index: 0,
      },
    ],
  },
  three: {
    id: 'three',
    name: 'Past, Present & Future',
    description: 'A classic 3-card spread exploring the timeline of your question or situation.',
    positions: [
      {
        name: 'Past',
        description: 'The foundation, history, or past events that led up to your current situation.',
        index: 0,
      },
      {
        name: 'Present',
        description: 'Your current state, immediate circumstances, or what you are experiencing right now.',
        index: 1,
      },
      {
        name: 'Future',
        description: 'The direction you are heading, potential outcome, or the near future if paths remain unchanged.',
        index: 2,
      },
    ],
  },
};
