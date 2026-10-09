import type { Pt, SilPose } from '../data/silhouettes';

const COLOR = '#08010f';
const r1 = (n: number) => Math.round(n * 10) / 10;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lerpPt = (a: Pt, b: Pt, t: number): Pt => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];

/** Ease between two poses (0 = A, 1 = B). */
export function lerpSilPose(a: SilPose, b: SilPose, t: number): SilPose {
  const out = { ...a } as SilPose;
  (Object.keys(a) as (keyof SilPose)[]).forEach((k) => {
    const av = a[k];
    const bv = b[k];
    (out as unknown as Record<string, unknown>)[k] = Array.isArray(av) ? lerpPt(av, bv as Pt, t) : lerp(av as number, bv as number, t);
  });
  return out;
}

/** A tapered limb: a line with round ends, drawn as two strokes so the thigh is thicker than the knee, and so on. */
function Limb({ from, to, w }: { from: Pt; to: Pt; w: number }) {
  return <line x1={r1(from[0])} y1={r1(from[1])} x2={r1(to[0])} y2={r1(to[1])} strokeWidth={w} strokeLinecap="round" stroke={COLOR} />;
}

/** Flowing hair: a soft mass plus tapered ribbons that sweep away from the head in gentle S-curves. */
function Hair({ head, angle, length }: { head: Pt; angle: number; length: number }) {
  const a = (angle * Math.PI) / 180;
  const dir: Pt = [Math.cos(a), Math.sin(a)];
  const perp: Pt = [-dir[1], dir[0]];
  const ribbons = [-3, -2, -1, 0, 1, 2, 3].map((k, i) => {
    const len = length * (1.05 - 0.09 * Math.abs(k) + (i % 2 ? 0.06 : -0.04));
    const base: Pt = [head[0] + perp[0] * k * 3.4 + dir[0] * 3, head[1] + perp[1] * k * 3.4 + dir[1] * 3];
    const tip: Pt = [head[0] + dir[0] * len + perp[0] * k * 3.6, head[1] + dir[1] * len + perp[1] * k * 3.6];
    // alternate the bend so neighbouring ribbons weave instead of lying parallel
    const bend = 9 + Math.abs(k) * 2.2; // all ribbons curve the same way, like hair streaming in the wind
    const ctrl: Pt = [head[0] + dir[0] * len * 0.55 + perp[0] * (k * 4 + bend), head[1] + dir[1] * len * 0.55 + perp[1] * (k * 4 + bend)];
    const w = 10.5 - Math.abs(k) * 1.3;
    const chord: Pt = [tip[0] - base[0], tip[1] - base[1]];
    const cl = Math.hypot(chord[0], chord[1]) || 1;
    const n: Pt = [-chord[1] / cl, chord[0] / cl];
    const p1: Pt = [base[0] + (n[0] * w) / 2, base[1] + (n[1] * w) / 2];
    const p2: Pt = [base[0] - (n[0] * w) / 2, base[1] - (n[1] * w) / 2];
    const c1: Pt = [ctrl[0] + n[0] * w * 0.3, ctrl[1] + n[1] * w * 0.3];
    const c2: Pt = [ctrl[0] - n[0] * w * 0.3, ctrl[1] - n[1] * w * 0.3];
    return <path key={i} d={`M ${r1(p1[0])} ${r1(p1[1])} Q ${r1(c1[0])} ${r1(c1[1])} ${r1(tip[0])} ${r1(tip[1])} Q ${r1(c2[0])} ${r1(c2[1])} ${r1(p2[0])} ${r1(p2[1])} Z`} fill={COLOR} />;
  });
  return (
    <g>
      <ellipse cx={r1(head[0] + dir[0] * 5)} cy={r1(head[1] + dir[1] * 5)} rx={13} ry={14} fill={COLOR} />
      {ribbons}
    </g>
  );
}

/** An original shadow figure. Everything is a vector shape in one flat colour on a transparent background. */
export function SilhouetteFigure({ pose: p, className = '' }: { pose: SilPose; className?: string }) {
  const lh: Pt = [p.pelvis[0] - 13, p.pelvis[1]];
  const rh: Pt = [p.pelvis[0] + 13, p.pelvis[1]];
  const mid: Pt = [(p.ls[0] + p.rs[0]) / 2, (p.ls[1] + p.rs[1]) / 2];
  // waist: a little narrower than shoulders and hips, so the torso has a shape
  const waistL = lerpPt(p.ls, lh, 0.6);
  const waistR = lerpPt(p.rs, rh, 0.6);
  const towards = (w: Pt, c: Pt, d: number): Pt => [w[0] + Math.sign(c[0] - w[0]) * d, w[1]];
  const wl = towards(waistL, mid, 8);
  const wr = towards(waistR, mid, 8);
  const torso = `M ${r1(p.ls[0])} ${r1(p.ls[1])} L ${r1(p.rs[0])} ${r1(p.rs[1])} Q ${r1(wr[0] + 1)} ${r1(wr[1] - 8)} ${r1(wr[0])} ${r1(wr[1])} Q ${r1(rh[0] + 5)} ${r1(rh[1] - 10)} ${r1(rh[0] + 3)} ${r1(rh[1] + 4)} L ${r1(lh[0] - 3)} ${r1(lh[1] + 4)} Q ${r1(lh[0] - 5)} ${r1(lh[1] - 10)} ${r1(wl[0])} ${r1(wl[1])} Q ${r1(wl[0] - 1)} ${r1(wl[1] - 8)} ${r1(p.ls[0])} ${r1(p.ls[1])} Z`;

  const foot = (ankle: Pt, knee: Pt): Pt => {
    const dir = Math.sign(ankle[0] - knee[0]) || (ankle[0] >= 0 ? 1 : -1);
    return [ankle[0] + dir * 14, ankle[1] + 3];
  };
  const lf = foot(p.la, p.lk);
  const rf = foot(p.ra, p.rk);

  return (
    <g className={`sil ${className}`}>
      {/* legs: thigh, shin, foot */}
      <Limb from={lh} to={p.lk} w={18} />
      <Limb from={p.lk} to={p.la} w={12.5} />
      <Limb from={p.la} to={lf} w={7} />
      <Limb from={rh} to={p.rk} w={18} />
      <Limb from={p.rk} to={p.ra} w={12.5} />
      <Limb from={p.ra} to={rf} w={7} />
      {/* torso, neck */}
      <path d={torso} fill={COLOR} stroke={COLOR} strokeWidth={6} strokeLinejoin="round" />
      <Limb from={mid} to={[p.head[0], p.head[1] + 8]} w={7.5} />
      {/* arms: upper arm, forearm, hand */}
      <Limb from={p.ls} to={p.le} w={9.5} />
      <Limb from={p.le} to={p.lw} w={7.5} />
      <circle cx={r1(p.lw[0])} cy={r1(p.lw[1])} r={4.6} fill={COLOR} />
      <Limb from={p.rs} to={p.re} w={9.5} />
      <Limb from={p.re} to={p.rw} w={7.5} />
      <circle cx={r1(p.rw[0])} cy={r1(p.rw[1])} r={4.6} fill={COLOR} />
      {/* head and hair */}
      <Hair head={p.head} angle={p.hair} length={p.hairLen} />
      <ellipse cx={r1(p.head[0])} cy={r1(p.head[1])} rx={10.2} ry={12.4} fill={COLOR} transform={`rotate(${r1(p.tilt)} ${r1(p.head[0])} ${r1(p.head[1])})`} />
    </g>
  );
}
