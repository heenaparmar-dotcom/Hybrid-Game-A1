import type { Track } from '../data/tracks';
import { stageHumanPose } from './human';
import { poseAtBeat } from './routine';

/**
 * Camera points. The browser's pose tracker gives body landmarks; we turn them into the same bone angles the stage dancer
 * uses (measured from straight down, positive towards the screen's right) and compare the two.
 *
 * Everything here is a pure function, so it can be tested without a camera. Nothing is stored or sent anywhere.
 */

/** A body landmark in the camera's normalised image coordinates (0 to 1, y points down). */
export interface Landmark {
  x: number;
  y: number;
  visibility?: number;
}

/** Bone angles, index 0 = the limb on the screen's left, 1 = the limb on the screen's right. NaN means "not visible". */
export interface BoneAngles {
  upper: [number, number];
  fore: [number, number];
  thigh: [number, number];
  shin: [number, number];
}

const NOSE = 0;
const L_SHOULDER = 11;
const R_SHOULDER = 12;
const LIMBS = {
  // [shoulder, elbow, wrist, hip, knee, ankle] for the player's own left and right
  left: [11, 13, 15, 23, 25, 27],
  right: [12, 14, 16, 24, 26, 28],
} as const;

const MIN_VISIBILITY = 0.5;
const deg = (r: number) => (r * 180) / Math.PI;
/** Smallest difference between two angles, 0 to 180. */
const gap = (a: number, b: number) => Math.abs((((a - b) % 360) + 540) % 360 - 180);

export const KEYS = ['upper', 'fore', 'thigh', 'shin'] as const;

/**
 * The player's bone angles as they would look in a mirror, so "right" means the player's right, just like the dancer's
 * "right on screen" cue. `aspect` is the video width divided by its height, so angles are not stretched.
 */
export function playerAngles(lm: Landmark[], aspect = 4 / 3): BoneAngles | null {
  if (lm.length < 29) return null;
  const mx = (p: Landmark) => (1 - p.x) * aspect; // mirror, and put x and y in the same unit
  const seen = (p: Landmark) => (p.visibility ?? 1) >= MIN_VISIBILITY;
  // which of the player's sides appears on the screen's left in the mirror view?
  const leftIsScreenLeft = mx(lm[L_SHOULDER]) <= mx(lm[R_SHOULDER]);
  const screenLeft = leftIsScreenLeft ? LIMBS.left : LIMBS.right;
  const screenRight = leftIsScreenLeft ? LIMBS.right : LIMBS.left;
  const bone = (a: Landmark, b: Landmark): number => (seen(a) && seen(b) ? deg(Math.atan2(mx(b) - mx(a), b.y - a.y)) : NaN);
  const side = (ids: readonly number[]) => {
    const [s, e, w, h, k, a] = ids.map((i) => lm[i]);
    return { upper: bone(s, e), fore: bone(e, w), thigh: bone(h, k), shin: bone(k, a) };
  };
  const l = side(screenLeft);
  const r = side(screenRight);
  // a head or shoulders that are missing means no usable body
  if (!seen(lm[L_SHOULDER]) || !seen(lm[R_SHOULDER]) || lm[NOSE] === undefined) return null;
  return { upper: [l.upper, r.upper], fore: [l.fore, r.fore], thigh: [l.thigh, r.thigh], shin: [l.shin, r.shin] };
}

/** The angles the stage dancer shows at a moment in the routine. */
export function dancerAngles(track: Track, beat: number, seated: boolean): BoneAngles {
  const h = stageHumanPose(poseAtBeat(track, beat, seated), seated);
  return { upper: h.upper, fore: h.fore, thigh: h.thigh, shin: h.shin };
}

/** What a person standing still looks like: arms hanging, legs straight. */
export const STANDING: BoneAngles = { upper: [-8, 8], fore: [-6, 6], thigh: [-4, 4], shin: [-2, 2] };

/** Angle difference (degrees) at which a bone earns no credit at all. */
const TOLERANCE = 70;
/** The player may be a moment behind the dancer, so we also look back over this many seconds. */
const LAG_SECONDS = [0, 0.15, 0.3, 0.45];

