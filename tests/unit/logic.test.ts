import { describe, expect, it } from 'vitest';
import { PHRASES } from '../../src/data/phrases';
import { THEMES, nextLockedTheme, unlockedThemeIds } from '../../src/data/themes';
import { SEQUENCES, sequenceFor } from '../../src/data/moves';
import { SCORING, TIMING } from '../../src/lib/constants';
import { scoreMovement, scorePuzzle, turnTotal } from '../../src/lib/scoring';
import { applyHint, countCorrect, moveTile, sameOrder, scramble, swapTiles, tokenise } from '../../src/lib/scramble';
import { commitTurn, isRoundComplete, advanceTurn, roundWinner, startNextRound, startSession } from '../../src/lib/session';
import { defaultStore, sanitiseStore } from '../../src/lib/storage';
import type { PuzzleDraft } from '../../src/lib/types';

const seeded = (seed: number) => () => {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
};

const solvedDraft = (over: Partial<PuzzleDraft> = {}): PuzzleDraft => ({ outcome: 'solved', puzzlePoints: 100, speedBonus: 25, hintDeduction: 0, hintsUsed: 0, puzzleMs: 20000, restarts: 0, ...over });

describe('scoring', () => {
  it('awards base + speed bonus with no hints', () => {
    expect(scorePuzzle(45000, 45000, 0)).toEqual({ puzzlePoints: 100, speedBonus: 50, hintDeduction: 0 });
    expect(scorePuzzle(0, 45000, 0).speedBonus).toBe(0);
    expect(scorePuzzle(22500, 45000, 0).speedBonus).toBe(25);
  });
  it('deducts 20 per hint and never goes negative', () => {
    expect(scorePuzzle(0, 45000, 2).puzzlePoints).toBe(60);
    expect(scorePuzzle(0, 45000, 99).puzzlePoints).toBe(0);
    expect(scorePuzzle(10000, 45000, 1).hintDeduction).toBe(SCORING.hintPenalty);
  });
  it('clamps odd inputs', () => {
    expect(scorePuzzle(-5, 45000, 0).speedBonus).toBe(0);
    expect(scorePuzzle(90000, 45000, 0).speedBonus).toBe(50);
    expect(scorePuzzle(1000, 0, 0).speedBonus).toBe(0);
  });
  it('movement is all-or-nothing and style independent', () => {
    expect(scoreMovement(true)).toBe(100);
    expect(scoreMovement(false)).toBe(0);
    expect(turnTotal(100, 50, 100)).toBe(250);
  });
});

describe('timing design', () => {
  it('planned digital time roughly equals planned physical time', () => {
    const digital = TIMING.puzzleSeconds + TIMING.listenGuideSeconds + TIMING.transitionAllowanceSeconds;
    expect(digital).toBe(120);
    expect(TIMING.moveSeconds).toBe(120);
  });
});

describe('puzzle mechanics', () => {
  it('has at least 12 original demo phrases with valid word counts', () => {
    expect(PHRASES.length).toBeGreaterThanOrEqual(12);
    expect(new Set(PHRASES.map((p) => p.id)).size).toBe(PHRASES.length);
    for (const p of PHRASES) expect(tokenise(p.text).length).toBeGreaterThanOrEqual(4);
  });
  it('every theme has enough phrases for a two-player round without repeats', () => {
    for (const t of THEMES) expect(PHRASES.filter((p) => p.themeId === t.id).length).toBeGreaterThanOrEqual(2);
  });
  it('scramble never returns the solved order', () => {
    for (const p of PHRASES) {
      const sol = tokenise(p.text);
      for (let i = 1; i <= 25; i++) expect(sameOrder(scramble(sol, seeded(i)), sol)).toBe(false);
    }
  });
  it('treats duplicate words as interchangeable', () => {
    const sol = tokenise('Find your rhythm, find your flow');
    const swapped = [...sol];
    [swapped[0], swapped[3]] = [swapped[3], swapped[0]];
    expect(sameOrder(swapped, sol)).toBe(true);
  });
  it('hint locks the next wrong position and eventually solves', () => {
    const sol = tokenise('Move with the morning light');
    let order = scramble(sol, seeded(7));
    let locked = 0;
    for (let i = 0; i < 5; i++) {
      const res = applyHint(order, locked, sol);
      if (!res) break;
      order = res.order;
      locked = res.locked;
      expect(order[locked - 1].norm).toBe(sol[locked - 1].norm);
    }
    expect(sameOrder(order, sol)).toBe(true);
  });
  it('hint returns null when already solved (no hint is wasted)', () => {
    const sol = tokenise('Step into a brighter day');
    expect(applyHint(sol, 0, sol)).toBeNull();
  });
  it('counts correct positions and respects locked prefix when moving', () => {
    const sol = tokenise('a b c d');
    expect(countCorrect(sol, sol)).toBe(4);
    const list = [1, 2, 3, 4];
    expect(moveTile(list, 0, 2, 1)).toEqual(list);
    expect(moveTile(list, 3, 1, 1)).toEqual([1, 4, 2, 3]);
    expect(swapTiles(list, 0, 3, 1)).toEqual(list);
    expect(swapTiles(list, 1, 3, 1)).toEqual([1, 4, 3, 2]);
  });
});

describe('themes and moves', () => {
  it('unlocks one theme per two successful rounds', () => {
    expect(unlockedThemeIds(0)).toEqual(['fresh']);
    expect(unlockedThemeIds(1)).toEqual(['fresh']);
    expect(unlockedThemeIds(2)).toEqual(['fresh', 'retro']);
    expect(unlockedThemeIds(4)).toEqual(['fresh', 'retro', 'hook']);
    expect(nextLockedTheme(4)).toBeUndefined();
  });
  it('every theme has an 8-move sequence', () => {
    for (const id of Object.keys(SEQUENCES) as (keyof typeof SEQUENCES)[]) expect(sequenceFor(id)).toHaveLength(8);
  });
});

