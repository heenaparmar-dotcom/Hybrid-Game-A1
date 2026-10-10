import type { Pt } from '../data/silhouettes';
import { GROUND, type Figure } from '../lib/human';

const COLOR = '#08010f';
/** The neon street-dance look: hair, skin, and a bright green outfit. All original colours and shapes. */
const HAIR = COLOR;
const SKIN = '#d99a78';
const SKIN_SHADE = '#b87656';
const NEON = '#b6ff2b';
const NEON_DEEP = '#6fd400';
const NEON_LIGHT = '#e9ffb0';
const EDGE = 'rgba(8, 1, 15, 0.35)';
const r1 = (n: number) => Math.round(n * 10) / 10;
const add = (a: Pt, b: Pt): Pt => [a[0] + b[0], a[1] + b[1]];
const sub = (a: Pt, b: Pt): Pt => [a[0] - b[0], a[1] - b[1]];
const mul = (a: Pt, k: number): Pt => [a[0] * k, a[1] * k];
const lerpPt = (a: Pt, b: Pt, t: number): Pt => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
const unit = (a: Pt): Pt => {
  const l = Math.hypot(a[0], a[1]) || 1;
  return [a[0] / l, a[1] / l];
};

/** A smooth closed outline: quadratic curves through the midpoints of the points, so corners become soft curves. */
function smoothClosed(pts: Pt[]): string {
  const n = pts.length;
  const mid = (i: number): Pt => lerpPt(pts[i % n], pts[(i + 1) % n], 0.5);
  const start = mid(n - 1);
  let d = `M ${r1(start[0])} ${r1(start[1])}`;
  for (let i = 0; i < n; i++) {
    const m = mid(i);
    d += ` Q ${r1(pts[i][0])} ${r1(pts[i][1])} ${r1(m[0])} ${r1(m[1])}`;
  }
  return `${d} Z`;
}

/** A limb as a tube with a different radius at each point (thick thigh, slim ankle), with rounded ends. */
function tube(points: Pt[], radii: number[]): string {
  const left: Pt[] = [];
  const right: Pt[] = [];
  points.forEach((p, i) => {
    const prev = points[Math.max(0, i - 1)];
    const next = points[Math.min(points.length - 1, i + 1)];
    const t = unit(sub(next, prev));
    const n: Pt = [-t[1], t[0]];
    left.push(add(p, mul(n, radii[i])));
    right.push(sub(p, mul(n, radii[i])));
  });
  const first = unit(sub(points[1], points[0]));
  const last = unit(sub(points[points.length - 1], points[points.length - 2]));
  const tipEnd = add(points[points.length - 1], mul(last, radii[radii.length - 1] * 1.1));
  const tipStart = sub(points[0], mul(first, radii[0] * 1.1));
  return smoothClosed([...left, tipEnd, ...right.reverse(), tipStart]);
}

const along = (a: Pt, b: Pt, ts: number[]): Pt[] => ts.map((t) => lerpPt(a, b, t));

/** Flowing hair: a soft mass plus tapered ribbons that sweep away from the head and ripple a little. */
function hairPaths(head: Pt, angle: number, length: number, ripple: number) {
  const a = (angle * Math.PI) / 180;
  const dir: Pt = [Math.cos(a), Math.sin(a)];
  const perp: Pt = [-dir[1], dir[0]];
  const ribbons = [-3, -2, -1, 0, 1, 2, 3].map((k, i) => {
    const len = length * (1.05 - 0.09 * Math.abs(k) + (i % 2 ? 0.06 : -0.04));
    const base = add(add(head, mul(perp, k * 3.2)), mul(dir, 3));
    const tip = add(add(head, mul(dir, len)), mul(perp, k * 3.6 + Math.sin(ripple + k) * 3));
    const bend = 9 + Math.abs(k) * 2.2 + Math.sin(ripple * 1.3 + i) * 3;
    const ctrl = add(add(head, mul(dir, len * 0.55)), mul(perp, k * 4 + bend));
    const w = 10.5 - Math.abs(k) * 1.3;
    const n = unit([-(tip[1] - base[1]), tip[0] - base[0]]);
    const p1 = add(base, mul(n, w / 2));
    const p2 = sub(base, mul(n, w / 2));
    const c1 = add(ctrl, mul(n, w * 0.3));
    const c2 = sub(ctrl, mul(n, w * 0.3));
    return `M ${r1(p1[0])} ${r1(p1[1])} Q ${r1(c1[0])} ${r1(c1[1])} ${r1(tip[0])} ${r1(tip[1])} Q ${r1(c2[0])} ${r1(c2[1])} ${r1(p2[0])} ${r1(p2[1])} Z`;
  });
  return { mass: add(head, mul(dir, 5)), ribbons };
}

