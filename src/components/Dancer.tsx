import type { Pose } from '../lib/dancer';

const G = { thigh: 56, shin: 54, upper: 44, fore: 42, shoulderX: 27, shoulderY: -84, hipX: 15 };
const rad = (d: number) => (d * Math.PI) / 180;
const r1 = (n: number) => Math.round(n * 10) / 10;

interface Pt {
  x: number;
  y: number;
}

/** Walk a segment from a joint. `side` is -1 for screen-left limbs and +1 for screen-right limbs. */
function seg(from: Pt, angle: number, len: number, side: number): Pt {
  const a = rad(angle);
  return { x: from.x + side * Math.sin(a) * len, y: from.y + Math.cos(a) * len };
}

interface Props {
  pose: Pose;
  seated?: boolean;
  /** Extra class names, e.g. "ghost". */
  className?: string;
}

/**
 * The shadow dancer, drawn from joint angles as an SVG <g> centred on the hips.
 * An original shape built from lines and ellipses: no images, no external assets.
 */
export function DancerFigure({ pose, seated = false, className = '' }: Props) {
  const tw = pose.twist;

  const leg = (side: -1 | 1) => {
    const t = side === -1 ? pose.tL : pose.tR;
    const lift = side === -1 ? pose.liftL : pose.liftR;
    const hip = { x: side * G.hipX, y: 0 };
    const knee = seg(hip, t, G.thigh * (1 - 0.55 * lift), side);
    const foot = seg(knee, t * 0.4, G.shin * (1 - 0.18 * lift), side);
    return (
      <g key={`leg${side}`}>
        <line x1={hip.x} y1={hip.y} x2={r1(knee.x)} y2={r1(knee.y)} strokeWidth={21} />
        <line x1={r1(knee.x)} y1={r1(knee.y)} x2={r1(foot.x)} y2={r1(foot.y)} strokeWidth={16} />
        <ellipse cx={r1(foot.x + side * 5)} cy={r1(foot.y + 4)} rx={13} ry={6.5} />
      </g>
    );
  };

  const arm = (side: -1 | 1) => {
    const s = side === -1 ? pose.sL : pose.sR;
    const e = side === -1 ? pose.eL : pose.eR;
    const shoulder = { x: side * G.shoulderX * tw, y: G.shoulderY };
    const elbow = seg(shoulder, s, G.upper, side);
    const wrist = seg(elbow, s + e, G.fore, side);
    return (
      <g key={`arm${side}`}>
        {/* a pale edge keeps arms readable when they cross the body */}
        <g className="edge">
          <line x1={r1(shoulder.x)} y1={shoulder.y} x2={r1(elbow.x)} y2={r1(elbow.y)} strokeWidth={19} />
          <line x1={r1(elbow.x)} y1={r1(elbow.y)} x2={r1(wrist.x)} y2={r1(wrist.y)} strokeWidth={16} />
          <circle cx={r1(wrist.x)} cy={r1(wrist.y)} r={10} />
        </g>
        <line x1={r1(shoulder.x)} y1={shoulder.y} x2={r1(elbow.x)} y2={r1(elbow.y)} strokeWidth={15} />
        <line x1={r1(elbow.x)} y1={r1(elbow.y)} x2={r1(wrist.x)} y2={r1(wrist.y)} strokeWidth={12} />
        <circle cx={r1(wrist.x)} cy={r1(wrist.y)} r={7.5} />
      </g>
    );
  };

  return (
    <g className={`dancer ${className}`} transform={`translate(${r1(pose.x)} ${r1(pose.y)})`}>
      {seated && (
        <g className="chair">
          <rect x={-42} y={-86} width={84} height={92} rx={14} />
          <rect x={-52} y={2} width={104} height={13} rx={6.5} />
          <rect x={-44} y={15} width={8} height={90} rx={4} />
          <rect x={36} y={15} width={8} height={90} rx={4} />
        </g>
      )}
      {leg(-1)}
      {leg(1)}
      <g transform={`rotate(${r1(pose.lean)})`}>
        <path
          d={`M ${-27 * tw} -86 C ${-27 * tw} -70 ${-18 * tw} -56 ${-17 * tw} -36 C ${-17 * tw} -20 -21 -10 -19 3 L 19 3 C 21 -10 ${17 * tw} -20 ${17 * tw} -36 C ${18 * tw} -56 ${27 * tw} -70 ${27 * tw} -86 Z`}
          strokeWidth={13}
          strokeLinejoin="round"
        />
        <line x1={0} y1={-90} x2={0} y2={-104} strokeWidth={11} />
        {arm(-1)}
        {arm(1)}
        <g transform={`rotate(${r1(pose.head)} 0 -102)`}>
          <ellipse cx={0} cy={-121} rx={16.5} ry={19.5} />
        </g>
      </g>
    </g>
  );
}
