import { useEffect, useRef, useState } from 'react';

/** Free-running beat counter for decorative animation (title screen). Pauses when the tab is hidden. */
export function useBeat(bpm: number, active = true): number {
  const [beat, setBeat] = useState(0);
  const start = useRef<number | null>(null);

  useEffect(() => {
    if (!active) return;
    let raf = 0;
    const tick = (now: number) => {
      if (start.current === null) start.current = now;
      setBeat(((now - start.current) / 1000) * (bpm / 60));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [bpm, active]);

  return beat;
}

export function prefersReducedMotion(): boolean {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}
