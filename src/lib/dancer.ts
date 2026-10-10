/**
 * Pose maths for the original 2D shadow dancer.
 * A pose is a set of joint angles. "L" and "R" are SCREEN left and right. Arm and leg angles are measured from
 * "hanging straight down", positive = swinging OUTWARD (away from the body). Everything is a pure function of the beat,
 * so the dancer stays locked to the music and can be tested without a browser.
 */
export interface Pose {
  /** Body offset in SVG units. */
  x: number;
  y: number;
  /** Torso lean in degrees (positive = top leans right). */
  lean: number;
  /** Head tilt in degrees. */
  head: number;
  /** Shoulder width scale (1 = facing front, lower = turned). */
  twist: number;
  /** Shoulder swing and elbow bend for each arm. */
  sL: number;
  eL: number;
  sR: number;
  eR: number;
  /** Thigh swing (degrees) and knee lift (0 to 1) for each leg. */
  tL: number;
  liftL: number;
  tR: number;
  liftR: number;
}

export const REST: Pose = { x: 0, y: 0, lean: 0, head: 0, twist: 1, sL: 14, eL: 8, sR: 14, eR: 8, tL: 5, liftL: 0, tR: 5, liftR: 0 };

const TAU = Math.PI * 2;
const sin = (b: number, period: number, phase = 0) => Math.sin(TAU * (b / period + phase));
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const ease = (x: number) => {
  const t = clamp01(x);
  return t * t * (3 - 2 * t);
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const pulse = (c: number, from: number, to: number) => (c >= from && c <= to ? Math.sin((Math.PI * (c - from)) / (to - from)) : 0);
const bounce = (b: number, amount: number) => -amount * Math.abs(Math.sin(Math.PI * b));

type MoveFn = (b: number) => Partial<Pose>;

/** One function per move; `b` is the beat within the move (0 to 8, and it may run slightly past 8 while blending). */
const MOVE_POSES: Record<string, MoveFn> = {
  sway: (b) => ({
    x: 18 * sin(b, 4), lean: -5 * sin(b, 4), head: 4 * sin(b, 4), y: bounce(b, 3),
    sL: 28 - 16 * sin(b, 4), sR: 28 + 16 * sin(b, 4), eL: 22, eR: 22,
  }),
  step: (b) => {
    const c = ((b % 4) + 4) % 4;
    return {
      x: 22 * sin(b, 4), y: bounce(b, 3), lean: -3 * sin(b, 4),
      tR: 6 + 24 * pulse(c, 0, 1), liftR: 0.3 * pulse(c, 0, 1),
      tL: 6 + 24 * pulse(c, 2, 3), liftL: 0.3 * pulse(c, 2, 3),
      sL: 30 + 12 * sin(b, 1), sR: 30 - 12 * sin(b, 1), eL: 30, eR: 30,
    };
  },
  reach: (b) => {
    const u = (1 - Math.cos((Math.PI * b) / 2)) / 2;
    return { sL: 14 + 156 * u, sR: 14 + 156 * u, eL: 8 - 8 * u, eR: 8 - 8 * u, y: 5 - 11 * u, head: -3 * u };
  },
  clap: (b) => {
    const k = (1 + Math.cos(TAU * b)) / 2; // 1 on each beat = hands together
    return { sL: lerp(55, 30, k), sR: lerp(55, 30, k), eL: lerp(-35, -125, k), eR: lerp(-35, -125, k), y: 3 * k, tL: 8, tR: 8 };
  },
  hips: (b) => ({
    sL: 58, sR: 58, eL: -85, eR: -85, x: 14 * sin(b, 4), lean: -7 * sin(b, 4), head: 3 * sin(b, 4), y: bounce(b, 2), tL: 8, tR: 8,
  }),
  march: (b) => {
    const p = ((b % 2) + 2) % 2;
    const r = pulse(p, 0, 1);
    const l = pulse(p, 1, 2);
    return { liftR: r, liftL: l, y: -3 * Math.max(r, l), sL: 24 + 30 * r, sR: 24 + 30 * l, eL: 40, eR: 40, lean: 2 * (r - l) };
  },
  wave: (b) => {
    const uR = ease(b / 0.8) * ease((4.2 - b) / 0.6);
    const uL = ease((b - 3.9) / 0.7) * ease((8.4 - b) / 0.6);
    const wag = 32 * sin(b, 1);
    return {
      sR: lerp(24, 152, uR), eR: lerp(20, 0, uR) + uR * wag,
      sL: lerp(24, 152, uL), eL: lerp(20, 0, uL) - uL * wag,
      head: 5 * (uR - uL), x: 6 * sin(b, 2), y: bounce(b, 2),
    };
  },
  bhangra: (b) => {
    const p = Math.cos(Math.PI * b); // peaks land ON the beat
    return {
      sR: 100 + 68 * p, sL: 100 - 68 * p, eR: -20, eL: -20, y: bounce(b, 3), lean: 4 * p, head: -4 * p, x: 6 * p,
      liftR: 0.3 * Math.max(0, p), liftL: 0.3 * Math.max(0, -p),
    };
  },
  // ---- Zumba-inspired party moves: bigger, bouncier, driven by the beat ----
  // salsa basic: weight shifts side to side, hips sway, hands swing at the waist
  salsa: (b) => {
    const c = ((b % 4) + 4) % 4;
    return {
      x: 14 * sin(b, 4), lean: -6 * sin(b, 4) + 2.5 * sin(b, 1), y: bounce(b, 3), head: 4 * sin(b, 4),
      tR: 6 + 20 * pulse(c, 0, 1), liftR: 0.25 * pulse(c, 0, 1),
      tL: 6 + 20 * pulse(c, 2, 3), liftL: 0.25 * pulse(c, 2, 3),
      sL: 46 + 10 * Math.cos(TAU * b), eL: -72, sR: 46 - 10 * Math.cos(TAU * b), eR: -72,
    };
  },
  // grapevine: a wide step out, the other foot crosses behind, then back the other way, arms swinging against the feet
  grapevine: (b) => {
    const c = ((b % 4) + 4) % 4;
    return {
      x: 26 * sin(b, 4), lean: -4 * sin(b, 4), y: bounce(b, 3), head: 5 * sin(b, 4),
      tR: 6 + 26 * pulse(c, 0, 1) - 16 * pulse(c, 3, 4), tL: 6 - 16 * pulse(c, 1, 2) + 26 * pulse(c, 2, 3),
      liftR: 0.3 * pulse(c, 0, 1), liftL: 0.3 * pulse(c, 2, 3),
      sL: 42 + 24 * sin(b, 2), sR: 42 - 24 * sin(b, 2), eL: -30, eR: -30,
    };
  },
  // merengue march: knees up on every beat, hips swaying, bent arms pumping
  merengue: (b) => {
    const p = ((b % 2) + 2) % 2;
    const r = pulse(p, 0, 1);
    const l = pulse(p, 1, 2);
    return {
      liftR: r * 0.9, liftL: l * 0.9, y: -3 * Math.max(r, l), x: 7 * sin(b, 2), lean: 3 * (r - l), head: 3 * (r - l),
      sL: 38 + 26 * l, sR: 38 + 26 * r, eL: -95 + 20 * l, eR: -95 + 20 * r,
    };
  },
  // party hop: a little bounce on every beat with the arms thrown up
  jump: (b) => {
    const p = Math.abs(Math.sin(Math.PI * b));
    return {
      y: -11 * p, sL: 24 + 140 * p, sR: 24 + 140 * p, eL: 14 - 24 * p, eR: 14 - 24 * p,
      liftL: 0.55 * p, liftR: 0.55 * p, tL: 12, tR: 12, head: -3 * p,
    };
  },
  twist: (b) => ({
    twist: 0.65 + 0.35 * Math.abs(Math.cos((Math.PI * b) / 2)), x: 10 * sin(b, 4), lean: -4 * sin(b, 4), y: bounce(b, 2),
    sL: 40 + 25 * sin(b, 4), sR: 40 - 25 * sin(b, 4), eL: 35, eR: 35, head: 5 * sin(b, 4),
  }),
};

export const MOVE_IDS = Object.keys(MOVE_POSES);

const SEATED_Y = 26;

export function poseAt(moveId: string, b: number, seated = false): Pose {
  const fn = MOVE_POSES[moveId] ?? MOVE_POSES.sway;
  const p: Pose = { ...REST, ...fn(b) };
  if (!seated) return p;
  // Seated: the lower body stays put on a stool (small foot taps and knee lifts survive), the upper body keeps moving.
  return {
    ...p,
    x: p.x * 0.35,
    y: SEATED_Y + p.y * 0.6,
    tL: 17 + (p.tL - REST.tL) * 0.4,
    tR: 17 + (p.tR - REST.tR) * 0.4,
    liftL: 0.55 + p.liftL * 0.35,
    liftR: 0.55 + p.liftR * 0.35,
  };
}

export function lerpPose(a: Pose, b: Pose, t: number): Pose {
  const out = { ...a };
  (Object.keys(a) as (keyof Pose)[]).forEach((k) => {
    out[k] = lerp(a[k], b[k], t);
  });
  return out;
}

export { ease };
