import { expect, test, type Page } from '@playwright/test';
import { LISTEN_CHALLENGES } from '../../src/data/listen';
import { audioCreated, noAudio } from './helpers';
import { fakeSpeech, openWithProgress } from './support';

test.use({ trace: 'off' });

const clipStatus = (page: Page) => page.getByTestId('clip-status');
const correctText = async (page: Page) => (await page.locator('[data-testid="option"][data-correct="yes"]').innerText()).trim();

/** Remember every media element the game plays, so a test can look at its real state. */
async function trackMedia(page: Page) {
  await page.addInitScript(() => {
    const w = window as unknown as { __media: HTMLMediaElement[] };
    w.__media = [];
    const real = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function (this: HTMLMediaElement) {
      if (!w.__media.includes(this)) w.__media.push(this);
      return real.call(this);
    };
  });
}
const media = (page: Page) =>
  page.evaluate(() => {
    const list = (window as unknown as { __media: HTMLMediaElement[] }).__media;
    return list.map((m) => ({ src: m.currentSrc, paused: m.paused, time: m.currentTime, duration: m.duration }));
  });

/** Make the recordings unavailable, so the demo clip takes over. */
const blockRecordings = (page: Page) => page.route('**/audio/listen-*.mp3', (route) => route.abort());

test('Level 3 is a listening level: no word tiles, no submit, the three song titles as choices', async ({ page }) => {
  await openWithProgress(page, 2, 'listen');
  await expect(page.getByRole('heading', { name: 'Listen, then choose' })).toBeVisible();
  await expect(page.getByText('Clip 1 of 3')).toBeVisible();
  await expect(page.getByText('Which song did you hear?').first()).toBeVisible();
  await expect(page.locator('[data-testid^="tile-"]')).toHaveCount(0); // nothing to rearrange
  await expect(page.getByRole('button', { name: /submit|check|verify/i })).toHaveCount(0);
  const options = (await page.getByTestId('option').allInnerTexts()).map((o) => o.trim());
  expect(options).toHaveLength(3);
  expect([...options].sort()).toEqual([...LISTEN_CHALLENGES[0].options].sort());
  await expect(page.locator('[data-testid="option"][data-correct="yes"]')).toHaveCount(1);
});

test('the recording plays only when Play is pressed, as real audio; pause, resume and replay work', async ({ page }) => {
  test.setTimeout(60_000);
  await trackMedia(page);
  await openWithProgress(page, 2, 'listen');
  expect(await media(page)).toHaveLength(0); // nothing started by itself
  await expect(clipStatus(page)).toHaveText('idle');

  await page.getByTestId('clip-play').click();
  await expect(clipStatus(page)).toHaveText('playing');
  await expect(page.getByTestId('clip-source')).toHaveCount(0); // a real recording, not the demo
  await expect(page.getByTestId('clip-file-failed')).toHaveCount(0);
  await expect.poll(async () => (await media(page))[0]?.time ?? 0, { timeout: 8000 }).toBeGreaterThan(0.5); // it really advances
  expect((await media(page))[0].src).toContain('/audio/listen-');

  await page.getByTestId('clip-pause').click();
  await expect(clipStatus(page)).toHaveText('paused');
  await expect.poll(async () => (await media(page))[0].paused).toBe(true);
  await page.getByTestId('clip-pause').click(); // the same button is now Resume
  await expect(clipStatus(page)).toHaveText('playing');
  await expect.poll(async () => (await media(page))[0].paused).toBe(false);

  await page.getByTestId('clip-play').click(); // replay from the start
  await expect(clipStatus(page)).toHaveText('playing');
  await expect.poll(async () => (await media(page)).length).toBeGreaterThanOrEqual(2);
});

test('answering: a wrong choice gives gentle feedback, the right one is celebrated, three different clips, then the dance', async ({ page }) => {
  test.setTimeout(120_000);
  await openWithProgress(page, 2, 'listen');
  const answers: string[] = [];

  for (let clip = 1; clip <= 3; clip++) {
    await expect(page.getByText(`Clip ${clip} of 3`)).toBeVisible();
    await expect(page.getByTestId('listen-feedback')).toContainText('Choose the song');
    answers.push(await correctText(page));
    await page.getByTestId('clip-play').click();
    await expect(clipStatus(page)).toHaveText('playing');

    if (clip === 1) {
      // a wrong answer: feedback, that choice is closed, no way forward yet
      await page.locator('[data-testid="option"][data-correct="no"]').first().click();
      await expect(page.getByTestId('listen-feedback')).toContainText('Not quite');
      await expect(page.locator('[data-testid="option"][data-correct="no"]').first()).toBeDisabled();
      await expect(page.getByTestId('listen-next')).toHaveCount(0);
    }
    await page.locator('[data-testid="option"][data-correct="yes"]').click();
    await expect(page.getByTestId('listen-feedback')).toContainText('Correct');
    await expect(page.getByTestId('listen-next')).toContainText(clip === 3 ? 'Finish level' : 'Next clip');
    await page.getByTestId('listen-next').click();
  }
  expect(new Set(answers).size).toBe(3); // three different songs

  // the existing level experience: dance invitation, dance, celebration
  await expect(page.getByTestId('accept-dance')).toBeVisible({ timeout: 6000 });
  await expect(page.getByRole('heading', { name: 'You cracked the song!' })).toBeVisible();
  await page.getByTestId('accept-dance').click();
  await expect(page.getByRole('heading', { name: 'Hook-Step Party' })).toBeVisible();
  await page.getByTestId('pause-dance').click();
  await page.getByTestId('end-dance').click();
  await expect(page.getByRole('heading', { name: 'You finished the set!' })).toBeVisible();
});

