import { expect, test } from '@playwright/test';
import { LEVELS } from '../../src/data/levels';
import { puzzlesForLevel } from '../../src/data/puzzles';
import { currentPuzzle, norm, solveByTaps, tileTexts } from './helpers';
import { enterPinned, openWithProgress } from './support';

const name = (n: number) => LEVELS[n - 1].name;
const songs = (level: number) => puzzlesForLevel(level).filter((p) => p.song);

test('Warm Up: all 8 Hindi songs appear as challenges with their hint, shuffled title words, and the song title once solved', async ({ page }) => {
  test.setTimeout(240_000);
  await openWithProgress(page, 1);
  const last: Record<number, string | undefined> = {};
  const shownTitles: string[] = [];
  for (const target of songs(1)) {
    const shown = await enterPinned(page, 1, name(1), target, last);
    const song = shown.song!;
    shownTitles.push(song.title);
    // Warm Up keeps the hint behind a small Hint button
    await expect(page.getByTestId('puzzle-hint')).toHaveCount(0);
    await page.getByTestId('puzzle-hint-button').click();
    await expect(page.getByTestId('puzzle-hint')).toContainText(song.hint);
    const tiles = (await tileTexts(page)).map((t) => t.trim());
    expect(tiles.map(norm).sort()).toEqual(shown.phrase.split(' ').map(norm).sort());
    expect(tiles.join(' ')).not.toBe(shown.phrase); // shuffled, never handed over solved
    await solveByTaps(page, shown.phrase);
    await expect(page.getByTestId('song-unlocked')).toContainText('You got it!');
    await expect(page.getByTestId('song-title')).toContainText(song.title);
  }
  expect(shownTitles).toEqual([
    'Badtameez Dil', 'Kala Chashma', 'Gallan Goodiyaan',
    'Sapphire', 'Jhoome Jo Pathaan', 'Swag Se Swagat', 'Jamaican (Bam Bam)', "Let's Nacho",
  ]);
});

test('Find the Beat: all 11 Hook-Step songs show their title words shuffled with the hint; repeated words are separate tiles', async ({ page }) => {
  test.setTimeout(300_000);
  await openWithProgress(page, 1);
  const last: Record<number, string | undefined> = { 2: (await currentPuzzle(page)).id }; // already shown by the title screen
  expect(songs(2)).toHaveLength(11);
  const items = [...songs(2)].sort((a, b) => Number(a.id === last[2]) - Number(b.id === last[2]));
  const seen: string[] = [];
  for (const song of items) {
    const shown = await enterPinned(page, 2, name(2), song, last);
    const tiles = (await tileTexts(page)).map((t) => t.trim());
    expect(tiles.map(norm).sort()).toEqual(shown.phrase.split(' ').map(norm).sort());
    expect(tiles.join(' ')).not.toBe(shown.phrase); // shuffled, never handed over solved
    await expect(page.getByTestId('puzzle-hint')).toContainText(song.song!.hint); // Find the Beat keeps its hint on screen

    if (song.id === 'l2-s03') {
      // "Tauba Tauba Bad Newz": two separate tiles for Tauba; the right words in the wrong places are not accepted
      expect(tiles.filter((t) => norm(t) === 'tauba')).toHaveLength(2);
      await solveByTaps(page, 'Tauba Bad Tauba Newz');
      await expect(page.getByTestId('song-unlocked')).toHaveCount(0);
    }
    await solveByTaps(page, shown.phrase);
    await expect(page.getByTestId('song-unlocked')).toContainText('You got it!');
    await expect(page.getByTestId('song-title')).toContainText(shown.song!.title);
    seen.push(shown.song!.title);
  }
  expect(seen.sort()).toEqual(songs(2).map((p) => p.song!.title).sort());
});

test('after a film-song puzzle the invitation says which music the dance really uses', async ({ page }) => {
  await openWithProgress(page, 1);
  const last: Record<number, string | undefined> = { 2: (await currentPuzzle(page)).id }; // already shown by the title screen
  const target = songs(2).find((p) => p.id !== last[2])!; // any Find the Beat song other than the one already showing
  const shown = await enterPinned(page, 2, name(2), target, last);
  await solveByTaps(page, shown.phrase);
  await expect(page.getByTestId('accept-dance')).toBeVisible({ timeout: 6000 });
  await expect(page.getByTestId('song-note')).toContainText(target.song!.title);
  await expect(page.getByTestId('song-note')).toContainText('original track');
  const p = await currentPuzzle(page).catch(() => null);
  expect(p).toBeNull(); // we are on the invitation now, not the puzzle
});
