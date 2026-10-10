/**
 * The three ORIGINAL songs in the game. Each one is synthesised live in the browser (see lib/audio.ts),
 * so there are no recordings and nothing to license. Titles, lyrics-style lines and routines were written for this project.
 */
export type TrackId = 'sunrise' | 'nacho' | 'hookstep';

export interface Track {
  id: TrackId;
  /** 1-based number used inside challenge links. */
  code: 1 | 2 | 3;
  title: string;
  language: 'English' | 'Hindi';
  style: string;
  blurb: string;
  bpm: number;
  /** How lively the dancers are (1 = normal): scales their beat-driven bounce, sway and swing. */
  energy: number;
  /** Move ids, in order. The whole sequence is danced `repeats` times. */
  moves: string[];
  repeats: number;
}

/** Each move lasts 2 bars. */
export const BEATS_PER_MOVE = 8;
/** Beats of "find your spot" before the routine starts. */
export const COUNT_IN_BEATS = 8;
/** Every dance (count-in included) lasts this many seconds. The lengths below are chosen so the maths is exact. */
export const DANCE_TOTAL_SECONDS = 30;

export const TRACKS: readonly Track[] = [
  {
    id: 'sunrise',
    code: 1,
    title: 'Sunrise Sway',
    language: 'English',
    style: 'Warm pop groove',
    blurb: 'Easy sways and big reaches. A gentle first dance.',
    bpm: 112,
    energy: 0.85,
    moves: ['sway', 'reach', 'step'],
    repeats: 2,
  },
  {
    id: 'nacho',
    code: 2,
    title: 'Nacho Aaj',
    language: 'Hindi',
    style: 'Dhol-inspired groove',
    blurb: 'Salsa steps, bhangra arm lifts, a grapevine and a bouncy finish.',
    bpm: 96,
    energy: 1.2,
    moves: ['salsa', 'bhangra', 'grapevine', 'merengue', 'jump'],
    repeats: 1,
  },
  {
    id: 'hookstep',
    code: 3,
    title: 'Hook-Step Party',
    language: 'English',
    style: 'Latin-pop, Zumba-inspired',
    blurb: 'Merengue marching, turns, waves and party hops. The liveliest of the three.',
    bpm: 128,
    energy: 1.35,
    moves: ['merengue', 'twist', 'wave', 'jump', 'grapevine', 'salsa', 'reach'],
    repeats: 1,
  },
];

export function trackById(id: TrackId): Track {
  return TRACKS.find((t) => t.id === id) ?? TRACKS[0];
}

export function trackByCode(code: number): Track | undefined {
  return TRACKS.find((t) => t.code === code);
}

export const routineBeats = (t: Track): number => t.moves.length * BEATS_PER_MOVE * t.repeats;
export const beatSeconds = (t: Track): number => 60 / t.bpm;
/** Length of the dance itself, without the count-in. */
export const routineSeconds = (t: Track): number => routineBeats(t) * beatSeconds(t);
/** Total time from pressing "Let's dance" to the end, including the count-in. */
export const totalSeconds = (t: Track): number => (routineBeats(t) + COUNT_IN_BEATS) * beatSeconds(t);
