import { expect, test, type Page } from '@playwright/test';
import { installRandomControl, solveCurrent } from './helpers';

test.use({ trace: 'off' });

const kicker = (page: Page) => page.locator('.kicker').first();

async function start(page: Page, opts: { allSongs?: boolean } = {}) {
  await installRandomControl(page);
  await page.goto('./');
  if (opts.allSongs) await page.getByTestId('songs-all').click();
  await page.getByTestId('title-stage').click();
  await page.getByTestId('tile-0').waitFor();
  await expect(page.getByTestId('splash')).toHaveCount(0, { timeout: 6000 });
}

test.describe('Back button', () => {
  test('is not on the title screen; appears after you move on', async ({ page }) => {
    await installRandomControl(page);
    await page.goto('./');
    await expect(page.getByTestId('back')).toHaveCount(0);
    await page.getByTestId('title-stage').click();
    await page.getByTestId('tile-0').waitFor();
    await expect(page.getByTestId('back')).toBeVisible();
  });

  test('every step goes back one step: puzzle to title, invitation to puzzle, dance to invitation, celebration to invitation', async ({ page }) => {
    test.setTimeout(90_000);
    await start(page);

    // puzzle -> title
    await page.getByTestId('back').click();
    await expect(page.getByTestId('title-stage')).toBeVisible();
    await expect(page.getByTestId('back')).toHaveCount(0);

    // title -> puzzle -> invitation
    await page.getByTestId('title-stage').click();
    await page.getByTestId('tile-0').waitFor();
    await expect(page.getByTestId('splash')).toHaveCount(0, { timeout: 6000 });
    await solveCurrent(page);
    await expect(page.getByTestId('accept-dance')).toBeVisible({ timeout: 8000 });

    // invitation -> puzzle (a fresh shuffle of the same level), and forward again
    await page.getByTestId('back').click();
    await page.getByTestId('tile-0').waitFor();
    await solveCurrent(page);
    await expect(page.getByTestId('accept-dance')).toBeVisible({ timeout: 8000 });

    // dance -> invitation
    await page.getByTestId('accept-dance').click();
    await expect(page.getByTestId('cue')).toBeVisible();
    await page.getByTestId('back').click();
    await expect(page.getByTestId('accept-dance')).toBeVisible();
    await expect(page.getByTestId('cue')).toHaveCount(0);

    // celebration -> invitation (never back into a dance that cannot be resumed)
    await page.getByTestId('skip-dance').click();
    await expect(page.getByTestId('dance-again')).toBeVisible();
    await page.getByTestId('back').click();
    await expect(page.getByTestId('accept-dance')).toBeVisible();
  });

  test('from the puzzle creator, Back returns to where you were', async ({ page }) => {
    await start(page);
    await page.getByTestId('nav-make').click();
    await expect(page.getByTestId('back')).toBeVisible();
    await page.getByTestId('back').click();
    await page.getByTestId('tile-0').waitFor();
  });

  test('from the level bar jump, Back returns to the level you were on', async ({ page }) => {
    await start(page);
    await page.getByTestId('level-3').click();
    await page.getByTestId('listen-screen').waitFor();
    await page.getByTestId('back').click();
    await page.getByTestId('tile-0').waitFor();
    await expect(kicker(page)).toContainText('Level 1');
  });
});

test.describe('skipping', () => {
  test('every level is open from the start, with no locks', async ({ page }) => {
    await start(page);
    for (const n of [1, 2, 3]) await expect(page.getByTestId(`level-${n}`)).toBeEnabled();
    await page.getByTestId('level-2').click();
    await expect(page.getByTestId('splash')).toContainText('Find the Beat', { timeout: 15_000 });
    await page.getByTestId('tile-0').waitFor();
  });

  test('Skip this level moves on to the next level, and the last level ends the game', async ({ page }) => {
    test.setTimeout(60_000);
    await start(page);
    await page.getByTestId('skip-level').click();
    await expect(page.getByTestId('splash')).toContainText('Find the Beat', { timeout: 15_000 });
    await page.getByTestId('tile-0').waitFor();
    await expect(kicker(page)).toContainText('Level 2');
    await expect(page.getByTestId('splash')).toHaveCount(0, { timeout: 6000 });
    await page.getByTestId('skip-level').click();
    await page.getByTestId('listen-screen').waitFor();
    await page.getByTestId('skip-level').click();
    await expect(page.getByRole('heading', { name: 'You finished the set!' })).toBeVisible();
  });

  test('a listening clip can be skipped', async ({ page }) => {
    await start(page);
    await page.getByTestId('level-3').click();
    await page.getByTestId('listen-screen').waitFor();
    await expect(page.getByText('Clip 1 of 3')).toBeVisible();
    await page.getByTestId('skip-clip').click();
    await expect(page.getByText('Clip 2 of 3')).toBeVisible();
  });

  test('with one song a level there is no "skip this song", only "skip this level"', async ({ page }) => {
    await start(page);
    await expect(page.getByTestId('skip-song')).toHaveCount(0);
    await expect(page.getByTestId('skip-level')).toBeVisible();
  });
});

