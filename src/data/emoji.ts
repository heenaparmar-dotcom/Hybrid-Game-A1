/** The complete emoji vocabulary of the game: exactly 10 distinct emoji, always paired with a text label. */
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
  { emoji: '🤝', label: 'Connected', kind: 'mood' },
  { emoji: '👏', label: 'Nice moves', kind: 'reaction' },
  { emoji: '🎵', label: 'Great song', kind: 'reaction' },
  { emoji: '💃', label: 'Great dance', kind: 'reaction' },
  { emoji: '🧩', label: 'Clever puzzle', kind: 'reaction' },
];
