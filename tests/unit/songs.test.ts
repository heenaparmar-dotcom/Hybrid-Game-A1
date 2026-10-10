import { existsSync } from 'node:fs';
import { LYRIC_LINES } from '../../src/data/lyricLines';
import { describe, expect, it } from 'vitest';
import { LISTEN_CHALLENGES, listenOrder, shuffledOptions } from '../../src/data/listen';
import { PUZZLES, pickPuzzle, playablePuzzles, puzzlesForLevel } from '../../src/data/puzzles';
import { applyHint, sameOrder, scramble, swapTiles, tokenise } from '../../src/lib/scramble';

const seeded = (seed: number) => () => {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
};
const songs = (level: number) => puzzlesForLevel(level).filter((p) => p.song);

describe('Level 1 (Warm Up): the 8 Hindi songs', () => {
  const expected = [
    'Badtameez Dil', 'Kala Chashma', 'Gallan Goodiyaan', 'Sapphire', 'Jhoome Jo Pathaan',
    'Swag Se Swagat', 'Jamaican (Bam Bam)', "Let's Nacho",
  ];
  it('contains every requested song, in the selection pool, as its own challenge', () => {
    expect(songs(1).map((p) => p.song!.title)).toEqual(expected);
    expect(new Set(songs(1).map((p) => p.id)).size).toBe(8);
    for (const p of songs(1)) expect(puzzlesForLevel(1)).toContain(p);
  });
  it('keeps the original Level 1 puzzles too (nothing was deleted): 20 originals + 8 songs', () => {
    expect(puzzlesForLevel(1).filter((p) => !p.song)).toHaveLength(20);
    expect(puzzlesForLevel(1)).toHaveLength(28);
  });
  it('every song carries a hint, and the scrambled words are the title (no lyrics)', () => {
    for (const p of songs(1)) {
      expect(p.song!.hint.length).toBeGreaterThan(5);
      if (LYRIC_LINES[p.id]) continue; // a line the owner supplied in lyricLines.ts replaces the title on purpose
      const title = p.song!.title.toLowerCase().replace(/[^a-z ]/g, '');
      const phrase = p.phrase.toLowerCase().replace(/[^a-z ]/g, '');
      // the phrase is the title (one entry adds the film name, because two identical words cannot be shuffled)
      expect(phrase.includes(title) || title.includes(phrase), p.id).toBe(true);
      expect(phrase.split(' ').length, p.id).toBeLessThanOrEqual(4);
    }
  });
  it('every song can actually be shuffled (at least two different words)', () => {
    for (const p of songs(1)) expect(new Set(tokenise(p.phrase).map((t) => t.norm)).size, p.id).toBeGreaterThanOrEqual(2);
  });
});

