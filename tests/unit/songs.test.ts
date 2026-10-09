import { describe, expect, it } from 'vitest';
import { LISTEN_CHALLENGES, listenOrder, shuffledOptions } from '../../src/data/listen';
import { PUZZLES, pickPuzzle, playablePuzzles, puzzlesForLevel } from '../../src/data/puzzles';
import { applyHint, sameOrder, scramble, swapTiles, tokenise } from '../../src/lib/scramble';

const seeded = (seed: number) => () => {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
};
const songs = (level: number) => puzzlesForLevel(level).filter((p) => p.song);

describe('Level 1 (Warm Up): the 10 requested Hindi songs', () => {
  const expected = [
    'Badtameez Dil', 'Kala Chashma', 'Gallan Goodiyaan', 'London Thumakda', 'What Jhumka?',
    'Aankh Marey', 'Chaiyya Chaiyya', 'Kajra Re', 'Jai Jai Shivshankar', 'Dilliwaali Girlfriend',
  ];
  it('contains every requested song, in the selection pool, as its own challenge', () => {
    expect(songs(1).map((p) => p.song!.title)).toEqual(expected);
    expect(new Set(songs(1).map((p) => p.id)).size).toBe(10);
    for (const p of songs(1)) expect(puzzlesForLevel(1)).toContain(p);
  });
  it('keeps the original Level 1 puzzles too (nothing was deleted): 20 originals + 10 songs', () => {
    expect(puzzlesForLevel(1).filter((p) => !p.song)).toHaveLength(20);
    expect(puzzlesForLevel(1)).toHaveLength(30);
  });
  it('every song carries a hint, and the scrambled words are the title (no lyrics)', () => {
    for (const p of songs(1)) {
      expect(p.song!.hint.length).toBeGreaterThan(5);
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

describe('Level 2 (Find the Beat): the 5 specified puzzles', () => {
  const spec: { title: string; hint: string; fragments: string[] }[] = [
    { title: 'Pehla Nasha', hint: '1992 · Jo Jeeta Wohi Sikandar', fragments: ['PEHLA', 'NASHA'] },
    { title: 'Do Dil Mil Rahe Hain', hint: '1998 · Pardes', fragments: ['DO', 'DIL', 'MIL', 'RAHE', 'HAIN'] },
    { title: 'Tujhe Dekha To Ye Jaana Sanam', hint: '1995 · Dilwale Dulhania Le Jayenge', fragments: ['TUJHE', 'DEKHA', 'TOH', 'YE', 'JAANA', 'SANAM'] },
    { title: 'Kuch Kuch Hota Hai', hint: '1998 · Kuch Kuch Hota Hai', fragments: ['KUCH', 'KUCH', 'HOTA', 'HAI'] },
    { title: 'Pardesi Pardesi Jaana Nahi', hint: '1996 · Raja Hindustani', fragments: ['PARDESI', 'PARDESI', 'JAANA', 'NAHI'] },
  ];
  it('has all five, with the exact title, hint and fragment sequence supplied', () => {
    expect(songs(2)).toHaveLength(5);
    spec.forEach((s, i) => {
      const p = songs(2)[i];
      expect(p.song).toEqual({ title: s.title, hint: s.hint });
      expect(tokenise(p.phrase).map((t) => t.text)).toEqual(s.fragments); // the answer key sequence, TOH included
    });
  });
  it('keeps the original Level 2 puzzles too: 20 originals + 5 songs', () => {
    expect(puzzlesForLevel(2).filter((p) => !p.song)).toHaveLength(20);
    expect(puzzlesForLevel(2)).toHaveLength(25);
  });
  it('repeated words stay separate tiles and the order check compares positions, not a set', () => {
    for (const title of ['KUCH KUCH HOTA HAI', 'PARDESI PARDESI JAANA NAHI']) {
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
  it('Warm Up draws from exactly the 10 songs and Find the Beat from exactly the 5 specified puzzles', () => {
    expect(playablePuzzles(1)).toHaveLength(10);
    expect(playablePuzzles(2)).toHaveLength(5);
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
  it('the whole pool is 30 + 25 + 20 = 75 puzzle entries; level 3 keeps its 20 word-order puzzles in data', () => {
    expect(PUZZLES).toHaveLength(75);
    expect(puzzlesForLevel(3)).toHaveLength(20);
  });
});

describe('Level 3 (Feel the Rhythm): listening challenges', () => {
  it('has exactly two different challenges with different clips and different answers', () => {
    expect(LISTEN_CHALLENGES).toHaveLength(2);
    const [a, b] = LISTEN_CHALLENGES;
    expect(a.id).not.toBe(b.id);
    expect(a.line).not.toBe(b.line);
    expect(a.placeholder.track).not.toBe(b.placeholder.track); // different music
  });
  it('each has three distinct choices that include the correct line exactly once', () => {
    for (const c of LISTEN_CHALLENGES) {
      expect(new Set(c.options).size).toBe(3);
      expect(c.options.filter((o) => o === c.line)).toHaveLength(1);
    }
    const [a, b] = LISTEN_CHALLENGES;
    expect(a.options.filter((o) => b.options.includes(o))).toEqual([]); // no shared answer text
  });
  it('is configured with placeholder audio only: no file URL is invented', () => {
    for (const c of LISTEN_CHALLENGES) expect(c.src ?? '').toBe('');
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
    for (let i = 1; i <= 20; i++) {
      const o = listenOrder(seeded(i * 7919 + 13));
      expect(o).toHaveLength(2);
      expect(new Set(o.map((c) => c.id)).size).toBe(2);
      orders.add(o.map((c) => c.id).join('|'));
    }
    expect(orders.size).toBe(2);
  });
});
