'use client';

import { useState, useEffect, useRef } from 'react';
import { ChatMessage, TarotReadingState, ReadingPhase, DrawnCard, SpreadId } from '@/types/tarot';

const INITIAL_STATE: TarotReadingState = {
  phase: 'greeting',
  userIntention: '',
  selectedSpread: null,
  drawnCards: [],
  currentCardIndex: 0,
  highestCardIndexReached: 0,
  readingComplete: false,
  followUpCount: 0,
  detectedLanguage: '',
};

export function useReading() {
  const [state, setState] = useState<TarotReadingState>(INITIAL_STATE);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [typingContent, setTypingContent] = useState<string>('');

  // Callback when a new completed message is received from AI
  const onNewMessageCallback = useRef<((text: string) => void) | null>(null);

  const stateRef = useRef<TarotReadingState>(state);
  stateRef.current = state;

  // Initialize reading room when the component mounts
  useEffect(() => {
    if (messages.length === 0) {
      triggerReadingStep([]);
    }
  }, []);

  async function triggerReadingStep(currentMessages: ChatMessage[], overrideState?: Partial<TarotReadingState>) {
    setIsTyping(true);
    setTypingContent('');

    const currentState = {
      ...stateRef.current,
      ...overrideState,
    };

    try {
      const response = await fetch('/api/reading', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: currentMessages,
          state: currentState,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to run reading step');
      }

      if (!response.body) return;

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let currentEvent = '';
      let accumulatedText = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const cleanLine = line.trim();
          if (cleanLine.startsWith('event: ')) {
            currentEvent = cleanLine.slice(7).trim();
          } else if (cleanLine.startsWith('data: ')) {
            const dataStr = cleanLine.slice(6).trim();

            if (currentEvent === 'token') {
              const token = decodeURIComponent(dataStr);
              accumulatedText += token;
              setTypingContent((prev) => prev + token);
            } else if (currentEvent === 'state') {
              const stateUpdate = JSON.parse(dataStr);
              setState((prev) => ({
                ...prev,
                ...stateUpdate,
              }));
            } else if (currentEvent === 'error') {
              console.error('❌ SSE Stream Error:', decodeURIComponent(dataStr));
            }
          }
        }
      }

      // Add the final assistant response to the chat history
      if (accumulatedText) {
        const newMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content: accumulatedText,
          timestamp: new Date().toISOString(),
          metadata: {
            phase: currentState.phase,
            activeCardIndex: currentState.currentCardIndex,
          },
        };
        setMessages((prev) => [...prev, newMsg]);

        // Trigger voice synthesis callback
        if (onNewMessageCallback.current) {
          onNewMessageCallback.current(accumulatedText);
        }
      }
    } catch (error) {
      console.error('❌ Error sending reading request:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: 'system',
          content: 'Connection lost. Please try again.',
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsTyping(false);
      setTypingContent('');
    }
  }

  const sendMessage = async (content: string) => {
    if (!content.trim() || isTyping) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);

    // Run the next phase in the graph
    await triggerReadingStep(updatedMessages);
  };

  const selectSpread = async (spreadId: SpreadId) => {
    setState((prev) => ({ ...prev, selectedSpread: spreadId, phase: 'shuffling' }));

    const userMsg: ChatMessage = {
      id: `user-select-${Date.now()}`,
      role: 'user',
      content: `I select the ${spreadId === 'single' ? 'Daily Draw' : spreadId === 'three' ? 'Past, Present & Future' : 'Celtic Cross'} spread.`,
      timestamp: new Date().toISOString(),
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
  };

  const finishShuffling = () => {
    setState((prev) => ({ ...prev, phase: 'manual_selection' }));
  };

  const submitCardSelection = async () => {
    if (!state.selectedSpread) return;
    
    try {
      const res = await fetch('/api/reading/draw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spreadId: state.selectedSpread }),
      });
      const data = await res.json();

      if (data.drawnCards) {
        setState((prev) => ({
          ...prev,
          drawnCards: data.drawnCards,
          phase: 'drawing',
        }));
      }
    } catch (e) {
      console.error('❌ Error drawing cards:', e);
    }
  };

  const finishDrawing = async () => {
    setState((prev) => ({ ...prev, phase: 'interpreting', currentCardIndex: 0 }));
    await triggerReadingStep(messages, { phase: 'interpreting', currentCardIndex: 0 });
  };

  // Advances to the next card or synthesis phase
  const advanceToNextCard = async () => {
    const nextIndex = state.currentCardIndex + 1;
    const isFinished = nextIndex >= state.drawnCards.length;

    if (isFinished) {
      // Transition to final synthesis
      setState((prev) => ({ ...prev, phase: 'synthesis' }));
      await triggerReadingStep(messages, { phase: 'synthesis' });
    } else {
      // Transition to next card interpretation
      setState((prev) => ({ 
        ...prev, 
        phase: 'interpreting', 
        currentCardIndex: nextIndex,
        highestCardIndexReached: Math.max(prev.highestCardIndexReached, nextIndex)
      }));
      await triggerReadingStep(messages, { 
        phase: 'interpreting', 
        currentCardIndex: nextIndex,
        highestCardIndexReached: Math.max(state.highestCardIndexReached, nextIndex)
      });
    }
  };

  const goToCard = (index: number) => {
    if (index >= 0 && index <= state.highestCardIndexReached) {
      setState((prev) => ({ ...prev, currentCardIndex: index, phase: 'interpreting' }));
    }
  };

  const revealCard = (index: number) => {
    setState((prev) => {
      const updated = prev.drawnCards.map((c) =>
        c.positionIndex === index ? { ...c, isRevealed: true } : c
      );
      return { ...prev, drawnCards: updated };
    });
  };

  const restartReading = () => {
    setState(INITIAL_STATE);
    setMessages([]);
    setTypingContent('');
    setIsTyping(false);
    setTimeout(() => {
      triggerReadingStep([]);
    }, 100);
  };

  return {
    state,
    messages,
    isTyping,
    typingContent,
    sendMessage,
    selectSpread,
    finishShuffling,
    submitCardSelection,
    finishDrawing,
    revealCard,
    advanceToNextCard,
    goToCard,
    restartReading,
    onNewMessageCallback,
  };
}
