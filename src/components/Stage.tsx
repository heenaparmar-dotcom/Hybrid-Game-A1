import { useEffect, useState } from 'react';
import { GROUND, type Figure } from '../lib/human';
import { HumanFigure } from './Silhouette';

interface Props {
  /** The posed dancer for this moment. */
  fig: Figure;
  seated: boolean;
  /** Short description of the move for screen readers. */
  label: string;
  /** Beat pulse 0..1 that makes the floor ring breathe in time. */
  pulse: number;
  /** Two players: the dancer stands in the middle with a spot on each side. */
  players?: 1 | 2;
}

function useNarrow(): boolean {
  const [narrow, setNarrow] = useState(() => typeof window !== 'undefined' && window.matchMedia('(max-width: 600px)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 600px)');
    const on = () => setNarrow(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return narrow;
}

/**
 * Stage: the shadow dancer on the left and "your spot" on the right, so the player dances alongside a partner.
 * Your spot shows a soft copy of the same moves to match; it is a guide, not tracking.
 */
export function Stage({ fig, seated, label, pulse, players = 1 }: Props) {
  const FLOOR = 292;
  // On phones, crop the empty edges so the dancers are bigger.
  const two = players === 2;
  const viewBox = useNarrow() && !two ? '95 0 590 360' : '0 0 760 360';
  const dancerX = two ? 380 : 245;
  const spots = two ? [130, 630] : [545];
  return (
    <svg className="stage-svg" viewBox={viewBox} role="img" aria-label={label}>
      <defs>
        <linearGradient id="beam" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff2e0" stopOpacity="0.28" />
          <stop offset="1" stopColor="#fff2e0" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="floor" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#ff5d4d" stopOpacity="0.55" />
          <stop offset="1" stopColor="#ff5d4d" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* spotlights */}
      <polygon points={`${dancerX - 5},0 ${dancerX - 95},300 ${dancerX + 95},300`} fill="url(#beam)" />
      {spots.map((x) => (
        <polygon key={x} points={`${x - 5},0 ${x - 95},300 ${x + 95},300`} fill="url(#beam)" opacity="0.6" />
      ))}

      {/* floor glow, breathing with the beat */}
      <ellipse cx={dancerX} cy={FLOOR} rx={150 + pulse * 18} ry={26 + pulse * 5} fill="url(#floor)" />
      {spots.map((x) => (
        <ellipse key={x} cx={x} cy={FLOOR} rx={two ? 96 : 130} ry={two ? 18 : 22} fill="none" stroke="#c9f35a" strokeWidth="2.5" strokeDasharray="7 7" opacity="0.8" />
      ))}
      <ellipse cx={dancerX} cy={FLOOR + 2} rx={64} ry={9} fill="#14061f" opacity="0.55" />

      {/* the shadow dancer */}
      <g transform={`translate(${dancerX} ${FLOOR - GROUND + 6})`} className="dancer-wrap">
        <HumanFigure fig={fig} seated={seated} />
      </g>

      {/* your spot (or the two players' spots) */}
      {spots.map((x) => (
        <g key={x} transform={`translate(${x} ${FLOOR - GROUND + 6})`} className="you-wrap" aria-hidden="true">
          <HumanFigure fig={fig} seated={seated} className="ghost" />
        </g>
      ))}
      <g aria-hidden="true">
        {spots.map((x, i) => (
          <text key={x} x={x} y={FLOOR + 36} textAnchor="middle" className="stage-label">{two ? `PLAYER ${i + 1}` : 'YOUR SPOT'}</text>
        ))}
        <text x={dancerX} y={FLOOR + 36} textAnchor="middle" className="stage-label dim">SHADOW DANCER</text>
      </g>
    </svg>
  );
}
