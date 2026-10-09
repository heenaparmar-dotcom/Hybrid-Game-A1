import { expect, test, type Page } from '@playwright/test';
import { LISTEN_CHALLENGES } from '../../src/data/listen';
import { audioCreated, noAudio, trackAudio } from './helpers';
import { fakeSpeech, openWithProgress, speech } from './support';

const clipStatus = (page: Page) => page.getByTestId('clip-status');
const correctText = async (page: Page) => (await page.locator('[data-testid="option"][data-correct="yes"]').innerText()).trim();

test('Level 3 is a listening level: no word tiles, no submit, three answer choices for the first clip', async ({ page }) => {
  await fakeSpeech(page, 'ok');
  await openWithProgress(page, 2, 'listen');
  await expect(page.getByRole('heading', { name: 'Listen, then choose' })).toBeVisible();
  await expect(page.getByText('Clip 1 of 2')).toBeVisible();
  await expect(page.locator('[data-testid^="tile-"]')).toHaveCount(0); // nothing to rearrange
  await expect(page.getByRole('button', { name: /submit|check|verify/i })).toHaveCount(0);
  const options = await page.getByTestId('option').allInnerTexts();
  expect(options).toHaveLength(3);
  expect(new Set(options).size).toBe(3);
  await expect(page.locator('[data-testid="option"][data-correct="yes"]')).toHaveCount(1);
  const match = LISTEN_CHALLENGES.find((c) => [...c.options].sort().join('|') === [...options.map((o) => o.trim())].sort().join('|'));
  expect(match, 'the options belong to one of the two configured challenges').toBeTruthy();
});

test('sound starts only when the player presses Play; pause, resume and replay work; the line is spoken over the clip', async ({ page }) => {
  await trackAudio(page);
  await fakeSpeech(page, 'ok');
  await openWithProgress(page, 2, 'listen');
  expect(await audioCreated(page)).toBe(0); // nothing has started by itself
  expect((await speech(page)).spoken).toHaveLength(0);
  await expect(clipStatus(page)).toHaveText('idle');

  const line = await correctText(page);
  await page.getByTestId('clip-play').click();
  await expect(clipStatus(page)).toHaveText('playing');
  expect(await audioCreated(page)).toBeGreaterThanOrEqual(1);
  await expect(page.getByTestId('clip-source')).toContainText('Demo clip');
  await expect.poll(async () => (await speech(page)).spoken.length, { timeout: 10_000 }).toBe(1);
  expect((await speech(page)).spoken[0]).toBe(line); // the voice says the correct line

  await page.getByTestId('clip-pause').click();
  await expect(clipStatus(page)).toHaveText('paused');
  await expect.poll(async () => (await speech(page)).paused).toBeGreaterThanOrEqual(1);
  await page.getByTestId('clip-pause').click(); // the same button is now Resume
  await expect(clipStatus(page)).toHaveText('playing');
  await expect.poll(async () => (await speech(page)).resumed).toBeGreaterThanOrEqual(1);

  await expect(clipStatus(page)).toHaveText('ended', { timeout: 15_000 }); // the clip finishes by itself
  await page.getByTestId('clip-play').click(); // replay
  await expect(clipStatus(page)).toHaveText('playing');
  await expect.poll(async () => (await speech(page)).spoken.length, { timeout: 10_000 }).toBe(2);
});

test('answering: wrong choice gives gentle feedback, the right one is celebrated, then the second, different clip, then the dance', async ({ page }) => {
  test.setTimeout(120_000);
  await fakeSpeech(page, 'ok');
  await openWithProgress(page, 2, 'listen');

  const firstLine = await correctText(page);
  const firstOptions = (await page.getByTestId('option').allInnerTexts()).map((o) => o.trim());
  await page.getByTestId('clip-play').click();

  // a wrong answer: feedback, that choice is closed, no way forward yet
  await page.locator('[data-testid="option"][data-correct="no"]').first().click();
  await expect(page.getByTestId('listen-feedback')).toContainText('Not quite');
  await expect(page.locator('[data-testid="option"][data-correct="no"]').first()).toBeDisabled();
  await expect(page.getByTestId('listen-next')).toHaveCount(0);

  // the right answer
  await page.locator('[data-testid="option"][data-correct="yes"]').click();
  await expect(page.getByTestId('listen-feedback')).toContainText('Correct');
  await expect(page.getByTestId('listen-next')).toContainText('Next clip');
  await page.getByTestId('listen-next').click();

  // the second clip is a different challenge
  await expect(page.getByText('Clip 2 of 2')).toBeVisible();
  await expect(page.getByTestId('listen-feedback')).toContainText('Choose the line');
  const secondLine = await correctText(page);
  const secondOptions = (await page.getByTestId('option').allInnerTexts()).map((o) => o.trim());
  expect(secondLine).not.toBe(firstLine);
  expect(secondOptions.filter((o) => firstOptions.includes(o))).toEqual([]);
  await page.getByTestId('clip-play').click();
  await expect(clipStatus(page)).toHaveText('playing');
  await expect.poll(async () => (await speech(page)).spoken.includes(secondLine), { timeout: 10_000 }).toBe(true);
  await page.locator('[data-testid="option"][data-correct="yes"]').click();
  await expect(page.getByTestId('listen-next')).toContainText('Finish level');
  await page.getByTestId('listen-next').click();

  // the existing level experience: dance invitation, dance, celebration
  await expect(page.getByTestId('accept-dance')).toBeVisible({ timeout: 6000 });
  await expect(page.getByRole('heading', { name: 'You cracked the song!' })).toBeVisible();
  await page.getByTestId('accept-dance').click();
  await expect(page.getByRole('heading', { name: 'Hook-Step Party' })).toBeVisible();
  await page.getByTestId('pause-dance').click();
  await page.getByTestId('end-dance').click();
  await expect(page.getByRole('heading', { name: 'You finished the set!' })).toBeVisible();
});

