import { expect, type Page } from '@playwright/test';
import { LEVELS } from '../../src/data/levels';

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

/** Start from the title screen and get past the level splash. */
export async function startGame(page: Page) {
  await page.goto('./');
  await page.getByTestId('title-stage').click();
  await expect(page.getByTestId('tile-0')).toBeVisible();
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

export const LEVEL1 = LEVELS[0];
export const LEVEL2 = LEVELS[1];
export const LEVEL3 = LEVELS[2];

/** Solve the puzzle and wait for the dance invitation. */
export async function solveToInvite(page: Page, phrase: string) {
  await solveByTaps(page, phrase);
  await expect(page.getByTestId('song-unlocked')).toBeVisible();
  await expect(page.getByTestId('accept-dance')).toBeVisible({ timeout: 6000 });
}
