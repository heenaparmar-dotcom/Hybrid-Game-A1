import type { TrackId } from './tracks';

/**
 * Level 3 "Feel the Rhythm" listening challenges.
 *
 * The player hears a short clip, then picks the line they heard from three choices.
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
  /** The original line the clip contains (the correct answer). */
  line: string;
  /** Exactly three choices, including `line`. They are shuffled each time. */
  options: [string, string, string];
  /** Authorised recording to play instead of the placeholder. Leave empty until you have one. */
  src?: string;
  /** Placeholder music: which of the game's original songs to play, and for how many seconds. */
  placeholder: { track: TrackId; seconds: number; voiceAt: number; lang: string };
}

export const LISTEN_CHALLENGES: readonly ListenChallenge[] = [
  {
    id: 'l3-listen-1',
    title: 'Clip 1',
    line: 'Feel the drums inside your chest',
    options: ['Feel the drums inside your chest', 'Feel the waves inside your chest', 'Feel the dawn inside your chest'],
    placeholder: { track: 'sunrise', seconds: 9, voiceAt: 2.2, lang: 'en-US' },
  },
  {
    id: 'l3-listen-2',
    title: 'Clip 2',
    line: 'Turn the lights down low and sway',
    options: ['Turn the lights down low and sway', 'Turn the music up and play', 'Turn the lights up high and stay'],
    placeholder: { track: 'hookstep', seconds: 9, voiceAt: 2.2, lang: 'en-US' },
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
