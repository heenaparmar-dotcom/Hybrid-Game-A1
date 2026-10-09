import { expect, test, type Page } from '@playwright/test';
import { PUZZLES } from '../../src/data/puzzles';
import { PIN_FOUR_TILES, audioCreated, installRandomControl, setRandom, solveByTaps, tileTexts, trackAudio } from './helpers';
import { openWithProgress } from './support';

// These tests use the REAL 10-second timer (no override), so they take real time.
test.use({ trace: 'off' });

const pinned = PUZZLES.find((p) => p.id === 'l1-s07')!; // "Dil Se Chaiyya Chaiyya"
const num = async (page: Page) => Number(await page.getByTestId('puzzle-timer-num').innerText());

/** Open Warm Up with the real timer, on the pinned four-tile song, and wait until the level splash has gone. */
async function startWarmUp(page: Page) {
  await installRandomControl(page, { realTimer: true });
  await page.goto('./');
  await setRandom(page, PIN_FOUR_TILES);
  await page.getByTestId('title-stage').click();
  await page.getByTestId('tile-0').waitFor();
  await setRandom(page, null);
}

test('Warm Up shows a 10-second countdown: it waits for the splash, then counts down second by second', async ({ page }) => {
  await startWarmUp(page);
  await expect(page.getByTestId('puzzle-timer')).toBeVisible();
  // frozen at 10 while the level splash covers the puzzle
  await expect(page.getByTestId('splash')).toBeVisible();
  expect(await num(page)).toBe(10);
  await expect(page.getByTestId('splash')).toHaveCount(0, { timeout: 5000 });

  const seen: number[] = [];
  const end = Date.now() + 4500;
  while (Date.now() < end) {
    const n = await num(page);
    if (seen[seen.length - 1] !== n) seen.push(n);
    await page.waitForTimeout(120);
  }
  expect(seen[0]).toBeGreaterThanOrEqual(9);
  expect(seen.length).toBeGreaterThanOrEqual(4); // it really counted down
  for (let i = 1; i < seen.length; i++) expect(seen[i - 1] - seen[i], `jumped from ${seen[i - 1]} to ${seen[i]}`).toBe(1); // exactly one per second
});

test('the Hint button reveals the film and year without stopping the timer, and never shows the answer', async ({ page }) => {
  await startWarmUp(page);
  await expect(page.getByTestId('splash')).toHaveCount(0, { timeout: 5000 });
  await expect(page.getByTestId('puzzle-hint')).toHaveCount(0);
  const before = await num(page);
  await page.getByTestId('puzzle-hint-button').click();
  await expect(page.getByTestId('puzzle-hint')).toContainText(pinned.song!.hint);
  const hint = await page.getByTestId('puzzle-hint').innerText();
  expect(hint.toLowerCase()).not.toContain('dil se chaiyya'); // the hint is a clue, not the answer
  await page.waitForTimeout(1300);
  expect(await num(page)).toBeLessThan(before); // the timer kept running while the hint was open
  await expect(page.getByTestId('puzzle-timeout')).toHaveCount(0);
});

test('timeout: the correct order is revealed, a clear message appears, and the dance is offered (not started)', async ({ page }) => {
  test.setTimeout(60_000);
  await trackAudio(page);
  await startWarmUp(page);
  await expect(page.getByTestId('puzzle-timeout')).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId('puzzle-timeout')).toContainText("Time's up!");
  await expect(page.getByTestId('puzzle-timeout')).toContainText("Here's the correct order.");
  expect((await tileTexts(page)).map((t) => t.trim())).toEqual(pinned.phrase.split(' ')); // the answer, in order
  await expect(page.getByTestId('song-title')).toContainText('Chaiyya Chaiyya');
  await expect(page.getByRole('button', { name: /submit|check|verify/i })).toHaveCount(0);
  expect(await num(page)).toBe(0);

  // the timer stays stopped; nothing else happens by itself
  await page.waitForTimeout(2500);
  expect(await num(page)).toBe(0);
  await expect(page.getByTestId('timeout-continue')).toBeVisible();
  await expect(page.getByTestId('accept-dance')).toHaveCount(0);
  expect(await audioCreated(page)).toBe(0);

  // the tiles are frozen once the answer is shown
  await expect(page.getByTestId('tile-0')).toBeDisabled();

  await page.getByTestId('timeout-continue').click();
  await expect(page.getByTestId('invite-title')).toHaveText("Here's the song!");
  await expect(page.getByTestId('accept-dance')).toBeVisible();
  expect(await audioCreated(page)).toBe(0); // still no sound until the player says yes
});

