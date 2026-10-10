import { expect, test, type Page } from '@playwright/test';
import { installRandomControl, solveCurrent } from './helpers';
import { openWithProgress } from './support';

/** A fake camera that shows a test pattern (no person), so the real tracker runs but finds nobody. */
const withFakeCamera = {
  launchOptions: { args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'] },
  permissions: ['camera' as const],
};

/** Remember every camera stream the game opens, so a test can check the camera really switches off. */
async function trackStreams(page: Page) {
  await page.addInitScript(() => {
    const w = window as unknown as { __streams: MediaStream[] };
    w.__streams = [];
    const real = navigator.mediaDevices?.getUserMedia?.bind(navigator.mediaDevices);
    if (!real) return;
    navigator.mediaDevices.getUserMedia = async (c) => {
      const s = await real(c);
      w.__streams.push(s);
      return s;
    };
  });
}
test.use({ trace: 'off', ...withFakeCamera });

const liveTracks = (page: Page) =>
  page.evaluate(() => (window as unknown as { __streams: MediaStream[] }).__streams.flatMap((s) => s.getTracks()).filter((t) => t.readyState === 'live').length);

async function toInvite(page: Page) {
  await openWithProgress(page, 1); // starts Level 2, Find the Beat
  await expect(page.getByTestId('splash')).toHaveCount(0, { timeout: 6000 });
  await solveCurrent(page);
  await expect(page.getByTestId('accept-dance')).toBeVisible({ timeout: 8000 });
}

test.describe('camera points: the offer', () => {
  test('Find the Beat offers the camera, off by default, with a plain privacy note', async ({ page }) => {
    await installRandomControl(page);
    await toInvite(page);
    await expect(page.getByTestId('camera-toggle')).not.toBeChecked();
    await expect(page.getByTestId('camera-privacy')).toContainText('Nothing is recorded, saved or sent anywhere');
    // starting the dance without ticking it never touches the camera
    await page.getByTestId('accept-dance').click();
    await expect(page.getByTestId('cue')).toBeVisible();
    await expect(page.getByTestId('camera-coach')).toHaveCount(0);
  });

  test('Warm Up has no camera offer', async ({ page }) => {
    test.setTimeout(60_000);
    await installRandomControl(page);
    await page.goto('./');
    await page.getByTestId('title-stage').click();
    await page.getByTestId('tile-0').waitFor();
    await expect(page.getByTestId('splash')).toHaveCount(0, { timeout: 6000 });
    await solveCurrent(page);
    await expect(page.getByTestId('accept-dance')).toBeVisible({ timeout: 8000 });
    await expect(page.getByTestId('camera-toggle')).toHaveCount(0);
  });

  test('two players: no camera offer', async ({ page }) => {
    test.setTimeout(90_000);
    await installRandomControl(page);
    await page.addInitScript(() => localStorage.setItem('rhythmrush.v2', JSON.stringify({ completed: 1, volume: 0.7, muted: false, seated: false, players: 2 })));
    await page.goto('./');
    await page.getByTestId('title-stage').click();
    await page.getByTestId('tile-0').waitFor();
    await expect(page.getByTestId('splash')).toHaveCount(0, { timeout: 6000 });
    await solveCurrent(page);
    await page.getByTestId('handover-start').click();
    await page.getByTestId('tile-0').waitFor();
    await solveCurrent(page);
    await expect(page.getByTestId('accept-dance')).toBeVisible({ timeout: 8000 });
    await expect(page.getByTestId('camera-toggle')).toHaveCount(0);
  });
});

test.describe('camera points: with a camera that sees nobody', () => {
  test('the real tracker starts, says it cannot see you, gives no points, and the camera switches off afterwards', async ({ page }) => {
    test.setTimeout(120_000);
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await installRandomControl(page);
    await trackStreams(page);
    await toInvite(page);
    await page.getByTestId('camera-toggle').check();
    await page.getByTestId('accept-dance').click();

    await expect(page.getByTestId('camera-coach')).toHaveAttribute('data-camera-status', 'on', { timeout: 30_000 }); // the model really loaded
    await expect(page.getByTestId('camera-note')).toContainText('cannot see you yet');
    expect(await liveTracks(page)).toBeGreaterThan(0);

    // the dance runs as normal and finishes by itself
    await expect(page.getByRole('heading', { name: /Dance complete!|You finished the set!/ })).toBeVisible({ timeout: 60_000 });
    await expect(page.getByTestId('camera-score')).toHaveAttribute('data-points', 'none');
    await expect(page.getByTestId('camera-score')).toContainText('could not see you');
    await expect.poll(() => liveTracks(page)).toBe(0); // the camera is off again
    expect(errors).toEqual([]);
  });

  test('leaving the dance switches the camera off', async ({ page }) => {
    test.setTimeout(90_000);
    await installRandomControl(page);
    await trackStreams(page);
    await toInvite(page);
    await page.getByTestId('camera-toggle').check();
    await page.getByTestId('accept-dance').click();
    await expect(page.getByTestId('camera-coach')).toHaveAttribute('data-camera-status', 'on', { timeout: 30_000 });
    await page.getByTestId('home').click();
    await expect(page.getByTestId('title-stage')).toBeVisible();
    await expect.poll(() => liveTracks(page)).toBe(0);
  });
});

test.describe('camera points: when the camera cannot be used', () => {
  test('permission refused: a clear message, the dance still works, and no score card appears', async ({ page }) => {
    test.setTimeout(90_000);
    await installRandomControl(page);
    await page.addInitScript(() => {
      navigator.mediaDevices.getUserMedia = () => Promise.reject(new DOMException('no', 'NotAllowedError'));
    });
    await toInvite(page);
    await page.getByTestId('camera-toggle').check();
    await page.getByTestId('accept-dance').click();
    await expect(page.getByTestId('camera-coach')).toHaveAttribute('data-camera-status', 'denied', { timeout: 8000 });
    await expect(page.getByTestId('camera-note')).toContainText('not allowed');
    await expect(page.getByTestId('cue')).toBeVisible();
    await page.getByTestId('pause-dance').click();
    await page.getByTestId('end-dance').click();
    await expect(page.getByRole('heading', { name: /Level complete|Dance complete!|You finished the set!/ })).toBeVisible();
    await expect(page.getByTestId('camera-score')).toHaveCount(0);
  });

  test('no camera on the device: a clear message and the dance still works', async ({ page }) => {
    test.setTimeout(90_000);
    await installRandomControl(page);
    await page.addInitScript(() => {
      navigator.mediaDevices.getUserMedia = () => Promise.reject(new DOMException('none', 'NotFoundError'));
    });
    await toInvite(page);
    await page.getByTestId('camera-toggle').check();
    await page.getByTestId('accept-dance').click();
    await expect(page.getByTestId('camera-coach')).toHaveAttribute('data-camera-status', 'unavailable', { timeout: 8000 });
    await expect(page.getByTestId('cue')).toBeVisible();
  });
});
