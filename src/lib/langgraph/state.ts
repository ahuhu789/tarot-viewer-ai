import { Annotation } from '@langchain/langgraph';
import { BaseMessage } from '@langchain/core/messages';
import { DrawnCard, SpreadId, ReadingPhase } from '@/types/tarot';

export const TarotReadingAnnotation = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
  phase: Annotation<ReadingPhase>({
    reducer: (x, y) => y ?? x,
    default: () => 'greeting',
  }),
  userIntention: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => '',
  }),
  selectedSpread: Annotation<SpreadId | null>({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),
  drawnCards: Annotation<DrawnCard[]>({
    reducer: (x, y) => y ?? x,
    default: () => [],
  }),
  currentCardIndex: Annotation<number>({
    reducer: (x, y) => y ?? x,
    default: () => 0,
  }),
  readingComplete: Annotation<boolean>({
    reducer: (x, y) => y ?? x,
    default: () => false,
  }),
  followUpCount: Annotation<number>({
    reducer: (x, y) => y ?? x,
    default: () => 0,
  }),
  detectedLanguage: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => '',
  }),
});
