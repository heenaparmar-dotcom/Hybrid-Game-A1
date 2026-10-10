import { describe, expect, it } from 'vitest';
import { TRACKS, trackById } from '../../src/data/tracks';
import { dancerAngles, playerAngles, ScoreKeeper, STANDING, type BoneAngles, type Landmark } from '../../src/lib/poseScore';

const ASPECT = 4 / 3;
const rad = (d: number) => (d * Math.PI) / 180;

/**
 * Build the 33 landmarks of a person (as the camera sees them, NOT mirrored) whose bones have the given angles in the
 * mirror view. Lengths are in image units. Used to test the scoring without a camera.
 */
function bodyFrom(a: BoneAngles, opts: { noise?: number; hideLegs?: boolean } = {}): Landmark[] {
  const lm: Landmark[] = Array.from({ length: 33 }, () => ({ x: 0.5, y: 0.5, visibility: 0 }));
  const set = (i: number, x: number, y: number, vis = 1) => (lm[i] = { x, y, visibility: vis });
  // mirrored x' = 1 - x, scaled by aspect: x = 1 - xm / aspect
  const toCam = (xm: number) => 1 - xm / ASPECT;
  const bone = (from: [number, number], angle: number, len: number): [number, number] => [from[0] + Math.sin(rad(angle)) * len, from[1] + Math.cos(rad(angle)) * len];
  const hip = 0.55;
  const shoulderY = 0.3;
  const wob = (v: number, k: number) => v + (opts.noise ?? 0) * Math.sin(k * 12.9898);
  set(0, 0.5, 0.18);
  // screen-left limbs are at smaller mirrored x; in the camera image they are the player's RIGHT side
  const sides: Array<{ idx: [number, number, number, number, number, number]; sx: number; i: 0 | 1 }> = [
    { idx: [12, 14, 16, 24, 26, 28], sx: 0.667 - 0.13, i: 0 },
    { idx: [11, 13, 15, 23, 25, 27], sx: 0.667 + 0.13, i: 1 },
  ];
  for (const { idx, sx, i } of sides) {
    const [s, e, w, h, k, an] = idx;
    const sh: [number, number] = [sx, shoulderY];
    const el = bone(sh, wob(a.upper[i], s), 0.16);
    const wr = bone(el, wob(a.fore[i], e), 0.15);
    const hp: [number, number] = [sx * 0.9 + 0.667 * 0.1, hip];
    const kn = bone(hp, wob(a.thigh[i], h), 0.2);
    const ak = bone(kn, wob(a.shin[i], k), 0.2);
    set(s, toCam(sh[0]), sh[1]);
    set(e, toCam(el[0]), el[1]);
    set(w, toCam(wr[0]), wr[1]);
    set(h, toCam(hp[0]), hp[1]);
    set(k, toCam(kn[0]), kn[1], opts.hideLegs ? 0 : 1);
    set(an, toCam(ak[0]), ak[1], opts.hideLegs ? 0 : 1);
  }
  return lm;
}

const track = trackById('hookstep');

/** Run a whole dance through the scorer, with the player doing `playerAt(beat)`. */
function dance(playerAt: (beat: number) => Landmark[] | null, seated = false) {
  const keeper = new ScoreKeeper(track, seated);
  const total = track.moves.length * 8 * track.repeats;
  for (let b = 0; b < total; b += 0.4) keeper.add(playerAt(b), b, ASPECT);
  return keeper.result();
}

describe('camera points', () => {
  it('reads angles the way the dancer is measured: arms hanging down are about 0, right arm straight up is about 180', () => {
    const up: BoneAngles = { upper: [-10, 175], fore: [-10, 178], thigh: [-5, 5], shin: [-2, 2] };
    const got = playerAngles(bodyFrom(up), ASPECT)!;
    expect(got.upper[1]).toBeGreaterThan(160);
    expect(Math.abs(got.upper[0])).toBeLessThan(15);
    expect(got.thigh[0]).toBeLessThan(0); // the screen-left leg leans to the left
    expect(got.thigh[1]).toBeGreaterThan(0);
  });

  it('a player who copies the dancer exactly gets full marks', () => {
    const r = dance((b) => bodyFrom(dancerAngles(track, b, false)));
    expect(r.points).toBe(100);
    expect(r.stars).toBe(3);
  });

  it('a player who copies the dancer roughly (about 20 degrees off, a little late) still scores well', () => {
    const r = dance((b) => bodyFrom(dancerAngles(track, Math.max(0, b - 0.3), false), { noise: 0.35 }));
    expect(r.points!).toBeGreaterThan(55);
  });

  it('standing still scores zero', () => {
    const r = dance(() => bodyFrom(STANDING));
    expect(r.points).toBe(0);
    expect(r.stars).toBe(0);
  });

  it('moving the opposite way (left for right) scores far less than copying', () => {
    const copy = dance((b) => bodyFrom(dancerAngles(track, b, false))).points!;
    const swapped = dance((b) => {
      const a = dancerAngles(track, b, false);
      return bodyFrom({ upper: [a.upper[1], a.upper[0]], fore: [a.fore[1], a.fore[0]], thigh: [a.thigh[1], a.thigh[0]], shin: [a.shin[1], a.shin[0]] });
    }).points!;
    expect(copy - swapped).toBeGreaterThan(30);
  });

  it('gives no points (and says so) when nobody is in view', () => {
    const r = dance(() => null);
    expect(r.points).toBeNull();
    expect(r.note).toContain('could not see you');
  });

  it('gives no points when the player was only in view a small part of the time', () => {
    let n = 0;
    const r = dance((b) => (n++ % 5 === 0 ? bodyFrom(dancerAngles(track, b, false)) : null));
    expect(r.points).toBeNull();
  });

  it('the seated version scores the arms only, so hidden legs do not matter', () => {
    const r = dance((b) => bodyFrom(dancerAngles(track, b, true), { hideLegs: true }), true);
    expect(r.points).toBe(100);
  });

  it('standing scoring needs the legs: with legs hidden there are no points', () => {
    const r = dance((b) => bodyFrom(dancerAngles(track, b, false), { hideLegs: true }));
    expect(r.points).toBeNull();
  });

  it('works for every track, never producing NaN', () => {
    for (const t of TRACKS) {
      const keeper = new ScoreKeeper(t, false);
      for (let b = 0; b < 40; b += 0.5) keeper.add(bodyFrom(dancerAngles(t, b, false)), b, ASPECT);
      const r = keeper.result();
      expect(Number.isFinite(r.points ?? 0)).toBe(true);
    }
  });
});
