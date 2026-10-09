import { useEffect, useRef, useState } from 'react';

/**
 * Free-running beat counter for decorative animation (title screen). Pauses when the tab is hidden.
 * `maxFps` limits how often it updates, which keeps slow phones smooth: slow dance motion looks the same at 30 fps.
 */
export function useBeat(bpm: number, active = true, maxFps = 60): number {
  const [beat, setBeat] = useState(0);
  const start = useRef<number | null>(null);
  const lastUpdate = useRef(0);

  useEffect(() => {
    if (!active) return;
    let raf = 0;
    const tick = (now: number) => {
      if (start.current === null) start.current = now;
      if (now - lastUpdate.current >= 1000 / maxFps - 1) {
        lastUpdate.current = now;
        setBeat(((now - start.current) / 1000) * (bpm / 60));
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [bpm, active, maxFps]);

  return beat;
}

export function prefersReducedMotion(): boolean {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}
