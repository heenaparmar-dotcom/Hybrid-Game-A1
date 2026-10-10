import { expect, type Page } from '@playwright/test';
import { PUZZLES, type Puzzle } from '../../src/data/puzzles';

export const norm = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{M}\p{N}]/gu, '');
export const tileTexts = (page: Page) => page.locator('[data-testid^="tile-"]').allTextContents();

/** Make tests deterministic: count audio contexts the game creates (to prove music waits for the button). */
export async function trackAudio(page: Page) {
  await page.addInitScript(() => {
    const w = window as unknown as { __audio: { created: number }; AudioContext: typeof AudioContext };
    w.__audio = { created: 0 };
    const Real = w.AudioContext;
    if (!Real) return;
    w.AudioContext = class extends Real {
      constructor(...args: ConstructorParameters<typeof AudioContext>) {
        super(...args);
        w.__audio.created++;
      }
    } as typeof AudioContext;
  });
}

export const audioCreated = (page: Page) => page.evaluate(() => (window as unknown as { __audio?: { created: number } }).__audio?.created ?? -1);

/** Remove Web Audio entirely, to test the silent fallback. */
export async function noAudio(page: Page) {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'AudioContext', { value: undefined, configurable: true });
    Object.defineProperty(window, 'webkitAudioContext', { value: undefined, configurable: true });
  });
}

/**
 * Lets a test steer Math.random (null = real randomness). Level puzzles are picked at random, so a test that needs a
 * particular kind of puzzle pins the choice instead of hoping for it.
 */
export async function installRandomControl(page: Page, opts: { realTimer?: boolean } = {}) {
  await page.addInitScript((realTimer) => {
    const w = window as unknown as { __r: number | null; __RR_PUZZLE_SECONDS?: number };
    // the real game gives 10 seconds per puzzle; most tests lengthen it so slow steps are not cut off by the timer
    if (!realTimer) w.__RR_PUZZLE_SECONDS = 600;
    w.__r = null;
    const real = Math.random;
    Math.random = () => (w.__r !== null ? w.__r : real());
  }, !!opts.realTimer);
}
export const setRandom = (page: Page, r: number | null) => page.evaluate((v) => ((window as unknown as { __r: number | null }).__r = v), r);

/**
 * Random number that makes Warm Up pick its 3rd song, "Gallan Goodiyaan": a song puzzle with plenty of tiles, which uses the
 * "Sunrise Sway" dance. Tests that drag tiles or need a normal-size puzzle pin it so they are stable.
 */
export const PIN_SUNRISE_SONG = 0.3125;

/** Start from the title screen and get past the level splash (pinned to the Gallan Goodiyaan puzzle). */
export async function startGame(page: Page) {
  await installRandomControl(page);
  await page.goto('./');
  await setRandom(page, PIN_SUNRISE_SONG);
  await page.getByTestId('title-stage').click();
  await expect(page.getByTestId('tile-0')).toBeVisible();
  await setRandom(page, null);
  await expect(page.getByTestId('splash')).toHaveCount(0, { timeout: 5000 });
}

/** Solve the visible puzzle with taps (tap a tile, then the tile whose place it should take). */
export async function solveByTaps(page: Page, phrase: string) {
  const target = phrase.split(' ');
  for (let i = 0; i < target.length; i++) {
    const current = await tileTexts(page);
    if (norm(current[i]) === norm(target[i])) continue;
    const j = current.findIndex((t, k) => k > i && norm(t) === norm(target[i]));
    await page.getByTestId(`tile-${j}`).click();
    await page.getByTestId(`tile-${i}`).click();
  }
}

/** Which level puzzle is on screen? Matches the shown words against the puzzle pools. */
export async function currentPuzzle(page: Page): Promise<Puzzle> {
  const key = (words: string[]) => words.map(norm).sort().join('|');
  const texts = (await tileTexts(page)).map((t) => t.trim());
  const found = PUZZLES.filter((p) => key(p.phrase.split(' ')) === key(texts));
  expect(found, `puzzle matching tiles ${texts.join(' / ')}`).toHaveLength(1);
  return found[0];
}

/** Solve whichever level puzzle is on screen and return it. */
export async function solveCurrent(page: Page): Promise<Puzzle> {
  const puzzle = await currentPuzzle(page);
  await solveByTaps(page, puzzle.phrase);
  return puzzle;
}

/** Solve the puzzle (the given phrase, or whichever level puzzle is showing) and wait for the dance invitation. */
export async function solveToInvite(page: Page, phrase?: string) {
  if (phrase) await solveByTaps(page, phrase);
  else await solveCurrent(page);
  await expect(page.getByTestId('song-unlocked')).toBeVisible();
  await expect(page.getByTestId('accept-dance')).toBeVisible({ timeout: 6000 });
}
