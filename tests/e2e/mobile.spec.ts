import { expect, test, type Page } from '@playwright/test';
import { seedSettings, solve, startSolo } from './helpers';

test.use({ viewport: { width: 375, height: 667 }, hasTouch: true, isMobile: true });

async function noHorizontalScroll(page: Page, where: string) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow, `horizontal overflow on ${where}`).toBeLessThanOrEqual(1);
}

async function touchTargetsOk(page: Page, where: string) {
  const small = await page.evaluate(() =>
    Array.from(document.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input'))
      .filter((el) => el.offsetParent !== null && !el.classList.contains('skip-link') && !(el as HTMLInputElement).type?.match(/range|checkbox/))
      .map((el) => ({ label: (el.textContent || el.getAttribute('aria-label') || el.tagName).trim().slice(0, 30), h: el.getBoundingClientRect().height, w: el.getBoundingClientRect().width }))
      .filter((r) => r.h < 40 || r.w < 40),
  );
  expect(small, `touch targets under 40px on ${where}`).toEqual([]);
}

test('mobile layout: all main screens fit and touch targets are large; tap-to-swap works', async ({ page }) => {
  await seedSettings(page);
  await page.goto('/');
  await noHorizontalScroll(page, 'home');
  await touchTargetsOk(page, 'home');

  await startSolo(page);
  await page.getByTestId('start-puzzle').click();
  await noHorizontalScroll(page, 'puzzle');
  await touchTargetsOk(page, 'puzzle');

  // tap-to-swap works with touch
  const phrase = await solve(page);
  expect(phrase).toBeTruthy();
  await page.getByTestId('submit-answer').tap();
  await expect(page.getByTestId('puzzle-result')).toBeVisible();
  await noHorizontalScroll(page, 'puzzle result');

  await page.getByTestId('to-music').tap();
  await noHorizontalScroll(page, 'music');
  await touchTargetsOk(page, 'music');
  await page.getByTestId('to-dance').tap();
  await noHorizontalScroll(page, 'dance');
  await touchTargetsOk(page, 'dance');
  await page.getByTestId('dance-start').tap();
  await page.getByTestId('dance-complete').tap({ timeout: 15_000 });
  await noHorizontalScroll(page, 'results');

  await page.getByTestId('nav-rules').tap();
  await expect(page.getByRole('dialog', { name: 'Rule Book' })).toBeVisible();
  await noHorizontalScroll(page, 'rule book');
});
