/**
 * Recordings for the song puzzles, keyed by puzzle id. The file goes in public/audio/ and its name goes here.
 * A song with a recording plays it (audio only) for the dance; a song without one uses the game's own music.
 * Only add recordings you have the right to publish: they are served to everyone who opens the game.
 */
export const SONG_AUDIO: Record<string, string> = {
  'l1-s02': 'kala-chashma.mp3', // Kala Chashma
};
