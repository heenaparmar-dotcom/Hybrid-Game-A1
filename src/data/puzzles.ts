import { LYRIC_LINES } from './lyricLines';
import { SONG_AUDIO } from './songAudio';
/**
 * ORIGINAL SONG LINES written for this project. None of them is a lyric from an existing song.
 * To add a puzzle, append an entry to the right level: the id must be unique, the words in a line should be distinct,
 * and the number of words must match the level (L1: 4, L2: 5, L3: 6) so the difficulty stays in order.
 * Level 2 lines are Hindi written in Roman letters (readable on every device) with a plain-English meaning.
 *
 * Entries with a `song` are Hindi film-song challenges. They contain ONLY the song title (as the scrambled words) and a short
 * factual hint (year and film). No lyrics from those songs are used anywhere, and no recording of them is played.
 */
import type { TrackId } from './tracks';

export interface Puzzle {
  id: string;
  level: 1 | 2 | 3;
  /** The correct word order. The game shuffles it every attempt and compares the player's order to THIS line. */
  phrase: string;
  /** Plain-English meaning, shown after solving a non-English line. */
  meaning?: string;
  /**
   * Set for the Hindi film-song challenges. The scrambled words are the song's TITLE (a title is not a lyric excerpt).
   * `hint` stays on screen while the player solves it; `title` is shown once it is solved.
   */
  song?: { title: string; hint: string };
  /** Which of the game's own original dance tracks to use for this puzzle (default: the level's track). */
  trackId?: TrackId;
  /**
   * An official, embeddable YouTube video of the song. When set, the dance plays that video through YouTube's own player
   * (nothing is copied or downloaded) and falls back to the game's own music if it cannot play.
   * `start` is the second of the video where the 30-second dance begins; `credit` is shown to the player.
   */
  video?: { id: string; start?: number; credit: string };
  /** A recorded audio file of the song (in public/audio). Played instead of the video; if it cannot load, the video is used. */
  audio?: { src: string; start?: number; credit: string };
}

