import { LEVEL_COUNT } from '../data/levels';

export const STORAGE_KEY = 'rhythmrush.v2';

export interface Store {
  /** Levels finished (dance completed or skipped). 0 to LEVEL_COUNT. */
  completed: number;
  volume: number;
  muted: boolean;
  /** Remembers the seated / low-impact choice. */
  seated: boolean;
  /** One player, or two players taking turns on the same device. */
  players: 1 | 2;
}

export const defaultStore = (): Store => ({ completed: 0, volume: 0.7, muted: false, seated: false, players: 1 });

/** Defensive parse: anything unexpected falls back to defaults. */
export function sanitiseStore(raw: unknown): Store {
  const d = defaultStore();
  if (typeof raw !== 'object' || raw === null) return d;
  const r = raw as Record<string, unknown>;
  const completed = typeof r.completed === 'number' && Number.isFinite(r.completed) ? Math.min(LEVEL_COUNT, Math.max(0, Math.floor(r.completed))) : d.completed;
  const volume = typeof r.volume === 'number' && Number.isFinite(r.volume) ? Math.min(1, Math.max(0, r.volume)) : d.volume;
  return {
    completed,
    volume,
    muted: typeof r.muted === 'boolean' ? r.muted : d.muted,
    seated: typeof r.seated === 'boolean' ? r.seated : d.seated,
    players: r.players === 2 ? 2 : 1,
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
    /* storage unavailable (private mode / blocked): the game keeps working without saving */
  }
}
