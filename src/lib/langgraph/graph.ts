import { StateGraph, START, END } from '@langchain/langgraph';
import { ChatOpenAI } from '@langchain/openai';
import { SystemMessage, AIMessage, HumanMessage } from '@langchain/core/messages';
import { TarotReadingAnnotation } from './state';
import { getCardByNumber } from '../csv-parser';
import { SPREADS } from '@/data/spreads';
import {
  getGreetingPrompt,
  getIntentionPrompt,
  getInterpretationPrompt,
  getCardChatPrompt,
  getSynthesisPrompt,
  getFollowUpPrompt,
  getClosingPrompt,
} from './prompts';

// Initialize the Alibaba client via OpenAI-compatible endpoint
const model = new ChatOpenAI({
  model: 'qwen-plus',
  maxTokens: 2048,
  apiKey: process.env.ALIBABA_API_KEY || 'dummy-key-for-build',
  configuration: {
    baseURL: process.env.ALIBABA_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  },
  temperature: 0.7,
});

// Use LLM to accurately detect language (robust for Vietnamese, English, etc.)
async function detectLanguageWithLLM(text: string): Promise<string> {
  if (!text.trim()) return 'English';
  try {
    const response = await model.invoke([
      new SystemMessage(
        "Identify the primary language of the following user message. " +
        "Respond with EXACTLY one word: the language name in English (e.g., 'Vietnamese', 'English', 'Japanese', 'Spanish'). " +
        "Do not include punctuation, markdown, or extra words. If unsure, respond with 'English'."
      ),
      new HumanMessage(text),
    ]);
    const lang = typeof response.content === 'string' ? response.content.trim() : 'English';
    const cleaned = lang.replace(/[^a-zA-Z]/g, '').trim();
    if (/viet/i.test(cleaned)) return 'Vietnamese';
    if (/eng/i.test(cleaned)) return 'English';
    return cleaned || 'English';
  } catch (e) {
    console.error('Error detecting language with LLM:', e);
    return 'English';
  }
}

// --- Node Handlers ---

async function greetingNode(state: typeof TarotReadingAnnotation.State) {
  const messagesToUse = state.messages.length > 0 
    ? state.messages 
    : [new HumanMessage('Hello')];

  const response = await model.invoke([
    new SystemMessage(getGreetingPrompt(state.detectedLanguage)),
    ...messagesToUse,
  ]);
  return {
    messages: [response],
    phase: 'intention' as const,
  };
}

async function intentionNode(state: typeof TarotReadingAnnotation.State) {
  const lastMessage = state.messages[state.messages.length - 1];
  const userText = typeof lastMessage?.content === 'string' ? lastMessage.content : '';
  
  let lang = state.detectedLanguage;
  if (!lang) {
    lang = await detectLanguageWithLLM(userText);
  }

  const response = await model.invoke([
    new SystemMessage(getIntentionPrompt(lang)),
    ...state.messages,
  ]);

  return {
    messages: [response],
    userIntention: state.userIntention || userText,
    detectedLanguage: lang,
    phase: 'spread_selection' as const,
  };
}

async function selectionNode(state: typeof TarotReadingAnnotation.State) {
  // Acknowledge spread choice and prompt drawing
  const lang = state.detectedLanguage || 'Vietnamese';
  const response = await model.invoke([
    new SystemMessage(
      `You are in the spread selection phase. Acknowledge their choice of spread, and invite them to click the deck to shuffle and draw the cards. Respond in ${lang}.`
    ),
    ...state.messages,
  ]);
  return {
    messages: [response],
  };
}

async function interpretNode(state: typeof TarotReadingAnnotation.State) {
  const currentIndex = state.currentCardIndex;
  const card = state.drawnCards[currentIndex];
  if (!card) {
    return { phase: 'synthesis' as const };
  }

  // Load detailed meanings from CSV
  const csvCard = getCardByNumber(card.cardNumber);
  const spread = SPREADS[state.selectedSpread || 'three'];
  const position = spread?.positions[card.positionIndex];

  if (!csvCard || !position) {
    return {
      messages: [new AIMessage('I had trouble reading the next card.')],
      currentCardIndex: currentIndex + 1,
    };
  }

  const orientation = card.isReversed ? 'REVERSED' : 'UPRIGHT';

  const promptInput = `${getInterpretationPrompt(state.detectedLanguage)}

=== CARD TO INTERPRET ===
Card Name: ${csvCard.cardName}
Arcana: ${csvCard.arcana}
Suit: ${csvCard.suit || 'None'}
Element: ${csvCard.element}
Spread Position: ${position.name} (${position.description})
Orientation: ${orientation}

=== CSV CARD DATA ===
Upright Meaning: ${csvCard.uprightMeaning}
Reversed Meaning: ${csvCard.reversedMeaning}
Love Implications: ${csvCard.loveMeaning}
Career Implications: ${csvCard.careerMeaning}
Yes/No: ${csvCard.yesOrNo}
Zodiac/Planet: ${csvCard.zodiacSign}
=== END CSV CARD DATA ===

Querent Intention: "${state.userIntention}"
Please interpret this specific card in detail based on this data.`;

  const response = await model.invoke([
    new SystemMessage(promptInput),
    ...state.messages,
  ]);

  return {
    messages: [response],
    phase: 'card_chat' as const, // Transit to per-card chat instead of interpreting
  };
}

