import type { TrackId } from './tracks';

/**
 * Level 3 "Feel the Rhythm" listening challenges.
 *
 * The player hears an instrumental clip (a piano or flute cover) and picks which song it was from three song titles.
 *
 * PLACEHOLDER AUDIO. No licensed recording is configured, so each clip is original music generated in the browser
 * with an original line spoken over it by the browser's built-in voice. All lines below were written for this project.
 *
 * To use a real, properly licensed recording for a challenge:
 *   1. Put the audio file in `public/audio/` (for example `public/audio/level3-clip-1.mp3`).
 *   2. Set `src` below to its path, e.g. `src: 'audio/level3-clip-1.mp3'` (relative, no leading slash).
 *   3. Replace `line` and `options` with text you are permitted to use (the rights holder's permission or licence covers
 *      both the recording and any lyric text you quote), and record the licence in docs/ASSIGNMENT_DOCUMENTATION.md.
 * If `src` fails to load, the game falls back to the placeholder clip and says so.
 */
export interface ListenChallenge {
  id: string;
  /** Short name shown to the player. */
  title: string;
  /** The correct answer: the title of the song in the clip (or, for a demo clip, the line it contains). */
  line: string;
  /** A non-spoiler clue for a player who cannot listen, such as the instrument. */
  clue?: string;
  /** Exactly three choices, including `line`. They are shuffled each time. */
  options: [string, string, string];
  /** Authorised recording to play instead of the placeholder. Leave empty until you have one. */
  src?: string;
  /** Placeholder music: which of the game's original songs to play, and for how many seconds. */
  placeholder: { track: TrackId; seconds: number; voiceAt: number; lang: string };
}

const SONGS: [string, string, string] = ['Pehla Nasha', 'Dekha Hazaro Dafa', 'Lag Ja Gale'];

export const LISTEN_CHALLENGES: readonly ListenChallenge[] = [
  {
    id: 'l3-listen-1',
    title: 'Clip 1',
    line: 'Pehla Nasha',
    options: SONGS,
    clue: 'Played on a piano.',
    src: 'audio/listen-pehla-nasha.mp3',
    placeholder: { track: 'sunrise', seconds: 9, voiceAt: 2.2, lang: 'en-US' },
  },
  {
    id: 'l3-listen-2',
    title: 'Clip 2',
    line: 'Dekha Hazaro Dafa',
    options: SONGS,
    clue: 'Played on a flute.',
    src: 'audio/listen-dekha-hazaro-dafa.mp3',
    placeholder: { track: 'hookstep', seconds: 9, voiceAt: 2.2, lang: 'en-US' },
  },
  {
    id: 'l3-listen-3',
    title: 'Clip 3',
    line: 'Lag Ja Gale',
    options: SONGS,
    clue: 'Played on a piano or keyboard.',
    src: 'audio/listen-lag-ja-gale.mp3',
    placeholder: { track: 'nacho', seconds: 9, voiceAt: 2.2, lang: 'en-US' },
  },
];

/** Both challenges, in a random order each time the level is entered. */
export function listenOrder(rng: () => number = Math.random): ListenChallenge[] {
  const list = [...LISTEN_CHALLENGES];
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

/** The three choices in a fresh random order. */
export function shuffledOptions(c: ListenChallenge, rng: () => number = Math.random): string[] {
  const list = [...c.options];
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}