test.describe('All songs mode', () => {
  test('the choice is on the title screen, remembered, and not offered for two players', async ({ page }) => {
    await installRandomControl(page);
    await page.goto('./');
    await expect(page.getByTestId('songs-one')).toHaveAttribute('aria-pressed', 'true');
    await page.getByTestId('songs-all').click();
    await expect(page.getByTestId('songs-all')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByTestId('title-stage')).toBeVisible(); // choosing did not start the game
    await page.reload();
    await expect(page.getByTestId('songs-all')).toHaveAttribute('aria-pressed', 'true');
    await page.getByTestId('players-2').click();
    await expect(page.getByTestId('songs-all')).toHaveCount(0);
  });

  test('Warm Up plays all 8 songs one after another, then Find the Beat plays all 11', async ({ page }) => {
    test.setTimeout(150_000);
    await start(page, { allSongs: true });
    await expect(kicker(page)).toContainText('Song 1 of 8');
    const seen = new Set<string>();

    // song 1: solve, dance, celebrate, then "Next song"
    seen.add((await solveCurrent(page)).id);
    await expect(page.getByTestId('accept-dance')).toBeVisible({ timeout: 8000 });
    await page.getByTestId('accept-dance').click();
    await page.getByTestId('pause-dance').click();
    await page.getByTestId('end-dance').click();
    await expect(page.getByTestId('next-song')).toContainText('Next song (2 of 8)');
    // the level is not finished until the last song
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('rhythmrush.v2') ?? '{}').completed)).toBe(0);
    await page.getByTestId('next-song').click();
    await page.getByTestId('tile-0').waitFor();
    await expect(kicker(page)).toContainText('Song 2 of 8');

    // skip songs 2 to 7 one at a time
    for (let n = 3; n <= 8; n++) {
      await page.getByTestId('skip-song').click();
      await expect(kicker(page)).toContainText(`Song ${n} of 8`);
      await page.getByTestId('tile-0').waitFor();
    }

    // the last song: finish it, and now the level counts as complete and "Next level" is the main button
    await solveCurrent(page);
    await expect(page.getByTestId('accept-dance')).toBeVisible({ timeout: 8000 });
    await page.getByTestId('accept-dance').click();
    await page.getByTestId('pause-dance').click();
    await page.getByTestId('end-dance').click();
    await expect(page.getByTestId('next-song')).toHaveCount(0);
    await expect(page.getByTestId('next-level')).toContainText('Next level');
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('rhythmrush.v2') ?? '{}').completed)).toBe(1);
    await page.getByTestId('next-level').click();
    await page.getByTestId('tile-0').waitFor();
    await expect(kicker(page)).toContainText('Level 2');
    await expect(kicker(page)).toContainText('Song 1 of 11');
  });

  test('"Skip to the next level" is offered between songs', async ({ page }) => {
    test.setTimeout(90_000);
    await start(page, { allSongs: true });
    await solveCurrent(page);
    await expect(page.getByTestId('accept-dance')).toBeVisible({ timeout: 8000 });
    await page.getByTestId('skip-dance').click();
    await expect(page.getByTestId('next-song')).toBeVisible();
    await expect(page.getByTestId('next-level')).toContainText('Skip to the next level');
    await page.getByTestId('next-level').click();
    await expect(page.getByTestId('splash')).toContainText('Find the Beat', { timeout: 15_000 });
  });

  test('Back works between songs too', async ({ page }) => {
    test.setTimeout(90_000);
    await start(page, { allSongs: true });
    await page.getByTestId('skip-song').click();
    await expect(kicker(page)).toContainText('Song 2 of 8');
    await page.getByTestId('back').click();
    await expect(kicker(page)).toContainText('Song 1 of 8');
  });
});
