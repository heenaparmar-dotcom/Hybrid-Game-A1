import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { moveTile, swapTiles, type Token } from '../lib/scramble';

interface Props {
  order: Token[];
  /** Number of tiles at the start that are locked in place (from a nudge). */
  locked: number;
  disabled: boolean;
  solved: boolean;
  onReorder: (next: Token[]) => void;
  /** Spoken/visible status for assistive tech. */
  announce: (message: string) => void;
}

interface Drag {
  id: number;
  w: number;
  h: number;
  offX: number;
  offY: number;
  x: number;
  y: number;
}

const DRAG_THRESHOLD = 6;
const prefersReducedMotion = () => {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
};

/**
 * The lyric line. Tiles can be dragged with a mouse, finger or pen (pointer events, so touch works),
 * tapped one after another to swap, or moved with the keyboard (Enter picks one up, arrows move it).
 * There is no submit button: the parent checks the order after every change.
 */
export function PuzzleBoard({ order, locked, disabled, solved, onReorder, announce }: Props) {
  const items = useRef<Map<number, HTMLLIElement>>(new Map());
  const buttons = useRef<Map<number, HTMLButtonElement>>(new Map());
  const rects = useRef<Map<number, DOMRect>>(new Map());
  const orderRef = useRef(order);
  orderRef.current = order;
  const press = useRef<{ id: number; x: number; y: number; pointerId: number } | null>(null);
  const dragRef = useRef<Drag | null>(null);
  /** When a pointer tap was last handled, so the click the browser sends right after it is not counted twice. */
  const lastPointerTap = useRef(0);
  const [drag, setDrag] = useState<Drag | null>(null);
  const [picked, setPicked] = useState<number | null>(null);
  const [focusId, setFocusId] = useState<number | null>(null);

  const setDragBoth = (d: Drag | null) => {
    dragRef.current = d;
    setDrag(d);
  };

  // Animate tiles sliding to their new places (FLIP). Skipped when the player prefers reduced motion.
  useLayoutEffect(() => {
    const next = new Map<number, DOMRect>();
    items.current.forEach((el, id) => next.set(id, el.getBoundingClientRect()));
    if (!prefersReducedMotion()) {
      next.forEach((r, id) => {
        const p = rects.current.get(id);
        if (!p) return;
        const dx = p.left - r.left;
        const dy = p.top - r.top;
        if (Math.abs(dx) + Math.abs(dy) > 1) {
          items.current.get(id)?.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'translate(0, 0)' }], { duration: 220, easing: 'cubic-bezier(.2,.9,.25,1)' });
        }
      });
    }
    rects.current = next;
  }, [order]);

  useEffect(() => {
    const refresh = () => {
      const next = new Map<number, DOMRect>();
      items.current.forEach((el, id) => next.set(id, el.getBoundingClientRect()));
      rects.current = next;
    };
    window.addEventListener('resize', refresh);
    return () => window.removeEventListener('resize', refresh);
  }, []);

  useEffect(() => {
    if (solved || disabled) {
      dragRef.current = null;
      setDrag(null);
      setPicked(null);
      press.current = null;
    }
  }, [solved, disabled]);

  useEffect(() => {
    if (focusId !== null) {
      buttons.current.get(focusId)?.focus();
      setFocusId(null);
    }
  }, [focusId, order]);

  const indexOf = (id: number) => orderRef.current.findIndex((t) => t.id === id);
  const word = (id: number) => orderRef.current.find((t) => t.id === id)?.text ?? '';
  const where = (id: number) => `position ${indexOf(id) + 1} of ${orderRef.current.length}`;

  const dropOn = useCallback(
    (px: number, py: number, id: number) => {
      const list = orderRef.current;
      const from = list.findIndex((t) => t.id === id);
      let target = -1;
      list.forEach((t, i) => {
        if (i < locked || t.id === id) return;
        const r = items.current.get(t.id)?.getBoundingClientRect();
        if (!r || px < r.left || px > r.right || py < r.top || py > r.bottom) return;
        // Only swap once the pointer passes the middle of the tile it is moving towards. This stops tiles of different
        // widths from bouncing the dragged word past its target as the row reflows.
        const middle = (r.left + r.right) / 2;
        if ((i > from && px >= middle) || (i < from && px <= middle)) target = i;
      });
      if (target >= 0 && target !== from) {
        onReorder(moveTile(list, from, target, locked));
      }
    },
    [locked, onReorder],
  );

  const onPointerDown = (e: React.PointerEvent<HTMLButtonElement>, id: number) => {
    if (disabled || solved || indexOf(id) < locked) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    press.current = { id, x: e.clientX, y: e.clientY, pointerId: e.pointerId };
  };

  const handleMove = (e: PointerEvent) => {
    const p = press.current;
    if (!p || e.pointerId !== p.pointerId) return;
    const current = dragRef.current;
    if (!current) {
      if (Math.hypot(e.clientX - p.x, e.clientY - p.y) < DRAG_THRESHOLD) return;
      const r = items.current.get(p.id)?.getBoundingClientRect();
      if (!r) return;
      setPicked(null);
      setDragBoth({ id: p.id, w: r.width, h: r.height, offX: p.x - r.left, offY: p.y - r.top, x: e.clientX, y: e.clientY });
      return;
    }
    setDragBoth({ ...current, x: e.clientX, y: e.clientY });
    dropOn(e.clientX, e.clientY, current.id);
  };

  const handleUp = (e: PointerEvent, cancelled: boolean) => {
    const p = press.current;
    if (!p || e.pointerId !== p.pointerId) return;
    press.current = null;
    if (dragRef.current) {
      setDragBoth(null);
      announce(`Dropped ${word(p.id)}, ${where(p.id)}.`);
      return;
    }
    if (!cancelled) {
      lastPointerTap.current = performance.now();
      tap(p.id);
    }
  };

  // Listen on the window, not the tile: React moves tiles in the DOM while one is being dragged, which makes the browser
  // drop pointer capture, and a tile that has lost capture never hears the finger lift.
  const moveRef = useRef(handleMove);
  const upRef = useRef(handleUp);
  moveRef.current = handleMove;
  upRef.current = handleUp;
  useEffect(() => {
    const move = (e: PointerEvent) => moveRef.current(e);
    const up = (e: PointerEvent) => upRef.current(e, false);
    const cancel = (e: PointerEvent) => upRef.current(e, true);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', cancel);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', cancel);
    };
  }, []);

  const tap = (id: number) => {
    if (disabled || solved) return;
    if (picked === null) {
      setPicked(id);
      announce(`Picked up ${word(id)}. Tap another word to swap with it.`);
    } else if (picked === id) {
      setPicked(null);
      announce(`Put ${word(id)} down.`);
    } else {
      const a = indexOf(picked);
      const b = indexOf(id);
      onReorder(swapTiles(orderRef.current, a, b, locked));
      announce(`Swapped ${word(picked)} and ${word(id)}.`);
      setPicked(null);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, id: number) => {
    if (disabled || solved) return;
    const i = indexOf(id);
    const dir = e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : 0;
    if (e.key === 'Escape' && picked !== null) {
      setPicked(null);
      announce('Put the word down.');
      return;
    }
    if (!dir) return;
    e.preventDefault();
    if (picked === id) {
      const to = i + dir;
      if (to < locked || to >= orderRef.current.length) return;
      onReorder(moveTile(orderRef.current, i, to, locked));
      setFocusId(id);
      announce(`Moved ${word(id)} to position ${to + 1} of ${orderRef.current.length}.`);
    } else {
      const next = orderRef.current[i + dir];
      if (next) setFocusId(next.id);
    }
  };

  return (
    <div className={`staff ${solved ? 'is-solved' : ''}`}>
      <span className="bar bar-start" aria-hidden="true" />
      <ol className="slots" aria-label="Your line. The words read in order from first to last." data-testid="slots">
        {order.map((t, i) => {
          const isLocked = i < locked;
          const isDragging = drag?.id === t.id;
          const ghostStyle: React.CSSProperties | undefined = isDragging && drag
            ? { position: 'fixed', left: drag.x - drag.offX, top: drag.y - drag.offY, width: drag.w, height: drag.h, zIndex: 60 }
            : undefined;
          return (
            <li
              key={t.id}
              ref={(el) => {
                if (el) items.current.set(t.id, el);
                else items.current.delete(t.id);
              }}
              className={`slot ${isDragging ? 'is-empty' : ''}`}
              style={isDragging && drag ? { width: drag.w, height: drag.h } : undefined}
            >
              <button
                ref={(el) => {
                  if (el) buttons.current.set(t.id, el);
                  else buttons.current.delete(t.id);
                }}
                type="button"
                data-testid={`tile-${i}`}
                className={`tile ${picked === t.id ? 'is-picked' : ''} ${isLocked ? 'is-locked' : ''} ${isDragging ? 'is-dragging' : ''}`}
                style={{ ...ghostStyle, ['--i' as string]: i }}
                aria-pressed={picked === t.id}
                aria-label={`${t.text}, ${i + 1} of ${order.length}${isLocked ? ', locked in place' : ''}`}
                disabled={disabled}
                onPointerDown={(e) => onPointerDown(e, t.id)}
                onClick={(e) => {
                  // Mouse and touch taps are handled by the pointer events. Keyboard and assistive-tech activation arrive here
                  // as clicks with no pointer tap just before them.
                  if (e.detail === 0 && performance.now() - lastPointerTap.current > 800) tap(t.id);
                }}
                onKeyDown={(e) => onKeyDown(e, t.id)}
              >
                {t.text}
              </button>
              <span className="slot-num" aria-hidden="true">{i + 1}</span>
            </li>
          );
        })}
      </ol>
      <span className="bar bar-end" aria-hidden="true" />
    </div>
  );
}
