/**
 * Original dancer poses for the title screen, written by hand as joint positions (SVG units, y points down,
 * origin at the pelvis). They are NOT traced from any picture. "L" and "R" are screen left and right.
 * Each dancer has two poses (A and B); the title screen eases between them for a gentle dance-like motion.
 */
export type Pt = [number, number];

export interface SilPose {
  pelvis: Pt;
  /** Shoulder joints. */
  ls: Pt;
  rs: Pt;
  /** Head centre and tilt in degrees. */
  head: Pt;
  tilt: number;
  /** Elbow and wrist. */
  le: Pt;
  lw: Pt;
  re: Pt;
  rw: Pt;
  /** Knee and ankle. */
  lk: Pt;
  la: Pt;
  rk: Pt;
  ra: Pt;
  /** Direction the hair streams (degrees, 0 = right, 90 = down) and how long it is. */
  hair: number;
  hairLen: number;
}

export interface SilDancer {
  x: number;
  y: number;
  scale: number;
  delay: number;
  phase: number;
  /** Loose wide-leg trousers instead of fitted legs. */
  baggy?: boolean;
  /** Height (SVG units) of a light hop, for a dancer who is slightly airborne on the off-beat. */
  hop?: number;
  a: SilPose;
  b: SilPose;
}

/**
 * All three share the Zumba "power stance": feet wide apart, knees soft, one arm high and the other bent behind the head,
 * with a ponytail that flies with the move. The poses are written by hand for this game.
 */
export const SIL_DANCERS: readonly SilDancer[] = [
  {
    // left: arm bent behind the head, the other arm reaching up and out, ponytail trailing
    x: -158, y: 108, scale: 0.95, delay: 0.1, phase: 0,
    a: {
      pelvis: [0, 0], ls: [-12, -80], rs: [26, -78], head: [10, -106], tilt: 6,
      le: [-46, -104], lw: [-14, -124], re: [52, -108], rw: [62, -148],
      lk: [-44, 50], la: [-72, 104], rk: [44, 50], ra: [72, 104],
      hair: 200, hairLen: 52,
    },
    b: {
      pelvis: [4, 3], ls: [-12, -80], rs: [26, -78], head: [14, -105], tilt: -4,
      le: [-50, -108], lw: [-58, -148], re: [50, -100], rw: [18, -122],
      lk: [-40, 54], la: [-62, 106], rk: [48, 48], ra: [78, 100],
      hair: 188, hairLen: 54,
    },
  },
  {
    // centre: the same stance, mirrored and deeper, wide-leg trousers, both arms reaching high on the beat
    x: 0, y: 96, scale: 0.98, delay: 0.3, phase: 0.5, baggy: true,
    a: {
      pelvis: [0, 12], ls: [-24, -70], rs: [14, -72], head: [-6, -98], tilt: -8,
      le: [-52, -98], lw: [-64, -140], re: [38, -100], rw: [8, -120],
      lk: [-52, 46], la: [-78, 100], rk: [52, 46], ra: [78, 100],
      hair: 110, hairLen: 58,
    },
    b: {
      pelvis: [0, 6], ls: [-24, -72], rs: [14, -74], head: [-6, -100], tilt: -2,
      le: [-48, -110], lw: [-58, -150], re: [42, -112], rw: [52, -150],
      lk: [-48, 48], la: [-70, 102], rk: [48, 48], ra: [70, 102],
      hair: 100, hairLen: 60,
    },
  },
  {
    // right: lightly airborne with one knee bent, one arm high and the other swinging low, ponytail flicked up
    x: 160, y: 104, scale: 0.95, delay: 0.5, phase: 1, hop: 7,
    a: {
      pelvis: [0, 6], ls: [-20, -74], rs: [18, -80], head: [8, -104], tilt: -10,
      le: [-52, -58], lw: [-74, -30], re: [48, -112], rw: [56, -150],
      lk: [-40, 54], la: [-60, 108], rk: [50, 44], ra: [66, 96],
      hair: 228, hairLen: 60,
    },
    b: {
      pelvis: [0, 6], ls: [-20, -74], rs: [18, -80], head: [7, -104], tilt: -4,
      le: [-48, -96], lw: [-20, -122], re: [44, -100], rw: [70, -126],
      lk: [-36, 56], la: [-54, 110], rk: [46, 48], ra: [62, 100],
      hair: 214, hairLen: 62,
    },
  },
];
