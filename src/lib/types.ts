import type { ThemeId } from '../data/phrases';

export type ScreenId = 'home' | 'setup' | 'themes' | 'puzzle' | 'music' | 'dance' | 'results' | 'create' | 'challenge' | 'settings';
export type Mode = 'solo' | 'duo';

export interface PuzzleDraft {
  outcome: 'solved' | 'timeout' | 'skipped';
  puzzlePoints: number;
  speedBonus: number;
  hintDeduction: number;
  hintsUsed: number;
  puzzleMs: number;
  restarts: number;
}

export interface TurnRecord {
  player: number;
  phrase: string;
  draft: PuzzleDraft;
  moveCompleted: boolean;
  seated: boolean;
  movePoints: number;
  total: number;
  listenMs: number;
  moveMs: number;
}

export interface ActivePhrase {
  id: string | null;
  text: string;
  /** Nickname of the friend who created a custom/challenge puzzle (optional). */
  from?: string;
  custom: boolean;
}

export interface Session {
  id: string;
  mode: Mode;
  names: string[];
  themeId: ThemeId;
  round: number;
  turnInRound: number;
  turns: TurnRecord[];
  totals: number[];
  usedPhraseIds: string[];
  phrase: ActivePhrase;
  draft?: PuzzleDraft;
  listenMs: number;
  /** Set when this round's results unlocked a new theme. */
  unlockedNow?: string;
  /** Solo only: the stored personal best before this round, and whether it was beaten. */
  previousBest?: number;
  newBest?: boolean;
}
