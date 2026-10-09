/** Single source of truth for scoring, timing and unlock rules. The Rule Book reads these values. */
export const SCORING = {
  puzzleBase: 100,
  speedBonusMax: 50,
  hintPenalty: 20,
  maxHints: 3,
  movePoints: 100,
} as const;

export const TIMING = {
  /** Default puzzle countdown (seconds). */
  puzzleSeconds: 45,
  /** Default movement phase length (seconds). */
  moveSeconds: 120,
  /** Soft guide for the listen/preview step (not enforced). */
  listenGuideSeconds: 30,
  /** Design allowance for result feedback and turn hand-offs (seconds). */
  transitionAllowanceSeconds: 45,
} as const;

export const SETTING_LIMITS = {
  puzzleSeconds: { min: 3, max: 300 },
  moveSeconds: { min: 4, max: 600 },
} as const;

export const PUZZLE_PRESETS = [
  { label: 'Quick demo', seconds: 20 },
  { label: 'Standard', seconds: 45 },
  { label: 'Relaxed', seconds: 60 },
] as const;

export const MOVE_PRESETS = [
  { label: 'Quick demo', seconds: 24 },
  { label: 'Short', seconds: 60 },
  { label: 'Standard', seconds: 120 },
  { label: 'Long', seconds: 180 },
] as const;

/** Song-and-dance turns (puzzle solved AND movement completed) needed per extra theme. */
export const UNLOCK_STEP = 2;

export const PHRASE_LIMITS = { minWords: 3, maxWords: 8, maxWordLength: 14, maxChars: 60, maxNickname: 16 } as const;

export const MOVES_PER_SEQUENCE = 8;
