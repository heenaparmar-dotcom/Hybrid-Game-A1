import { expect, test } from '@playwright/test';
import { LEVELS } from '../../src/data/levels';
import { playablePuzzles, type Puzzle } from '../../src/data/puzzles';
import { currentPuzzle, solveByTaps, tileTexts } from './helpers';
import { enterLevel, enterPinned, openWithProgress } from './support';

const name = (n: number) => LEVELS[n - 1].name;

// The 55-puzzle run records thousands of frames; Playwright's trace writer can fail on file cleanup at the very end
// (an ENOENT unrelated to the game). Traces are only a debugging aid, so they are off for this file.
test.use({ trace: 'off' });

test('entering a level again gives a different puzzle each time, with a fresh shuffle', async ({ page }) => {
  test.setTimeout(150_000);
  await openWithProgress(page, 1); // starts level 2; levels 1 and 2 are open
  for (const level of [1, 2]) {
    const seen: Puzzle[] = [];
    const orders = new Set<string>();
    for (let i = 0; i < 7; i++) {
      const p = await enterLevel(page, level, name(level));
      expect(p.level).toBe(level);
      if (seen.length) expect(p.id, `level ${level} repeated immediately`).not.toBe(seen[seen.length - 1].id);
      seen.push(p);
      orders.add((await tileTexts(page)).join('|'));
      await expect(page.getByTestId('splash')).toHaveCount(0, { timeout: 5000 });
    }
    expect(new Set(seen.map((p) => p.id)).size, `level ${level} variety`).toBeGreaterThanOrEqual(3);
    // Warm Up lines have many words; Find the Beat titles are short (two words have only one other order), so fewer different orders are possible
    expect(orders.size).toBeGreaterThanOrEqual(level === 1 ? 5 : 3);
  }
});

test('"Shuffle again" keeps the same puzzle but re-mixes the tiles', async ({ page }) => {
  await openWithProgress(page, 1);
  const p = await enterLevel(page, 1, name(1));
  await expect(page.getByTestId('splash')).toHaveCount(0, { timeout: 5000 });
  await page.getByTestId('shuffle-again').click();
  expect((await currentPuzzle(page)).id).toBe(p.id);
  expect((await tileTexts(page)).join(' ')).not.toBe(p.phrase);
});

test('every puzzle played in Levels 1 and 2 (all 19 Hindi film-song puzzles) can be solved and shows the success state', async ({ page }) => {
  test.setTimeout(600_000);
  await openWithProgress(page, 1);
  const last: Record<number, string | undefined> = {};
  last[2] = (await currentPuzzle(page)).id; // what the title screen picked for level 2
  const solved = new Set<string>();

  for (const level of [1, 2]) {
    const pool = playablePuzzles(level);
    const order = [...pool].sort((a, b) => Number(a.id === last[level]) - Number(b.id === last[level]));
    for (const target of order) {
      const shown = await enterPinned(page, level, name(level), target, last);
      if (shown.song && level === 2) await expect(page.getByTestId('puzzle-hint')).toContainText(shown.song.hint); // Find the Beat shows its hint while solving
      await solveByTaps(page, shown.phrase);
      await expect(page.getByTestId('song-unlocked')).toContainText('You got it!');
      if (shown.song) await expect(page.getByTestId('song-title')).toContainText(shown.song.title);
      else if (shown.meaning) await expect(page.getByTestId('song-unlocked')).toContainText(shown.meaning);
      solved.add(shown.id);
    }
  }
  expect(solved.size).toBe(playablePuzzles(1).length + playablePuzzles(2).length);
  expect(solved.size).toBe(19);
});

test('a solved level 2 puzzle still leads to the dance invitation, and the next level is the listening level', async ({ page }) => {
  await openWithProgress(page, 1);
  const p = await currentPuzzle(page);
  await solveByTaps(page, p.phrase);
  await expect(page.getByTestId('accept-dance')).toBeVisible({ timeout: 6000 });
  await expect(page.getByRole('heading', { name: 'You cracked the song!' })).toBeVisible();
  await expect(page.getByText('Hook-Step Party', { exact: false }).first()).toBeVisible();
  await page.getByTestId('skip-dance').click();
  await page.getByTestId('next-level').click();
  await expect(page.getByTestId('listen-screen')).toBeVisible();
});
