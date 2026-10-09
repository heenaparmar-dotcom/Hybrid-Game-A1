import { PHRASES, type Phrase, type ThemeId } from '../data/phrases';
import { THEMES, unlockedThemeIds } from '../data/themes';
import { scoreMovement, turnTotal } from './scoring';
import type { Store } from './storage';
import type { ActivePhrase, Mode, Session, TurnRecord } from './types';

export function playersIn(mode: Mode): number {
  return mode === 'duo' ? 2 : 1;
}

export function pickPhrase(themeId: ThemeId, usedIds: string[], rng: () => number = Math.random): { phrase: Phrase; usedIds: string[] } {
  const pool = PHRASES.filter((p) => p.themeId === themeId);
  let fresh = pool.filter((p) => !usedIds.includes(p.id));
  let used = usedIds;
  if (fresh.length === 0) {
    fresh = pool;
    used = usedIds.filter((id) => !pool.some((p) => p.id === id));
  }
  const phrase = fresh[Math.floor(rng() * fresh.length)];
  return { phrase, usedIds: [...used, phrase.id] };
}

let counter = 0;
export function newSessionId(): string {
  counter += 1;
  return `s${Date.now().toString(36)}${counter}`;
}

export function startSession(mode: Mode, names: string[], themeId: ThemeId, custom?: { text: string; from?: string }, rng: () => number = Math.random): Session {
  let phrase: ActivePhrase;
  let usedPhraseIds: string[] = [];
  if (custom) {
    phrase = { id: null, text: custom.text, from: custom.from, custom: true };
  } else {
    const picked = pickPhrase(themeId, [], rng);
    phrase = { id: picked.phrase.id, text: picked.phrase.text, custom: false };
    usedPhraseIds = picked.usedIds;
  }
  const n = playersIn(mode);
  return {
    id: newSessionId(),
    mode,
    names: names.slice(0, n),
    themeId,
    round: 1,
    turnInRound: 0,
    turns: [],
    totals: Array<number>(n).fill(0),
    usedPhraseIds,
    phrase,
    listenMs: 0,
  };
}

export const turnKey = (s: Session): string => `${s.id}-${s.round}-${s.turnInRound}`;
export const isRoundComplete = (s: Session): boolean => s.turns.length >= playersIn(s.mode);

/** Applies a finished turn exactly once. The caller guards against repeat calls with turnKey(). */
export function commitTurn(session: Session, store: Store, input: { moveCompleted: boolean; seated: boolean; moveMs: number }): { session: Session; store: Store } {
  const draft = session.draft;
  if (!draft) return { session, store };
  const movePoints = scoreMovement(input.moveCompleted);
  const total = turnTotal(draft.puzzlePoints, draft.speedBonus, movePoints);
  const record: TurnRecord = {
    player: session.turnInRound,
    phrase: session.phrase.text,
    draft,
    moveCompleted: input.moveCompleted,
    seated: input.seated,
    movePoints,
    total,
    listenMs: session.listenMs,
    moveMs: input.moveMs,
  };
  const totals = [...session.totals];
  totals[record.player] += total;
  const turns = [...session.turns, record];

  const before = unlockedThemeIds(store.progress.successfulRounds);
  const success = draft.outcome === 'solved' && input.moveCompleted;
  const successfulRounds = store.progress.successfulRounds + (success ? 1 : 0);
  const after = unlockedThemeIds(successfulRounds);
  const newlyUnlocked = after.filter((id) => !before.includes(id));

  const next: Session = { ...session, totals, turns, draft: undefined, listenMs: 0 };
  if (newlyUnlocked.length) next.unlockedNow = THEMES.find((t) => t.id === newlyUnlocked[newlyUnlocked.length - 1])?.name;

  let bestSoloRound = store.scores.bestSoloRound;
  if (isRoundComplete(next) && next.mode === 'solo') {
    next.previousBest = bestSoloRound;
    next.newBest = total > bestSoloRound;
    bestSoloRound = Math.max(bestSoloRound, total);
  }

  const nextStore: Store = {
    ...store,
    progress: { successfulRounds },
    scores: { bestSoloRound, bestTurn: Math.max(store.scores.bestTurn, total) },
    timingLog: [
      ...store.timingLog,
      { at: new Date().toISOString(), puzzleMs: Math.round(draft.puzzleMs), listenMs: Math.round(session.listenMs), moveMs: Math.round(input.moveMs), outcome: draft.outcome, moveCompleted: input.moveCompleted, seated: input.seated },
    ].slice(-30),
  };
  return { session: next, store: nextStore };
}

/** Hand over to the next player in the same round. */
export function advanceTurn(session: Session, rng: () => number = Math.random): Session {
  const picked = pickPhrase(session.themeId, session.usedPhraseIds, rng);
  return { ...session, turnInRound: session.turnInRound + 1, usedPhraseIds: picked.usedIds, phrase: { id: picked.phrase.id, text: picked.phrase.text, custom: false } };
}

export function startNextRound(session: Session, rng: () => number = Math.random): Session {
  const picked = pickPhrase(session.themeId, session.usedPhraseIds, rng);
  return {
    ...session,
    round: session.round + 1,
    turnInRound: 0,
    turns: [],
    usedPhraseIds: picked.usedIds,
    phrase: { id: picked.phrase.id, text: picked.phrase.text, custom: false },
    unlockedNow: undefined,
    previousBest: undefined,
    newBest: undefined,
    draft: undefined,
    listenMs: 0,
  };
}

export function roundWinner(session: Session): { kind: 'solo' } | { kind: 'tie' } | { kind: 'win'; player: number } {
  if (session.mode === 'solo') return { kind: 'solo' };
  const [a, b] = session.turns.map((t) => t.total);
  if (a === b) return { kind: 'tie' };
  return { kind: 'win', player: a > b ? 0 : 1 };
}
