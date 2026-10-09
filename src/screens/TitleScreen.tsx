import { useState } from 'react';
import { DancerFigure } from '../components/Dancer';
import { routineBeats, TRACKS } from '../data/tracks';
import { LEVEL_COUNT } from '../data/levels';
import { poseAtBeat } from '../lib/routine';
import { prefersReducedMotion, useBeat } from '../lib/useBeat';

interface Props {
  completed: number;
  onStart: () => void;
  onStartOver: () => void;
}

const TITLE_TRACK = TRACKS[1];
const TRAIL = [
  { lag: 0.34, c: 'var(--coral)', o: 0.6 },
  { lag: 0.68, c: 'var(--tangerine)', o: 0.42 },
  { lag: 1.02, c: 'var(--lime)', o: 0.28 },
  { lag: 1.36, c: 'var(--mint)', o: 0.16 },
];

/** The first screen: one big gesture (tap anywhere) into the game. */
export function TitleScreen({ completed, onStart, onStartOver }: Props) {
  const reduce = prefersReducedMotion();
  const beat = useBeat(TITLE_TRACK.bpm, !reduce);
  const total = routineBeats(TITLE_TRACK);
  const at = (b: number) => poseAtBeat(TITLE_TRACK, ((b % total) + total) % total, false);
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

  const rings = [0, 1, 2];

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
        {/* sound waves, radiating from the dancer's chest */}
        <g transform="translate(0 -40)">
          {rings.map((i) => (
            <circle key={i} className="wave" cx="0" cy="0" r={150} style={{ animationDelay: `${i * 0.9}s` }} />
          ))}
        </g>
        <ellipse className="title-floor" cx="0" cy="214" rx="210" ry="26" />
        <g transform="translate(0 100) scale(1.2)">
          {TRAIL.map((t, i) => (
            <g key={i} style={{ ['--c' as string]: t.c, opacity: t.o }} className="trail">
              <DancerFigure pose={at(beat - t.lag)} />
            </g>
          ))}
          <g className="hero-dancer">
            <DancerFigure pose={at(beat)} />
          </g>
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
        <span className="start-text">Tap anywhere to start</span>
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
