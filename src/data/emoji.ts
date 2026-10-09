/** The whole emoji vocabulary of the game: 8 distinct emoji (limit: 10), always shown next to a text label. */
export interface EmojiItem {
  emoji: string;
  label: string;
  kind: 'mood' | 'reaction';
}

export const EMOJI: readonly EmojiItem[] = [
  { emoji: '😄', label: 'Happy', kind: 'mood' },
  { emoji: '😌', label: 'Calm', kind: 'mood' },
  { emoji: '🔥', label: 'Energised', kind: 'mood' },
  { emoji: '😅', label: 'A bit tired', kind: 'mood' },
  { emoji: '💪', label: 'Strong', kind: 'mood' },
  { emoji: '👏', label: 'Nice moves', kind: 'reaction' },
  { emoji: '🎵', label: 'Great song', kind: 'reaction' },
  { emoji: '💃', label: 'Great dance', kind: 'reaction' },
];

export const MAX_EMOJI = 10;