describe('Level 2 (Find the Beat): the 11 Hook-Step songs', () => {
  const titles = [
    'Aankh Marey', 'Dola Re Dola', 'Tauba Tauba', 'Jhoome Jo Pathaan', 'Kaho Na Pyaar Hai', 'Caller Tune',
    'Kajra Re', 'Jai Jai Shivshankar', 'Om Shanti Om', 'Desi Girl', 'Dhana Dhin Dha',
  ];
  it('has all eleven songs, in order, each with a hint', () => {
    expect(songs(2).map((p) => p.song!.title)).toEqual(titles);
    for (const p of songs(2)) expect(p.song!.hint.length, p.id).toBeGreaterThan(5);
  });
  it('every song is danced to the Hook-Step routine', () => {
    for (const p of songs(2)) expect(p.trackId, p.id).toBe('hookstep');
  });
  it('keeps the original Level 2 puzzles too: 20 originals + 11 songs', () => {
    expect(puzzlesForLevel(2).filter((p) => !p.song)).toHaveLength(20);
    expect(puzzlesForLevel(2)).toHaveLength(31);
  });
  it('repeated words stay separate tiles and the order check compares positions, not a set', () => {
    for (const title of ['Tauba Tauba Bad Newz']) {
      const solution = tokenise(title);
      const dup = solution[0].norm;
      expect(solution.filter((t) => t.norm === dup)).toHaveLength(2); // two separate tiles
      expect(new Set(solution.map((t) => t.id)).size).toBe(solution.length); // with different ids
      // swapping the two identical tiles is still correct (same word in the same place)...
      const swapped = swapTiles(solution, 0, 1, 0);
      expect(sameOrder(swapped, solution)).toBe(true);
      // ...but moving the repeated word somewhere else is wrong, even though the SET of words is identical
      const wrong = swapTiles(solution, 1, 2, 0);
      expect(sameOrder(wrong, solution)).toBe(false);
      expect([...wrong.map((t) => t.norm)].sort()).toEqual([...solution.map((t) => t.norm)].sort());
    }
  });
  it('every song puzzle is solvable by swaps and by hints, and never starts solved', () => {
    for (const p of [...songs(1), ...songs(2)]) {
      const solution = tokenise(p.phrase);
      for (let seed = 1; seed <= 8; seed++) {
        let order = scramble(solution, seeded(seed * 31));
        expect(sameOrder(order, solution), `${p.id} starts solved`).toBe(false);
        for (let i = 0; i < solution.length; i++) {
          const j = order.findIndex((t, k) => k >= i && t.norm === solution[i].norm);
          order = swapTiles(order, i, j, 0);
        }
        expect(sameOrder(order, solution), p.id).toBe(true);
      }
      let order = scramble(solution, seeded(3));
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
});

describe('Warm Up and Find the Beat are played with the Hindi film-song puzzles only', () => {
  it('Warm Up draws from exactly the 8 songs and Find the Beat from exactly the 11 songs', () => {
    expect(playablePuzzles(1)).toHaveLength(8);
    expect(playablePuzzles(2)).toHaveLength(11);
    for (const p of [...playablePuzzles(1), ...playablePuzzles(2)]) expect(p.song, p.id).toBeDefined();
  });
  it('every random pick for levels 1 and 2 is a song, and the original lines are never picked there', () => {
    const rng = seeded(99);
    for (let i = 0; i < 300; i++) {
      expect(pickPuzzle(1, undefined, rng).song).toBeDefined();
      expect(pickPuzzle(2, undefined, rng).song).toBeDefined();
    }
  });
  it('each Warm Up song names the original dance track it uses; the dance configuration is valid', () => {
    for (const p of songs(1)) expect(['sunrise', 'nacho', 'hookstep'], p.id).toContain(p.trackId);
    expect(new Set(songs(1).map((p) => p.trackId)).size).toBeGreaterThan(1); // variety across songs
  });
});

describe('selection includes the songs and never repeats the last puzzle', () => {
  it('over many draws every song in Levels 1 and 2 comes up (and the 10-song / 5-song pools are small enough to hit them all)', () => {
    for (const level of [1, 2]) {
      const rng = seeded(17 * level);
      const seen = new Set<string>();
      let prev: string | undefined;
      for (let i = 0; i < 1200; i++) {
        const next = pickPuzzle(level, prev, rng);
        expect(next.id).not.toBe(prev);
        seen.add(next.id);
        prev = next.id;
      }
      for (const p of songs(level)) expect(seen.has(p.id), p.id).toBe(true);
    }
  });
  it('the whole pool is 28 + 31 + 20 = 79 puzzle entries; level 3 keeps its 20 word-order puzzles in data', () => {
    expect(PUZZLES).toHaveLength(79);
    expect(puzzlesForLevel(3)).toHaveLength(20);
  });
});

describe('Level 3 (Feel the Rhythm): listening challenges', () => {
  it('has three different instrumental clips, each with a different answer', () => {
    expect(LISTEN_CHALLENGES).toHaveLength(3);
    expect(new Set(LISTEN_CHALLENGES.map((c) => c.id)).size).toBe(3);
    expect(new Set(LISTEN_CHALLENGES.map((c) => c.line)).size).toBe(3);
    expect(new Set(LISTEN_CHALLENGES.map((c) => c.src)).size).toBe(3);
  });
  it('each offers the three song titles, and the correct one is among them exactly once', () => {
    for (const c of LISTEN_CHALLENGES) {
      expect(new Set(c.options).size).toBe(3);
      expect(c.options.filter((o) => o === c.line)).toHaveLength(1);
    }
  });
  it('every clip points at a file in public/audio, and offers a clue that does not give the answer away', () => {
    for (const c of LISTEN_CHALLENGES) {
      expect(c.src).toMatch(/^audio\/listen-[a-z-]+\.mp3$/);
      expect(existsSync(`public/${c.src}`), c.src).toBe(true);
      expect(c.clue, c.id).toBeTruthy();
      expect(c.clue!.toLowerCase()).not.toContain(c.line.toLowerCase());
    }
  });
  it('options and order are shuffled without losing or duplicating anything', () => {
    for (const c of LISTEN_CHALLENGES) {
      const seen = new Set<string>();
      for (let i = 1; i <= 40; i++) {
        const o = shuffledOptions(c, seeded(i * 7919 + 13));
        expect([...o].sort()).toEqual([...c.options].sort());
        seen.add(o.join('|'));
      }
      expect(seen.size).toBeGreaterThan(2);
    }
    const orders = new Set<string>();
    for (let i = 1; i <= 40; i++) {
      const o = listenOrder(seeded(i * 7919 + 13));
      expect(o).toHaveLength(3);
      expect(new Set(o.map((c) => c.id)).size).toBe(3);
      orders.add(o.map((c) => c.id).join('|'));
    }
    expect(orders.size).toBeGreaterThan(2);
  });
});
