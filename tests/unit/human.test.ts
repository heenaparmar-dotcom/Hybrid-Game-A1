import { describe, expect, it } from 'vitest';
import { SIL_DANCERS } from '../../src/data/silhouettes';
import { BONES, GROUND, distance, figureAt, keyframes, toHumanPose, type Figure } from '../../src/lib/human';

const framesFor = (i: number) => keyframes(toHumanPose(SIL_DANCERS[i].a), toHumanPose(SIL_DANCERS[i].b));
const near = (a: number, b: number, tol: number) => Math.abs(a - b) <= tol;

describe('title dancers move like a person', () => {
  it('bone lengths never change, whatever the pose (limbs do not stretch or shrink)', () => {
    SIL_DANCERS.forEach((d, i) => {
      const frames = framesFor(i);
      for (let beat = 0; beat < 8; beat += 0.05) {
        const f = figureAt(frames, beat, d.phase);
        expect(near(distance(f.ls, f.le), BONES.upper, 0.01), `upper arm L ${i}@${beat}`).toBe(true);
        expect(near(distance(f.rs, f.re), BONES.upper, 0.01)).toBe(true);
        expect(near(distance(f.le, f.lw), BONES.fore, 0.01)).toBe(true);
        expect(near(distance(f.re, f.rw), BONES.fore, 0.01)).toBe(true);
        expect(near(distance(f.hl, f.lk), BONES.thigh, 0.01)).toBe(true);
        expect(near(distance(f.hr, f.rk), BONES.thigh, 0.01)).toBe(true);
        expect(near(distance(f.lk, f.la), BONES.shin, 0.01)).toBe(true);
        expect(near(distance(f.rk, f.ra), BONES.shin, 0.01)).toBe(true);
        expect(near(distance(f.pelvis, f.spineTop), BONES.spine, 0.01)).toBe(true);
      }
    });
  });

  it('feet stay on the floor: the lowest foot always touches the ground line', () => {
    SIL_DANCERS.forEach((d, i) => {
      const frames = framesFor(i);
      for (let beat = 0; beat < 8; beat += 0.05) {
        const f = figureAt(frames, beat, d.phase);
        const lowest = Math.max(f.la[1] + 6, f.ra[1] + 6, f.ltoe[1] + 2, f.rtoe[1] + 2);
        expect(near(lowest, GROUND, 0.001), `dancer ${i} @${beat}`).toBe(true);
        for (const p of [f.la, f.ra, f.ltoe, f.rtoe]) expect(p[1]).toBeLessThanOrEqual(GROUND + 0.001); // nothing sinks below the floor
      }
    });
  });

  it('the airborne dancer hops: she leaves the floor between beats, lands on each beat and never sinks into it', () => {
    const d = SIL_DANCERS[2];
    expect(d.hop).toBeGreaterThan(0);
    const frames = framesFor(2);
    let maxLift = 0;
    for (let beat = 0; beat < 8; beat += 0.05) {
      const f = figureAt(frames, beat, d.phase, d.hop);
      const lowest = Math.max(f.la[1] + 6, f.ra[1] + 6, f.ltoe[1] + 2, f.rtoe[1] + 2);
      expect(lowest).toBeLessThanOrEqual(GROUND + 0.001);
      maxLift = Math.max(maxLift, GROUND - lowest);
    }
    expect(maxLift).toBeGreaterThan(d.hop! * 0.8);
    const onBeat = figureAt(frames, 4 - d.phase, d.phase, d.hop); // phase puts the foot-down moment on the beat
    expect(Math.max(onBeat.la[1] + 6, onBeat.ra[1] + 6, onBeat.ltoe[1] + 2, onBeat.rtoe[1] + 2)).toBeCloseTo(GROUND, 1);
  });

  it('every coordinate is a finite number', () => {
    SIL_DANCERS.forEach((d, i) => {
      const frames = framesFor(i);
      for (let beat = -2; beat < 12; beat += 0.1) {
        const f = figureAt(frames, beat, d.phase) as Figure;
        for (const v of Object.values(f)) {
          if (Array.isArray(v)) for (const n of v) expect(Number.isFinite(n)).toBe(true);
          else expect(Number.isFinite(v as number)).toBe(true);
        }
      }
    });
  });

  it('motion is smooth: no joint jumps between frames, and the figure really moves', () => {
    SIL_DANCERS.forEach((d, i) => {
      const frames = framesFor(i);
      let prev = figureAt(frames, 0, d.phase);
      let travelled = 0;
      for (let beat = 1 / 60; beat < 8; beat += 1 / 60) {
        const f = figureAt(frames, beat, d.phase);
        for (const key of ['lw', 'rw', 'lk', 'rk', 'la', 'ra', 'head'] as const) {
          const step = distance(f[key], prev[key]);
          expect(step, `${key} jumped on dancer ${i}`).toBeLessThan(12);
          travelled += step;
        }
        prev = f;
      }
      expect(travelled).toBeGreaterThan(800); // lively, not frozen
    });
  });

  it('hair trails the motion instead of being rigid', () => {
    const frames = framesFor(1);
    const angles = new Set<number>();
    for (let beat = 0; beat < 4; beat += 0.1) angles.add(Math.round(figureAt(frames, beat, SIL_DANCERS[1].phase).hair));
    expect(angles.size).toBeGreaterThan(8);
  });

  it('retargeting keeps the shape of the hand-authored poses (arms up stay up, legs stay apart)', () => {
    const lunge = toHumanPose(SIL_DANCERS[1].a);
    expect(Math.abs(lunge.upper[1])).toBeGreaterThan(160); // right arm straight up
    expect(lunge.thigh[0]).toBeLessThan(-40); // left leg out to the left
    expect(lunge.thigh[1]).toBeGreaterThan(40); // right leg out to the right
  });
});
