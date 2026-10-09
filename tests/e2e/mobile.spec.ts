import { expect, test, type Page } from '@playwright/test';
import { currentPuzzle, norm, solveToInvite, tileTexts } from './helpers';

test.use({ viewport: { width: 390, height: 780 }, hasTouch: true, isMobile: true });

async function noHorizontalScroll(page: Page, where: string) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow, `horizontal overflow on ${where}`).toBeLessThanOrEqual(1);
}

async function touchTargetsOk(page: Page, where: string) {
  const small = await page.evaluate(() =>
    Array.from(document.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input[type="text"], input:not([type])'))
      .filter((el) => el.offsetParent !== null && !el.classList.contains('skip-link'))
      .map((el) => ({ label: (el.textContent || el.getAttribute('aria-label') || el.tagName).trim().slice(0, 30), h: el.getBoundingClientRect().height, w: el.getBoundingClientRect().width }))
      .filter((r) => r.h < 40 || r.w < 40),
  );
  expect(small, `touch targets under 40px on ${where}`).toEqual([]);
}

/** Real touch drag using the browser's touch input (not mouse events). */
async function touchDrag(page: Page, from: { x: number; y: number }, to: { x: number; y: number }) {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [from] });
  for (let i = 1; i <= 12; i++) {
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x: from.x + ((to.x - from.x) * i) / 12, y: from.y + ((to.y - from.y) * i) / 12 }],
    });
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
}

test('mobile: every screen fits, touch targets are large, and tiles drag with a finger', async ({ page }) => {
  await page.goto('./');
  await noHorizontalScroll(page, 'title');
  await touchTargetsOk(page, 'title');
  await page.getByTestId('title-stage').tap();
  await expect(page.getByTestId('tile-0')).toBeVisible();
  await expect(page.getByTestId('splash')).toHaveCount(0, { timeout: 5000 });
  await noHorizontalScroll(page, 'puzzle');
  await touchTargetsOk(page, 'puzzle');

  // finger drag from tile 0 to tile 3
  const before = await tileTexts(page);
  const a = (await page.getByTestId('tile-0').boundingBox())!;
  const d = (await page.getByTestId('tile-3').boundingBox())!;
  await touchDrag(page, { x: a.x + a.width / 2, y: a.y + a.height / 2 }, { x: d.x + d.width * 0.85, y: d.y + d.height / 2 });
  const after = await tileTexts(page);
  expect(after).not.toEqual(before);
  expect(after[3]).toBe(before[0]);
  expect([...after].sort()).toEqual([...before].sort());

  // regression: after a finger drag, taps still work (the drag must not leave anything stuck)
  const solvedByDrag = (await page.getByTestId('song-unlocked').count()) > 0;
  if (!solvedByDrag) {
    await expect(page.locator('.tile.is-dragging')).toHaveCount(0);
    const target = (await currentPuzzle(page)).phrase.split(' ');
    for (let i = 0; i < target.length; i++) {
      const cur = await tileTexts(page);
      if (norm(cur[i]) === norm(target[i])) continue;
      const j = cur.findIndex((t, k) => k > i && norm(t) === norm(target[i]));
      await page.getByTestId(`tile-${j}`).tap();
      await page.getByTestId(`tile-${i}`).tap();
    }
  }
  await expect(page.getByTestId('song-unlocked')).toBeVisible();
  await expect(page.getByTestId('accept-dance')).toBeVisible({ timeout: 6000 });
  await noHorizontalScroll(page, 'invite');
  await touchTargetsOk(page, 'invite');

  await page.getByTestId('accept-dance').tap();
  await expect(page.getByTestId('cue')).toBeVisible();
  await noHorizontalScroll(page, 'dance');
  await touchTargetsOk(page, 'dance');
  await page.getByTestId('pause-dance').tap();
  await noHorizontalScroll(page, 'pause');
  await page.getByTestId('end-dance').tap();
  await noHorizontalScroll(page, 'celebrate');
  await touchTargetsOk(page, 'celebrate');
});

test('mobile: make-a-puzzle screen and rule book fit the screen', async ({ page }) => {
  await page.goto('./');
  await page.getByTestId('nav-make').tap();
  await page.getByTestId('phrase-input').fill('Jump into the sunshine');
  await page.getByTestId('make-link').tap();
  await expect(page.getByTestId('share-panel')).toBeVisible();
  await noHorizontalScroll(page, 'create');
  await touchTargetsOk(page, 'create');
  await page.getByTestId('nav-rules').tap();
  await expect(page.getByRole('dialog', { name: 'How to play' })).toBeVisible();
  await noHorizontalScroll(page, 'rule book');
});

test('mobile: seated dance fits and the stage is cropped for small screens', async ({ page }) => {
  await page.goto('./');
  await page.getByTestId('title-stage').tap();
  await expect(page.getByTestId('splash')).toHaveCount(0, { timeout: 5000 });
  await page.getByTestId('tile-0').waitFor();
  await page.evaluate(() => localStorage.setItem('rhythmrush.v2', JSON.stringify({ completed: 0, volume: 0.7, muted: false, seated: true })));
  await page.reload();
  await page.getByTestId('title-stage').tap();
  await page.getByTestId('tile-0').waitFor();
  await expect(page.getByTestId('splash')).toHaveCount(0, { timeout: 5000 });
  await solveToInvite(page);
  await page.getByTestId('accept-dance').tap();
  await expect(page.locator('.chair').first()).toBeVisible();
  const vb = await page.locator('.stage-svg').getAttribute('viewBox');
  expect(vb).toBe('95 0 590 360');
  await noHorizontalScroll(page, 'seated dance');
});
