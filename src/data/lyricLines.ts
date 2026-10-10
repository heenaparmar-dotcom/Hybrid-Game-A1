/**
 * Optional lyric lines for the song puzzles, keyed by puzzle id (for example 'l1-s02' is Kala Chashma).
 * When a line is set here, the player unscrambles that line and the song's name is revealed once they solve it.
 * Only add a line you have permission to use: the game ships no film-song lyrics of its own.
 * Keep it to 3 to 8 words so it fits the tile board and the 10-second timer.
 */
export const LYRIC_LINES: Record<string, string> = {
  'l1-s02': 'KALA / CHASHMA / JACHDA / AE / GORE / MUKHDE / PE',
  'l1-s01': 'ZID / PAKAD / KE / KHADA / HAI / KAMBAKHT / CHHODNA / JAANE / NA',
  'l1-s03': 'HELLO / HELLO / TU FLOOR PE KAB HAI AAYI'
};
