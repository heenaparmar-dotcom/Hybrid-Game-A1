import { useState } from 'react';
import { HumanFigure } from '../components/Silhouette';
import { LEVEL_COUNT } from '../data/levels';
import { SIL_DANCERS } from '../data/silhouettes';
import { figureAt, GROUND, keyframes, toHumanPose } from '../lib/human';
import { prefersReducedMotion, useBeat } from '../lib/useBeat';

interface Props {
  completed: number;
  onStart: () => void;
  onStartOver: () => void;
}

/** Each dancer's cycle of poses, worked out once. */
const FRAMES = SIL_DANCERS.map((d) => keyframes(toHumanPose(d.a), toHumanPose(d.b)));
const FLOOR_Y = 218;

/** The first screen: one big gesture (tap anywhere on the screen) into the game. */
export function TitleScreen({ completed, onStart, onStartOver }: Props) {
  const reduce = prefersReducedMotion();
  const beat = useBeat(96, !reduce, 30);
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
          {SIL_DANCERS.map((d, i) => (
            <g key={i} transform={`translate(${d.x} ${FLOOR_Y - GROUND * d.scale}) scale(${d.scale})`}>
              <g className="title-dancer" style={{ animationDelay: `${d.delay}s` }}>
                <HumanFigure fig={figureAt(FRAMES[i], reduce ? 0 : beat, d.phase, reduce ? 0 : d.hop)} baggy={d.baggy} />
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
        <span className="start-text">TAP TO START</span>
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
