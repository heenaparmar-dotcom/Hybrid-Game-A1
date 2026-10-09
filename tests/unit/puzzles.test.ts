import { describe, expect, it } from 'vitest';
import { LEVELS } from '../../src/data/levels';
import { PUZZLES, pickPuzzle, playablePuzzles, puzzlesForLevel } from '../../src/data/puzzles';
import { applyHint, normaliseWord, sameOrder, scramble, swapTiles, tokenise } from '../../src/lib/scramble';
import { validatePhrase } from '../../src/lib/challenge';

const seeded = (seed: number) => () => {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
};
const key = (phrase: string) => tokenise(phrase).map((t) => t.norm).join(' ');
const bag = (phrase: string) => tokenise(phrase).map((t) => t.norm).sort().join(' ');

describe('puzzle pools', () => {
  it('has at least 20 puzzles for each level and at least 60 in total', () => {
    expect(PUZZLES.length).toBeGreaterThanOrEqual(60);
    for (const l of LEVELS) expect(puzzlesForLevel(l.n).length, `level ${l.n}`).toBeGreaterThanOrEqual(20);
  });
  it('every puzzle has a unique id, a valid level and a unique phrase', () => {
    expect(new Set(PUZZLES.map((p) => p.id)).size).toBe(PUZZLES.length);
    expect(new Set(PUZZLES.map((p) => key(p.phrase))).size).toBe(PUZZLES.length);
    for (const p of PUZZLES) expect([1, 2, 3]).toContain(p.level);
  });
  it('the three pools do not overlap, even by the same words in a different order', () => {
    const owner = new Map<string, number>();
    for (const p of PUZZLES) {
      const k = bag(p.phrase);
      expect(owner.has(k) ? owner.get(k) : p.level, `${p.id} shares its words with another puzzle`).toBe(p.level);
      owner.set(k, p.level);
    }
    expect(new Set(PUZZLES.map((p) => bag(p.phrase))).size).toBe(PUZZLES.length);
  });
  it('difficulty rises: every original puzzle has 4, 5 or 6 words for levels 1, 2 and 3', () => {
    for (const p of PUZZLES.filter((x) => !x.song)) expect(tokenise(p.phrase).length, p.id).toBe(p.level + 3);
  });
  it('every original puzzle passes the same validation custom puzzles use (length, characters, kindness)', () => {
    for (const p of PUZZLES.filter((x) => !x.song)) expect(validatePhrase(p.phrase), p.id).toEqual({ ok: true, value: p.phrase });
  });
  it('original Hindi (level 2) puzzles all have a plain-English meaning', () => {
    for (const p of puzzlesForLevel(2).filter((x) => !x.song)) expect(p.meaning?.length, p.id).toBeGreaterThan(5);
  });
});

describe('every puzzle can be solved by the game logic', () => {
  it('a shuffled arrangement is never already solved, and can be solved with swaps and hints', () => {
    for (const p of PUZZLES) {
      const solution = tokenise(p.phrase);
      for (let seed = 1; seed <= 5; seed++) {
        let order = scramble(solution, seeded(seed * 97));
        expect(sameOrder(order, solution), `${p.id} shuffled solved`).toBe(false);
        // selection-sort with swaps, as a player tapping tiles would
        for (let i = 0; i < solution.length; i++) {
          const j = order.findIndex((t, k) => k >= i && t.norm === solution[i].norm);
          order = swapTiles(order, i, j, 0);
        }
        expect(sameOrder(order, solution), `${p.id} not solvable by swaps`).toBe(true);
      }
      // the nudge also reaches the solution
      let order = scramble(solution, seeded(7));
      let locked = 0;
      for (let i = 0; i < solution.length; i++) {
        const res = applyHint(order, locked, solution);
        if (!res) break;
        order = res.order;
        locked = res.locked;
      }
      expect(sameOrder(order, solution), `${p.id} nudge`).toBe(true);
    }
  });
  it('checking compares against the selected puzzle only, never another one', () => {
    const a = tokenise(puzzlesForLevel(1)[0].phrase);
    const b = tokenise(puzzlesForLevel(1)[1].phrase);
    expect(sameOrder(a, b)).toBe(false);
    expect(sameOrder(a, a)).toBe(true);
    expect(normaliseWord('Wiggle,')).toBe('wiggle');
  });
});

describe('random selection', () => {
  it('always returns a puzzle from the requested level', () => {
    for (const l of LEVELS) for (let i = 0; i < 50; i++) expect(pickPuzzle(l.n, undefined, seeded(i + 1)).level).toBe(l.n);
  });
  it('never repeats the previous puzzle', () => {
    for (const l of LEVELS) {
      const rng = seeded(11 * l.n);
      let prev: string | undefined;
      for (let i = 0; i < 300; i++) {
        const next = pickPuzzle(l.n, prev, rng);
        expect(next.id).not.toBe(prev);
        prev = next.id;
      }
    }
  });
  it('varies a lot: over many attempts every puzzle in a level appears', () => {
    for (const l of LEVELS) {
      const rng = seeded(5 * l.n);
      const seen = new Set<string>();
      let prev: string | undefined;
      for (let i = 0; i < 600; i++) {
        const next = pickPuzzle(l.n, prev, rng);
        seen.add(next.id);
        prev = next.id;
      }
      expect(seen.size).toBe(playablePuzzles(l.n).length);
    }
  });
  it('maps a random number to a puzzle in a predictable way (the browser test relies on this)', () => {
    const pool = playablePuzzles(2);
    expect(pickPuzzle(2, undefined, () => 0).id).toBe(pool[0].id);
    expect(pickPuzzle(2, undefined, () => 0.9999).id).toBe(pool[pool.length - 1].id);
    expect(pickPuzzle(2, pool[0].id, () => 0).id).toBe(pool[1].id); // skips the previous one
  });
});