async function cardChatNode(state: typeof TarotReadingAnnotation.State) {
  const currentIndex = state.currentCardIndex;
  const card = state.drawnCards[currentIndex];

  if (!card) {
    return { phase: 'synthesis' as const };
  }

  const csvCard = getCardByNumber(card.cardNumber);
  const spread = SPREADS[state.selectedSpread || 'three'];
  const position = spread?.positions[card.positionIndex];

  const orientation = card.isReversed ? 'REVERSED' : 'UPRIGHT';

  const promptInput = `${getCardChatPrompt(state.detectedLanguage)}

=== CURRENT TARGET CARD DETAILS ===
Card Name: ${csvCard?.cardName}
Spread Position: ${position?.name} (${position?.description})
Orientation: ${orientation}

=== CSV CARD DATA ===
Upright Meaning: ${csvCard?.uprightMeaning}
Reversed Meaning: ${csvCard?.reversedMeaning}
Love Implications: ${csvCard?.loveMeaning}
Career Implications: ${csvCard?.careerMeaning}
Yes/No: ${csvCard?.yesOrNo}
=== END CSV CARD DATA ===

Querent Intention: "${state.userIntention}"
Answering follow-up about this specific card.`;

  const response = await model.invoke([
    new SystemMessage(promptInput),
    ...state.messages,
  ]);

  return {
    messages: [response],
    phase: 'card_chat' as const, // Stay in card chat until next card triggered
  };
}

async function synthesisNode(state: typeof TarotReadingAnnotation.State) {
  const spread = SPREADS[state.selectedSpread || 'three'];
  const cardsSummary = state.drawnCards
    .map((c) => {
      const csvCard = getCardByNumber(c.cardNumber);
      const pos = spread?.positions[c.positionIndex];
      return `- ${pos?.name}: ${csvCard?.cardName} (${c.isReversed ? 'Reversed' : 'Upright'})`;
    })
    .join('\n');

  const promptInput = `${getSynthesisPrompt(state.detectedLanguage)}

=== CARDS DRAWN IN THE SPREAD ===
${cardsSummary}

Querent Intention: "${state.userIntention}"`;

  const response = await model.invoke([
    new SystemMessage(promptInput),
    ...state.messages,
  ]);

  return {
    messages: [response],
    phase: 'follow_up' as const,
    readingComplete: true,
  };
}

async function followUpNode(state: typeof TarotReadingAnnotation.State) {
  const lastMessage = state.messages[state.messages.length - 1];
  const userText = typeof lastMessage?.content === 'string' ? lastMessage.content.toLowerCase() : '';

  const isClosing =
    userText.includes('thank you') ||
    userText.includes('cảm ơn') ||
    userText.includes('tạm biệt') ||
    userText.includes('bye') ||
    userText.includes('goodbye') ||
    userText.includes('done') ||
    state.followUpCount >= 4;

  if (isClosing) {
    return {
      phase: 'closing' as const,
    };
  }

  const response = await model.invoke([
    new SystemMessage(getFollowUpPrompt(state.detectedLanguage)),
    ...state.messages,
  ]);

  return {
    messages: [response],
    followUpCount: state.followUpCount + 1,
  };
}

async function closingNode(state: typeof TarotReadingAnnotation.State) {
  const response = await model.invoke([
    new SystemMessage(getClosingPrompt(state.detectedLanguage)),
    ...state.messages,
  ]);
  return {
    messages: [response],
  };
}

// --- Routing Edge ---

function routePhase(state: typeof TarotReadingAnnotation.State) {
  return state.phase;
}

// --- Assemble Graph ---

const workflow = new StateGraph(TarotReadingAnnotation)
  .addNode('greeting', greetingNode)
  .addNode('intention', intentionNode)
  .addNode('spread_selection', selectionNode)
  .addNode('interpreting', interpretNode)
  .addNode('card_chat', cardChatNode)
  .addNode('synthesis', synthesisNode)
  .addNode('follow_up', followUpNode)
  .addNode('closing', closingNode);

// Add conditional route from START to correct node
workflow.addConditionalEdges(START, routePhase, {
  greeting: 'greeting',
  intention: 'intention',
  spread_selection: 'spread_selection',
  shuffling: 'spread_selection',
  drawing: 'spread_selection',
  interpreting: 'interpreting',
  card_chat: 'card_chat',
  synthesis: 'synthesis',
  follow_up: 'follow_up',
  closing: 'closing',
});

// Add transitions to standard end points
workflow.addEdge('greeting', END);
workflow.addEdge('intention', END);
workflow.addEdge('spread_selection', END);
workflow.addEdge('interpreting', END);
workflow.addEdge('card_chat', END);
workflow.addEdge('synthesis', END);
workflow.addEdge('follow_up', END);
workflow.addEdge('closing', END);

export const graph = workflow.compile();
export type TarotGraphType = typeof graph;
export { SPREADS };
