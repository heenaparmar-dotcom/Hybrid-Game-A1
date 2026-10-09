import { useEffect, useRef, useState } from 'react';
import type { Token } from '../lib/scramble';
import { Icon } from './Icon';

interface Props {
  order: Token[];
  locked: number;
  selected: number | null;
  disabled?: boolean;
  onSelect: (index: number | null) => void;
  onMove: (from: number, to: number) => void;
  onSwap: (a: number, b: number) => void;
}

/** Word tiles. Works with mouse drag-and-drop, tap-to-swap, and keyboard (Enter/Space to pick up, arrows to move). */
export function PuzzleBoard({ order, locked, selected, disabled, onSelect, onMove, onSwap }: Props) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);
  const [focusIdx, setFocusIdx] = useState<number | null>(null);

  useEffect(() => {
    if (focusIdx !== null) {
      refs.current[focusIdx]?.focus();
      setFocusIdx(null);
    }
  }, [focusIdx, order]);

  const click = (i: number) => {
    if (disabled || i < locked) return;
    if (selected === null) onSelect(i);
    else if (selected === i) onSelect(null);
    else {
      onSwap(selected, i);
      onSelect(null);
    }
  };

  const key = (e: React.KeyboardEvent, i: number) => {
    if (disabled || selected !== i) return;
    if (e.key === 'ArrowLeft' && i - 1 >= locked) {
      e.preventDefault();
      onMove(i, i - 1);
      onSelect(i - 1);
      setFocusIdx(i - 1);
    } else if (e.key === 'ArrowRight' && i + 1 < order.length) {
      e.preventDefault();
      onMove(i, i + 1);
      onSelect(i + 1);
      setFocusIdx(i + 1);
    } else if (e.key === 'Escape') {
      onSelect(null);
    }
  };

  return (
    <ul className="tiles" aria-label="Scrambled words. Put them in the right order.">
      {order.map((t, i) => {
        const isLocked = i < locked;
        const isSel = selected === i;
        return (
          <li key={t.id}>
            <button
              ref={(el) => {
                refs.current[i] = el;
              }}
              type="button"
              data-testid={`tile-${i}`}
              className={`tile ${isSel ? 'is-selected' : ''} ${isLocked ? 'is-locked' : ''} ${dragFrom === i ? 'is-dragging' : ''} ${overIdx === i && dragFrom !== null && dragFrom !== i ? 'is-over' : ''}`}
              aria-pressed={isSel}
              aria-label={`${t.text}, position ${i + 1} of ${order.length}${isLocked ? ', locked by hint' : ''}${isSel ? ', picked up. Use left and right arrow keys to move it.' : ''}`}
              disabled={disabled}
              aria-disabled={disabled || isLocked}
              draggable={!disabled && !isLocked}
              onClick={() => click(i)}
              onKeyDown={(e) => key(e, i)}
              onDragStart={(e) => {
                if (isLocked) return e.preventDefault();
                setDragFrom(i);
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', String(i));
              }}
              onDragOver={(e) => {
                if (dragFrom !== null && !isLocked) {
                  e.preventDefault();
                  setOverIdx(i);
                }
              }}
              onDrop={(e) => {
                e.preventDefault();
                if (dragFrom !== null && !isLocked) onMove(dragFrom, i);
                setDragFrom(null);
                setOverIdx(null);
                onSelect(null);
              }}
              onDragEnd={() => {
                setDragFrom(null);
                setOverIdx(null);
              }}
            >
              {isLocked && <span className="tile-lock"><Icon name="lock" size={14} /></span>}
              {t.text}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
