'use client';

import React, { memo, useCallback, useEffect, useRef } from 'react';
import type { ViewId } from '@/lib/reading-views';

export interface ReadingTab {
  id: ViewId;
  label: string;
}

interface ReadingTabsProps {
  tabs: ReadingTab[];
  active: ViewId | null;
  disabled?: boolean;
  onSelect: (id: ViewId) => void;
}

/**
 * Segmented control above the reader text: "1 · Quá khứ | 2 · Hiện tại | … | Tổng hợp".
 * Follows the WAI-ARIA tabs pattern (arrow keys, Home/End); scrolls sideways on narrow screens.
 */
function ReadingTabsBase({ tabs, active, disabled = false, onSelect }: ReadingTabsProps) {
  const listRef = useRef<HTMLDivElement>(null);

  // Keep the selected tab visible when the strip scrolls sideways (narrow screens).
  useEffect(() => {
    const list = listRef.current;
    const tab = list?.querySelector<HTMLElement>('[aria-selected="true"]');
    if (!list || !tab) return;
    const left = tab.offsetLeft - list.offsetLeft;
    if (left < list.scrollLeft || left + tab.offsetWidth > list.scrollLeft + list.clientWidth) {
      list.scrollTo({ left: Math.max(0, left - 12), behavior: 'smooth' });
    }
  }, [active, tabs.length]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const i = tabs.findIndex((t) => t.id === active);
      let next = -1;
      if (e.key === 'ArrowRight') next = (i + 1) % tabs.length;
      else if (e.key === 'ArrowLeft') next = (i - 1 + tabs.length) % tabs.length;
      else if (e.key === 'Home') next = 0;
      else if (e.key === 'End') next = tabs.length - 1;
      if (next < 0) return;
      e.preventDefault();
      onSelect(tabs[next].id);
      listRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus();
    },
    [active, onSelect, tabs],
  );

  return (
    <div ref={listRef} className="vn-tabs" role="tablist" aria-label="Xem lại các phần của trải bài" onKeyDown={handleKeyDown}>
      {tabs.map((t) => {
        const selected = t.id === active;
        return (
          <button
            key={String(t.id)}
            type="button"
            role="tab"
            className={`vn-tab ${selected ? 'is-active' : ''} ${t.id === 'summary' ? 'vn-tab--summary' : ''}`}
            aria-selected={selected}
            tabIndex={selected || (active === null && t === tabs[0]) ? 0 : -1}
            disabled={disabled && !selected}
            onClick={() => onSelect(t.id)}
            data-view={String(t.id)}
          >
            {t.id === 'summary' ? `✦ ${t.label}` : t.label}
          </button>
        );
      })}
    </div>
  );
}

export const ReadingTabs = memo(ReadingTabsBase);
