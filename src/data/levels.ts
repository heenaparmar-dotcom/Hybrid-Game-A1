import type { TrackId } from './tracks';

/**
 * ORIGINAL SONG LINES written for this project. They are not lyrics from any existing song.
 * Level 2 is written in Hindi using Roman letters so it is readable on every device.
 */
export interface Level {
  n: 1 | 2 | 3;
  name: string;
  trackId: TrackId;
  phrase: string;
  /** Plain-English meaning, shown after solving a non-English line. */
  meaning?: string;
  /** Short instruction for the puzzle screen. */
  prompt: string;
}

export const LEVELS: readonly Level[] = [
  { n: 1, name: 'Warm Up', trackId: 'sunrise', phrase: 'Sway with the sunrise', prompt: 'Four words. Put the line back in order.' },
  {
    n: 2, name: 'Find the Beat', trackId: 'nacho', phrase: 'Aaj dil khol ke nacho',
    meaning: 'Today, dance with an open heart', prompt: 'A Hindi line this time. Five words.',
  },
  { n: 3, name: 'Feel the Rhythm', trackId: 'hookstep', phrase: 'Let the rhythm carry us forward', prompt: 'Six words. Listen for the flow.' },
];

export const LEVEL_COUNT = LEVELS.length;

export function levelByNumber(n: number): Level {
  return LEVELS.find((l) => l.n === n) ?? LEVELS[0];
}
