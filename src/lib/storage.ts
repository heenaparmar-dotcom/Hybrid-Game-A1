import { SETTING_LIMITS, TIMING } from './constants';

export const STORAGE_KEY = 'rhythmrush.v1';

export interface TurnTiming {
  at: string;
  puzzleMs: number;
  listenMs: number;
  moveMs: number;
  outcome: string;
  moveCompleted: boolean;
  seated: boolean;
}

export interface Store {
  settings: {
    puzzleSeconds: number;
    moveSeconds: number;
    volume: number;
    muted: boolean;
    animatedGuide: boolean;
    names: [string, string];
  };
  progress: { successfulRounds: number };
  scores: { bestSoloRound: number; bestTurn: number };
  timingLog: TurnTiming[];
}

const prefersReducedMotion = (): boolean => {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
};

export function defaultStore(): Store {
  return {
    settings: {
      puzzleSeconds: TIMING.puzzleSeconds,
      moveSeconds: TIMING.moveSeconds,
      volume: 0.7,
      muted: false,
      animatedGuide: !prefersReducedMotion(),
      names: ['Player 1', 'Player 2'],
    },
    progress: { successfulRounds: 0 },
    scores: { bestSoloRound: 0, bestTurn: 0 },
    timingLog: [],
  };
}

const num = (v: unknown, min: number, max: number, fallback: number): number =>
  typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(min, Math.round(v))) : fallback;

const cleanName = (v: unknown, fallback: string): string => {
  if (typeof v !== 'string') return fallback;
  const t = v.replace(/\s+/g, ' ').trim().slice(0, 16);
  return t || fallback;
};

/** Defensive parse: anything unexpected falls back to defaults. */
export function sanitiseStore(raw: unknown): Store {
  const d = defaultStore();
  if (typeof raw !== 'object' || raw === null) return d;
  const r = raw as Record<string, Record<string, unknown> | undefined>;
  const s = r.settings ?? {};
  const names = Array.isArray(s.names) ? s.names : [];
  const rawLog = (raw as { timingLog?: unknown }).timingLog;
  const log = Array.isArray(rawLog) ? rawLog : [];
  return {
    settings: {
      puzzleSeconds: num(s.puzzleSeconds, SETTING_LIMITS.puzzleSeconds.min, SETTING_LIMITS.puzzleSeconds.max, d.settings.puzzleSeconds),
      moveSeconds: num(s.moveSeconds, SETTING_LIMITS.moveSeconds.min, SETTING_LIMITS.moveSeconds.max, d.settings.moveSeconds),
      volume: typeof s.volume === 'number' && Number.isFinite(s.volume) ? Math.min(1, Math.max(0, s.volume)) : d.settings.volume,
      muted: typeof s.muted === 'boolean' ? s.muted : d.settings.muted,
      animatedGuide: typeof s.animatedGuide === 'boolean' ? s.animatedGuide : d.settings.animatedGuide,
      names: [cleanName(names[0], d.settings.names[0]), cleanName(names[1], d.settings.names[1])],
    },
    progress: { successfulRounds: num(r.progress?.successfulRounds, 0, 10_000, 0) },
    scores: { bestSoloRound: num(r.scores?.bestSoloRound, 0, 100_000, 0), bestTurn: num(r.scores?.bestTurn, 0, 100_000, 0) },
    timingLog: log
      .filter(
        (e): e is TurnTiming =>
          typeof e === 'object' && e !== null && typeof (e as TurnTiming).moveMs === 'number' && typeof (e as TurnTiming).puzzleMs === 'number' && typeof (e as TurnTiming).listenMs === 'number',
      )
      .slice(-30),
  };
}

export function loadStore(): Store {
  try {
    const text = window.localStorage.getItem(STORAGE_KEY);
    return text ? sanitiseStore(JSON.parse(text)) : defaultStore();
  } catch {
    return defaultStore();
  }
}

export function saveStore(store: Store): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    /* storage unavailable (private mode / blocked): the game keeps working without persistence */
  }
}