test('the clue for a player who cannot listen names the instrument, never the answer', async ({ page }) => {
  await openWithProgress(page, 2, 'listen');
  await expect(page.getByTestId('captions')).toHaveCount(0);
  await page.getByTestId('show-words').click();
  const clue = (await page.getByTestId('captions').innerText()).trim();
  expect(clue.toLowerCase()).toMatch(/piano|flute|keyboard/);
  expect(clue.toLowerCase()).not.toContain((await correctText(page)).toLowerCase());
  await page.getByTestId('show-words').click();
  await expect(page.getByTestId('captions')).toHaveCount(0);
});

test('if a recording cannot load, the game says so and the demo clip plays instead', async ({ page }) => {
  await blockRecordings(page);
  await fakeSpeech(page, 'ok');
  await openWithProgress(page, 2, 'listen');
  await page.getByTestId('clip-play').click();
  await expect(page.getByTestId('clip-file-failed')).toBeVisible({ timeout: 8000 });
  await expect(clipStatus(page)).toHaveText('playing');
  await expect(page.getByTestId('clip-source')).toContainText('Demo clip');
  await page.locator('[data-testid="option"][data-correct="yes"]').click();
  await expect(page.getByTestId('listen-next')).toBeVisible();
});

test('no Web Audio and no recording: a clear message, the clue can be shown, and the level can still be finished', async ({ page }) => {
  test.setTimeout(90_000);
  await noAudio(page);
  await blockRecordings(page);
  await fakeSpeech(page, 'ok');
  await openWithProgress(page, 2, 'listen');
  await page.getByTestId('clip-play').click();
  await expect(page.getByTestId('clip-sound-missing')).toBeVisible({ timeout: 8000 });
  await page.getByTestId('show-words').click();
  await expect(page.getByTestId('captions')).toBeVisible();
  for (let i = 0; i < 3; i++) {
    await page.locator('[data-testid="option"][data-correct="yes"]').click();
    await page.getByTestId('listen-next').click();
  }
  await expect(page.getByTestId('accept-dance')).toBeVisible({ timeout: 6000 });
});

test('no recording and no speech voice: the game says so and the level can still be finished', async ({ page }) => {
  await blockRecordings(page);
  await fakeSpeech(page, 'none');
  await openWithProgress(page, 2, 'listen');
  await page.getByTestId('clip-play').click();
  await expect(page.getByTestId('clip-voice-missing')).toBeVisible({ timeout: 12_000 });
  await page.locator('[data-testid="option"][data-correct="yes"]').click();
  await expect(page.getByTestId('listen-next')).toBeVisible();
});

test('leaving the level silences the recording', async ({ page }) => {
  await trackMedia(page);
  await openWithProgress(page, 2, 'listen');
  await page.getByTestId('clip-play').click();
  await expect(clipStatus(page)).toHaveText('playing');
  await expect.poll(async () => (await media(page)).length).toBeGreaterThanOrEqual(1);
  await page.getByTestId('home').click();
  await expect(page.getByTestId('title-stage')).toBeVisible();
  await expect.poll(async () => (await media(page)).every((m) => m.paused)).toBe(true);
});

test('REAL browser engine (nothing faked): every recording loads and plays, and nothing crashes', async ({ page }) => {
  test.setTimeout(60_000);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await trackMedia(page);
  await openWithProgress(page, 2, 'listen');
  await page.getByTestId('clip-play').click();
  await expect(clipStatus(page)).toHaveText('playing');
  await expect.poll(async () => (await media(page))[0]?.time ?? 0, { timeout: 10_000 }).toBeGreaterThan(0.5);
  const m = (await media(page))[0];
  console.log(`REAL ENGINE: ${m.src.split('/').pop()} duration=${m.duration.toFixed(1)}s, web audio contexts=${await audioCreated(page)}`);
  expect(m.duration).toBeGreaterThan(5);
  expect(errors).toEqual([]);
});
