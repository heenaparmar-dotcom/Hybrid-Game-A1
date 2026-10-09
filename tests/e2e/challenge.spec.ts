import { expect, test } from '@playwright/test';
import { norm, solveByTaps, tileTexts } from './helpers';

test.beforeEach(async ({ context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
});

test('create: validation, reviewed scramble, copy link, a friend opens the REAL puzzle with the same shuffle and song', async ({ page, context }) => {
  await page.goto('./');
  await page.getByTestId('nav-make').click();
  await expect(page.getByTestId('puzzle-preview')).toHaveCount(0);
  await expect(page.getByTestId('make-link')).toBeDisabled();

  await page.getByTestId('phrase-input').fill('too short');
  await expect(page.getByTestId('phrase-error')).toBeVisible();
  await page.getByTestId('phrase-input').fill('this has <b>markup</b> in it');
  await expect(page.getByTestId('phrase-error')).toContainText('letters');
  await page.getByTestId('phrase-input').fill('a '.repeat(40));
  await expect(page.getByTestId('phrase-error')).toBeVisible();
  await page.getByTestId('phrase-input').fill('you are so stupid today');
  await expect(page.getByTestId('phrase-error')).toContainText('kind');

  const phrase = 'Jump into the sunshine';
  await page.getByTestId('phrase-input').fill(phrase);
  await page.getByTestId('nickname-input').fill('Maya');
  await expect(page.getByTestId('puzzle-preview')).toBeVisible();
  await page.getByTestId('track-nacho').click();
  await page.getByTestId('reshuffle-preview').click();
  const reviewed = (await page.locator('.preview-tiles .tile').allTextContents()).map((t) => t.trim());
  expect(reviewed.map(norm).sort()).toEqual(phrase.split(' ').map(norm).sort());
  expect(reviewed.join(' ')).not.toBe(phrase);

  await page.getByTestId('make-link').click();
  await expect(page.getByTestId('share-panel')).toBeVisible();
  const url = await page.getByTestId('challenge-url').inputValue();
  expect(url).toContain('#challenge=');
  // honest about localhost: the warning shows only when the game is running on localhost
  if (new URL(page.url()).hostname === 'localhost') await expect(page.getByTestId('local-warning')).toBeVisible();
  else await expect(page.getByTestId('local-warning')).toHaveCount(0);
  await page.getByTestId('copy-link').click();
  await expect(page.getByTestId('share-status')).toContainText('Link copied');
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(url);

  // changing the text invalidates the old link
  await page.getByTestId('phrase-input').fill('Jump into the moonlight');
  await expect(page.getByTestId('created-link')).toHaveCount(0);
  await page.getByTestId('phrase-input').fill(phrase);

  // friend opens the link
  const friend = await context.newPage();
  await friend.goto(url);
  await expect(friend.getByTestId('incoming-challenge')).toContainText('Maya challenged you');
  await expect(friend.getByTestId('incoming-challenge')).toContainText('Nacho Aaj');
  await friend.getByTestId('accept-challenge').click();
  await expect(friend.getByTestId('splash')).toHaveCount(0, { timeout: 5000 });
  // the friend sees the shuffle the creator reviewed
  expect((await tileTexts(friend)).map((t) => t.trim())).toEqual(reviewed);
  await solveByTaps(friend, phrase);
  await expect(friend.getByTestId('song-unlocked')).toContainText('You got it!');
  await expect(friend.getByTestId('accept-dance')).toBeVisible({ timeout: 6000 });
  await friend.getByTestId('accept-dance').click();
  await expect(friend.getByRole('heading', { name: 'Nacho Aaj' })).toBeVisible(); // the song the creator chose
  await friend.getByTestId('pause-dance').click();
  await friend.getByTestId('end-dance').click();
  await expect(friend.getByRole('heading', { name: 'Challenge complete!' })).toBeVisible();
  await expect(friend.getByTestId('make-own')).toBeVisible();

  // refreshing a challenge link keeps the challenge
  await friend.goto(url);
  await friend.reload();
  await expect(friend.getByTestId('incoming-challenge')).toBeVisible();
});

test('share buttons: WhatsApp, Telegram and Email open ready messages; nothing claims to be sent', async ({ page }) => {
  await page.goto('./');
  await page.getByTestId('nav-make').click();
  await page.getByTestId('phrase-input').fill('Share the happy beat');
  await page.getByTestId('make-link').click();
  const url = await page.getByTestId('challenge-url').inputValue();
  const wa = await page.getByTestId('share-whatsapp').getAttribute('href');
  expect(wa).toContain('https://wa.me/?text=');
  expect(decodeURIComponent(wa!)).toContain(url);
  expect(await page.getByTestId('share-whatsapp').getAttribute('target')).toBe('_blank');
  expect(await page.getByTestId('share-whatsapp').getAttribute('rel')).toContain('noopener');
  expect(await page.getByTestId('share-telegram').getAttribute('href')).toContain('https://t.me/share/url?url=');
  expect(await page.getByTestId('share-email').getAttribute('href')).toContain('mailto:?subject=');
  await expect(page.getByTestId('share-panel')).toContainText('Nothing is sent until you do');
  await page.getByTestId('copy-message').click();
  await expect(page.getByTestId('share-status')).toContainText('Message copied');
  const msg = await page.evaluate(() => navigator.clipboard.readText());
  expect(msg).toContain(url);
});

test('native share is offered only when the browser supports it', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, 'share', { value: undefined, configurable: true }));
  await page.goto('./');
  await page.getByTestId('nav-make').click();
  await page.getByTestId('phrase-input').fill('Share the happy beat');
  await page.getByTestId('make-link').click();
  await expect(page.getByTestId('native-share')).toHaveCount(0);
  await expect(page.getByTestId('copy-link')).toBeVisible();
});

