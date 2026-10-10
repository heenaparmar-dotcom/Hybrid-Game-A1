import { expect, test, type Page } from '@playwright/test';
import { PUZZLES } from '../../src/data/puzzles';
import { PIN_FOUR_TILES, audioCreated, installRandomControl, setRandom, solveByTaps, trackAudio } from './helpers';

test.use({ trace: 'off' });

const kala = PUZZLES.find((p) => p.id === 'l1-s02')!;
const KALA_PIN = 1.5 / 10; // Warm Up's second song

interface YtLog {
  created: number;
  calls: string[];
  volume: number | null;
  videoId: string | null;
  start: number | null;
  destroyed: number;
}

/** A controllable stand-in for YouTube's player: it plays on a real clock, so the game's timing can be checked. */
async function fakeYouTube(page: Page, mode: 'works' | 'error' | 'never-plays') {
  await page.addInitScript((m) => {
    const w = window as unknown as { __yt: YtLog; YT: unknown };
    w.__yt = { created: 0, calls: [], volume: null, videoId: null, start: null, destroyed: 0 };
    interface Opts {
      videoId: string;
      playerVars: { start: number };
      events: { onReady: (e: { target: unknown }) => void; onStateChange: (e: { data: number }) => void; onError: (e: { data: number }) => void };
    }
    class Player {
      opts: Opts;
      t: number;
      playing = false;
      last = 0;
      constructor(_el: HTMLElement, opts: Opts) {
        this.opts = opts;
        this.t = opts.playerVars.start;
        w.__yt.created++;
        w.__yt.videoId = opts.videoId;
        w.__yt.start = opts.playerVars.start;
        setTimeout(() => opts.events.onReady({ target: this }), 30);
      }
      tick() {
        if (this.playing) {
          const now = performance.now();
          this.t += (now - this.last) / 1000;
          this.last = now;
        }
      }
      playVideo() {
        w.__yt.calls.push('play');
        if (m === 'never-plays') return;
        if (m === 'error') {
          setTimeout(() => this.opts.events.onError({ data: 150 }), 40);
          return;
        }
        this.tick();
        this.playing = true;
        this.last = performance.now();
        setTimeout(() => this.opts.events.onStateChange({ data: 1 }), 30);
      }
      pauseVideo() {
        w.__yt.calls.push('pause');
        this.tick();
        this.playing = false;
        this.opts.events.onStateChange({ data: 2 });
      }
      stopVideo() {
        w.__yt.calls.push('stop');
        this.tick();
        this.playing = false;
      }
      getCurrentTime() {
        this.tick();
        return this.t;
      }
      mute() { w.__yt.calls.push('mute'); }
      unMute() { w.__yt.calls.push('unmute'); }
      setVolume(v: number) { w.__yt.volume = v; }
      destroy() { w.__yt.destroyed++; }
    }
    w.YT = { Player };
  }, mode);
}
const yt = (page: Page) => page.evaluate(() => (window as unknown as { __yt: YtLog }).__yt);

/** Pin Kala Chashma, solve it, and press the dance button. */
async function danceKala(page: Page, opts: { blockAudioFile?: boolean } = { blockAudioFile: true }) {
  // the recording is tried first; most tests here are about the video, so they block the file to reach it
  if (opts.blockAudioFile) await page.route('**/audio/kala-chashma.mp3', (route) => route.abort());
  await installRandomControl(page);
  await page.goto('./');
  await setRandom(page, KALA_PIN);
  await page.getByTestId('title-stage').click();
  await page.getByTestId('tile-0').waitFor();
  await setRandom(page, null);
  await expect(page.getByTestId('song-title')).toHaveCount(0);
  await solveByTaps(page, kala.phrase);
  await expect(page.getByTestId('song-title')).toContainText('Kala Chashma');
  await expect(page.getByTestId('accept-dance')).toBeVisible({ timeout: 6000 });
}

test('data: Kala Chashma has the supplied YouTube video; every other song still uses the game music', () => {
  expect(kala.video).toEqual({ id: 'k4yXQkG2s1E', start: 0, credit: 'Zee Music Company' });
  expect(kala.video!.id).toMatch(/^[A-Za-z0-9_-]{11}$/);
  expect(PUZZLES.filter((p) => p.video).map((p) => p.id)).toEqual(['l1-s02']);
});

test('the song that was solved is the song that plays: the dance uses that video, nothing from the game synth', async ({ page }) => {
  test.setTimeout(90_000);
  await trackAudio(page);
  await fakeYouTube(page, 'works');
  await danceKala(page);
  await expect(page.getByTestId('song-note')).toContainText('official video');
  expect(await audioCreated(page)).toBe(0); // the invitation did not start any sound

  await page.getByTestId('accept-dance').click();
  await expect(page.getByTestId('video-wrap')).toBeVisible(); // the player stays visible, as YouTube requires
  await expect(page.getByTestId('video-wrap')).toHaveAttribute('data-video-state', 'playing');
  await expect(page.getByTestId('video-wrap')).toContainText('Zee Music Company');
  const log = await yt(page);
  expect(log.videoId).toBe('k4yXQkG2s1E'); // the solved song's video
  expect(log.start).toBe(0);
  expect(log.calls).toContain('play');
  expect(await audioCreated(page)).toBe(0); // the game's own music is NOT playing over it

  // the countdown and the dancer follow the video's clock for exactly 30 seconds
  await expect.poll(async () => Number(await page.getByTestId('dance-timer-num').innerText()), { timeout: 4000 }).toBeGreaterThanOrEqual(28);
  const started = Date.now();
  await expect(page.getByRole('heading', { name: 'Dance complete!' })).toBeVisible({ timeout: 45_000 });
  const elapsed = (Date.now() - started) / 1000;
  expect(elapsed).toBeGreaterThan(24);
  expect(elapsed).toBeLessThan(33);
  const after = await yt(page);
  expect(after.calls).toContain('stop'); // the video is stopped when the 30 seconds end
  await expect(page.getByTestId('video-wrap')).toHaveCount(0); // and the player is gone from the screen
  expect(after.destroyed).toBeGreaterThanOrEqual(1);
});

