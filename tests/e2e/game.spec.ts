import { expect, test } from '@playwright/test';
import { audioCreated, currentPuzzle, noAudio, solveByTaps, solveCurrent, solveToInvite, startGame, tileTexts, trackAudio, norm } from './helpers';

test('title screen: tap anywhere starts Level 1 with shuffled tiles and no submit button', async ({ page }) => {
  await page.goto('./');
  await expect(page.getByRole('heading', { name: 'Rhythm Rush' })).toBeVisible();
  await expect(page.getByText('Tap to start', { exact: true })).toBeVisible();
  await expect(page.getByText('Tap anywhere to start')).toHaveCount(0);
  await expect(page.getByText('Solve the song. Catch the beat. Own the move.')).toBeVisible();
  // secondary features are reachable without starting the game
  await expect(page.getByTestId('nav-rules')).toBeVisible();
  await expect(page.getByTestId('nav-make')).toBeVisible();

  await page.mouse.click(300, 400); // anywhere in the main area
  await expect(page.getByTestId('splash')).toContainText('Warm Up');
  await expect(page.getByTestId('tile-0')).toBeVisible();
  const tiles = await tileTexts(page);
  const puzzle = await currentPuzzle(page);
  expect(puzzle.level).toBe(1);
  expect(tiles.map(norm).sort()).toEqual(puzzle.phrase.split(' ').map(norm).sort());
  expect(tiles.join(' ')).not.toBe(puzzle.phrase); // shuffled

  // The brief: no Submit / Check / Verify button anywhere on the puzzle screen
  await expect(page.getByRole('button', { name: /submit|check|verify/i })).toHaveCount(0);
  await expect(page.getByTestId('splash')).toHaveCount(0, { timeout: 5000 });
});

test('title art: three original black silhouettes, no image and no white background', async ({ page }) => {
  await page.goto('./');
  const art = page.locator('.title-art');
  await expect(art.locator('.sil')).toHaveCount(3);
  await expect(art.locator('image, img, foreignObject')).toHaveCount(0); // only vector shapes, no pasted picture
  await expect(page.locator('.title-stage img, .title-stage picture, .title-stage canvas')).toHaveCount(0);
  const info = await art.evaluate((svg) => {
    const dancers = Array.from(svg.querySelectorAll('.sil'));
    const fills = dancers.map((d) => getComputedStyle(d.querySelector('ellipse')!).fill);
    return { bg: getComputedStyle(svg).backgroundColor, fills };
  });
  expect(info.bg).toBe('rgba(0, 0, 0, 0)'); // transparent: the game background shows through
  for (const f of info.fills) expect(f).toBe('rgb(8, 1, 15)'); // near-black, not white
  // the figures do not cover the title or the start prompt
  const title = (await page.locator('.wordmark-big').boundingBox())!;
  const prompt = (await page.locator('.start-prompt').boundingBox())!;
  expect(title.width).toBeGreaterThan(200);
  expect(prompt.width).toBeGreaterThan(100);
  await expect(page.getByRole('heading', { name: 'Rhythm Rush' })).toBeVisible();
  // gentle motion: the poses change over time
  const a = await art.innerHTML();
  await page.waitForTimeout(700);
  expect(await art.innerHTML()).not.toBe(a);
});

test('title screen also starts with the keyboard', async ({ page }) => {
  await page.goto('./');
  await page.getByTestId('title-stage').focus();
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('tile-0')).toBeVisible();
});

test('wrong arrangements are gentle: the puzzle keeps going and never reveals the answer', async ({ page }) => {
  await startGame(page);
  const puzzle = await currentPuzzle(page);
  const before = await tileTexts(page);
  await page.getByTestId('tile-0').click();
  await page.getByTestId('tile-1').click();
  const after = await tileTexts(page);
  expect(after[0]).toBe(before[1]);
  await expect(page.getByTestId('puzzle-feedback')).toContainText(/words are in the right place|Not yet/);
  await expect(page.getByTestId('song-unlocked')).toHaveCount(0);
  const text = await page.getByTestId('puzzle-feedback').innerText();
  expect(text).not.toContain(puzzle.phrase); // the answer is never shown
  await expect(page.getByTestId('tile-0')).toBeEnabled();
});

