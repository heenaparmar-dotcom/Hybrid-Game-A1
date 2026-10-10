import { describe, expect, it } from 'vitest';
import { MOVE_IDS, poseAt } from '../../src/lib/dancer';
import { MOVES } from '../../src/data/moves';
import { TRACKS } from '../../src/data/tracks';
import { stageFigure } from '../../src/lib/human';

describe('stage dancers', () => {
  it('every move has cues and a pose, including the Zumba-style ones', () => {
    for (const id of ['salsa', 'grapevine', 'merengue', 'jump']) {
      expect(MOVES[id]).toBeTruthy();
      expect(MOVE_IDS).toContain(id);
    }
  });

  it('livelier songs have higher energy', () => {
    const e = Object.fromEntries(TRACKS.map((t) => [t.id, t.energy]));
    expect(e.hookstep).toBeGreaterThan(e.nacho);
    expect(e.nacho).toBeGreaterThan(e.sunrise);
  });

  it('stageFigure gives finite coordinates standing and seated, for every move', () => {
    for (const id of MOVE_IDS) {
      for (const seated of [false, true]) {
        for (let b = 0; b < 8; b += 0.25) {
          const f = stageFigure(poseAt(id, b, seated), b, { seated, energy: 1.2 });
          expect(JSON.stringify(f)).not.toMatch(/null|NaN/);
        }
      }
    }
  });
});