test('a correct answer stops the timer at once; there is exactly one transition and no late timeout', async ({ page }) => {
  test.setTimeout(60_000);
  await startWarmUp(page);
  await expect(page.getByTestId('splash')).toHaveCount(0, { timeout: 5000 });
  await solveByTaps(page, pinned.phrase);
  await expect(page.getByTestId('song-unlocked')).toContainText('You got it!');
  const frozen = await num(page);
  expect(frozen).toBeGreaterThan(0);
  await page.waitForTimeout(2000);
  expect(await num(page)).toBe(frozen); // the countdown stopped the moment it was solved
  await expect(page.getByTestId('puzzle-timeout')).toHaveCount(0);
  await expect(page.getByTestId('accept-dance')).toBeVisible({ timeout: 6000 }); // the usual transition
  await page.waitForTimeout(12_000); // long enough for a leftover timer to fire
  await expect(page.getByTestId('accept-dance')).toHaveCount(1);
  await expect(page.getByTestId('invite-title')).toHaveText('You cracked the song!');
  await expect(page.getByTestId('puzzle-timeout')).toHaveCount(0);
});

test('Shuffle again restarts the puzzle and the timer', async ({ page }) => {
  await startWarmUp(page);
  await expect(page.getByTestId('splash')).toHaveCount(0, { timeout: 5000 });
  await expect.poll(() => num(page), { timeout: 8000 }).toBeLessThanOrEqual(7);
  await page.getByTestId('shuffle-again').click();
  await expect.poll(() => num(page), { timeout: 2000 }).toBeGreaterThanOrEqual(9);
});

test('leaving mid-countdown leaves no timer behind: nothing fires afterwards and nothing crashes', async ({ page }) => {
  test.setTimeout(60_000);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await startWarmUp(page);
  await expect(page.getByTestId('splash')).toHaveCount(0, { timeout: 5000 });
  await page.getByTestId('home').click();
  await expect(page.getByTestId('title-stage')).toBeVisible();
  await page.waitForTimeout(12_000);
  await expect(page.getByTestId('title-stage')).toBeVisible();
  await expect(page.getByTestId('puzzle-timeout')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('the countdown pauses while the Rule Book is open', async ({ page }) => {
  await startWarmUp(page);
  await expect(page.getByTestId('splash')).toHaveCount(0, { timeout: 5000 });
  await page.getByTestId('nav-rules').click();
  const frozen = await num(page);
  await page.waitForTimeout(2000);
  expect(await num(page)).toBe(frozen);
  await page.keyboard.press('Escape');
  await expect.poll(() => num(page), { timeout: 4000 }).toBeLessThan(frozen);
});

test('Find the Beat uses the same 10-second timer, with its hint always visible', async ({ page }) => {
  await openWithProgress(page, 1, 'tiles', { realTimer: true }); // starts level 2
  await expect(page.getByTestId('puzzle-timer')).toBeVisible();
  await expect(page.getByTestId('puzzle-hint')).toBeVisible(); // no button needed
  await expect(page.getByTestId('puzzle-hint-button')).toHaveCount(0);
  await expect(page.getByTestId('splash')).toHaveCount(0, { timeout: 5000 });
  await expect.poll(() => num(page), { timeout: 4000 }).toBeLessThanOrEqual(9);
});

test('the dance lasts 30 seconds with a visible countdown, then stops and shows the completion', async ({ page }) => {
  test.setTimeout(90_000);
  await startWarmUp(page);
  await expect(page.getByTestId('splash')).toHaveCount(0, { timeout: 5000 });
  await solveByTaps(page, pinned.phrase);
  await expect(page.getByTestId('accept-dance')).toBeVisible({ timeout: 6000 });
  expect(await audioCreated(page).catch(() => 0)).toBeLessThanOrEqual(0);

  const started = Date.now();
  await page.getByTestId('accept-dance').click();
  await expect(page.getByTestId('dance-timer')).toBeVisible();
  await expect.poll(async () => Number(await page.getByTestId('dance-timer-num').innerText()), { timeout: 5000 }).toBeGreaterThanOrEqual(29);

  // pausing freezes the countdown
  await page.waitForTimeout(3000);
  await page.getByTestId('pause-dance').click();
  const frozen = Number(await page.getByTestId('dance-timer-num').innerText());
  await page.waitForTimeout(1500);
  expect(Number(await page.getByTestId('dance-timer-num').innerText())).toBe(frozen);
  await page.getByTestId('resume-dance').click();
  const pausedFor = 1500 + 400; // the time spent paused does not count

  await expect(page.getByRole('heading', { name: 'Dance complete!' })).toBeVisible({ timeout: 45_000 });
  const elapsed = (Date.now() - started - pausedFor) / 1000;
  expect(elapsed, `dance took ${elapsed.toFixed(1)} s of dancing time`).toBeGreaterThan(28);
  expect(elapsed).toBeLessThan(36);
  // everything stopped: no countdown left on screen, and the next step is clear
  await expect(page.getByTestId('dance-timer')).toHaveCount(0);
  await expect(page.getByTestId('next-level')).toBeVisible();
  await page.waitForTimeout(2500);
  await expect(page.getByRole('heading', { name: 'Dance complete!' })).toBeVisible();
});