/** Mean credit (0 to 1) of the player's bones against one dancer pose; null when too few bones are visible. */
export function credit(player: BoneAngles, target: BoneAngles, seated: boolean): number | null {
  let sum = 0;
  let n = 0;
  for (const key of KEYS) {
    if (seated && (key === 'thigh' || key === 'shin')) continue; // a seated dancer's legs are not scored
    for (const i of [0, 1] as const) {
      const p = player[key][i];
      if (Number.isNaN(p)) continue;
      sum += Math.max(0, 1 - gap(p, target[key][i]) / TOLERANCE);
      n++;
    }
  }
  return n >= (seated ? 3 : 5) ? sum / n : null;
}

/** Best credit over the dancer's recent poses (allowing for reaction time). */
export function windowCredit(player: BoneAngles, track: Track, beat: number, seated: boolean): number | null {
  const perSecond = track.bpm / 60;
  let best: number | null = null;
  for (const lag of LAG_SECONDS) {
    const c = credit(player, dancerAngles(track, Math.max(0, beat - lag * perSecond), seated), seated);
    if (c !== null && (best === null || c > best)) best = c;
  }
  return best;
}

export interface CameraResult {
  /** 0 to 100, or null when the camera could not see the player well enough to score. */
  points: number | null;
  /** 0 to 3 stars. */
  stars: number;
  /** How often the player was clearly in view (0 to 1). */
  seen: number;
  /** Scored moments. */
  frames: number;
  note: string;
}

/** Mean credit at or above this earns the full 100 points: nobody matches a dancer exactly. */
const FULL_MARKS = 0.85;
/** Below this share of moments in view, we do not give a score. */
const MIN_SEEN = 0.4;
const MIN_FRAMES = 20;

/** Collects the moments of one dance and turns them into points. Standing still scores zero. */
export class ScoreKeeper {
  private sum = 0;
  private idleSum = 0;
  private frames = 0;
  private attempts = 0;

  constructor(
    private track: Track,
    private seated: boolean,
  ) {}

  /** `lm` is null when nobody was found in the picture. Call once per detection while the dance is under way. */
  add(lm: Landmark[] | null, beat: number, aspect = 4 / 3) {
    this.attempts++;
    if (!lm) return;
    const angles = playerAngles(lm, aspect);
    if (!angles) return;
    const c = windowCredit(angles, this.track, beat, this.seated);
    if (c === null) return;
    this.sum += c;
    this.idleSum += windowCredit(STANDING, this.track, beat, this.seated) ?? 0;
    this.frames++;
  }

  result(): CameraResult {
    const seen = this.attempts === 0 ? 0 : this.frames / this.attempts;
    if (this.frames < MIN_FRAMES || seen < MIN_SEEN) {
      return {
        points: null,
        stars: 0,
        seen,
        frames: this.frames,
        note: 'The camera could not see you well enough to give points. Try again with your whole body in view and some light.',
      };
    }
    const mean = this.sum / this.frames;
    const idle = this.idleSum / this.frames;
    const points = Math.round(100 * Math.min(1, Math.max(0, (mean - idle) / (Math.min(FULL_MARKS, 0.98) - idle))));
    const stars = points >= 75 ? 3 : points >= 50 ? 2 : points >= 25 ? 1 : 0;
    return {
      points,
      stars,
      seen,
      frames: this.frames,
      note: stars === 3 ? 'Great match!' : stars === 2 ? 'Nice moves. Try for bigger arm and leg moves.' : stars === 1 ? 'A start. Copy the dancer a little bigger.' : 'Try again, and follow the dancer with your arms and legs.',
    };
  }
}

/** For the live skeleton drawn over the camera picture: pairs of landmark ids to join with a line. */
export const SKELETON: ReadonlyArray<readonly [number, number]> = [
  [11, 12], [11, 13], [13, 15], [12, 14], [14, 16], [11, 23], [12, 24], [23, 24], [23, 25], [25, 27], [24, 26], [26, 28],
];
