import { expect, test } from '@playwright/test';
import { seedSettings, startSolo } from './helpers';

// Confirms the silhouette really animates (computed transforms change) and stops when paused.
test('dance figure animates and pauses', async ({ page }) => {
  await seedSettings(page, { moveSeconds: 60 });
  await page.goto('/');
  await startSolo(page);
  await page.getByTestId('start-puzzle').click();
  await page.getByTestId('skip-puzzle').click();
  await page.getByTestId('to-music').click();
  await page.getByTestId('to-dance').click();
  await page.getByTestId('dance-start').click();
  const t = () => page.evaluate(() => getComputedStyle(document.querySelector('.fig .body')!).transform);
  const a = await t();
  await page.waitForTimeout(500);
  const b = await t();
  expect(a).not.toBe(b);
  await page.getByTestId('dance-pause').click();
  const c = await t();
  await page.waitForTimeout(500);
  expect(await t()).toBe(c);
});
