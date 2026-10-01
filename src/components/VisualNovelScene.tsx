'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ChatMessage, TarotReadingState, TarotCard as TarotCardType } from '@/types/tarot';
import { useTTS } from '@/hooks/useTTS';
import { SpreadPicker } from './SpreadPicker';
import { CardDeck } from './CardDeck';
import { SeventyEightCardsSpread } from './SeventyEightCardsSpread';
import { SpreadLayout } from './SpreadLayout';
import { TarotCard } from './TarotCard';
import { SPREADS } from '@/data/spreads';

interface VisualNovelSceneProps {
  state: TarotReadingState;
  messages: ChatMessage[];
  isTyping: boolean;
  typingContent: string;
  onSendMessage: (text: string) => void;
  onSelectSpread: (spreadId: any) => void;
  onFinishShuffling: () => void;
  onSubmitCardSelection: () => void;
  onFinishDrawing: () => void;
  onRevealCard: (index: number) => void;
  onAdvanceToNextCard: () => void;
  onGoToCard?: (index: number) => void;
  onRestart: () => void;
  cardMeanings: TarotCardType[];
  onNewMessageCallback: React.MutableRefObject<((text: string) => void) | null>;
}

export const VisualNovelScene: React.FC<VisualNovelSceneProps> = ({
  state,
  messages,
  isTyping,
  typingContent,
  onSendMessage,
  onSelectSpread,
  onFinishShuffling,
  onSubmitCardSelection,
  onFinishDrawing,
  onRevealCard,
  onAdvanceToNextCard,
  onGoToCard,
  onRestart,
  cardMeanings,
  onNewMessageCallback,
}) => {
  const router = useRouter();
  const { voiceEnabled, isSpeaking, toggleVoice, speak, stopSpeaking } = useTTS();

  // Register TTS callback to read completed incoming messages
  useEffect(() => {
    onNewMessageCallback.current = (text: string) => {
      speak(text);
    };
    return () => {
      onNewMessageCallback.current = null;
      stopSpeaking();
    };
  }, [voiceEnabled]);

  const activeSpread = SPREADS[state.selectedSpread || 'three'];
  const revealedCount = state.drawnCards.filter((c) => c.isRevealed).length;
  const lastMessage = messages[messages.length - 1];

  // Helper to get active card meanings
  const activeCard = state.drawnCards[state.currentCardIndex];
  const activeCardMeaning = cardMeanings.find((m) => m.cardNumber === activeCard?.cardNumber);
  const activePosition = activeSpread?.positions[activeCard?.positionIndex];

  // User input submit handler
  const [inputValue, setInputValue] = React.useState('');
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isTyping) return;
    onSendMessage(inputValue.trim());
    setInputValue('');
  };

  const showInput = state.phase === 'intention' || state.phase === 'card_chat' || state.phase === 'follow_up';

  // Extract the dialogue panel for reuse between layouts
  const dialoguePanel = (
    <div className={`vn-dialogue-panel ${state.phase !== 'interpreting' && state.phase !== 'card_chat' ? 'bottom-pinned' : ''} ${isSpeaking ? 'speaker-active' : ''}`}>
      <div className="vn-name-box">🌙 The Card Reader</div>

      <div className="vn-text-box">
        <div className="vn-text-box-scroller">
          {isTyping ? (
            typingContent || 'Whispering to the cards...'
          ) : (
            lastMessage?.content || 'Welcoming your presence...'
          )}
        </div>
      </div>

      {/* Input & Button Controls */}
      <div style={styles.bottomControls}>
        {showInput && (
          <form onSubmit={handleSubmit} style={styles.inputForm}>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={isTyping}
              placeholder={
                state.phase === 'intention'
                  ? 'State your question or seek general guidance...'
                  : 'Ask a question about this card, or click Next...'
              }
              style={{ ...styles.textInput, opacity: isTyping ? 0.5 : 1 }}
            />
            <button type="submit" className="btn-gold" style={{ ...styles.sendBtn, opacity: (!inputValue.trim() || isTyping) ? 0.5 : 1 }} disabled={!inputValue.trim() || isTyping}>
              ✦ Send
            </button>
          </form>
        )}

        {/* Action buttons */}
        <div style={styles.buttonsRow}>
          {state.phase === 'drawing' && revealedCount === state.drawnCards.length && state.drawnCards.length > 0 && (
            <button onClick={onFinishDrawing} className="btn-gold" style={styles.actionBtn}>
              Begin Interpretation ✦
            </button>
          )}

          {state.phase === 'drawing' && revealedCount < state.drawnCards.length && (
            <div style={styles.promptHint}>
              Reveal all cards to begin ({revealedCount}/{state.drawnCards.length} flipped)
            </div>
          )}

          {state.phase === 'card_chat' && (
            <button onClick={onAdvanceToNextCard} className="btn-gold" style={{ ...styles.actionBtn, opacity: isTyping ? 0.5 : 1 }} disabled={isTyping}>
              {state.currentCardIndex + 1 >= state.drawnCards.length
                ? 'Request Final Synthesis ✦'
                : 'Move to Next Card ➔'}
            </button>
          )}

          {state.phase === 'closing' && (
            <button onClick={onRestart} className="btn-gold" style={styles.actionBtn}>
              Begin Another Journey ✦
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="vn-stage">
      {/* Background decorations */}
      <div className="starfield-ambient" />
      <div className="candle-glow-left" />
      <div className="candle-glow-right" />

      {/* Top Header Controls */}
      <div style={styles.topBar}>
        <button onClick={() => router.push('/')} style={styles.leaveBtn}>
          ✦ Exit Sanctuary
        </button>

        <div style={styles.controlsRight}>
          {/* TTS Speaker Toggle */}
          <div className="tts-indicator" onClick={toggleVoice}>
            <span>{voiceEnabled ? '🔊 VOICE: ON' : '🔇 VOICE: OFF'}</span>
          </div>
        </div>
      </div>

      {/* Spread Thumbnail Strip (Shown during interpretation/chat) */}
      {activeSpread && state.drawnCards.length > 0 && (
        <div className="vn-spread-overview">
          {state.drawnCards.map((c, i) => {
            const isCurrent = state.currentCardIndex === i;
            const isAccessible = i <= state.highestCardIndexReached;
            const meaning = cardMeanings.find((m) => m.cardNumber === c.cardNumber);
            return (
              <div
                key={i}
                className={`mini-card-slot ${isCurrent ? 'active' : ''} ${isAccessible ? 'cursor-pointer hover:scale-105 transition-transform' : 'opacity-50 cursor-not-allowed'}`}
                title={`${activeSpread.positions[i]?.name}: ${meaning?.cardName || 'Card'}`}
                onClick={() => {
                  if (isAccessible && onGoToCard) {
                    onGoToCard(i);
                  }
                }}
              >
                {c.isRevealed ? (
                  <Image
                    src={`/cards/1909/${c.cardNumber}.jpg`}
                    alt="Card Front"
                    fill
                    className="mini-card-image"
                    sizes="32px"
                  />
                ) : (
                  <Image
                    src="/cards/back.jpg"
                    alt="Card Back"
                    fill
                    className="mini-card-image"
                    sizes="32px"
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Center Stage Panel */}
      <div className="vn-main-stage">
        {/* NON-READING PHASES (Centered) */}
        {(state.phase === 'spread_selection' || state.phase === 'shuffling' || state.phase === 'manual_selection' || state.phase === 'drawing' || state.phase === 'synthesis' || state.phase === 'follow_up' || state.phase === 'closing') && (
          <div className="vn-stage-center">
            {state.phase === 'spread_selection' && (
              <div style={styles.modalContent}>
                <SpreadPicker onSelect={onSelectSpread} />
              </div>
            )}
            {state.phase === 'shuffling' && (
              <div style={styles.modalContent}>
                <CardDeck onDraw={onFinishShuffling} />
              </div>
            )}
            {state.phase === 'manual_selection' && state.selectedSpread && (
              <SeventyEightCardsSpread
                spreadId={state.selectedSpread}
                onSelectComplete={onSubmitCardSelection}
              />
            )}
            {(state.phase === 'drawing' || state.phase === 'synthesis' || state.phase === 'follow_up' || state.phase === 'closing') && (
              <div style={styles.drawingStage}>
                <SpreadLayout
                  drawnCards={state.drawnCards}
                  cardMeanings={cardMeanings}
                  spreadId={state.selectedSpread || 'three'}
                  currentCardIndex={state.currentCardIndex}
                  onRevealCard={onRevealCard}
                  phase={state.phase}
                />
              </div>
            )}
          </div>
        )}

        {/* READING PHASES (Side-by-Side) */}
        {(state.phase === 'interpreting' || state.phase === 'card_chat') && activeCard && (
          <div className="vn-reading-layout">
            <div className="vn-col-left">
              <TarotCard
                cardNumber={activeCard.cardNumber}
                cardName={activeCardMeaning?.cardName || ''}
                isReversed={activeCard.isReversed}
                isRevealed={activeCard.isRevealed}
                isActive={isSpeaking}
                onReveal={() => onRevealCard(state.currentCardIndex)}
                positionName={activePosition?.name}
                positionDescription={activePosition?.description}
                size="large"
              />
            </div>
            <div className="vn-col-right">
              {dialoguePanel}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Pinned Dialogue (Only show if not in side-by-side mode) */}
      {!(state.phase === 'interpreting' || state.phase === 'card_chat') && dialoguePanel}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  topBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1.25rem 1.5rem',
    zIndex: 30,
    width: '100%',
  },
  leaveBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    fontSize: '0.8rem',
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    cursor: 'pointer',
    fontFamily: 'var(--font-ui)',
    transition: 'color 0.2s',
  },
  controlsRight: {
    display: 'flex',
    gap: '0.75rem',
    alignItems: 'center',
    position: 'relative',
    height: '24px',
  },
  modalContent: {
    width: '100%',
    maxWidth: '650px',
    backgroundColor: 'rgba(5, 5, 12, 0.75)',
    border: '1px solid var(--border-gold)',
    borderRadius: '12px',
    padding: '2rem',
    boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
    backdropFilter: 'blur(16px)',
  },
  drawingStage: {
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
  },
  bottomControls: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    width: '100%',
  },
  inputForm: {
    display: 'flex',
    gap: '0.75rem',
    width: '100%',
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    padding: '0.75rem 1rem',
    borderRadius: '6px',
    border: '1px solid var(--border-gold)',
    background: 'rgba(3, 3, 8, 0.5)',
    color: 'var(--text-primary)',
    fontSize: '0.95rem',
    outline: 'none',
    fontFamily: 'var(--font-body)',
  },
  sendBtn: {
    padding: '0.75rem 1.5rem',
    fontSize: '0.85rem',
    borderRadius: '6px',
  },
  buttonsRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    width: '100%',
  },
  actionBtn: {
    fontSize: '0.85rem',
    padding: '0.65rem 1.75rem',
  },
  promptHint: {
    fontFamily: 'var(--font-ui)',
    fontSize: '0.8rem',
    color: 'var(--gold-primary)',
    textAlign: 'center',
    width: '100%',
    padding: '0.5rem',
    border: '1px dashed var(--border-gold)',
    borderRadius: '6px',
    backgroundColor: 'rgba(230, 194, 98, 0.02)',
  },
};