describe('session flow and scoring integrity', () => {
  it('scores a solo turn once and unlocks Retro Rewind on the second success', () => {
    let store = defaultStore();
    let s = startSession('solo', ['Sam'], 'fresh', undefined, seeded(3));
    for (let i = 0; i < 2; i++) {
      s = { ...s, draft: solvedDraft() };
      const out = commitTurn(s, store, { moveCompleted: true, seated: i === 1, moveMs: 120000 });
      store = out.store;
      expect(out.session.turns.at(-1)?.total).toBe(225);
      expect(isRoundComplete(out.session)).toBe(true);
      expect(out.session.unlockedNow).toBe(i === 1 ? 'Retro Rewind' : undefined);
      s = startNextRound(out.session, seeded(9));
    }
    expect(store.progress.successfulRounds).toBe(2);
  });
  it('seated and standing earn identical points', () => {
    const s = { ...startSession('solo', ['A'], 'fresh'), draft: solvedDraft() };
    const standing = commitTurn(s, defaultStore(), { moveCompleted: true, seated: false, moveMs: 1 });
    const seated = commitTurn(s, defaultStore(), { moveCompleted: true, seated: true, moveMs: 1 });
    expect(seated.session.turns[0].total).toBe(standing.session.turns[0].total);
  });
  it('skipped movement earns no movement points and no unlock progress', () => {
    const s = { ...startSession('solo', ['A'], 'fresh'), draft: solvedDraft() };
    const out = commitTurn(s, defaultStore(), { moveCompleted: false, seated: false, moveMs: 0 });
    expect(out.session.turns[0].movePoints).toBe(0);
    expect(out.store.progress.successfulRounds).toBe(0);
  });
  it('timeout puzzle with completed movement scores only movement and is not a successful round', () => {
    const s = { ...startSession('solo', ['A'], 'fresh'), draft: solvedDraft({ outcome: 'timeout', puzzlePoints: 0, speedBonus: 0 }) };
    const out = commitTurn(s, defaultStore(), { moveCompleted: true, seated: false, moveMs: 1 });
    expect(out.session.turns[0].total).toBe(100);
    expect(out.store.progress.successfulRounds).toBe(0);
  });
  it('tracks the solo personal best', () => {
    const store = { ...defaultStore(), scores: { bestSoloRound: 300, bestTurn: 300 } };
    const s = { ...startSession('solo', ['A'], 'fresh'), draft: solvedDraft() };
    const out = commitTurn(s, store, { moveCompleted: true, seated: false, moveMs: 1 });
    expect(out.session.previousBest).toBe(300);
    expect(out.session.newBest).toBe(false);
    expect(out.store.scores.bestSoloRound).toBe(300);
  });
  it('two-player round: turns alternate, different phrases, correct winner', () => {
    let store = defaultStore();
    let s = startSession('duo', ['Ana', 'Ben'], 'fresh', undefined, seeded(5));
    const first = s.phrase.text;
    s = { ...s, draft: solvedDraft({ puzzlePoints: 100, speedBonus: 50 }) };
    let out = commitTurn(s, store, { moveCompleted: true, seated: false, moveMs: 1 });
    store = out.store;
    expect(isRoundComplete(out.session)).toBe(false);
    s = advanceTurn(out.session, seeded(11));
    expect(s.turnInRound).toBe(1);
    expect(s.phrase.text).not.toBe(first);
    s = { ...s, draft: solvedDraft({ puzzlePoints: 80, speedBonus: 10 }) };
    out = commitTurn(s, store, { moveCompleted: false, seated: false, moveMs: 0 });
    expect(isRoundComplete(out.session)).toBe(true);
    expect(out.session.totals).toEqual([250, 90]);
    expect(roundWinner(out.session)).toEqual({ kind: 'win', player: 0 });
  });
  it('detects ties', () => {
    let s = startSession('duo', ['A', 'B'], 'fresh', undefined, seeded(2));
    const store = defaultStore();
    s = { ...s, draft: solvedDraft() };
    s = commitTurn(s, store, { moveCompleted: true, seated: false, moveMs: 1 }).session;
    s = advanceTurn(s);
    s = { ...s, draft: solvedDraft() };
    s = commitTurn(s, store, { moveCompleted: true, seated: false, moveMs: 1 }).session;
    expect(roundWinner(s)).toEqual({ kind: 'tie' });
  });
  it('does nothing when there is no puzzle draft', () => {
    const s = startSession('solo', ['A'], 'fresh');
    const out = commitTurn(s, defaultStore(), { moveCompleted: true, seated: false, moveMs: 1 });
    expect(out.session).toBe(s);
  });
});

describe('storage sanitising', () => {
  it('falls back to defaults on garbage', () => {
    expect(sanitiseStore(null)).toEqual(defaultStore());
    expect(sanitiseStore('x')).toEqual(defaultStore());
    const s = sanitiseStore({ settings: { puzzleSeconds: 'abc', moveSeconds: -50, volume: 9, names: [123, '  Zed  '] }, progress: { successfulRounds: 'many' }, timingLog: 'no' });
    expect(s.settings.puzzleSeconds).toBe(45);
    expect(s.settings.moveSeconds).toBe(4);
    expect(s.settings.volume).toBe(1);
    expect(s.settings.names).toEqual(['Player 1', 'Zed']);
    expect(s.progress.successfulRounds).toBe(0);
    expect(s.timingLog).toEqual([]);
  });
});
