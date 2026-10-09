import { useEffect, useState } from 'react';
import { AudioControls, AudioNotice, useMusicStatus } from '../components/AudioControls';
import { DanceFigure } from '../components/DanceFigure';
import { Icon } from '../components/Icon';
import type { ThemeId } from '../data/phrases';
import { sequenceFor } from '../data/moves';
import { themeById } from '../data/themes';
import { music } from '../lib/audio';
import { SCORING } from '../lib/constants';
import { formatClock, useCountdown } from '../lib/useCountdown';

interface Props {
  themeId: ThemeId;
  moveSeconds: number;
  animatedGuide: boolean;
  volume: number;
  muted: boolean;
  paused: boolean;
  onVolume: (v: number) => void;
  onMuted: (m: boolean) => void;
  onDone: (result: { completed: boolean; moveMs: number; seated: boolean }) => void;
}

type Phase = 'ready' | 'running' | 'paused' | 'finished';

export function DanceScreen({ themeId, moveSeconds, animatedGuide, volume, muted, paused, onVolume, onMuted, onDone }: Props) {
  const moves = sequenceFor(themeId);
  const theme = themeById(themeId);
  const totalMs = moveSeconds * 1000;
  const perMove = totalMs / moves.length;
  const [phase, setPhase] = useState<Phase>('ready');
  const [seated, setSeated] = useState(false);
  const status = useMusicStatus();

  const cd = useCountdown(totalMs, phase === 'running' && !paused, () => {
    setPhase('finished');
    music.stop();
  });

  useEffect(() => () => music.stop(), []);
  // The Rule Book overlay pauses movement and music, then resumes them.
  useEffect(() => {
    if (paused && music.getStatus() === 'playing') void music.pause();
    if (!paused && phase === 'running' && music.getStatus() === 'paused') void music.resume();
  }, [paused, phase]);

  const idx = Math.min(moves.length - 1, Math.floor(cd.elapsedMs / perMove));
  const move = phase === 'ready' ? moves[0] : moves[idx];
  const next = moves[idx + 1];
  const running = phase === 'running' && !paused;
  const animate = animatedGuide && (phase === 'ready' || running);

  const start = () => {
    setPhase('running');
    void music.start(themeId);
  };
  const pause = () => {
    setPhase('paused');
    void music.pause();
  };
  const resume = () => {
    setPhase('running');
    void music.resume();
  };
  const leave = (completed: boolean) => {
    music.stop();
    onDone({ completed, moveMs: cd.exactElapsedMs(), seated });
  };

  return (
    <div className="screen dance">
      <h1 className="sr-only">Dance challenge</h1>
      <div className="dance-grid">
        <div className="card figure-card">
          <div className={`beat-ring ${animate ? 'is-on' : ''}`} style={{ ['--beat' as string]: `${60 / theme.bpm}s` }} aria-hidden="true" />
          <DanceFigure moveId={move.id} seated={seated} animate={animate} beat={60 / theme.bpm} label={`Animated silhouette showing: ${move.name}`} />
          {!animatedGuide && <p className="hint-text center-text">Animation is off (Settings). Follow the written cue.</p>}
        </div>

        <div className="dance-info">
          <div className={`timer ${phase === 'finished' ? 'is-done' : ''}`} role="timer" aria-label="Movement time left" data-testid="move-timer">
            <span className="timer-num">{formatClock(cd.remainingMs)}</span>
            <span className="timer-bar" aria-hidden="true"><span style={{ width: `${(cd.remainingMs / totalMs) * 100}%` }} /></span>
          </div>

          <div className="seg" role="radiogroup" aria-label="Movement style">
            <button type="button" role="radio" aria-checked={!seated} className={!seated ? 'is-on' : ''} onClick={() => setSeated(false)} data-testid="style-standing"><Icon name="stand" /> Standing</button>
            <button type="button" role="radio" aria-checked={seated} className={seated ? 'is-on' : ''} onClick={() => setSeated(true)} data-testid="style-seated"><Icon name="seat" /> Seated / low-impact</button>
          </div>
          <p className="hint-text">Both styles earn the same {SCORING.movePoints} points. Choose whatever feels good, and change any time.</p>

          {phase === 'finished' ? (
            <div className="card result" data-testid="dance-finished">
              <h2>Sequence finished!</h2>
              <p>The game cannot see you, so you decide. Did you complete the movement (in any style that worked for you)?</p>
            </div>
          ) : (
            <div className="card move-card" aria-live="polite">
              <span className="chip">{phase === 'ready' ? 'First move' : `Move ${idx + 1} of ${moves.length}`}</span>
              <h2 className="move-name" data-testid="move-name">{move.name}</h2>
              <p className="move-cue" data-testid="move-cue">{seated ? move.seatedCue : move.cue}</p>
              {phase !== 'ready' && next && <p className="hint-text">Up next: {next.name}</p>}
            </div>
          )}

          <ol className="seq" aria-label="Movement progress">
            {moves.map((m, i) => (
              <li key={i} className={phase === 'finished' || (phase !== 'ready' && i < idx) ? 'is-done' : phase !== 'ready' && i === idx ? 'is-current' : ''} aria-label={`${m.name}${i === idx && phase !== 'ready' && phase !== 'finished' ? ', current' : ''}`}>
                <span />
              </li>
            ))}
          </ol>

          {phase === 'ready' && (
            <div className="safety">
              <strong>Before you start:</strong> clear about two metres of floor (or take a stable chair), keep water nearby, and move gently. Stop if anything hurts.
            </div>
          )}
          <AudioNotice status={status} />

          <div className="row wrap">
            {phase === 'ready' && <button className="btn btn-primary btn-xl" onClick={start} data-testid="dance-start"><Icon name="play" /> Start moving</button>}
            {phase === 'running' && <button className="btn btn-primary btn-lg" onClick={pause} data-testid="dance-pause"><Icon name="pause" /> Pause</button>}
            {phase === 'paused' && <button className="btn btn-primary btn-lg" onClick={resume} data-testid="dance-resume"><Icon name="play" /> Resume</button>}
            {phase === 'finished' && (
              <>
                <button className="btn btn-primary btn-xl" onClick={() => leave(true)} data-testid="dance-complete"><Icon name="check" /> I completed it (+{SCORING.movePoints})</button>
                <button className="btn" onClick={() => leave(false)} data-testid="dance-skip-after">I could not finish: continue (+0)</button>
              </>
            )}
            {phase !== 'finished' && (
              <button className="btn btn-ghost" onClick={() => leave(false)} data-testid="dance-skip"><Icon name="skip" /> Skip movement (+0)</button>
            )}
          </div>
          {phase !== 'finished' && phase !== 'ready' && <p className="hint-text">The Complete button appears when the countdown ends.</p>}
          <AudioControls volume={volume} muted={muted} onVolume={onVolume} onMuted={onMuted} />
        </div>
      </div>
    </div>
  );
}
