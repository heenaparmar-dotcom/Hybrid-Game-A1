import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { LEVELS } from '../../src/data/levels';
import { EMOJI } from '../../src/data/emoji';
import { TRACKS, totalSeconds } from '../../src/data/tracks';
import { DANCE_SECONDS, PUZZLE_SECONDS } from '../../src/lib/timing';
import { PHRASE_LIMITS } from '../../src/lib/challenge';

const rules = readFileSync('docs/RULE_BOOK.md', 'utf8');
const assignment = readFileSync('docs/ASSIGNMENT_DOCUMENTATION.md', 'utf8');
const readme = readFileSync('README.md', 'utf8');
const inApp = readFileSync('src/components/RuleBook.tsx', 'utf8');

describe('docs/RULE_BOOK.md matches the game', () => {
  it('covers all seven game design elements', () => {
    for (const h of ['## 1. Players', '## 2. Goals', '## 3. Rules', '## 4. Space', '## 5. Time', '## 6. Resources', '## 7. Conflict']) expect(rules).toContain(h);
  });
  it('states the real puzzle timer and dance length', () => {
    expect(rules).toContain(`you have ${PUZZLE_SECONDS} seconds`);
    expect(rules).toContain(`**Puzzle:** ${PUZZLE_SECONDS} seconds in Warm Up and Find the Beat`);
    expect(rules).toContain(`**Dance:** ${DANCE_SECONDS} seconds, including a short count-in`);
    expect(rules).toContain(`It lasts ${DANCE_SECONDS} seconds, with a countdown`);
    for (const t of TRACKS) expect(Math.round(totalSeconds(t))).toBe(DANCE_SECONDS); // the document is true for every song
  });
  it('explains the new rules: timeout reveal, hint button, listening level', () => {
    expect(rules).toContain("**Time's up:**");
    expect(rules).toContain('correct order is shown');
    expect(rules).toContain('small Hint button');
    expect(rules).toContain('**Feel the Rhythm:**');
    expect(rules).toContain('three titles');
  });
  it('states the real level count, phrase limits and emoji count', () => {
    expect(rules).toContain(`Finish all ${LEVELS.length} levels`);
    expect(rules).toContain(`${PHRASE_LIMITS.minWords} to ${PHRASE_LIMITS.maxWords} words, up to ${PHRASE_LIMITS.maxChars} characters`);
    expect(rules).toContain(`There are ${EMOJI.length} emoji`);
  });
  it('says there is no submit button and that music waits for the button', () => {
    expect(rules).toContain('there is no button to press');
    expect(rules).toContain('it starts only when you press the dance button');
  });
  it('promises only features that exist in the game', () => {
    for (const testId of ['nudge', 'shuffle-again', 'restart-dance', 'dance-again', 'seated-toggle', 'level-1']) {
      expect(['src/screens/PuzzleScreen.tsx', 'src/screens/DanceScreen.tsx', 'src/screens/CelebrateScreen.tsx', 'src/screens/InviteScreen.tsx', 'src/components/LevelBar.tsx'].some((f) => readFileSync(f, 'utf8').includes(testId) || readFileSync(f, 'utf8').includes('level-${'))).toBe(true);
    }
  });
  it('the in-app Rule Book has the same seven sections', () => {
    for (const h of ['1. Players', '2. Goals', '3. Rules', '4. Space', '5. Time', '6. Resources', '7. Conflict']) expect(inApp).toContain(h);
  });
});

describe('other documents', () => {
  it('assignment documentation has every numbered section and the honest-evidence labels', () => {
    for (let i = 1; i <= 20; i++) expect(assignment, `section ${i}`).toMatch(new RegExp(`^## ${i}\\. `, 'm'));
    for (const word of ['MOVE & MATCH', 'MOOD IN MOTION', 'NOT YET COLLECTED', 'Empathise', 'Define', 'Ideate', 'Prototype', 'Test', 'Refine']) expect(assignment).toContain(word);
  });
  it('README documents running, deploying and the live link', () => {
    expect(readme).toContain('npm run dev');
    expect(readme).toContain('npm run deploy');
    expect(readme).toContain('https://heenaparmar-dotcom.github.io/Hybrid-Game-A1/');
  });
  it('no document claims real playtest results or faculty approval', () => {
    for (const text of [assignment, readme]) {
      expect(text).not.toMatch(/participants? (said|reported|found|enjoyed)/i);
      expect(text).not.toMatch(/faculty (approved|loved|praised)/i);
    }
  });
});
