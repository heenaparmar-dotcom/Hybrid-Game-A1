import { UNLOCK_STEP } from '../lib/constants';
import type { ThemeId } from './phrases';

export interface Theme {
  id: ThemeId;
  name: string;
  blurb: string;
  bpm: number;
  /** Song-and-dance turns needed to unlock. */
  unlockAt: number;
}

export const THEMES: readonly Theme[] = [
  { id: 'fresh', name: 'Fresh Beats', blurb: 'Bright, bouncy and easy to follow. Perfect for a first round.', bpm: 112, unlockAt: 0 },
  { id: 'retro', name: 'Retro Rewind', blurb: 'A slower, swinging groove with warm old-school tones.', bpm: 96, unlockAt: UNLOCK_STEP },
  { id: 'hook', name: 'Hook-Step Party', blurb: 'The fastest tempo, with hook-step moves for a party feel.', bpm: 124, unlockAt: UNLOCK_STEP * 2 },
];

export function themeById(id: ThemeId): Theme {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}

export function unlockedThemeIds(successfulRounds: number): ThemeId[] {
  return THEMES.filter((t) => successfulRounds >= t.unlockAt).map((t) => t.id);
}

export function nextLockedTheme(successfulRounds: number): Theme | undefined {
  return THEMES.find((t) => successfulRounds < t.unlockAt);
}
