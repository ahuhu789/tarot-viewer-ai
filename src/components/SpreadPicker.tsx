'use client';

import React from 'react';
import { SpreadId } from '@/types/tarot';

interface SpreadPickerProps {
  onSelect: (spreadId: SpreadId) => void;
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100%',
    padding: '1.5rem 0',
  },
  title: {
    fontSize: '0.95rem',
    letterSpacing: '0.15em',
    marginBottom: '1.5rem',
    textAlign: 'center',
    color: 'var(--gold-primary)',
  },
  grid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    width: '100%',
  },
  card: {
    padding: '1.25rem',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    display: 'grid',
    gridTemplateColumns: '60px 1fr 80px',
    alignItems: 'center',
    gap: '1rem',
    textAlign: 'left',
  },
  previewContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewGrid: {
    display: 'grid',
    width: '32px',
    height: '32px',
    placeItems: 'center',
  },
  previewBox: {
    width: '12px',
    height: '20px',
    border: '1px solid rgba(230, 194, 98, 0.4)',
    borderRadius: '2px',
    backgroundColor: 'rgba(230, 194, 98, 0.05)',
  },
  activeBox: {
    backgroundColor: 'var(--gold-primary)',
    borderColor: 'var(--gold-primary)',
  },
  spreadName: {
    fontSize: '1rem',
    letterSpacing: '0.05em',
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-heading)',
  },
  badge: {
    fontFamily: 'var(--font-ui)',
    fontSize: '0.75rem',
    color: 'var(--gold-primary)',
    border: '1px solid var(--border-gold)',
    borderRadius: '12px',
    padding: '2px 8px',
    textAlign: 'center',
    justifySelf: 'end',
  },
  spreadDesc: {
    gridColumn: '1 / -1',
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
    lineHeight: '1.4',
    fontFamily: 'var(--font-ui)',
  },
};

const SPREADS_LIST = [
  {
    id: 'single' as const,
    name: 'Daily Draw',
    description: 'Draw a single card to capture the theme of your day or get a quick, direct response to a single question.',
    layout: '1 Card',
    preview: (
      <div style={styles.previewGrid}>
        <div style={{ ...styles.previewBox, ...styles.activeBox }} />
      </div>
    ),
  },
  {
    id: 'three' as const,
    name: 'Past, Present & Future',
    description: 'Explore the timeline of your question, understanding where you came from, where you are, and where you are heading.',
    layout: '3 Cards',
    preview: (
      <div style={{ ...styles.previewGrid, gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
        <div style={{ ...styles.previewBox, ...styles.activeBox }} />
        <div style={{ ...styles.previewBox, ...styles.activeBox }} />
        <div style={{ ...styles.previewBox, ...styles.activeBox }} />
      </div>
    ),
  },
];

export const SpreadPicker: React.FC<SpreadPickerProps> = ({ onSelect }) => {
  return (
    <div style={styles.container}>
      <h3 style={styles.title}>SELECT SPREAD LAYOUT</h3>
      <div style={styles.grid}>
        {SPREADS_LIST.map((spread) => (
          <div
            key={spread.id}
            onClick={() => onSelect(spread.id)}
            style={styles.card}
            className="glass-panel"
          >
            <div style={styles.previewContainer}>{spread.preview}</div>
            <h4 style={styles.spreadName}>{spread.name}</h4>
            <span style={styles.badge}>{spread.layout}</span>
            <p style={styles.spreadDesc}>{spread.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