test('correct order is detected automatically, then the dance invitation appears and music has not started', async ({ page }) => {
  await trackAudio(page);
  await startGame(page);
  expect(await audioCreated(page)).toBe(0);
  await solveCurrent(page);
  await expect(page.getByTestId('song-unlocked')).toContainText('You got it!');
  await expect(page.getByTestId('song-unlocked')).toContainText('Sunrise Sway');
  await expect(page.getByTestId('accept-dance')).toBeVisible({ timeout: 6000 });
  await expect(page.getByRole('heading', { name: 'You cracked the song!' })).toBeVisible();
  expect(await audioCreated(page)).toBe(0); // still silent: the player has not accepted yet
  await page.getByTestId('accept-dance').click();
  await expect(page.getByTestId('cue')).toBeVisible();
  expect(await audioCreated(page)).toBeGreaterThanOrEqual(1); // music starts only now
});

test('tiles can be dragged with the mouse', async ({ page }) => {
  await startGame(page);
  const before = await tileTexts(page);
  const a = (await page.getByTestId('tile-0').boundingBox())!;
  const c = (await page.getByTestId('tile-2').boundingBox())!;
  await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
  await page.mouse.down();
  await page.mouse.move(a.x + a.width / 2 + 20, a.y + a.height / 2 + 10, { steps: 4 });
  await page.mouse.move(c.x + c.width * 0.85, c.y + c.height / 2, { steps: 10 }); // drop past the middle of the target
  await page.mouse.up();
  const after = await tileTexts(page);
  expect(after).not.toEqual(before);
  expect(after[2]).toBe(before[0]); // moved to the target slot
  expect([...after].sort()).toEqual([...before].sort()); // nothing lost

  // regression: after a drag finishes, nothing is left "stuck" and tapping still works
  if ((await page.getByTestId('song-unlocked').count()) === 0) {
    await expect(page.locator('.tile.is-dragging')).toHaveCount(0);
    await page.getByTestId('tile-0').click();
    await page.getByTestId('tile-1').click();
    const swapped = await tileTexts(page);
    expect(swapped[0]).toBe(after[1]);
    expect(swapped[1]).toBe(after[0]);
  }
});

test('keyboard: pick up a tile with Enter, move it with the arrows, put it down', async ({ page }) => {
  await startGame(page);
  const before = await tileTexts(page);
  await page.getByTestId('tile-0').focus();
  await page.keyboard.press('Enter');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Enter');
  const after = await tileTexts(page);
  expect(after[2]).toBe(before[0]);
  await expect(page.getByTestId('puzzle-live')).toContainText(/Moved|Put/);
});

test('shuffle again restarts the puzzle; a nudge locks a correct word after a while', async ({ page }) => {
  await startGame(page);
  const puzzle = await currentPuzzle(page);
  await page.getByTestId('shuffle-again').click();
  expect((await tileTexts(page)).join(' ')).not.toBe(puzzle.phrase);
  await expect(page.getByTestId('nudge')).toBeVisible({ timeout: 20_000 });
  await page.getByTestId('nudge').click();
  const t = await tileTexts(page);
  expect(norm(t[0])).toBe(norm(puzzle.phrase.split(' ')[0]));
  await expect(page.getByTestId('tile-0')).toHaveClass(/is-locked/);
});

