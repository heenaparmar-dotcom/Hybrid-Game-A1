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

export const SIL_DANCERS: readonly SilDancer[] = [
  {
    // left: wide power stance, one fist reaching up-left, the other arm out to the right, hair flying left
    x: -158, y: 108, scale: 0.95, delay: 0.1, phase: 0,
    a: {
      pelvis: [0, 0], ls: [-11, -80], rs: [27, -76], head: [14, -105], tilt: 10,
      le: [-44, -100], lw: [-66, -129], re: [62, -66], rw: [86, -86],
      lk: [-36, 52], la: [-54, 104], rk: [40, 48], ra: [62, 100],
      hair: 200, hairLen: 54,
    },
    b: {
      pelvis: [0, 2], ls: [-12, -80], rs: [25, -78], head: [11, -105], tilt: 4,
      le: [-47, -90], lw: [-72, -112], re: [60, -72], rw: [84, -96],
      lk: [-32, 54], la: [-46, 106], rk: [37, 50], ra: [54, 103],
      hair: 188, hairLen: 56,
    },
  },
  {
    // centre: deep lunge, one arm straight up, the other out, head tipped back, long hair falling
    x: 0, y: 96, scale: 0.98, delay: 0.3, phase: 0.5, baggy: true,
    a: {
      pelvis: [0, 14], ls: [-26, -62], rs: [10, -70], head: [-16, -91], tilt: -22,
      le: [-62, -52], lw: [-96, -40], re: [16, -110], rw: [22, -146],
      lk: [-58, 44], la: [-62, 98], rk: [58, 48], ra: [100, 84],
      hair: 105, hairLen: 62,
    },
    b: {
      pelvis: [0, 10], ls: [-24, -64], rs: [12, -70], head: [-12, -92], tilt: -14,
      le: [-60, -56], lw: [-92, -52], re: [20, -108], rw: [28, -144],
      lk: [-54, 42], la: [-60, 98], rk: [54, 46], ra: [94, 88],
      hair: 96, hairLen: 64,
    },
  },
  {
    // right: lightly airborne, one knee bent and lifted, one arm up-right and the other swinging low, hair flicked up
    x: 160, y: 104, scale: 0.95, delay: 0.5, phase: 1, hop: 7,
    a: {
      pelvis: [0, 8], ls: [-20, -72], rs: [18, -80], head: [8, -104], tilt: -10,
      le: [-56, -54], lw: [-72, -22], re: [42, -112], rw: [62, -142],
      lk: [-22, 56], la: [-26, 110], rk: [46, 40], ra: [34, 88],
      hair: 228, hairLen: 62,
    },
    b: {
      pelvis: [0, 8], ls: [-20, -72], rs: [17, -80], head: [7, -104], tilt: -4,
      le: [-52, -62], lw: [-80, -44], re: [34, -114], rw: [48, -148],
      lk: [-20, 58], la: [-22, 112], rk: [40, 46], ra: [28, 96],
      hair: 216, hairLen: 64,
    },
  },
];
