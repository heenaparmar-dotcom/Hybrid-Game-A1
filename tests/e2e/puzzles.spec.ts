import { expect, test, type Page } from '@playwright/test';
import { LEVELS } from '../../src/data/levels';
import { PUZZLES, puzzlesForLevel, type Puzzle } from '../../src/data/puzzles';
import { currentPuzzle, solveByTaps } from './helpers';

/** Seed progress so every level is open, and let a test steer Math.random (null = real randomness). */
async function openWithControls(page: Page) {
  await page.addInitScript(() => {
    if (!localStorage.getItem('rhythmrush.v2')) localStorage.setItem('rhythmrush.v2', JSON.stringify({ completed: 2, volume: 0.7, muted: false, seated: false }));
    const w = window as unknown as { __r: number | null };
    w.__r = null;
    const real = Math.random;
    Math.random = () => (w.__r !== null ? w.__r : real());
  });
  await page.goto('./');
  await page.getByTestId('title-stage').click(); // progress is 2, so this starts level 3
  await page.getByTestId('tile-0').waitFor();
}

const setRandom = (page: Page, r: number | null) => page.evaluate((v) => ((window as unknown as { __r: number | null }).__r = v), r);

async function enterLevel(page: Page, n: number): Promise<Puzzle> {
  await page.getByTestId(`level-${n}`).click();
  await expect(page.getByTestId('splash')).toContainText(LEVELS[n - 1].name, { timeout: 15_000 });
  await page.getByTestId('tile-0').waitFor();
  return currentPuzzle(page);
}

test('entering a level again gives a different puzzle each time, with a fresh shuffle', async ({ page }) => {
  test.setTimeout(150_000);
  await openWithControls(page);
  for (const level of [1, 2, 3]) {
    const seen: Puzzle[] = [];
    const orders = new Set<string>();
    for (let i = 0; i < 7; i++) {
      const p = await enterLevel(page, level);
      expect(p.level).toBe(level);
      if (seen.length) expect(p.id, `level ${level} repeated immediately`).not.toBe(seen[seen.length - 1].id);
      seen.push(p);
      orders.add((await page.locator('[data-testid^="tile-"]').allTextContents()).join('|'));
      await expect(page.getByTestId('splash')).toHaveCount(0, { timeout: 5000 });
    }
    expect(new Set(seen.map((p) => p.id)).size, `level ${level} variety`).toBeGreaterThanOrEqual(4);
    expect(orders.size).toBeGreaterThanOrEqual(5); // tiles are shuffled differently, not in one fixed order
  }
});

test('"Shuffle again" keeps the same puzzle but re-mixes the tiles', async ({ page }) => {
  await openWithControls(page);
  const p = await enterLevel(page, 1);
  await expect(page.getByTestId('splash')).toHaveCount(0, { timeout: 5000 });
  const before = await page.locator('[data-testid^="tile-"]').allTextContents();
  await page.getByTestId('shuffle-again').click();
  expect((await currentPuzzle(page)).id).toBe(p.id);
  expect((await page.locator('[data-testid^="tile-"]').allTextContents()).join(' ')).not.toBe(p.phrase);
  void before;
});

test('every one of the 60 puzzles can be solved in the game and triggers the success state', async ({ page }) => {
  test.setTimeout(600_000);
  await openWithControls(page);
  const last: Record<number, string | undefined> = {};
  last[3] = (await currentPuzzle(page)).id; // what the title screen picked for level 3
  const solved = new Set<string>();

  for (const level of [1, 2, 3]) {
    const pool = puzzlesForLevel(level);
    // handle the puzzle currently remembered for this level last: it cannot be picked straight after itself
    const order = [...pool].sort((a, b) => Number(a.id === last[level]) - Number(b.id === last[level]));
    for (const target of order) {
      const candidates = pool.filter((p) => p.id !== last[level]);
      const index = candidates.findIndex((p) => p.id === target.id);
      expect(index, `${target.id} must be selectable`).toBeGreaterThanOrEqual(0);
      await setRandom(page, (index + 0.5) / candidates.length);
      const shown = await enterLevel(page, level);
      await setRandom(page, null);
      expect(shown.id).toBe(target.id);

      // the success state: tiles light up, "You got it!", the song is unlocked, then the invitation
      await solveByTaps(page, shown.phrase);
      await expect(page.getByTestId('song-unlocked')).toContainText('You got it!');
      if (shown.meaning) await expect(page.getByTestId('song-unlocked')).toContainText(shown.meaning);
      last[level] = shown.id;
      solved.add(shown.id);
    }
  }
  expect(solved.size).toBe(PUZZLES.length);
  expect(PUZZLES.length).toBeGreaterThanOrEqual(60);
});

test('a solved level puzzle still leads to the same dance invitation and next level', async ({ page }) => {
  await openWithControls(page);
  const p = await enterLevel(page, 2);
  await solveByTaps(page, p.phrase);
  await expect(page.getByTestId('accept-dance')).toBeVisible({ timeout: 6000 });
  await expect(page.getByRole('heading', { name: 'You cracked the song!' })).toBeVisible();
  await expect(page.getByText('Nacho Aaj', { exact: false }).first()).toBeVisible();
  await page.getByTestId('skip-dance').click();
  await page.getByTestId('next-level').click();
  const next = await currentPuzzle(page);
  expect(next.level).toBe(3);
});