const BASE_PUZZLES: readonly Puzzle[] = [
  // Level 1: four English words
  { id: 'l1-01', level: 1, phrase: 'Sway with the sunrise' },
  { id: 'l1-02', level: 1, phrase: 'Drums wake the morning' },
  { id: 'l1-03', level: 1, phrase: 'Light feet loud smiles' },
  { id: 'l1-04', level: 1, phrase: 'Spin through the kitchen' },
  { id: 'l1-05', level: 1, phrase: 'Hum while you stretch' },
  { id: 'l1-06', level: 1, phrase: 'Shake out sleepy shoulders' },
  { id: 'l1-07', level: 1, phrase: 'Footsteps find the rhythm' },
  { id: 'l1-08', level: 1, phrase: 'Bright mornings beat faster' },
  { id: 'l1-09', level: 1, phrase: 'Walk wiggle wave hello' },
  { id: 'l1-10', level: 1, phrase: 'Echo the happy drums' },
  { id: 'l1-11', level: 1, phrase: 'Little steps big groove' },
  { id: 'l1-12', level: 1, phrase: 'Breathe in bounce out' },
  { id: 'l1-13', level: 1, phrase: 'Giggle and glide softly' },
  { id: 'l1-14', level: 1, phrase: 'Toes tap tiny rhythms' },
  { id: 'l1-15', level: 1, phrase: 'Warm up your wonder' },
  { id: 'l1-16', level: 1, phrase: 'Wiggle through the hallway' },
  { id: 'l1-17', level: 1, phrase: 'Wide windows open arms' },
  { id: 'l1-18', level: 1, phrase: 'Chase the bouncing beat' },
  { id: 'l1-19', level: 1, phrase: 'Stretch tall sing small' },
  { id: 'l1-20', level: 1, phrase: 'Dance before your breakfast' },

  // Level 1: Hindi film songs. The words to arrange are the song title.
  { id: 'l1-s01', level: 1, trackId: 'hookstep', phrase: 'Badtameez Dil', song: { title: 'Badtameez Dil', hint: '2013 · Yeh Jawaani Hai Deewani' } },
  { id: 'l1-s02', level: 1, trackId: 'nacho', phrase: 'Kala Chashma', song: { title: 'Kala Chashma', hint: '2016 · Baar Baar Dekho' }, video: { id: 'k4yXQkG2s1E', start: 0, credit: 'Zee Music Company' } },
  { id: 'l1-s03', level: 1, trackId: 'sunrise', phrase: 'Gallan Goodiyaan', song: { title: 'Gallan Goodiyaan', hint: '2015 · Dil Dhadakne Do' } },
  { id: 'l1-s04', level: 1, trackId: 'hookstep', phrase: 'London Thumakda', song: { title: 'London Thumakda', hint: '2014 · Queen' } },
  { id: 'l1-s05', level: 1, trackId: 'nacho', phrase: 'What Jhumka?', song: { title: 'What Jhumka?', hint: '2023 · Rocky Aur Rani Kii Prem Kahaani' } },
  { id: 'l1-s06', level: 1, trackId: 'hookstep', phrase: 'Aankh Marey', song: { title: 'Aankh Marey', hint: '2018 · Simmba' } },
  // Two identical words cannot be shuffled, so this one adds the film name to the fragments: Dil Se, Chaiyya, Chaiyya.
  { id: 'l1-s07', level: 1, trackId: 'sunrise', phrase: 'Dil Se Chaiyya Chaiyya', song: { title: 'Chaiyya Chaiyya', hint: '1998 · Famously filmed on top of a moving train' } },
  { id: 'l1-s08', level: 1, trackId: 'nacho', phrase: 'Kajra Re', song: { title: 'Kajra Re', hint: '2005 · Bunty Aur Babli' } },
  { id: 'l1-s09', level: 1, trackId: 'nacho', phrase: 'Jai Jai Shivshankar', song: { title: 'Jai Jai Shivshankar', hint: '2019 · War' } },
  { id: 'l1-s10', level: 1, trackId: 'hookstep', phrase: 'Dilliwaali Girlfriend', song: { title: 'Dilliwaali Girlfriend', hint: '2013 · Yeh Jawaani Hai Deewani' } },

  // Level 2: five Hindi words (Roman script)
  { id: 'l2-01', level: 2, phrase: 'Aaj dil khol ke nacho', meaning: 'Today, dance with an open heart' },
  { id: 'l2-02', level: 2, phrase: 'Dhol bajao saath mein nacho', meaning: 'Play the dhol and dance together' },
  { id: 'l2-03', level: 2, phrase: 'Hum sab milkar jhoomenge aaj', meaning: 'All of us will sway together today' },
  { id: 'l2-04', level: 2, phrase: 'Taal pe taali bajao yaar', meaning: 'Clap to the beat, friend' },
  { id: 'l2-05', level: 2, phrase: 'Subah ki dhoop mein nacho', meaning: 'Dance in the morning sunshine' },
  { id: 'l2-06', level: 2, phrase: 'Pair uthao aur jhoom jao', meaning: 'Lift your feet and sway away' },
  { id: 'l2-07', level: 2, phrase: 'Muskurao aur thoda sa ghoomo', meaning: 'Smile and turn around a little bit' },
  { id: 'l2-08', level: 2, phrase: 'Sangeet ke saath jhoomo aaj', meaning: 'Sway with the music today' },
  { id: 'l2-09', level: 2, phrase: 'Haath upar karo aur nacho', meaning: 'Raise your hands and dance' },
  { id: 'l2-10', level: 2, phrase: 'Mere dost ke saath nacho', meaning: 'Dance with my friend' },
  { id: 'l2-11', level: 2, phrase: 'Chalo thodi der saath jhoomein', meaning: "Come, let's sway together for a while" },
  { id: 'l2-12', level: 2, phrase: 'Kadam milao aur saath nacho', meaning: 'Match your steps and dance together' },
  { id: 'l2-13', level: 2, phrase: 'Dil ki dhun pe nacho', meaning: 'Dance to the tune of your heart' },
  { id: 'l2-14', level: 2, phrase: 'Khushi ke geet pe jhoomo', meaning: 'Sway to the song of joy' },
  { id: 'l2-15', level: 2, phrase: 'Aaj raat khoob nachenge hum', meaning: 'We will dance a lot tonight' },
  { id: 'l2-16', level: 2, phrase: 'Dheere se jhoomo mere yaar', meaning: 'Sway slowly, my friend' },
  { id: 'l2-17', level: 2, phrase: 'Ghar mein bhi nacho aaj', meaning: 'Dance at home too today' },
  { id: 'l2-18', level: 2, phrase: 'Neeche jhuko phir upar utho', meaning: 'Bend down, then rise up' },
  { id: 'l2-19', level: 2, phrase: 'Tez dhun par khoob nacho', meaning: 'Dance a lot to the fast tune' },
  { id: 'l2-20', level: 2, phrase: 'Geet gungunao aur saath jhoomo', meaning: 'Hum a song and sway along' },

  // Level 2: Hindi film songs. The words to arrange are the song title, exactly as supplied (capitals, TOH and repeated words kept).
  { id: 'l2-s01', level: 2, phrase: 'PEHLA NASHA', song: { title: 'Pehla Nasha', hint: '1992 · Jo Jeeta Wohi Sikandar' } },
  { id: 'l2-s02', level: 2, phrase: 'DO DIL MIL RAHE HAIN', song: { title: 'Do Dil Mil Rahe Hain', hint: '1998 · Pardes' } },
  { id: 'l2-s03', level: 2, phrase: 'TUJHE DEKHA TOH YE JAANA SANAM', song: { title: 'Tujhe Dekha To Ye Jaana Sanam', hint: '1995 · Dilwale Dulhania Le Jayenge' } },
  { id: 'l2-s04', level: 2, phrase: 'KUCH KUCH HOTA HAI', song: { title: 'Kuch Kuch Hota Hai', hint: '1998 · Kuch Kuch Hota Hai' } },
  { id: 'l2-s05', level: 2, phrase: 'PARDESI PARDESI JAANA NAHI', song: { title: 'Pardesi Pardesi Jaana Nahi', hint: '1996 · Raja Hindustani' } },

  // Level 3: six English words
  { id: 'l3-01', level: 3, phrase: 'Let the rhythm carry us forward' },
  { id: 'l3-02', level: 3, phrase: 'Our footsteps write a new song' },
  { id: 'l3-03', level: 3, phrase: 'Gather friends and find the groove' },
  { id: 'l3-04', level: 3, phrase: 'Slow breaths turn into bright movement' },
  { id: 'l3-05', level: 3, phrase: 'Tired shoulders remember how to sway' },
  { id: 'l3-06', level: 3, phrase: 'The evening gathers all our laughter' },
  { id: 'l3-07', level: 3, phrase: 'Share the beat with someone kind' },
  { id: 'l3-08', level: 3, phrase: 'Every breeze carries a tiny melody' },
  { id: 'l3-09', level: 3, phrase: 'Move gently and the music follows' },
  { id: 'l3-10', level: 3, phrase: 'Bring your sparkle to the floor' },
  { id: 'l3-11', level: 3, phrase: 'Small circles become a big dance' },
  { id: 'l3-12', level: 3, phrase: 'Count the beats and keep smiling' },
  { id: 'l3-13', level: 3, phrase: 'We learned the steps by heart' },
  { id: 'l3-14', level: 3, phrase: 'Nothing feels heavy when we sway' },
  { id: 'l3-15', level: 3, phrase: 'Mornings are better with a soundtrack' },
  { id: 'l3-16', level: 3, phrase: 'Your rhythm belongs in every room' },
  { id: 'l3-17', level: 3, phrase: 'Raise a hand and greet today' },
  { id: 'l3-18', level: 3, phrase: 'Wander slowly through a warm melody' },
  { id: 'l3-19', level: 3, phrase: 'Brave little feet start the party' },
  { id: 'l3-20', level: 3, phrase: 'Together we turn minutes into music' },
];