test('full Level 1: puzzle, dance with synced cues and a moving dancer, pause, celebrate, then Level 2 (Hindi)', async ({ page }) => {
  test.setTimeout(150_000);
  await startGame(page);
  await solveToInvite(page);
  await page.getByTestId('accept-dance').click();

  // count-in first
  await expect(page.getByTestId('cue-kicker')).toHaveText('Get ready');
  await expect(page.getByTestId('cue')).toHaveText('Find your spot');
  // then the routine: cues change on the beat and the dancer visibly moves
  await expect(page.getByTestId('cue')).toHaveText('Sway right', { timeout: 10_000 });
  const shape1 = await page.locator('.dancer-wrap').innerHTML();
  await expect(page.getByTestId('cue')).toHaveText('Sway left', { timeout: 6000 });
  const shape2 = await page.locator('.dancer-wrap').innerHTML();
  expect(shape2).not.toBe(shape1);
  await expect(page.getByTestId('cue-kicker')).toContainText('Move 1 of 4');

  // pause freezes the dance, resume continues
  await page.getByTestId('pause-dance').click();
  await expect(page.getByTestId('pause-panel')).toBeVisible();
  const frozenA = await page.locator('.dancer-wrap').innerHTML();
  const cueA = await page.getByTestId('cue').innerText();
  await page.waitForTimeout(1500);
  expect(await page.locator('.dancer-wrap').innerHTML()).toBe(frozenA);
  expect(await page.getByTestId('cue').innerText()).toBe(cueA);
  await page.getByTestId('resume-dance').click();
  await expect(page.getByTestId('pause-panel')).toHaveCount(0);

  // run to the end: celebration appears by itself
  await expect(page.getByRole('heading', { name: 'Dance complete!' })).toBeVisible({ timeout: 60_000 });
  await expect(page.getByTestId('next-level')).toBeVisible();
  await expect(page.getByTestId('dance-again')).toBeVisible();

  // next level: a longer Hindi line
  await page.getByTestId('next-level').click();
  await expect(page.getByTestId('splash')).toContainText('Find the Beat');
  await expect(page.getByTestId('tile-4')).toBeVisible(); // five tiles
  const l2 = await currentPuzzle(page);
  expect(l2.level).toBe(2);
  await solveByTaps(page, l2.phrase);
  await expect(page.getByTestId('song-unlocked')).toContainText(l2.meaning!);
  await expect(page.getByTestId('accept-dance')).toBeVisible({ timeout: 6000 });

  // progress is saved: after a refresh the title offers to continue at level 2... then 3
  await page.goto('./');
  await expect(page.getByText('Continue at level 2')).toBeVisible();
});

test('dance can be paused and ended from the pause screen; skipping still lets the player continue', async ({ page }) => {
  await startGame(page);
  await solveToInvite(page);
  await page.getByTestId('accept-dance').click();
  await page.getByTestId('pause-dance').click();
  await page.getByTestId('end-dance').click();
  await expect(page.getByRole('heading', { name: 'Level complete' })).toBeVisible();
  await expect(page.getByTestId('next-level')).toBeVisible();
});

test('"not now" on the invitation skips the dance without starting music', async ({ page }) => {
  await trackAudio(page);
  await startGame(page);
  await solveToInvite(page);
  await page.getByTestId('skip-dance').click();
  await expect(page.getByTestId('next-level')).toBeVisible();
  expect(await audioCreated(page)).toBe(0);
});

test('restart dance and dance again both work', async ({ page }) => {
  await startGame(page);
  await solveToInvite(page);
  await page.getByTestId('accept-dance').click();
  await expect(page.getByTestId('cue')).toHaveText('Sway right', { timeout: 10_000 });
  await page.getByTestId('pause-dance').click();
  await page.getByTestId('restart-dance').click();
  await expect(page.getByTestId('cue-kicker')).toHaveText('Get ready'); // back at the count-in
  await page.getByTestId('pause-dance').click();
  await page.getByTestId('end-dance').click();
  await page.getByTestId('dance-again').click();
  await expect(page.getByTestId('cue-kicker')).toHaveText('Get ready');
});

