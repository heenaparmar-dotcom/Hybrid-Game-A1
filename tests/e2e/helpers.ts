import { expect, type Page } from '@playwright/test';
import { PHRASES } from '../../src/data/phrases';

const KEY = 'rhythmrush.v1';
export const norm = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');

/** Seed settings once per browser context (not on every reload, so persistence can be tested). */
export async function seedSettings(page: Page, settings: { puzzleSeconds?: number; moveSeconds?: number } = {}) {
  const value = JSON.stringify({ settings: { puzzleSeconds: 20, moveSeconds: 4, animatedGuide: true, ...settings } });
  await page.addInitScript(
    ([k, v]) => {
      try {
        if (!window.localStorage.getItem(k)) window.localStorage.setItem(k, v);
      } catch {
        /* ignore */
      }
    },
    [KEY, value],
  );
}

export const tileTexts = (page: Page) => page.locator('[data-testid^="tile-"]').allTextContents();

/** Solve the visible puzzle through the UI (tap one tile, then another, to swap). */
export async function solve(page: Page, phraseOverride?: string) {
  const texts = await tileTexts(page);
  const key = (a: string[]) => a.map(norm).sort().join('|');
  const phrase = phraseOverride ?? PHRASES.find((p) => key(p.text.split(' ')) === key(texts))?.text;
  expect(phrase, `no known phrase matches tiles ${texts.join(' / ')}`).toBeTruthy();
  const target = phrase!.split(' ');
  for (let i = 0; i < target.length; i++) {
    const current = await tileTexts(page);
    if (norm(current[i]) === norm(target[i])) continue;
    const j = current.findIndex((t, k) => k > i && norm(t) === norm(target[i]));
    await page.getByTestId(`tile-${j}`).click();
    await page.getByTestId(`tile-${i}`).click();
  }
  return phrase!;
}

export async function startDuo(page: Page, a = 'Ana', b = 'Ben') {
  await page.getByTestId('start-game').click();
  await page.getByTestId('name-1').fill(a);
  await page.getByTestId('name-2').fill(b);
  await page.getByTestId('setup-continue').click();
  await page.getByTestId('theme-start').click();
}

export async function startSolo(page: Page, name = 'Sam') {
  await page.getByTestId('solo-practice').click();
  await page.getByTestId('name-1').fill(name);
  await page.getByTestId('setup-continue').click();
  await page.getByTestId('theme-start').click();
}

/** Plays one full turn: puzzle, music, dance. */
export async function playTurn(page: Page, opts: { solve?: boolean; complete?: boolean; phrase?: string } = {}) {
  const { solve: doSolve = true, complete = true, phrase } = opts;
  await page.getByTestId('start-puzzle').click();
  if (doSolve) {
    await solve(page, phrase);
    await page.getByTestId('submit-answer').click();
  } else {
    await page.getByTestId('skip-puzzle').click();
  }
  await page.getByTestId('to-music').click();
  await page.getByTestId('to-dance').click();
  await page.getByTestId('dance-start').click();
  if (complete) {
    await page.getByTestId('dance-complete').click({ timeout: 15_000 });
  } else {
    await page.getByTestId('dance-skip').click();
  }
}
