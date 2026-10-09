import { expect, type Page } from '@playwright/test';
import { PUZZLES, type Puzzle } from '../../src/data/puzzles';
import { currentPuzzle, installRandomControl, setRandom } from './helpers';

/** Open the game with progress pre-set, then press the title (which starts level `completed + 1`). */
export async function openWithProgress(page: Page, completed: number, waitFor: 'tiles' | 'listen' = 'tiles') {
  await installRandomControl(page);
  await page.addInitScript((c) => {
    if (!localStorage.getItem('rhythmrush.v2')) localStorage.setItem('rhythmrush.v2', JSON.stringify({ completed: c, volume: 0.7, muted: false, seated: false }));
  }, completed);
  await page.goto('./');
  await page.getByTestId('title-stage').click();
  await page.getByTestId(waitFor === 'tiles' ? 'tile-0' : 'listen-screen').waitFor();
}

/** Click a level pip and wait for a word-order puzzle (levels 1 and 2). */
export async function enterLevel(page: Page, n: number, name: string): Promise<Puzzle> {
  // wait for any splash still on screen to clear, so the new level's splash is a fresh one this test can see
  await expect(page.getByTestId('splash')).toHaveCount(0, { timeout: 5000 });
  await page.getByTestId(`level-${n}`).click();
  await expect(page.getByTestId('splash')).toContainText(name, { timeout: 15_000 });
  await page.getByTestId('tile-0').waitFor();
  return currentPuzzle(page);
}

/**
 * Enter a level and make the game pick one particular puzzle. The game picks candidates[floor(random * candidates.length)],
 * where candidates are the level's puzzles minus the one just shown, so the right random number selects the target.
 */
export async function enterPinned(page: Page, level: number, name: string, target: Puzzle, last: Record<number, string | undefined>): Promise<Puzzle> {
  const pool = PUZZLES.filter((p) => p.level === level);
  const candidates = pool.filter((p) => p.id !== last[level]);
  const index = candidates.findIndex((p) => p.id === target.id);
  expect(index, `${target.id} must be selectable`).toBeGreaterThanOrEqual(0);
  await setRandom(page, (index + 0.5) / candidates.length);
  const shown = await enterLevel(page, level, name);
  await setRandom(page, null);
  expect(shown.id).toBe(target.id);
  last[level] = shown.id;
  return shown;
}

interface SpeechLog {
  spoken: string[];
  paused: number;
  resumed: number;
  cancelled: number;
}

/** A controllable stand-in for the browser's speech voice, so tests can check what the game asks it to say. */
export async function fakeSpeech(page: Page, mode: 'ok' | 'never-starts' | 'none') {
  await page.addInitScript((m) => {
    const w = window as unknown as { __speech: SpeechLog };
    w.__speech = { spoken: [], paused: 0, resumed: 0, cancelled: 0 };
    if (m === 'none') {
      Object.defineProperty(window, 'speechSynthesis', { value: undefined, configurable: true });
      return;
    }
    class Utterance {
      text: string;
      lang = '';
      rate = 1;
      volume = 1;
      onstart: (() => void) | null = null;
      onend: (() => void) | null = null;
      onerror: (() => void) | null = null;
      constructor(text: string) {
        this.text = text;
      }
    }
    Object.defineProperty(window, 'SpeechSynthesisUtterance', { value: Utterance, configurable: true });
    Object.defineProperty(window, 'speechSynthesis', {
      configurable: true,
      value: {
        speak(u: Utterance) {
          w.__speech.spoken.push(u.text);
          if (m === 'ok') {
            setTimeout(() => u.onstart?.(), 40);
            setTimeout(() => u.onend?.(), 900);
          }
        },
        cancel() {
          w.__speech.cancelled++;
        },
        pause() {
          w.__speech.paused++;
        },
        resume() {
          w.__speech.resumed++;
        },
        getVoices() {
          return [];
        },
      },
    });
  }, mode);
}

export const speech = (page: Page): Promise<SpeechLog> => page.evaluate(() => (window as unknown as { __speech: SpeechLog }).__speech);
