import type { Pt, SilPose } from '../data/silhouettes';
import type { Pose } from './dancer';

/**
 * A small articulated human figure for the title screen.
 * Bones keep a FIXED length and move by rotating at the joints (never by sliding points), the lowest foot always stays
 * on the ground, and secondary motion (knee flex, hip sway, shoulder counter-rotation, trailing hair) is layered on top.
 * Everything is a pure function of the beat, so it can be unit tested without a browser.
 */
export const BONES = { spine: 70, shoulder: 17, hip: 11, upper: 38, fore: 34, thigh: 58, shin: 56, neck: 9, foot: 17 } as const;
/** y of the floor, measured from the pelvis, after the ground lock. */
export const GROUND = 112;

const rad = (d: number) => (d * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = (t: number) => (1 - Math.cos(Math.PI * Math.min(1, Math.max(0, t)))) / 2;
/** Shortest signed angle from a to b, in degrees. */
const delta = (a: number, b: number) => ((((b - a) % 360) + 540) % 360) - 180;
const lerpAngle = (a: number, b: number, t: number) => a + delta(a, b) * t;
/** Angle of a bone measured from "straight down", positive towards screen right. */
const boneAngle = (from: Pt, to: Pt) => deg(Math.atan2(to[0] - from[0], to[1] - from[1]));
const fromDown = (p: Pt, angle: number, len: number): Pt => [p[0] + Math.sin(rad(angle)) * len, p[1] + Math.cos(rad(angle)) * len];

/** A pose as joint angles. Index 0 is the screen-left limb, 1 the screen-right limb. */
export interface HumanPose {
  /** Spine lean from vertical (degrees, positive leans right). */
  lean: number;
  /** Shoulder line and hip line tilt from horizontal (degrees). */
  shoulderTilt: number;
  hipTilt: number;
  /** Shoulder width factor: below 1 means the upper body is turned a little. */
  twist: number;
  headTilt: number;
  /** Bone angles from straight down. */
  upper: [number, number];
  fore: [number, number];
  thigh: [number, number];
  shin: [number, number];
  /** Hair direction (0 = right, 90 = down) and length. */
  hair: number;
  hairLen: number;
}

/** Turn a hand-authored joint-position pose into joint angles, so every bone gets its proper length. */
export function toHumanPose(p: SilPose): HumanPose {
  const mid: Pt = [(p.ls[0] + p.rs[0]) / 2, (p.ls[1] + p.rs[1]) / 2];
  const lean = deg(Math.atan2(mid[0] - p.pelvis[0], -(mid[1] - p.pelvis[1])));
  const shoulderAngle = deg(Math.atan2(p.rs[1] - p.ls[1], p.rs[0] - p.ls[0]));
  const width = Math.hypot(p.rs[0] - p.ls[0], p.rs[1] - p.ls[1]);
  const hipL: Pt = [p.pelvis[0] - 13, p.pelvis[1]];
  const hipR: Pt = [p.pelvis[0] + 13, p.pelvis[1]];
  return {
    lean,
    shoulderTilt: shoulderAngle - lean,
    hipTilt: -(shoulderAngle - lean) * 0.5,
    twist: Math.min(1.1, Math.max(0.72, width / (BONES.shoulder * 2))),
    headTilt: p.tilt,
    upper: [boneAngle(p.ls, p.le), boneAngle(p.rs, p.re)],
    fore: [boneAngle(p.le, p.lw), boneAngle(p.re, p.rw)],
    thigh: [boneAngle(hipL, p.lk), boneAngle(hipR, p.rk)],
    shin: [boneAngle(p.lk, p.la), boneAngle(p.rk, p.ra)],
    hair: p.hair,
    hairLen: p.hairLen,
  };
}

const pair = (a: [number, number], b: [number, number], t: number): [number, number] => [lerpAngle(a[0], b[0], t), lerpAngle(a[1], b[1], t)];

export function blendPose(a: HumanPose, b: HumanPose, t: number): HumanPose {
  return {
    lean: lerp(a.lean, b.lean, t),
    shoulderTilt: lerp(a.shoulderTilt, b.shoulderTilt, t),
    hipTilt: lerp(a.hipTilt, b.hipTilt, t),
    twist: lerp(a.twist, b.twist, t),
    headTilt: lerp(a.headTilt, b.headTilt, t),
    upper: pair(a.upper, b.upper, t),
    fore: pair(a.fore, b.fore, t),
    thigh: pair(a.thigh, b.thigh, t),
    shin: pair(a.shin, b.shin, t),
    hair: lerpAngle(a.hair, b.hair, t),
    hairLen: lerp(a.hairLen, b.hairLen, t),
  };
}

/**
 * The four poses a dancer cycles through, one per beat: A, an in-between with the arms opening, B, and an in-between with
 * the arms closing. The in-betweens swing the arms through slightly different arcs so the motion is not a plain back-and-forth.
 */
export function keyframes(a: HumanPose, b: HumanPose): HumanPose[] {
  const mid = blendPose(a, b, 0.5);
  // the in-betweens swing the arms wider, shift the weight from one leg to the other and lean the body, so it reads as dancing
  const open: HumanPose = {
    ...mid,
    upper: [mid.upper[0] + 28, mid.upper[1] - 24],
    fore: [mid.fore[0] + 20, mid.fore[1] - 18],
    thigh: [mid.thigh[0] - 7, mid.thigh[1] - 7],
    shin: [mid.shin[0] - 4, mid.shin[1] - 4],
    lean: mid.lean - 9,
    headTilt: mid.headTilt + 7,
  };
  const close: HumanPose = {
    ...mid,
    upper: [mid.upper[0] - 24, mid.upper[1] + 28],
    fore: [mid.fore[0] - 16, mid.fore[1] + 20],
    thigh: [mid.thigh[0] + 7, mid.thigh[1] + 7],
    shin: [mid.shin[0] + 4, mid.shin[1] + 4],
    lean: mid.lean + 9,
    headTilt: mid.headTilt - 7,
  };
  return [a, open, b, close];
}

/** Position in the cycle (in beats) to a pose, easing between neighbouring keyframes so each pose lands on the beat. */
export function poseAtBeat(frames: HumanPose[], beat: number): HumanPose {
  const n = frames.length;
  const pos = ((beat % n) + n) % n;
  const i = Math.floor(pos);
  return blendPose(frames[i], frames[(i + 1) % n], ease(pos - i));
}

export interface Figure {
  pelvis: Pt;
  spineTop: Pt;
  neckTop: Pt;
  head: Pt;
  headTilt: number;
  ls: Pt;
  rs: Pt;
  le: Pt;
  re: Pt;
  lw: Pt;
  rw: Pt;
  lhand: Pt;
  rhand: Pt;
  hl: Pt;
  hr: Pt;
  lk: Pt;
  rk: Pt;
  la: Pt;
  ra: Pt;
  ltoe: Pt;
  rtoe: Pt;
  twist: number;
  hair: number;
  hairLen: number;
  /** Extra phase so hair ribbons ripple a little out of step with each other. */
  ripple: number;
}

export interface BuildOptions {
  /** Beat time, used for the layered secondary motion. */
  beat: number;
  /** Offsets this dancer's secondary motion so the three are not in lockstep. */
  phase: number;
  /** Hair angle from the same motion a little earlier, so it trails the head. */
  laggedHair?: number;
  /** A light hop (SVG units): the whole figure lifts off the floor between beats and lands on each beat. */
  hop?: number;
  /** How lively the beat-driven secondary motion is (1 = normal). Livelier songs use a higher number. */
  energy?: number;
  /** Thigh length factor. A seated dancer's thighs point towards the viewer, so they look shorter. */
  thighScale?: number;
  /** Seated: the lower body stays put on the chair (no knee flex). */
  seated?: boolean;
  /** Move the whole figure (SVG units) after it has been placed on the floor. */
  offset?: Pt;
}

/** Forward kinematics: joint angles and fixed bone lengths in, joint positions out. The lowest foot is placed on the ground. */
export function buildFigure(p: HumanPose, o: BuildOptions): Figure {
  const t = o.beat;
  // secondary motion: the weight shifts and the knees give a little on every beat; the shoulders turn against the hips
  const sway = Math.sin(Math.PI * (t / 2 + o.phase));
  const bounce = Math.abs(Math.cos(Math.PI * (t + o.phase))); // 1 on the beat, 0 half a beat later
  const e = o.energy ?? 1;
  const flex = o.seated ? 0 : (1 - bounce) * 9 * e;
  const ts = o.thighScale ?? 1;
  const thigh: [number, number] = [p.thigh[0] + (p.thigh[0] < 0 ? -flex : flex), p.thigh[1] + (p.thigh[1] < 0 ? -flex : flex)];
  const shin: [number, number] = [p.shin[0] + (p.thigh[0] < 0 ? flex * 0.6 : -flex * 0.6), p.shin[1] + (p.thigh[1] < 0 ? flex * 0.6 : -flex * 0.6)];
  const lean = p.lean + sway * 3 * e;
  const shoulderTilt = p.shoulderTilt - sway * 3.5 * e;
  const hipTilt = p.hipTilt + sway * 3 * e;

  const pelvis: Pt = [sway * 4.5 * e, 0];
  const up: Pt = [Math.sin(rad(lean)), -Math.cos(rad(lean))];
  const spineTop: Pt = [pelvis[0] + up[0] * BONES.spine, pelvis[1] + up[1] * BONES.spine];
  const sAng = rad(lean + shoulderTilt);
  const sDir: Pt = [Math.cos(sAng), Math.sin(sAng)];
  const hw = BONES.shoulder * p.twist;
  const ls: Pt = [spineTop[0] - sDir[0] * hw, spineTop[1] - sDir[1] * hw];
  const rs: Pt = [spineTop[0] + sDir[0] * hw, spineTop[1] + sDir[1] * hw];
  const hAng = rad(hipTilt);
  const hl: Pt = [pelvis[0] - Math.cos(hAng) * BONES.hip, pelvis[1] - Math.sin(hAng) * BONES.hip];
  const hr: Pt = [pelvis[0] + Math.cos(hAng) * BONES.hip, pelvis[1] + Math.sin(hAng) * BONES.hip];

  const le = fromDown(ls, p.upper[0], BONES.upper);
  const re = fromDown(rs, p.upper[1], BONES.upper);
  const lw = fromDown(le, p.fore[0], BONES.fore);
  const rw = fromDown(re, p.fore[1], BONES.fore);
  const lhand = fromDown(lw, p.fore[0], 7);
  const rhand = fromDown(rw, p.fore[1], 7);
  const lk = fromDown(hl, thigh[0], BONES.thigh * ts);
  const rk = fromDown(hr, thigh[1], BONES.thigh * ts);
  const la = fromDown(lk, shin[0], BONES.shin);
  const ra = fromDown(rk, shin[1], BONES.shin);

  // feet point outwards along the floor
  const toeOf = (ankle: Pt, side: number): Pt => [ankle[0] + side * BONES.foot, ankle[1] + 4];
  const ltoe = toeOf(la, thigh[0] <= 0 ? -1 : 1);
  const rtoe = toeOf(ra, thigh[1] >= 0 ? 1 : -1);

  // neck and head follow the spine, tilting with it and then a little on their own
  const headDir = rad(lean * 0.5 + p.headTilt);
  const neckTop: Pt = [spineTop[0] + Math.sin(headDir) * BONES.neck, spineTop[1] - Math.cos(headDir) * BONES.neck];
  const head: Pt = [neckTop[0] + Math.sin(headDir) * 10, neckTop[1] - Math.cos(headDir) * 10];

  const all: Pt[] = [pelvis, spineTop, neckTop, head, ls, rs, le, re, lw, rw, lhand, rhand, hl, hr, lk, rk, la, ra, ltoe, rtoe];
  const lowest = Math.max(la[1] + 6, ra[1] + 6, ltoe[1] + 2, rtoe[1] + 2);
  const hopLift = (o.hop ?? 0) * Math.abs(Math.sin(Math.PI * (t + o.phase)));
  const shift = GROUND - lowest - hopLift;
  const dx = o.offset?.[0] ?? 0;
  const dy = o.offset?.[1] ?? 0;
  all.forEach((pt) => {
    pt[0] += dx;
    pt[1] += shift + dy;
  });

  return {
    pelvis, spineTop, neckTop, head, headTilt: lean * 0.5 + p.headTilt,
    ls, rs, le, re, lw, rw, lhand, rhand, hl, hr, lk, rk, la, ra, ltoe, rtoe,
    twist: p.twist,
    hair: o.laggedHair ?? p.hair,
    hairLen: p.hairLen,
    ripple: t * 2.4 + o.phase * 3,
  };
}

/** Everything the renderer needs for one dancer at one moment. */
export function figureAt(frames: HumanPose[], beat: number, phase: number, hop = 0): Figure {
  const pose = poseAtBeat(frames, beat);
  // the hair trails the body by about a third of a beat
  const lagged = poseAtBeat(frames, beat - 0.35).hair + 9 * Math.sin(beat * 2.6 + phase * 4);
  return buildFigure(pose, { beat, phase, laggedHair: lagged, hop });
}

export const distance = (a: Pt, b: Pt) => Math.hypot(a[0] - b[0], a[1] - b[1]);

/**
 * Turn the dance routine's move poses (the angles the cues describe) into the natural human figure used on the stage.
 * `energy` is the song's liveliness: it scales the on-the-beat bounce, hip sway and arm swing for a party feel.
 */
export function stageFigure(pose: Pose, beat: number, opts: { seated: boolean; energy: number }): Figure {
  const { seated, energy } = opts;
  const bendDown = Math.max(0, pose.y) * 1.2; // the old "sink down" becomes a deeper knee bend
  const thighOut = (t: number, lift: number) => t + 6 + 38 * lift + bendDown;
  const shinOut = (t: number, lift: number) => t * 0.4 - 28 * lift - bendDown * 0.5;
  const human: HumanPose = {
    lean: pose.lean,
    shoulderTilt: -pose.lean * 0.4,
    hipTilt: pose.lean * 0.2,
    twist: pose.twist,
    headTilt: pose.head,
    upper: [-pose.sL, pose.sR],
    fore: [-(pose.sL + pose.eL), pose.sR + pose.eR],
    thigh: seated ? [-(17 + (pose.tL - 5) * 0.4), 17 + (pose.tR - 5) * 0.4] : [-thighOut(pose.tL, pose.liftL), thighOut(pose.tR, pose.liftR)],
    shin: seated ? [-(3 + (pose.tL - 5) * 0.3), 3 + (pose.tR - 5) * 0.3] : [-shinOut(pose.tL, pose.liftL), shinOut(pose.tR, pose.liftR)],
    hair: 100,
    hairLen: 40,
  };
  return buildFigure(human, {
    beat,
    phase: 0,
    energy: seated ? energy * 0.5 : energy,
    seated,
    thighScale: seated ? 0.55 : 1,
    offset: [pose.x * 0.9, Math.min(0, pose.y)],
    // hair falls and swings against the way the body is moving
    laggedHair: 100 + pose.lean * 2 - pose.x * 0.4 + 14 * Math.sin(beat * 2.4),
  });
}
