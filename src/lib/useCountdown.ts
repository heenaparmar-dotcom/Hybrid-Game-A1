import { useEffect, useRef, useState } from 'react';

/** Pausable countdown. Only time spent while `running` is true is counted. */
export function useCountdown(totalMs: number, running: boolean, onEnd?: () => void) {
  const [elapsedMs, setElapsedMs] = useState(0);
  const elapsed = useRef(0);
  const last = useRef<number | null>(null);
  const ended = useRef(false);
  const onEndRef = useRef(onEnd);
  useEffect(() => {
    onEndRef.current = onEnd;
  });

  useEffect(() => {
    if (!running) return;
    last.current = performance.now();
    const id = window.setInterval(() => {
      const now = performance.now();
      elapsed.current += now - (last.current ?? now);
      last.current = now;
      const e = Math.min(elapsed.current, totalMs);
      setElapsedMs(e);
      if (e >= totalMs && !ended.current) {
        ended.current = true;
        onEndRef.current?.();
      }
    }, 100);
    return () => {
      window.clearInterval(id);
      if (last.current !== null) elapsed.current += performance.now() - last.current;
      last.current = null;
    };
  }, [running, totalMs]);

  return {
    elapsedMs,
    remainingMs: Math.max(0, totalMs - elapsedMs),
    finished: elapsedMs >= totalMs,
    /** Exact active time so far (not limited to the 100 ms render tick). */
    exactElapsedMs: () => Math.min(totalMs, elapsed.current + (last.current !== null ? performance.now() - last.current : 0)),
  };
}

export function formatClock(ms: number): string {
  const total = Math.ceil(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}