test('both clips use different music', async ({ page }) => {
  const [a, b] = LISTEN_CHALLENGES;
  expect(a.placeholder.track).not.toBe(b.placeholder.track);
  await page.goto('./');
});

test('no Web Audio at all: a clear message, the words can be shown, and the level can still be finished', async ({ page }) => {
  test.setTimeout(90_000);
  await noAudio(page);
  await fakeSpeech(page, 'ok');
  await openWithProgress(page, 2, 'listen');
  await page.getByTestId('clip-play').click();
  await expect(page.getByTestId('clip-sound-missing')).toBeVisible();
  await page.getByTestId('show-words').click();
  const line = await correctText(page);
  await expect(page.getByTestId('captions')).toContainText(line);
  await page.locator('[data-testid="option"][data-correct="yes"]').click();
  await page.getByTestId('listen-next').click();
  await page.locator('[data-testid="option"][data-correct="yes"]').click();
  await page.getByTestId('listen-next').click();
  await expect(page.getByTestId('accept-dance')).toBeVisible({ timeout: 6000 });
});

test('no speech voice on the device: the game says so and the words can be shown', async ({ page }) => {
  await fakeSpeech(page, 'none');
  await openWithProgress(page, 2, 'listen');
  await page.getByTestId('clip-play').click();
  await expect(page.getByTestId('clip-voice-missing')).toBeVisible({ timeout: 10_000 });
  await page.getByTestId('show-words').click();
  await expect(page.getByTestId('captions')).toContainText(await correctText(page));
  await page.locator('[data-testid="option"][data-correct="yes"]').click();
  await expect(page.getByTestId('listen-next')).toBeVisible();
});

test('a voice that never starts does not leave the player waiting: a message appears after a few seconds', async ({ page }) => {
  await fakeSpeech(page, 'never-starts');
  await openWithProgress(page, 2, 'listen');
  await page.getByTestId('clip-play').click();
  await expect(page.getByTestId('clip-voice-missing')).toBeVisible({ timeout: 15_000 });
});

test('leaving the level silences the clip', async ({ page }) => {
  await fakeSpeech(page, 'ok');
  await openWithProgress(page, 2, 'listen');
  await page.getByTestId('clip-play').click();
  await expect(clipStatus(page)).toHaveText('playing');
  const before = (await speech(page)).cancelled;
  await page.getByTestId('home').click();
  await expect(page.getByTestId('title-stage')).toBeVisible();
  expect((await speech(page)).cancelled).toBeGreaterThan(before);
});

test('REAL browser engine (nothing faked): Play starts, the clip runs to its end, and nothing crashes', async ({ page }) => {
  test.setTimeout(60_000);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await trackAudio(page);
  await openWithProgress(page, 2, 'listen');
  await page.getByTestId('clip-play').click();
  await expect(clipStatus(page)).toHaveText('playing');
  const contexts = await audioCreated(page);
  const info = await page.evaluate(() => ({
    voices: window.speechSynthesis ? window.speechSynthesis.getVoices().length : -1,
    hasSpeech: typeof window.speechSynthesis !== 'undefined',
  }));
  await expect(clipStatus(page)).toHaveText('ended', { timeout: 30_000 });
  const voiceMissing = await page.getByTestId('clip-voice-missing').count();
  console.log(`REAL ENGINE: audio contexts=${contexts}, speech available=${info.hasSpeech}, voices=${info.voices}, voice-missing notice=${voiceMissing > 0}`);
  expect(contexts).toBeGreaterThanOrEqual(1);
  expect(errors).toEqual([]);
});