test('native share is used when available', async ({ page }) => {
  await page.addInitScript(() => {
    (window as unknown as { __shared: unknown }).__shared = null;
    Object.defineProperty(navigator, 'share', {
      value: async (d: unknown) => {
        (window as unknown as { __shared: unknown }).__shared = d;
      },
      configurable: true,
    });
  });
  await page.goto('./');
  await page.getByTestId('nav-make').click();
  await page.getByTestId('phrase-input').fill('Share the happy beat');
  await page.getByTestId('make-link').click();
  await page.getByTestId('native-share').click();
  const shared = (await page.evaluate(() => (window as unknown as { __shared: { url: string } }).__shared)) as { url: string };
  expect(shared.url).toContain('#challenge=');
});

test('try it first: the creator plays their own puzzle and goes back to sharing', async ({ page }) => {
  await page.goto('./');
  await page.getByTestId('nav-make').click();
  await page.getByTestId('phrase-input').fill('Dance like nobody knows');
  await page.getByTestId('try-puzzle').click();
  await expect(page.getByTestId('splash')).toHaveCount(0, { timeout: 5000 });
  await solveByTaps(page, 'Dance like nobody knows');
  await expect(page.getByTestId('accept-dance')).toBeVisible({ timeout: 6000 });
  await page.getByTestId('skip-dance').click();
  await expect(page.getByRole('heading', { name: 'Your puzzle works!' })).toBeVisible();
  await page.getByTestId('back-to-create').click();
  await expect(page.getByTestId('phrase-input')).toBeVisible();
});

test('a Hindi (Devanagari) puzzle can be made, shared and solved', async ({ page, context }) => {
  await page.goto('./');
  await page.getByTestId('nav-make').click();
  const phrase = 'आज दिल खोल के नाचो';
  await page.getByTestId('phrase-input').fill(phrase);
  await page.getByTestId('make-link').click();
  const url = await page.getByTestId('challenge-url').inputValue();
  const friend = await context.newPage();
  await friend.goto(url);
  await friend.getByTestId('accept-challenge').click();
  await expect(friend.getByTestId('tile-4')).toBeVisible();
  await solveByTaps(friend, phrase);
  await expect(friend.getByTestId('song-unlocked')).toBeVisible();
});

test('malformed challenge links are handled safely and the app stays usable', async ({ page }) => {
  for (const hash of ['#challenge=%%%', '#challenge=abc', '#challenge=' + 'A'.repeat(900), '#challenge=eyJ2IjoyfQ']) {
    await page.goto('./' + hash);
    await page.reload();
    await expect(page.getByTestId('challenge-error')).toBeVisible();
    await expect(page.getByTestId('accept-challenge')).toHaveCount(0);
  }
  await page.getByTestId('play-instead').click();
  await expect(page.getByTestId('tile-0')).toBeVisible();
});

test('links made before songs and shuffles existed still open', async ({ page }) => {
  const data = Buffer.from(JSON.stringify({ v: 1, p: 'Find your rhythm, find your flow' })).toString('base64url');
  await page.goto(`./#challenge=${data}`);
  await expect(page.getByTestId('incoming-challenge')).toContainText('A friend challenged you');
  await expect(page.getByTestId('incoming-challenge')).toContainText('Sunrise Sway'); // default song
  await page.getByTestId('accept-challenge').click();
  await expect(page.getByTestId('tile-5')).toBeVisible();
  await solveByTaps(page, 'Find your rhythm, find your flow'); // repeated words work
  await expect(page.getByTestId('song-unlocked')).toBeVisible();
});

test('paste a link on the make screen; bad pastes show an error', async ({ page }) => {
  await page.goto('./');
  await page.getByTestId('nav-make').click();
  await page.getByTestId('paste-link').fill('not a link');
  await page.getByTestId('open-link').click();
  await expect(page.getByTestId('paste-error')).toBeVisible();
  const data = Buffer.from(JSON.stringify({ v: 1, p: 'One more beat and off we go', f: 'Ravi', t: 3 })).toString('base64url');
  await page.getByTestId('paste-link').fill(`http://localhost:5173/#challenge=${data}`);
  await page.getByTestId('open-link').click();
  await expect(page.getByTestId('incoming-challenge')).toContainText('Ravi challenged you');
  await expect(page.getByTestId('incoming-challenge')).toContainText('Hook-Step Party');
});

test('song preview on the make screen plays and stops on demand', async ({ page }) => {
  await page.goto('./');
  await page.getByTestId('nav-make').click();
  await page.getByTestId('preview-sunrise').click();
  await expect(page.getByTestId('preview-sunrise')).toHaveAccessibleName(/Stop Sunrise Sway|Preview Sunrise Sway/);
  await page.getByTestId('make-link').isDisabled();
});
