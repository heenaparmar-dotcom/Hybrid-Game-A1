import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { THEMES } from '../../src/data/themes';
import { MOVES_PER_SEQUENCE, PHRASE_LIMITS, SCORING, TIMING, UNLOCK_STEP } from '../../src/lib/constants';

const rules = readFileSync('docs/RULE_BOOK.md', 'utf8');
const assignment = readFileSync('docs/ASSIGNMENT_DOCUMENTATION.md', 'utf8');
const readme = readFileSync('README.md', 'utf8');

describe('docs/RULE_BOOK.md matches the implemented constants', () => {
  it('states the scoring values used by the game', () => {
    expect(rules).toContain(`| Correct puzzle answer | ${SCORING.puzzleBase} |`);
    expect(rules).toContain(`0 to ${SCORING.speedBonusMax} |`);
    expect(rules).toContain(`-${SCORING.hintPenalty} from the puzzle points`);
    expect(rules).toContain(`| Completing the movement phase (standing or seated) | ${SCORING.movePoints} |`);
    expect(rules).toContain(`up to **${SCORING.maxHints} hints**`);
    expect(rules).toContain(`Best possible turn: **${SCORING.puzzleBase + SCORING.speedBonusMax + SCORING.movePoints}**`);
  });
  it('states the timing values used by the game', () => {
    expect(rules).toContain(`**${TIMING.puzzleSeconds} seconds**`);
    expect(rules).toContain(`**${TIMING.moveSeconds} seconds**`);
    expect(rules).toContain(`about ${TIMING.listenGuideSeconds} s`);
    expect(rules).toContain(`about ${TIMING.transitionAllowanceSeconds} s`);
    expect(rules).toContain(`**${MOVES_PER_SEQUENCE} moves**`);
  });
  it('states the unlock thresholds and theme names', () => {
    for (const t of THEMES) expect(rules).toContain(t.name);
    expect(rules).toContain(`Every **${UNLOCK_STEP}** song-and-dance turns`);
    expect(rules).toContain(`Unlocks after ${UNLOCK_STEP} song-and-dance turns`);
    expect(rules).toContain(`Unlocks after ${UNLOCK_STEP * 2} song-and-dance turns`);
  });
  it('states the phrase limits', () => {
    expect(rules).toContain(`${PHRASE_LIMITS.minWords} to ${PHRASE_LIMITS.maxWords} words, up to ${PHRASE_LIMITS.maxChars} characters`);
  });
  it('covers all seven game-design elements', () => {
    for (const h of ['## 1. Players', '## 2. Goals', '## 3. Rules', '## 4. Space', '## 5. Time', '## 6. Resources', '## 7. Conflict']) expect(rules).toContain(h);
  });
});

describe('other documents exist and keep their required sections', () => {
  it('assignment documentation has every numbered section and the honest-evidence labels', () => {
    for (let i = 1; i <= 20; i++) expect(assignment, `section ${i}`).toMatch(new RegExp(`^## ${i}\\. `, 'm'));
    expect(assignment).toContain('MOVE & MATCH');
    expect(assignment).toContain('MOOD IN MOTION');
    expect(assignment).toContain('NOT YET COLLECTED');
  });
  it('README documents how to run the game', () => {
    expect(readme).toContain('npm run dev');
    expect(readme).toContain('localhost');
  });
});
