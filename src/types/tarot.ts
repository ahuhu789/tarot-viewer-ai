export interface TarotCard {
  cardNumber: number;          // 0–77
  cardName: string;            // "The Fool"
  arcana: 'Major' | 'Minor';
  suit: string;                // "Wands", "Cups", "Swords", "Pentacles", or ""
  element: string;             // "Air", "Water", "Fire", "Earth"
  uprightMeaning: string;
  reversedMeaning: string;
  loveMeaning: string;
  careerMeaning: string;
  yesOrNo: string;             // "Yes", "No", "Maybe"
  zodiacSign: string;
  guideUrl: string;
}

export type SpreadId = 'single' | 'three';

export interface SpreadPosition {
  name: string;
  description: string;
  index: number; // 0-based index in the drawn cards array
}

export interface Spread {
  id: SpreadId;
  name: string;
  description: string;
  positions: SpreadPosition[];
}

export interface DrawnCard {
  cardNumber: number;
  isReversed: boolean;
  positionIndex: number;
  isRevealed: boolean;
}

export type ReadingPhase =
  | 'greeting'
  | 'intention'
  | 'spread_selection'
  | 'shuffling'
  | 'manual_selection'
  | 'drawing'
  | 'interpreting'
  | 'card_chat'
  | 'synthesis'
  | 'follow_up'
  | 'closing';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  metadata?: {
    phase?: ReadingPhase;
    activeCardIndex?: number;
    cardsDrawn?: boolean;
  };
}

export interface TarotReadingState {
  phase: ReadingPhase;
  userIntention: string;
  selectedSpread: SpreadId | null;
  drawnCards: DrawnCard[];
  currentCardIndex: number;
  highestCardIndexReached: number;
  readingComplete: boolean;
  followUpCount: number;
  detectedLanguage: string;
}
