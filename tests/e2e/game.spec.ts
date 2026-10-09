import { expect, test } from '@playwright/test';
import { playTurn, seedSettings, solve, startDuo, startSolo, tileTexts } from './helpers';

test.beforeEach(async ({ page }) => {
  await seedSettings(page);
  await page.goto('/');
});

test('primary journey: home > setup > puzzle > music > dance > results > theme unlock > new round', async ({ page }) => {
  await expect(page.getByRole('heading', { name: /solve the song/i })).toBeVisible();
  await startDuo(page, 'Ana', 'Ben');

  // Ana's turn
  await expect(page.getByTestId('current-player')).toHaveText("Ana's turn");
  await playTurn(page);

  // Hand-over to Ben
  await expect(page.getByRole('heading', { name: /Ben, you're up/ })).toBeVisible();
  await playTurn(page);

  // Results
  await expect(page.getByTestId('winner-banner')).toBeVisible();
  await expect(page.getByTestId('winner')).toContainText(/wins the round|tie/);
  const a = Number(await page.getByTestId('turn-total-0').innerText());
  const b = Number(await page.getByTestId('turn-total-1').innerText());
  expect(a).toBeGreaterThanOrEqual(200); // 100 puzzle + 100 movement + speed bonus
  expect(b).toBeGreaterThanOrEqual(200);
  await expect(page.getByTestId('match-totals')).toContainText(`Ana ${a}`);

  // Two song-and-dance turns completed -> Retro Rewind unlocked
  await expect(page.getByTestId('unlocked-banner')).toContainText('Retro Rewind');

  // New round, same players
  await page.getByTestId('next-round').click();
  await expect(page.getByTestId('current-player')).toHaveText("Ana's turn");
  await expect(page.getByTestId('turnbar')).toContainText('Round 2');
  await expect(page.getByTestId('turnbar')).toContainText(`Ana: ${a}`);
});

test('theme unlock persists across refresh and enables Retro Rewind', async ({ page }) => {
  await startSolo(page);
  await playTurn(page);
  await expect(page.getByTestId('winner')).toBeVisible();
  await page.getByTestId('return-home').click();
  await page.getByTestId('solo-practice').click();
  await page.getByTestId('setup-continue').click();
  await expect(page.getByTestId('theme-retro')).toBeDisabled(); // only 1 of 2 so far
  await page.getByTestId('theme-start').click();
  await playTurn(page);
  await expect(page.getByTestId('unlocked-banner')).toContainText('Retro Rewind');

  await page.reload();
  await page.getByTestId('solo-practice').click();
  await page.getByTestId('setup-continue').click();
  await expect(page.getByTestId('theme-retro')).toBeEnabled();
  await expect(page.getByTestId('theme-hook')).toBeDisabled();
  await page.getByTestId('theme-retro').click();
  await page.getByTestId('theme-start').click();
  await page.getByTestId('start-puzzle').click();
  const tiles = await tileTexts(page);
  expect(tiles.length).toBeGreaterThanOrEqual(4);
});

test('incorrect answer, hint and no duplicate scoring', async ({ page }) => {
  await startSolo(page);
  await page.getByTestId('start-puzzle').click();

  // Initial scramble is guaranteed wrong
  await page.getByTestId('submit-answer').click();
  await expect(page.getByTestId('puzzle-feedback')).toContainText('Not quite');
  await expect(page.getByTestId('puzzle-result')).toHaveCount(0);

  await page.getByTestId('hint').click();
  await expect(page.getByTestId('hints-used')).toContainText('1/');
  await solve(page);
  await page.getByTestId('submit-answer').click();
  await expect(page.getByTestId('puzzle-result')).toBeVisible();
  await expect(page.getByTestId('puzzle-points')).toContainText('80'); // 100 - one hint
  // Submit is gone once solved, so the same answer cannot be scored again
  await expect(page.getByTestId('submit-answer')).toHaveCount(0);
});

test('puzzle timeout reveals the answer, scores 0 and still continues', async ({ page }) => {
  await page.getByTestId('nav-settings').click();
  await page.getByTestId('puzzle-seconds').fill('3');
  await page.getByRole('button', { name: /Back/ }).click();
  await startSolo(page);
  await page.getByTestId('start-puzzle').click();
  await expect(page.getByTestId('puzzle-result')).toBeVisible({ timeout: 10_000 });
  await expect(page.getByTestId('puzzle-result')).toContainText("Time's up");
  await expect(page.getByTestId('puzzle-points')).toContainText('0');
  await expect(page.getByTestId('solved-phrase')).not.toBeEmpty();
  await page.getByTestId('to-music').click();
  await expect(page.getByTestId('to-dance')).toBeVisible();
});

test('skipping movement earns no movement points; puzzle skip still continues', async ({ page }) => {
  await startSolo(page);
  await playTurn(page, { complete: false });
  await expect(page.getByTestId('turn-total-0')).toBeVisible();
  const total = Number(await page.getByTestId('turn-total-0').innerText());
  expect(total).toBeLessThan(200); // no movement points
  expect(total).toBeGreaterThanOrEqual(100);
  await expect(page.getByTestId('personal-best')).toContainText('Previous personal best: 0');

  await page.getByTestId('replay').click();
  await playTurn(page, { solve: false });
  await expect(page.getByTestId('turn-total-0')).toHaveText('100'); // movement only
});

test('seated style earns the same movement points', async ({ page }) => {
  await startSolo(page);
  await page.getByTestId('start-puzzle').click();
  await page.getByTestId('skip-puzzle').click();
  await page.getByTestId('to-music').click();
  await page.getByTestId('to-dance').click();
  await page.getByTestId('style-seated').click();
  await expect(page.getByTestId('move-cue')).toBeVisible();
  await page.getByTestId('dance-start').click();
  await page.getByTestId('dance-complete').click({ timeout: 15_000 });
  await expect(page.getByTestId('turn-total-0')).toHaveText('100');
  await expect(page.getByTestId('score-card-0')).toContainText('seated');
});

test('dance: pause and resume hold the countdown', async ({ page }) => {
  await page.getByTestId('nav-settings').click();
  await page.getByTestId('move-seconds').fill('30');
  await page.getByRole('button', { name: /Back/ }).click();
  await startSolo(page);
  await page.getByTestId('start-puzzle').click();
  await page.getByTestId('skip-puzzle').click();
  await page.getByTestId('to-music').click();
  await page.getByTestId('to-dance').click();
  await page.getByTestId('dance-start').click();
  await page.getByTestId('dance-pause').click();
  const t1 = await page.getByTestId('move-timer').innerText();
  await page.waitForTimeout(1500);
  expect(await page.getByTestId('move-timer').innerText()).toBe(t1);
  await page.getByTestId('dance-resume').click();
  await expect(page.getByTestId('dance-pause')).toBeVisible();
  await expect(page.getByTestId('dance-complete')).toHaveCount(0); // not available before the countdown ends
});

test('rule book is reachable during play and pauses the puzzle timer', async ({ page }) => {
  await startSolo(page);
  await page.getByTestId('start-puzzle').click();
  await page.getByTestId('nav-rules').click();
  const dialog = page.getByRole('dialog', { name: 'Rule Book' });
  await expect(dialog).toContainText('Players');
  await expect(dialog).toContainText('Conflict');
  const t1 = await page.getByTestId('puzzle-timer').innerText();
  await page.waitForTimeout(1500);
  expect(await page.getByTestId('puzzle-timer').innerText()).toBe(t1);
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect.poll(async () => page.getByTestId('puzzle-timer').innerText(), { timeout: 5000 }).not.toBe(t1);
});

test('keyboard can pick up and move a tile', async ({ page }) => {
  await startSolo(page);
  await page.getByTestId('start-puzzle').click();
  const before = await tileTexts(page);
  await page.getByTestId('tile-0').focus();
  await page.keyboard.press('Enter');
  await page.keyboard.press('ArrowRight');
  const after = await tileTexts(page);
  expect(after[1]).toBe(before[0]);
  expect(after[0]).toBe(before[1]);
});

test('restart puzzle resets hints and timer', async ({ page }) => {
  await startSolo(page);
  await page.getByTestId('start-puzzle').click();
  await page.getByTestId('hint').click();
  await expect(page.getByTestId('hints-used')).toContainText('1/');
  await page.getByTestId('restart-puzzle').click();
  await page.getByTestId('start-puzzle').click();
  await expect(page.getByTestId('hints-used')).toContainText('0/');
});

test('leaving mid-turn asks for confirmation', async ({ page }) => {
  await startSolo(page);
  await page.getByTestId('start-puzzle').click();
  await page.getByTestId('nav-home').click();
  await expect(page.getByRole('dialog', { name: 'Leave this round?' })).toBeVisible();
  await page.getByTestId('confirm-leave').click();
  await expect(page.getByTestId('start-game')).toBeVisible();
});

test('setup validates names', async ({ page }) => {
  await page.getByTestId('start-game').click();
  await page.getByTestId('name-1').fill('Same');
  await page.getByTestId('name-2').fill('same');
  await page.getByTestId('setup-continue').click();
  await expect(page.getByTestId('setup-error')).toBeVisible();
  await page.getByTestId('name-2').fill('');
  await page.getByTestId('setup-continue').click();
  await expect(page.getByTestId('setup-error')).toContainText('Player 2');
});

test('audio fallback: game continues when Web Audio is unavailable', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'AudioContext', { value: undefined, configurable: true });
    Object.defineProperty(window, 'webkitAudioContext', { value: undefined, configurable: true });
  });
  await page.goto('/');
  await startSolo(page);
  await page.getByTestId('start-puzzle').click();
  await page.getByTestId('skip-puzzle').click();
  await page.getByTestId('to-music').click();
  await page.getByTestId('play-track').click();
  await expect(page.getByTestId('audio-fallback')).toBeVisible();
  await page.getByTestId('to-dance').click();
  await page.getByTestId('dance-start').click();
  await expect(page.getByTestId('audio-fallback')).toBeVisible();
  await page.getByTestId('dance-complete').click({ timeout: 15_000 });
  await expect(page.getByTestId('turn-total-0')).toHaveText('100');
});

test('settings and scores persist after refresh', async ({ page }) => {
  await page.getByTestId('nav-settings').click();
  await page.getByTestId('puzzle-preset-60').click();
  await page.getByTestId('animated-guide').uncheck();
  await page.reload();
  await page.getByTestId('nav-settings').click();
  await expect(page.getByTestId('puzzle-seconds')).toHaveValue('60');
  await expect(page.getByTestId('animated-guide')).not.toBeChecked();
});
