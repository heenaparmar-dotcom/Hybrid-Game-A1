import type { TrackId } from './tracks';

/** The three levels. Their song lines live in puzzles.ts (20 per level). */
export interface Level {
  n: 1 | 2 | 3;
  name: string;
  trackId: TrackId;
  /** Short instruction for the puzzle screen. */
  prompt: string;
}

export const LEVELS: readonly Level[] = [
  { n: 1, name: 'Warm Up', trackId: 'sunrise', prompt: 'Four words. Put the line back in order.' },
  { n: 2, name: 'Find the Beat', trackId: 'nacho', prompt: 'A Hindi line this time. Five words.' },
  { n: 3, name: 'Feel the Rhythm', trackId: 'hookstep', prompt: 'Six words. Listen for the flow.' },
];

export const LEVEL_COUNT = LEVELS.length;

export function levelByNumber(n: number): Level {
  return LEVELS.find((l) => l.n === n) ?? LEVELS[0];
}