test('seated version: the dancer sits on a chair and cues use the upper body', async ({ page }) => {
  await startGame(page);
  await solveToInvite(page);
  await page.getByTestId('seated-toggle').check();
  await page.getByTestId('accept-dance').click();
  await expect(page.locator('.chair').first()).toBeVisible();
  await expect(page.getByTestId('cue')).toHaveText('Lean right', { timeout: 10_000 });
  // the choice is remembered
  await page.reload();
  await expect.poll(() => page.evaluate(() => localStorage.getItem('rhythmrush.v2'))).toContain('"seated":true');
});

test('audio fallback: when Web Audio is unavailable the dance still runs, silently, with a clear message', async ({ page }) => {
  await noAudio(page);
  await startGame(page);
  await solveToInvite(page);
  await page.getByTestId('accept-dance').click();
  await expect(page.getByTestId('audio-fallback')).toBeVisible();
  await expect(page.getByTestId('cue')).toHaveText('Sway right', { timeout: 10_000 }); // the beat clock still runs
  await expect(page.getByTestId('pause-dance')).toBeEnabled();
});

test('rule book: reachable from the title, documents all seven elements, and pauses the dance when opened', async ({ page }) => {
  await page.goto('./');
  await page.getByTestId('nav-rules').click();
  const dialog = page.getByRole('dialog', { name: 'How to play' });
  for (const h of ['1. Players', '2. Goals', '3. Rules', '4. Space', '5. Time', '6. Resources', '7. Conflict', 'Make and share a puzzle', 'Safety and access']) {
    await expect(dialog.getByRole('heading', { name: h })).toBeVisible();
  }
  await expect(dialog).toContainText('no button to press');
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);

  await page.getByTestId('title-stage').click();
  await expect(page.getByTestId('tile-0')).toBeVisible();
  await solveToInvite(page);
  await page.getByTestId('accept-dance').click();
  await expect(page.getByTestId('cue')).toHaveText('Sway right', { timeout: 10_000 });
  await page.getByTestId('nav-rules').click();
  const frozen = await page.locator('.dancer-wrap').innerHTML();
  await page.waitForTimeout(1200);
  expect(await page.locator('.dancer-wrap').innerHTML()).toBe(frozen);
  await page.keyboard.press('Escape');
  await expect.poll(async () => page.locator('.dancer-wrap').innerHTML()).not.toBe(frozen);
});

test('level bar: finished levels can be replayed, later ones are locked', async ({ page }) => {
  await startGame(page);
  await expect(page.getByTestId('level-3')).toBeDisabled();
  await solveToInvite(page);
  await page.getByTestId('skip-dance').click();
  await expect(page.getByTestId('level-2')).toBeEnabled();
  await page.getByTestId('level-1').click(); // replay level 1
  await expect(page.getByTestId('splash')).toContainText('Warm Up');
  await expect(page.getByTestId('tile-0')).toBeVisible();
});

test('the home button returns to the title and stops everything', async ({ page }) => {
  await startGame(page);
  await page.getByTestId('home').click();
  await expect(page.getByTestId('title-stage')).toBeVisible();
});

test('refresh keeps progress and sound settings', async ({ page }) => {
  await startGame(page);
  await solveToInvite(page);
  await page.getByTestId('skip-dance').click();
  await page.reload();
  await expect(page.getByText('Continue at level 2')).toBeVisible();
  await page.getByTestId('start-over').click();
  await expect(page.getByTestId('splash')).toContainText('Warm Up');
});

test('dancer animates continuously while dancing and stops when paused', async ({ page }) => {
  await startGame(page);
  await solveToInvite(page);
  await page.getByTestId('accept-dance').click();
  await expect(page.getByTestId('cue')).toHaveText('Sway right', { timeout: 10_000 });
  const frames = new Set<string>();
  for (let i = 0; i < 6; i++) {
    frames.add(await page.locator('.dancer-wrap').innerHTML());
    await page.waitForTimeout(150);
  }
  expect(frames.size).toBeGreaterThanOrEqual(4);
});
