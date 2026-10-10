import { describe, expect, it } from 'vitest';
import { LEVELS } from '../../src/data/levels';
import { PUZZLES } from '../../src/data/puzzles';
import { MOVES } from '../../src/data/moves';
import { BEATS_PER_MOVE, COUNT_IN_BEATS, DANCE_TOTAL_SECONDS, TRACKS, routineBeats, routineSeconds, totalSeconds } from '../../src/data/tracks';
import { DANCE_SECONDS, PUZZLE_SECONDS, puzzleSeconds } from '../../src/lib/timing';
import { MOVE_IDS, REST, poseAt } from '../../src/lib/dancer';
import { poseAtBeat, stateAt } from '../../src/lib/routine';
import { applyHint, applyOrder, countCorrect, moveTile, orderOf, sameOrder, scramble, swapTiles, tokenise } from '../../src/lib/scramble';
import { defaultStore, sanitiseStore } from '../../src/lib/storage';

const seeded = (seed: number) => () => {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
};

describe('levels and songs', () => {
  it('has three levels that get longer, each tied to an existing song', () => {
    expect(LEVELS).toHaveLength(3);
    const words = LEVELS.map((l) => new Set(PUZZLES.filter((p) => p.level === l.n && !p.song).map((p) => tokenise(p.phrase).length)));
    expect(words.map((w) => [...w])).toEqual([[4], [5], [6]]); // every puzzle in a level has the same, rising, word count
    for (const l of LEVELS) expect(TRACKS.some((t) => t.id === l.trackId)).toBe(true);
  });
  it('includes both Hindi and English songs', () => {
    expect(new Set(TRACKS.map((t) => t.language))).toEqual(new Set(['English', 'Hindi']));
  });
  it('every dance lasts exactly 30 seconds including the count-in', () => {
    expect(DANCE_SECONDS).toBe(30);
    expect(DANCE_TOTAL_SECONDS).toBe(30);
    for (const t of TRACKS) {
      expect(totalSeconds(t), t.id).toBeCloseTo(30, 6);
      expect(routineSeconds(t) + (COUNT_IN_BEATS * 60) / t.bpm, t.id).toBeCloseTo(30, 6);
      expect(routineBeats(t)).toBe(t.moves.length * BEATS_PER_MOVE * t.repeats);
    }
  });
  it('the puzzle timer is 10 seconds (browser tests may lengthen it, players cannot)', () => {
    expect(PUZZLE_SECONDS).toBe(10);
    expect(puzzleSeconds()).toBe(10); // no window in this test environment: the default applies
  });
  it('every move used by a song exists and has four cues (standing and seated)', () => {
    for (const t of TRACKS) {
      for (const id of t.moves) {
        expect(MOVES[id], id).toBeDefined();
        expect(MOVES[id].cues).toHaveLength(4);
        expect(MOVES[id].seatedCues).toHaveLength(4);
        expect(MOVE_IDS).toContain(id);
      }
    }
  });
  it('every original puzzle has unique words (no ambiguous tiles)', () => {
    for (const p of PUZZLES.filter((x) => !x.song)) {
      const t = tokenise(p.phrase);
      expect(new Set(t.map((x) => x.norm)).size, p.id).toBe(t.length);
    }
  });
});

describe('puzzle mechanics', () => {
  it('scramble never returns the solved order', () => {
    for (const p of PUZZLES) {
      const sol = tokenise(p.phrase);
      for (let i = 1; i <= 30; i++) expect(sameOrder(scramble(sol, seeded(i)), sol), p.id).toBe(false);
    }
  });
  it('duplicate words are interchangeable', () => {
    const sol = tokenise('Find your rhythm, find your flow');
    const swapped = [...sol];
    [swapped[0], swapped[3]] = [swapped[3], swapped[0]];
    expect(sameOrder(swapped, sol)).toBe(true);
  });
  it('supports Devanagari words', () => {
    const sol = tokenise('आज दिल खोल के नाचो');
    expect(sol).toHaveLength(5);
    expect(new Set(sol.map((t) => t.norm)).size).toBe(5);
    expect(sol.every((t) => t.norm.length > 0)).toBe(true);
  });
  it('hint locks the next wrong position and eventually solves', () => {
    const sol = tokenise('Let the rhythm carry us forward');
    let order = scramble(sol, seeded(7));
    let locked = 0;
    for (let i = 0; i < 6; i++) {
      const res = applyHint(order, locked, sol);
      if (!res) break;
      order = res.order;
      locked = res.locked;
      expect(order[locked - 1].norm).toBe(sol[locked - 1].norm);
    }
    expect(sameOrder(order, sol)).toBe(true);
  });
  it('counts correct positions and respects locked tiles', () => {
    const sol = tokenise('a b c d');
    expect(countCorrect(sol, sol)).toBe(4);
    const list = [1, 2, 3, 4];
    expect(moveTile(list, 0, 2, 1)).toEqual(list);
    expect(moveTile(list, 3, 1, 1)).toEqual([1, 4, 2, 3]);
    expect(swapTiles(list, 1, 3, 1)).toEqual([1, 4, 3, 2]);
  });
  it('a creator shuffle survives the round trip through a link order', () => {
    const sol = tokenise('Jump into the sunshine');
    const shuffled = scramble(sol, seeded(3));
    expect(sameOrder(applyOrder(sol, orderOf(sol, shuffled)), shuffled)).toBe(true);
  });
});

