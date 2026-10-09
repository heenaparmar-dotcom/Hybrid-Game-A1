import { useEffect, useState } from 'react';
import type { Pose } from '../lib/dancer';
import { DancerFigure } from './Dancer';

interface Props {
  pose: Pose;
  seated: boolean;
  /** Short description of the move for screen readers. */
  label: string;
  /** Beat pulse 0..1 that makes the floor ring breathe in time. */
  pulse: number;
}

/**
 * Stage: the shadow dancer on the left and "your spot" on the right, so the player dances alongside a partner.
 * Your spot shows a soft copy of the pose to match; it is a guide, not tracking.
 */
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

export function Stage({ pose, seated, label, pulse }: Props) {
  const FLOOR = 292;
  // On phones, crop the empty edges so the dancers are bigger.
  const viewBox = useNarrow() ? '95 0 590 360' : '0 0 760 360';
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
      <polygon points="240,0 150,300 340,300" fill="url(#beam)" />
      <polygon points="540,0 450,300 640,300" fill="url(#beam)" opacity="0.6" />

      {/* floor glow, breathing with the beat */}
      <ellipse cx="245" cy={FLOOR} rx={150 + pulse * 10} ry={26 + pulse * 3} fill="url(#floor)" />
      <ellipse cx="545" cy={FLOOR} rx={130} ry={22} fill="none" stroke="#c9f35a" strokeWidth="2.5" strokeDasharray="7 7" opacity="0.8" />
      <ellipse cx="245" cy={FLOOR + 2} rx={64} ry={9} fill="#14061f" opacity="0.55" />

      {/* the shadow dancer */}
      <g transform={`translate(245 ${FLOOR - 118})`} className="dancer-wrap">
        <DancerFigure pose={pose} seated={seated} />
      </g>

      {/* your spot */}
      <g transform={`translate(545 ${FLOOR - 118})`} className="you-wrap" aria-hidden="true">
        <DancerFigure pose={pose} seated={seated} className="ghost" />
      </g>
      <g aria-hidden="true">
        <text x="545" y={FLOOR + 36} textAnchor="middle" className="stage-label">YOUR SPOT</text>
        <text x="245" y={FLOOR + 36} textAnchor="middle" className="stage-label dim">SHADOW DANCER</text>
      </g>
    </svg>
  );
}
