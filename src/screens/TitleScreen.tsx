import { useState } from 'react';
import { DancerFigure } from '../components/Dancer';
import { LEVEL_COUNT } from '../data/levels';
import { ease, lerpPose, REST, type Pose } from '../lib/dancer';
import { prefersReducedMotion, useBeat } from '../lib/useBeat';

interface Props {
  completed: number;
  onStart: () => void;
  onStartOver: () => void;
}

/**
 * Three original black dancers, each held between two poses. They are drawn with the same rig as the dance screen,
 * so there is no image file and no background: only the silhouettes sit on the title screen.
 */
const pose = (p: Partial<Pose>): Pose => ({ ...REST, ...p });
const DANCERS: { x: number; y: number; scale: number; delay: number; phase: number; a: Pose; b: Pose }[] = [
  {
    // left: one arm reaching up, a leg kicked out
    x: -140, y: 108, scale: 1.0, delay: 0.1, phase: 0,
    a: pose({ sL: 152, eL: -8, sR: 52, eR: -38, tL: 4, tR: 26, liftR: 0.35, lean: -7, x: -4, head: -5 }),
    b: pose({ sL: 122, eL: -10, sR: 76, eR: -30, tL: 6, tR: 16, liftR: 0.15, lean: -2, x: 0, head: -2 }),
  },
  {
    // centre: both arms up in a V, bouncing
    x: 0, y: 98, scale: 1.12, delay: 0.3, phase: 0.5,
    a: pose({ sL: 162, eL: 0, sR: 162, eR: 0, tL: 15, tR: 15, y: 0, head: 3 }),
    b: pose({ sL: 128, eL: -26, sR: 128, eR: -26, tL: 9, tR: 9, y: 7, head: -3 }),
  },
  {
    // right: hand on hip, other arm up, hips leaning
    x: 142, y: 110, scale: 0.98, delay: 0.5, phase: 1,
    a: pose({ sL: 58, eL: -85, sR: 142, eR: -18, tL: 5, tR: 17, liftR: 0.3, lean: 8, x: 6, head: 5 }),
    b: pose({ sL: 58, eL: -85, sR: 108, eR: -30, tL: 7, tR: 10, lean: 3, x: 2, head: 2 }),
  },
];

/** The first screen: one big gesture (tap anywhere on the screen) into the game. */
export function TitleScreen({ completed, onStart, onStartOver }: Props) {
  const reduce = prefersReducedMotion();
  const beat = useBeat(96, !reduce);
  // 0 to 1 and back every 4 beats, offset per dancer so they are not in lockstep.
  const swing = (phase: number) => ease((Math.sin((beat / 2 + phase) * Math.PI) + 1) / 2);
  const [leaving, setLeaving] = useState<{ x: number; y: number } | null>(null);
  const next = completed >= LEVEL_COUNT ? 1 : completed + 1;

  const begin = (x: number, y: number) => {
    if (leaving) return;
    if (reduce) {
      onStart();
      return;
    }
    setLeaving({ x, y });
    window.setTimeout(onStart, 620);
  };


  return (
    <div
      className={`title-stage ${leaving ? 'is-leaving' : ''}`}
      role="button"
      tabIndex={0}
      aria-label={`Start the game${completed > 0 && completed < LEVEL_COUNT ? ` at level ${next}` : ''}. Tap or click anywhere, or press Enter.`}
      data-testid="title-stage"
      onClick={(e) => begin(e.clientX, e.clientY)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const r = e.currentTarget.getBoundingClientRect();
          begin(r.left + r.width / 2, r.top + r.height / 2);
        }
      }}
    >
      <svg className="title-art" viewBox="-300 -260 600 520" aria-hidden="true" focusable="false">
        <ellipse className="title-floor" cx="0" cy="214" rx="230" ry="24" />
        <g className="title-dancers">
          {DANCERS.map((d, i) => (
            <g key={i} transform={`translate(${d.x} ${d.y}) scale(${d.scale})`}>
              <g className="title-dancer" style={{ animationDelay: `${d.delay}s` }}>
                <DancerFigure pose={lerpPose(d.a, d.b, reduce ? 0 : swing(d.phase))} />
              </g>
            </g>
          ))}
        </g>
      </svg>

      <div className="title-copy">
        <h1 className="wordmark-big" aria-label="Rhythm Rush">
          <span className="wm-line wm-a" aria-hidden="true">
            {'RHYTHM'.split('').map((ch, i) => (
              <span key={i} style={{ ['--i' as string]: i }}>{ch}</span>
            ))}
          </span>
          <span className="wm-line wm-b" aria-hidden="true">
            {'RUSH'.split('').map((ch, i) => (
              <span key={i} style={{ ['--i' as string]: i + 6 }}>{ch}</span>
            ))}
          </span>
        </h1>
        <p className="tagline">Solve the song. Catch the beat. Own the move.</p>
      </div>

      <div className="start-prompt">
        <span className="tap-dot" aria-hidden="true" />
        <span className="start-text">Tap to start</span>
        {completed > 0 && completed < LEVEL_COUNT && <span className="start-sub">Continue at level {next}</span>}
        {completed > 0 && (
          <button
            type="button"
            className="link-btn"
            data-testid="start-over"
            onClick={(e) => {
              e.stopPropagation();
              onStartOver();
            }}
            onKeyDown={(e) => e.stopPropagation()}
          >
            Start from level 1
          </button>
        )}
      </div>

      {leaving && <span className="curtain" style={{ ['--cx' as string]: `${leaving.x}px`, ['--cy' as string]: `${leaving.y}px` }} aria-hidden="true" />}
    </div>
  );
}