describe('dancer and routine timing', () => {
  it('every move gives finite, plausible angles at every beat', () => {
    for (const id of MOVE_IDS) {
      for (const seated of [false, true]) {
        for (let b = 0; b <= 9; b += 0.125) {
          const p = poseAt(id, b, seated);
          for (const [k, v] of Object.entries(p)) expect(Number.isFinite(v), `${id} ${k} @${b}`).toBe(true);
          expect(p.twist).toBeGreaterThan(0.2);
          expect(p.liftL).toBeLessThanOrEqual(1);
          expect(p.liftR).toBeLessThanOrEqual(1);
        }
      }
    }
  });
  it('the dancer visibly moves: each move changes the pose over its 8 beats', () => {
    for (const id of MOVE_IDS) {
      const seen = new Set<string>();
      for (let b = 0; b < 8; b += 0.25) seen.add(JSON.stringify(poseAt(id, b)));
      expect(seen.size, id).toBeGreaterThanOrEqual(6);
    }
  });
  it('seated poses keep the legs on the chair', () => {
    const standing = poseAt('march', 0.5, false);
    const seated = poseAt('march', 0.5, true);
    expect(seated.y).toBeGreaterThan(standing.y);
    expect(seated.liftL).toBeGreaterThanOrEqual(0.5);
  });
  it('is continuous across move boundaries (no jumps)', () => {
    for (const t of TRACKS) {
      const total = routineBeats(t);
      let prev = poseAtBeat(t, 0, false);
      for (let b = 0.05; b < total; b += 0.05) {
        const cur = poseAtBeat(t, b, false);
        for (const k of Object.keys(REST) as (keyof typeof REST)[]) {
          expect(Math.abs(cur[k] - prev[k]), `${t.id} ${k} @${b.toFixed(2)}`).toBeLessThan(60);
        }
        prev = cur;
      }
    }
  });
  it('cues follow the beat: count-in, then 2-beat cues, then done', () => {
    const t = TRACKS[0];
    expect(stateAt(t, -COUNT_IN_BEATS, false).phase).toBe('countin');
    expect(stateAt(t, -3.5, false).countNumber).toBe(4);
    expect(stateAt(t, -0.5, false).countNumber).toBe(1);
    expect(stateAt(t, -6, false).countNumber).toBeNull();
    const first = MOVES[t.moves[0]];
    expect(stateAt(t, 0.1, false).cue).toBe(first.cues[0]);
    expect(stateAt(t, 2.1, false).cue).toBe(first.cues[1]);
    expect(stateAt(t, 6.1, false).cue).toBe(first.cues[3]);
    expect(stateAt(t, 2.1, true).cue).toBe(first.seatedCues[1]);
    expect(stateAt(t, 8.1, false).move.id).toBe(t.moves[1]);
    expect(stateAt(t, 8.1, false).moveIndex).toBe(1);
    const secondRound = stateAt(t, t.moves.length * BEATS_PER_MOVE + 0.1, false);
    expect(secondRound.round).toBe(2);
    expect(secondRound.move.id).toBe(t.moves[0]);
    expect(stateAt(t, routineBeats(t), false).phase).toBe('done');
    expect(stateAt(t, routineBeats(t) - 0.01, false).progress).toBeGreaterThan(0.99);
  });
});

describe('storage sanitising', () => {
  it('falls back to defaults on garbage', () => {
    expect(sanitiseStore(null)).toEqual(defaultStore());
    expect(sanitiseStore('x')).toEqual(defaultStore());
    expect(sanitiseStore({ players: 2 }).players).toBe(2);
    expect(sanitiseStore({ players: 7 }).players).toBe(1); // anything else means one player
    const s = sanitiseStore({ completed: 99, volume: 9, muted: 'yes', seated: 1 });
    expect(s.completed).toBe(3);
    expect(s.volume).toBe(1);
    expect(s.muted).toBe(false);
    expect(s.seated).toBe(false);
    expect(sanitiseStore({ completed: -4 }).completed).toBe(0);
  });
});
