import { expect, test } from '@playwright/test';
import { LEVELS } from '../../src/data/levels';
import { puzzlesForLevel } from '../../src/data/puzzles';
import { currentPuzzle, norm, solveByTaps, tileTexts } from './helpers';
import { enterPinned, openWithProgress } from './support';

const name = (n: number) => LEVELS[n - 1].name;
const songs = (level: number) => puzzlesForLevel(level).filter((p) => p.song);

test('Warm Up: all 10 Hindi songs appear as challenges with their hint, shuffled title words, and the song title once solved', async ({ page }) => {
  test.setTimeout(240_000);
  await openWithProgress(page, 1);
  const last: Record<number, string | undefined> = {};
  const shownTitles: string[] = [];
  for (const target of songs(1)) {
    const shown = await enterPinned(page, 1, name(1), target, last);
    const song = shown.song!;
    shownTitles.push(song.title);
    await expect(page.getByTestId('puzzle-hint')).toContainText(song.hint);
    const tiles = (await tileTexts(page)).map((t) => t.trim());
    expect(tiles.map(norm).sort()).toEqual(shown.phrase.split(' ').map(norm).sort());
    expect(tiles.join(' ')).not.toBe(shown.phrase); // shuffled, never handed over solved
    await solveByTaps(page, shown.phrase);
    await expect(page.getByTestId('song-unlocked')).toContainText('You got it!');
    await expect(page.getByTestId('song-title')).toContainText(song.title);
  }
  expect(shownTitles).toEqual([
    'Badtameez Dil', 'Kala Chashma', 'Gallan Goodiyaan', 'London Thumakda', 'What Jhumka?',
    'Aankh Marey', 'Chaiyya Chaiyya', 'Kajra Re', 'Jai Jai Shivshankar', 'Dilliwaali Girlfriend',
  ]);
});

test('Find the Beat: the 5 specified puzzles show the exact fragments and hints; repeated words are separate tiles', async ({ page }) => {
  test.setTimeout(240_000);
  await openWithProgress(page, 1);
  const last: Record<number, string | undefined> = { 2: (await currentPuzzle(page)).id }; // already shown by the title screen
  const spec = [
    { fragments: ['PEHLA', 'NASHA'], hint: '1992 · Jo Jeeta Wohi Sikandar' },
    { fragments: ['DO', 'DIL', 'MIL', 'RAHE', 'HAIN'], hint: '1998 · Pardes' },
    { fragments: ['TUJHE', 'DEKHA', 'TOH', 'YE', 'JAANA', 'SANAM'], hint: '1995 · Dilwale Dulhania Le Jayenge' },
    { fragments: ['KUCH', 'KUCH', 'HOTA', 'HAI'], hint: '1998 · Kuch Kuch Hota Hai' },
    { fragments: ['PARDESI', 'PARDESI', 'JAANA', 'NAHI'], hint: '1996 · Raja Hindustani' },
  ];
  expect(songs(2)).toHaveLength(5);
  for (let i = 0; i < spec.length; i++) {
    const shown = await enterPinned(page, 2, name(2), songs(2)[i], last);
    const tiles = (await tileTexts(page)).map((t) => t.trim());
    expect([...tiles].sort()).toEqual([...spec[i].fragments].sort()); // exactly the supplied fragments (TOH, capitals, repeats)
    expect(tiles.join(' ')).not.toBe(spec[i].fragments.join(' '));
    await expect(page.getByTestId('puzzle-hint')).toContainText(spec[i].hint);

    const repeated = spec[i].fragments.find((f, k) => spec[i].fragments.indexOf(f) !== k);
    if (repeated) {
      // two separate, draggable tiles for the same word
      expect(tiles.filter((t) => t === repeated)).toHaveLength(2);
      // the right words in the wrong places must not count as solved (the check is by position, not by set)
      const wrong = [spec[i].fragments[0], spec[i].fragments[2], spec[i].fragments[1], spec[i].fragments[3]];
      await solveByTaps(page, wrong.join(' '));
      await expect(page.getByTestId('song-unlocked')).toHaveCount(0);
      await expect(page.getByTestId('puzzle-hint')).toContainText(spec[i].hint); // hint still showing
    }
    await solveByTaps(page, shown.phrase);
    await expect(page.getByTestId('song-unlocked')).toContainText('You got it!');
    // the answer key: tiles now read in the specified sequence
    expect((await tileTexts(page)).map((t) => t.trim())).toEqual(spec[i].fragments);
    await expect(page.getByTestId('song-title')).toContainText(shown.song!.title);
  }
});

test('after a film-song puzzle the invitation says which music the dance really uses', async ({ page }) => {
  await openWithProgress(page, 1);
  const last: Record<number, string | undefined> = { 2: (await currentPuzzle(page)).id }; // already shown by the title screen
  const target = songs(2)[0]; // Pehla Nasha
  const shown = await enterPinned(page, 2, name(2), target, last);
  await solveByTaps(page, shown.phrase);
  await expect(page.getByTestId('accept-dance')).toBeVisible({ timeout: 6000 });
  await expect(page.getByTestId('song-note')).toContainText('Pehla Nasha');
  await expect(page.getByTestId('song-note')).toContainText('original track');
  const p = await currentPuzzle(page).catch(() => null);
  expect(p).toBeNull(); // we are on the invitation now, not the puzzle
});
