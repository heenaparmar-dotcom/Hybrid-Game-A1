import { expect, test } from '@playwright/test';
import { currentPuzzle, installRandomControl, solveCurrent } from './helpers';

test.use({ trace: 'off' });

test('title: one player is the default; the choice is remembered and does not start the game', async ({ page }) => {
  await installRandomControl(page);
  await page.goto('./');
  await expect(page.getByTestId('players-1')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByTestId('players-2')).toHaveAttribute('aria-pressed', 'false');
  await page.getByTestId('players-2').click();
  await expect(page.getByTestId('players-2')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByTestId('title-stage')).toBeVisible(); // choosing did not start the game
  await expect.poll(() => page.evaluate(() => localStorage.getItem('rhythmrush.v2'))).toContain('"players":2');
  await page.reload();
  await expect(page.getByTestId('players-2')).toHaveAttribute('aria-pressed', 'true');
});

test('two players: each solves a different puzzle, then both dance to the faster solver\'s song', async ({ page }) => {
  test.setTimeout(90_000);
  await installRandomControl(page);
  await page.goto('./');
  await page.getByTestId('players-2').click();
  await page.getByTestId('title-stage').click();
  await page.getByTestId('tile-0').waitFor();
  await expect(page.getByTestId('splash')).toHaveCount(0, { timeout: 5000 });
  await expect(page.locator('.kicker').first()).toContainText('Player 1');
  const first = await solveCurrent(page);

  await expect(page.getByTestId('handover')).toBeVisible({ timeout: 8000 });
  await page.getByTestId('handover-start').click();
  await page.getByTestId('tile-0').waitFor();
  await expect(page.locator('.kicker').first()).toContainText('Player 2');
  const second = await currentPuzzle(page);
  expect(second.id).not.toBe(first.id); // a different puzzle for Player 2
  await solveCurrent(page);

  await expect(page.getByTestId('accept-dance')).toBeVisible({ timeout: 8000 });
  await expect(page.getByTestId('song-note')).toContainText(/Player [12] solved/);
  await page.getByTestId('accept-dance').click();
  await expect(page.getByTestId('cue')).toBeVisible();
  const stage = page.locator('svg.stage-svg');
  await expect(stage).toContainText('PLAYER 1');
  await expect(stage).toContainText('PLAYER 2');
  await expect(stage).not.toContainText('YOUR SPOT');
});

test('one player is unchanged: no hand-over, and the stage shows "your spot"', async ({ page }) => {
  test.setTimeout(90_000);
  await installRandomControl(page);
  await page.goto('./');
  await page.getByTestId('title-stage').click();
  await page.getByTestId('tile-0').waitFor();
  await expect(page.getByTestId('splash')).toHaveCount(0, { timeout: 5000 });
  await solveCurrent(page);
  await expect(page.getByTestId('accept-dance')).toBeVisible({ timeout: 8000 });
  await expect(page.getByTestId('handover')).toHaveCount(0);
  await page.getByTestId('accept-dance').click();
  await expect(page.getByTestId('cue')).toBeVisible();
  await expect(page.locator('svg.stage-svg')).toContainText('YOUR SPOT');
});
