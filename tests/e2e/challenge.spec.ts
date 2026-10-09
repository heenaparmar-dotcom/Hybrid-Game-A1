import { expect, test } from '@playwright/test';
import { norm, seedSettings, solve, tileTexts } from './helpers';

test.beforeEach(async ({ context, page }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await seedSettings(page);
  await page.goto('/');
});

test('create validation, preview, copy link, open link in a new tab and play the actual challenge', async ({ page, context }) => {
  await page.getByTestId('create-puzzle').click();

  // Empty -> no preview, no link
  await expect(page.getByTestId('puzzle-preview')).toHaveCount(0);
  // Invalid inputs
  await page.getByTestId('phrase-input').fill('too short');
  await expect(page.getByTestId('phrase-error')).toBeVisible();
  await page.getByTestId('phrase-input').fill('this has <b>markup</b> in it');
  await expect(page.getByTestId('phrase-error')).toContainText('letters');
  await page.getByTestId('phrase-input').fill('a '.repeat(40));
  await expect(page.getByTestId('phrase-error')).toBeVisible();

  const phrase = 'Jump into the sunshine';
  await page.getByTestId('phrase-input').fill(phrase);
  await page.getByTestId('nickname-input').fill('Maya');
  await expect(page.getByTestId('puzzle-preview')).toBeVisible();
  await page.getByTestId('make-link').click();
  await expect(page.getByTestId('share-panel')).toBeVisible();

  const url = await page.getByTestId('challenge-url').inputValue();
  expect(url).toContain('#challenge=');
  await expect(page.getByTestId('challenge-message')).toHaveValue(/Maya made a RHYTHM RUSH puzzle/);
  await expect(page.getByTestId('share-panel')).toContainText('localhost'); // honest hosting warning

  await page.getByTestId('copy-link').click();
  await expect(page.getByTestId('share-status')).toContainText('Link copied');
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(url);

  // Editing the phrase invalidates the old link
  await page.getByTestId('phrase-input').fill('Jump into the moonlight');
  await expect(page.getByTestId('created-link')).toHaveCount(0);
  await page.getByTestId('phrase-input').fill(phrase);

  // Friend opens the link: must land on the real challenge, not the generic home
  const friend = await context.newPage();
  await friend.goto(url);
  await expect(friend.getByTestId('incoming-challenge')).toContainText('Maya challenged you');
  await friend.getByTestId('play-challenge').click();
  await friend.getByTestId('start-puzzle').click();
  const tiles = await tileTexts(friend);
  expect(tiles.map(norm).sort()).toEqual(phrase.split(' ').map(norm).sort());
  await solve(friend, phrase);
  await friend.getByTestId('submit-answer').click();
  await expect(friend.getByTestId('solved-phrase')).toHaveText(phrase);
  await friend.getByTestId('to-music').click();
  await expect(friend.getByTestId('music-phrase')).toHaveText(phrase);
  await friend.getByTestId('to-dance').click();
  await friend.getByTestId('dance-start').click();
  await friend.getByTestId('dance-complete').click({ timeout: 15_000 });
  await expect(friend.getByTestId('winner')).toContainText('You scored');

  // Refreshing the challenge URL keeps the challenge
  await friend.goto(url);
  await friend.reload();
  await expect(friend.getByTestId('incoming-challenge')).toBeVisible();
});

test('try-it-myself runs the creator through the full flow', async ({ page }) => {
  await page.getByTestId('create-puzzle').click();
  await page.getByTestId('phrase-input').fill('Dance like nobody knows');
  await page.getByTestId('try-puzzle').click();
  await page.getByTestId('start-puzzle').click();
  await solve(page, 'Dance like nobody knows');
  await page.getByTestId('submit-answer').click();
  await expect(page.getByTestId('puzzle-result')).toContainText('Solved');
});

test('malformed challenge links are handled safely', async ({ page }) => {
  for (const hash of ['#challenge=%%%', '#challenge=abc', '#challenge=' + 'A'.repeat(900), '#challenge=eyJ2IjoyfQ']) {
    await page.goto('/' + hash);
    await page.reload();
    await expect(page.getByTestId('challenge-error')).toBeVisible();
    await expect(page.getByTestId('play-challenge')).toHaveCount(0);
  }
  // The app is still usable
  await page.getByRole('button', { name: /Back/ }).click();
  await expect(page.getByTestId('start-game')).toBeVisible();
});

test('paste a link on the Friend challenge screen; bad pastes show an error', async ({ page }) => {
  await page.getByTestId('friend-challenge').click();
  await page.getByTestId('paste-link').fill('not a link');
  await page.getByTestId('open-link').click();
  await expect(page.getByTestId('paste-error')).toBeVisible();

  const data = Buffer.from(JSON.stringify({ v: 1, p: 'Find your rhythm, find your flow' })).toString('base64url');
  await page.getByTestId('paste-link').fill(`http://localhost:5173/#challenge=${data}`);
  await page.getByTestId('open-link').click();
  await expect(page.getByTestId('incoming-challenge')).toContainText('A friend challenged you');
  await page.getByTestId('play-challenge').click();
  await page.getByTestId('start-puzzle').click();
  await solve(page, 'Find your rhythm, find your flow'); // contains repeated words
  await page.getByTestId('submit-answer').click();
  await expect(page.getByTestId('puzzle-result')).toContainText('Solved');
});

test('native share is offered only when supported, and copy still works without it', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, 'share', { value: undefined, configurable: true }));
  await page.goto('/');
  await page.getByTestId('create-puzzle').click();
  await page.getByTestId('phrase-input').fill('Share the happy beat');
  await page.getByTestId('make-link').click();
  await expect(page.getByTestId('native-share')).toHaveCount(0);
  await expect(page.getByTestId('copy-message')).toBeVisible();
  await page.getByTestId('copy-message').click();
  await expect(page.getByTestId('share-status')).toContainText('Message copied');
});

test('native share is used when the browser supports it', async ({ page }) => {
  await page.addInitScript(() => {
    (window as unknown as { __shared: unknown }).__shared = null;
    Object.defineProperty(navigator, 'share', { value: async (d: unknown) => { (window as unknown as { __shared: unknown }).__shared = d; }, configurable: true });
  });
  await page.goto('/');
  await page.getByTestId('create-puzzle').click();
  await page.getByTestId('phrase-input').fill('Share the happy beat');
  await page.getByTestId('make-link').click();
  await page.getByTestId('native-share').click();
  const shared = (await page.evaluate(() => (window as unknown as { __shared: { url: string } }).__shared)) as { url: string };
  expect(shared.url).toContain('#challenge=');
});