test('pause, resume and mute reach the video', async ({ page }) => {
  test.setTimeout(60_000);
  await fakeYouTube(page, 'works');
  await danceKala(page);
  await page.getByTestId('accept-dance').click();
  await expect(page.getByTestId('video-wrap')).toHaveAttribute('data-video-state', 'playing');
  await page.waitForTimeout(1500);
  await page.getByTestId('pause-dance').click();
  await expect.poll(async () => (await yt(page)).calls.includes('pause')).toBe(true);
  const frozen = Number(await page.getByTestId('dance-timer-num').innerText());
  await page.waitForTimeout(1600);
  expect(Number(await page.getByTestId('dance-timer-num').innerText())).toBe(frozen);
  const playsBefore = (await yt(page)).calls.filter((c) => c === 'play').length;
  await page.getByTestId('resume-dance').click();
  await expect.poll(async () => (await yt(page)).calls.filter((c) => c === 'play').length).toBeGreaterThan(playsBefore);
  await page.getByTestId('mute').first().click();
  await expect.poll(async () => (await yt(page)).calls.includes('mute')).toBe(true);
});

test('if the video cannot play (error), the game says so and dances to its own music instead', async ({ page }) => {
  test.setTimeout(60_000);
  await trackAudio(page);
  await fakeYouTube(page, 'error');
  await danceKala(page);
  await page.getByTestId('accept-dance').click();
  await expect(page.getByTestId('video-fallback')).toBeVisible({ timeout: 10_000 });
  await expect(page.getByTestId('video-wrap')).toHaveCount(0);
  await expect.poll(() => audioCreated(page), { timeout: 5000 }).toBeGreaterThanOrEqual(1); // the game music took over
  await expect(page.getByTestId('cue')).toHaveText('Step right, hips sway', { timeout: 12_000 }); // and the dance carries on (Nacho Aaj starts with a salsa step)
});

test('if the video never starts, the game does not hang: after a few seconds it falls back', async ({ page }) => {
  test.setTimeout(60_000);
  await fakeYouTube(page, 'never-plays');
  await danceKala(page);
  await page.getByTestId('accept-dance').click();
  await expect(page.getByTestId('video-fallback')).toBeVisible({ timeout: 15_000 });
});

test('with no connection to YouTube at all the game still works (script blocked)', async ({ page }) => {
  test.setTimeout(60_000);
  await page.route('**/iframe_api', (route) => route.abort());
  await danceKala(page);
  await page.getByTestId('accept-dance').click();
  await expect(page.getByTestId('video-fallback')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId('dance-timer')).toBeVisible();
});

test('a song without a video is unchanged: no player, the game music plays', async ({ page }) => {
  await trackAudio(page);
  await fakeYouTube(page, 'works');
  await installRandomControl(page);
  await page.goto('./');
  await setRandom(page, PIN_FOUR_TILES); // Dil Se Chaiyya Chaiyya has no video
  await page.getByTestId('title-stage').click();
  await page.getByTestId('tile-0').waitFor();
  await setRandom(page, null);
  const p = PUZZLES.find((x) => x.id === 'l1-s07')!;
  await solveByTaps(page, p.phrase);
  await page.getByTestId('accept-dance').click();
  await expect(page.getByTestId('cue')).toBeVisible();
  await expect(page.getByTestId('video-wrap')).toHaveCount(0);
  expect((await yt(page)).created).toBe(0);
  expect(await audioCreated(page)).toBeGreaterThanOrEqual(1);
});

test('REAL YouTube (nothing faked): the official player loads for the solved song', async ({ page }) => {
  test.setTimeout(90_000);
  await danceKala(page);
  await page.getByTestId('accept-dance').click();
  await expect(page.getByTestId('video-wrap')).toBeVisible();
  // wait until either the real video reports it is playing, or the game falls back
  const outcome = await expect
    .poll(async () => (await page.getByTestId('video-fallback').count()) > 0 ? 'fallback' : await page.getByTestId('video-wrap').getAttribute('data-video-state'), { timeout: 30_000 })
    .toMatch(/playing|fallback/)
    .then(() => 'settled');
  const state = (await page.getByTestId('video-fallback').count()) > 0 ? 'fallback' : await page.getByTestId('video-wrap').getAttribute('data-video-state');
  const src = await page.locator('iframe').first().getAttribute('src').catch(() => null);
  console.log(`REAL YOUTUBE: ${outcome}, state=${state}, iframe src=${src}`);
  if (state === 'playing') expect(src).toContain('k4yXQkG2s1E');
});

test('with the recording present, the dance plays it as audio only: no video player, no game synth', async ({ page }) => {
  test.setTimeout(60_000);
  await trackAudio(page);
  await fakeYouTube(page, 'works');
  await danceKala(page, { blockAudioFile: false });
  await page.getByTestId('accept-dance').click();
  await expect(page.getByTestId('audio-credit')).toBeVisible({ timeout: 10_000 });
  await expect(page.getByTestId('video-wrap')).toHaveCount(0);
  expect((await yt(page)).created).toBe(0);
  expect(await audioCreated(page)).toBe(0);
  await expect.poll(() => page.evaluate(() => document.querySelector('audio') === null)).toBe(true); // an Audio object, not a page element
  await expect(page.getByTestId('cue')).toHaveText('Step right, hips sway', { timeout: 12_000 });
});