interface Props {
  fig: Figure;
  /** Loose, wide-leg trousers instead of fitted legs. */
  baggy?: boolean;
  /** Draw a chair under the figure (the seated version of the dance). */
  seated?: boolean;
  /** 'neon' is the coloured street-dance character; 'shadow' is the flat black silhouette. */
  look?: 'neon' | 'shadow';
  className?: string;
}

/**
 * An original shadow figure with a natural outline, drawn from a posed skeleton.
 * Flat colour on a transparent background: no image, no outline stroke, no fill behind it.
 */
export function HumanFigure({ fig: f, baggy = true, seated = false, look = 'neon', className = '' }: Props) {
  // torso: hips, waist, ribcage and shoulders as a smooth outline around the spine
  const up = unit(sub(f.spineTop, f.pelvis));
  const v: Pt = [-up[1], up[0]];
  const at = (t: number): Pt => lerpPt(f.pelvis, f.spineTop, t);
  const samples: [number, number][] = [
    [0.0, 14.5], [0.2, 16], [0.45, 11.5], [0.72, 14.5], [0.92, 16.5], [1.0, 17.5 * f.twist],
  ];
  const leftSide = samples.map(([t, w]) => sub(at(t), mul(v, w)));
  const rightSide = samples.map(([t, w]) => add(at(t), mul(v, w)));
  const torso = smoothClosed([
    ...leftSide.reverse(),
    add(sub(f.pelvis, mul(v, 12)), mul(up, -7)),
    add(add(f.pelvis, mul(v, 12)), mul(up, -7)),
    ...rightSide,
    add(f.spineTop, mul(up, 3)),
  ]);

  const leg = baggy
    ? { thigh: [12.5, 13.4, 9.4], shin: [9.4, 10.2, 8.6, 6.4] } // loose Zumba trousers that narrow at the ankle
    : { thigh: [10.5, 10.8, 6.6], shin: [6.4, 7.8, 5, 3.8] };

  const limbs = [
    // legs
    tube(along(f.hl, f.lk, [0, 0.3, 1]), leg.thigh),
    tube(along(f.lk, f.la, [0, 0.28, 0.72, 1]), leg.shin),
    tube(along(f.hr, f.rk, [0, 0.3, 1]), leg.thigh),
    tube(along(f.rk, f.ra, [0, 0.28, 0.72, 1]), leg.shin),
    // feet
    tube([f.la, lerpPt(f.la, f.ltoe, 0.55), f.ltoe], [4.4, 3.8, 2.6]),
    tube([f.ra, lerpPt(f.ra, f.rtoe, 0.55), f.rtoe], [4.4, 3.8, 2.6]),
    // arms
    tube(along(f.ls, f.le, [0, 0.35, 1]), [6.6, 6.0, 4.6]),
    tube(along(f.le, f.lw, [0, 0.3, 1]), [4.6, 4.8, 3.3]),
    tube(along(f.rs, f.re, [0, 0.35, 1]), [6.6, 6.0, 4.6]),
    tube(along(f.re, f.rw, [0, 0.3, 1]), [4.6, 4.8, 3.3]),
    // neck
    tube([f.spineTop, f.neckTop, f.head], [4.6, 3.9, 3.9]),
  ];

  const hairData = hairPaths(f.head, f.hair, f.hairLen, f.ripple);
  const handAngle = (wrist: Pt, hand: Pt) => (-Math.atan2(hand[0] - wrist[0], hand[1] - wrist[1]) * 180) / Math.PI;
  const lc: Pt = [(f.lw[0] + f.lhand[0]) / 2, (f.lw[1] + f.lhand[1]) / 2];
  const rc: Pt = [(f.rw[0] + f.rhand[0]) / 2, (f.rw[1] + f.rhand[1]) / 2];

  if (look === 'neon') {
    const widthAt = (t: number) => {
      for (let i = 0; i < samples.length - 1; i++) {
        const [t0, w0] = samples[i];
        const [t1, w1] = samples[i + 1];
        if (t <= t1) return w0 + ((w1 - w0) * (t - t0)) / (t1 - t0 || 1);
      }
      return samples[samples.length - 1][1];
    };
    /** A band of the torso between two heights along the spine, a little wider than the body if asked. */
    const band = (t0: number, t1: number, extra = 0) => {
      const ts = [t0, ...samples.map((s) => s[0]).filter((t) => t > t0 && t < t1), t1];
      const L = ts.map((t) => sub(at(t), mul(v, widthAt(t) + extra)));
      const R = ts.map((t) => add(at(t), mul(v, widthAt(t) + extra)));
      return smoothClosed([...R, ...L.reverse()]);
    };
    const hx = f.head[0];
    const hy = f.head[1];
    const sleeve = (a: Pt, b: Pt, c: Pt) => [tube(along(a, b, [0, 0.35, 1]), [7.4, 6.8, 5.6]), tube(along(b, c, [0, 0.3, 1]), [5.6, 5.8, 4.6])];
    const legsPants = [
      tube(along(f.hl, f.lk, [0, 0.3, 1]), leg.thigh),
      tube(along(f.lk, f.la, [0, 0.28, 0.72, 1]), leg.shin),
      tube(along(f.hr, f.rk, [0, 0.3, 1]), leg.thigh),
      tube(along(f.rk, f.ra, [0, 0.28, 0.72, 1]), leg.shin),
    ];
    return (
      <g className={`sil sil-neon ${className}`} stroke={EDGE} strokeWidth={0.7} strokeLinejoin="round">
        {seated && (
          <g className="chair" fill={COLOR} stroke="none">
            <rect x={r1(f.pelvis[0] - 42)} y={r1(f.pelvis[1] - 86)} width={84} height={92} rx={14} />
            <rect x={r1(f.pelvis[0] - 52)} y={r1(f.pelvis[1] + 2)} width={104} height={13} rx={6.5} />
            <rect x={r1(f.pelvis[0] - 44)} y={r1(f.pelvis[1] + 15)} width={8} height={r1(Math.max(10, GROUND - (f.pelvis[1] + 15)))} rx={4} />
            <rect x={r1(f.pelvis[0] + 36)} y={r1(f.pelvis[1] + 15)} width={8} height={r1(Math.max(10, GROUND - (f.pelvis[1] + 15)))} rx={4} />
          </g>
        )}
        {/* long dark hair, streaming behind */}
        <g fill={HAIR} stroke="none">
          <ellipse cx={r1(hairData.mass[0])} cy={r1(hairData.mass[1])} rx={12.5} ry={13.5} />
          {hairData.ribbons.map((d, i) => (
            <path key={i} d={d} />
          ))}
        </g>
        {/* joggers and sneakers */}
        <g fill={NEON}>
          {legsPants.map((d, i) => (
            <path key={i} d={d} />
          ))}
        </g>
        <g fill={NEON_DEEP}>
          <path d={tube(along(f.lk, f.la, [0.55, 0.8, 1]), [8.2, 7, 6.4])} />
          <path d={tube(along(f.rk, f.ra, [0.55, 0.8, 1]), [8.2, 7, 6.4])} />
        </g>
        <g fill={NEON_LIGHT}>
          <path d={tube([f.la, lerpPt(f.la, f.ltoe, 0.55), f.ltoe], [5.4, 4.8, 3.4])} />
          <path d={tube([f.ra, lerpPt(f.ra, f.rtoe, 0.55), f.rtoe], [5.4, 4.8, 3.4])} />
        </g>
        {/* the body: bare midriff, crop top, and the waistband of the joggers */}
        <path d={torso} fill={SKIN} />
        <path d={band(0, 0.22, 0.6)} fill={NEON} />
        <path d={band(0.58, 1.0)} fill={NEON_LIGHT} />
        <path d={tube([f.spineTop, f.neckTop, f.head], [4.6, 3.9, 3.9])} fill={SKIN_SHADE} />
        {/* sheer cropped jacket: sleeves with cuffs, and a loose body over the top */}
        <g fill={NEON} fillOpacity={0.82}>
          {sleeve(f.ls, f.le, f.lw).map((d, i) => (
            <path key={`l${i}`} d={d} />
          ))}
          {sleeve(f.rs, f.re, f.rw).map((d, i) => (
            <path key={`r${i}`} d={d} />
          ))}
        </g>
        <path d={band(0.46, 1.04, 4)} fill={NEON} fillOpacity={0.45} />
        <g fill={NEON_DEEP}>
          <path d={tube(along(f.le, f.lw, [0.78, 1]), [5.4, 5.2])} />
          <path d={tube(along(f.re, f.rw, [0.78, 1]), [5.4, 5.2])} />
        </g>
        {/* hands, head, face and cap */}
        <g fill={SKIN}>
          <ellipse cx={r1(lc[0])} cy={r1(lc[1])} rx={3.7} ry={6} transform={`rotate(${r1(handAngle(f.lw, f.lhand))} ${r1(lc[0])} ${r1(lc[1])})`} />
          <ellipse cx={r1(rc[0])} cy={r1(rc[1])} rx={3.7} ry={6} transform={`rotate(${r1(handAngle(f.rw, f.rhand))} ${r1(rc[0])} ${r1(rc[1])})`} />
        </g>
        <g transform={`rotate(${r1(f.headTilt)} ${r1(hx)} ${r1(hy)})`}>
          <ellipse cx={r1(hx)} cy={r1(hy)} rx={9.4} ry={11.8} fill={SKIN} />
          <path d={`M ${r1(hx - 5.6)} ${r1(hy + 1.2)} q 2.2 1.8 4.4 0 M ${r1(hx + 1.2)} ${r1(hy + 1.2)} q 2.2 1.8 4.4 0 M ${r1(hx - 2)} ${r1(hy + 6.4)} q 2 1 4 0`} fill="none" stroke={COLOR} strokeWidth={0.9} strokeLinecap="round" />
          <path d={`M ${r1(hx - 10.4)} ${r1(hy - 2)} C ${r1(hx - 10.4)} ${r1(hy - 16.5)} ${r1(hx + 10.4)} ${r1(hy - 16.5)} ${r1(hx + 10.4)} ${r1(hy - 2)} Z`} fill={NEON} />
          <rect x={r1(hx - 12.5)} y={r1(hy - 4)} width={25} height={4.4} rx={2.2} fill={NEON_LIGHT} />
        </g>
      </g>
    );
  }

  return (
    <g className={`sil ${className}`} fill={COLOR}>
      {seated && (
        <g className="chair">
          <rect x={r1(f.pelvis[0] - 42)} y={r1(f.pelvis[1] - 86)} width={84} height={92} rx={14} />
          <rect x={r1(f.pelvis[0] - 52)} y={r1(f.pelvis[1] + 2)} width={104} height={13} rx={6.5} />
          <rect x={r1(f.pelvis[0] - 44)} y={r1(f.pelvis[1] + 15)} width={8} height={r1(Math.max(10, GROUND - (f.pelvis[1] + 15)))} rx={4} />
          <rect x={r1(f.pelvis[0] + 36)} y={r1(f.pelvis[1] + 15)} width={8} height={r1(Math.max(10, GROUND - (f.pelvis[1] + 15)))} rx={4} />
        </g>
      )}
      <ellipse cx={r1(hairData.mass[0])} cy={r1(hairData.mass[1])} rx={12.5} ry={13.5} />
      {hairData.ribbons.map((d, i) => (
        <path key={i} d={d} />
      ))}
      <path d={torso} />
      {limbs.map((d, i) => (
        <path key={i} d={d} />
      ))}
      <ellipse cx={r1(lc[0])} cy={r1(lc[1])} rx={3.5} ry={5.8} transform={`rotate(${r1(handAngle(f.lw, f.lhand))} ${r1(lc[0])} ${r1(lc[1])})`} />
      <ellipse cx={r1(rc[0])} cy={r1(rc[1])} rx={3.5} ry={5.8} transform={`rotate(${r1(handAngle(f.rw, f.rhand))} ${r1(rc[0])} ${r1(rc[1])})`} />
      <ellipse cx={r1(f.head[0])} cy={r1(f.head[1])} rx={9.4} ry={11.8} transform={`rotate(${r1(f.headTilt)} ${r1(f.head[0])} ${r1(f.head[1])})`} />
    </g>
  );
}