/** A song puzzle can use a line you supply (see lyricLines.ts) instead of the title; the title is revealed once it is solved. */
export const PUZZLES: readonly Puzzle[] = BASE_PUZZLES.map((p) => {
  const line = LYRIC_LINES[p.id];
  const file = SONG_AUDIO[p.id];
  return {
    ...p,
    ...(line ? { phrase: line.replace(/\s*\/\s*/g, ' ').trim() } : {}),
    ...(file && p.song ? { audio: { src: `audio/${file}`, start: 0, credit: p.song.title } } : {}),
  };
});

export function puzzlesForLevel(level: number): Puzzle[] {
  return PUZZLES.filter((p) => p.level === level);
}

/**
 * Levels that are played with the Hindi film-song puzzles only. The original word-order lines stay in this file
 * (nothing was deleted) but Warm Up and Find the Beat now draw only from the song puzzles.
 */
export const SONG_ONLY_LEVELS: readonly number[] = [1, 2];

/** The puzzles a level actually draws from. */
export function playablePuzzles(level: number): Puzzle[] {
  const all = puzzlesForLevel(level);
  return SONG_ONLY_LEVELS.includes(level) ? all.filter((p) => p.song) : all;
}

/**
 * Pick a random puzzle for a level, never the one just played (when the level has another one to offer).
 * The candidate list keeps the data order, so a given random number maps to a given puzzle (handy for tests).
 */
export function pickPuzzle(level: number, previousId?: string, rng: () => number = Math.random): Puzzle {
  const pool = playablePuzzles(level);
  const candidates = pool.length > 1 ? pool.filter((p) => p.id !== previousId) : pool;
  return candidates[Math.min(candidates.length - 1, Math.floor(rng() * candidates.length))];
}
