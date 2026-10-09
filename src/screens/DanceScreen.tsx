import { useEffect, useMemo, useRef, useState } from 'react';
import { AudioControls, AudioNotice, useMusicStatus } from '../components/AudioControls';
import { Icon } from '../components/Icon';
import { Stage } from '../components/Stage';
import { COUNT_IN_BEATS, DANCE_TOTAL_SECONDS, routineBeats, type Track } from '../data/tracks';
import { music } from '../lib/audio';
import { poseAtBeat, stateAt } from '../lib/routine';

interface Props {
  track: Track;
  kicker: string;
  seated: boolean;
  /** True while something else (like the Rule Book) is covering the game. */
  externalPause: boolean;
  volume: number;
  muted: boolean;
  onVolume: (v: number) => void;
  onMuted: (m: boolean) => void;
  onFinish: () => void;
  onSkip: () => void;
  onRestart: () => void;
}

/**
 * The hook-step challenge. The routine is driven by the music clock (or by a silent clock if sound is unavailable),
 * so the cues and the dancer stay on the beat. Nothing watches the player: they simply dance along.
 */
export function DanceScreen({ track, kicker, seated, externalPause, volume, muted, onVolume, onMuted, onFinish, onSkip, onRestart }: Props) {
  const [mode, setMode] = useState<'pending' | 'audio' | 'silent'>('pending');
  const [beat, setBeat] = useState(-COUNT_IN_BEATS);
  const [userPaused, setUserPaused] = useState(false);
  const [done, setDone] = useState(false);
  const status = useMusicStatus();
  const paused = userPaused || externalPause;
  const silent = useRef({ elapsed: 0, last: null as number | null });
  const finishRef = useRef(onFinish);
  useEffect(() => {
    finishRef.current = onFinish;
  });
  const total = routineBeats(track);

  // The music was started by the button press on the previous screen. Find out whether it is really playing.
  useEffect(() => {
    let alive = true;
    void music.ready().then((s) => {
      if (alive) setMode(s === 'playing' ? 'audio' : 'silent');
    });
    return () => {
      alive = false;
    };
  }, []);

  // Pause or resume the sound together with the dance.
  useEffect(() => {
    if (mode !== 'audio' || done) return;
    if (paused) void music.pause();
    else void music.resume();
  }, [paused, mode, done]);

  // The beat clock.
  useEffect(() => {
    if (mode === 'pending' || done) return;
    const s = silent.current;
    let raf = 0;
    if (mode === 'silent' && !paused) s.last = performance.now();
    const tick = () => {
      let seconds: number;
      if (mode === 'audio') {
        seconds = music.songTime() ?? 0;
      } else {
        const now = performance.now();
        if (s.last !== null) s.elapsed += now - s.last;
        s.last = paused ? null : now;
        seconds = s.elapsed / 1000;
      }
      const b = (seconds * track.bpm) / 60 - COUNT_IN_BEATS;
      setBeat(b);
      if (b >= total) {
        setDone(true);
        music.fadeOut(1);
        window.setTimeout(() => finishRef.current(), 900);
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      if (mode === 'silent' && s.last !== null) {
        s.elapsed += performance.now() - s.last;
        s.last = null;
      }
    };
  }, [mode, paused, done, track.bpm, total]);

  const st = useMemo(() => stateAt(track, beat, seated), [track, beat, seated]);
  const pose = useMemo(() => poseAtBeat(track, beat, seated), [track, beat, seated]);
  const pulse = Math.max(0, 1 - (((beat % 1) + 1) % 1) * 2);
  const countdown = st.phase === 'countin' ? st.countNumber : null;
  // seconds left of the 30-second dance (the count-in is part of it)
  const elapsedSeconds = ((beat + COUNT_IN_BEATS) * 60) / track.bpm;
  const secondsLeft = done ? 0 : Math.max(0, Math.min(DANCE_TOTAL_SECONDS, Math.ceil(DANCE_TOTAL_SECONDS - elapsedSeconds)));
  const go = st.phase === 'dance' && beat < 1.2;

  return (
    <section className="screen dance" aria-labelledby="dance-title">
      <header className="dance-head">
        <div>
          <p className="kicker">{kicker}</p>
          <h1 id="dance-title" className="dance-title">{track.title}</h1>
        </div>
        <div className="dance-timer" role="timer" aria-label="Dance time left" data-testid="dance-timer">
          <span className="dance-timer-num" data-testid="dance-timer-num">{secondsLeft}</span>
          <span className="dance-timer-unit">sec</span>
        </div>
        <div className="dance-tools">
          <AudioControls volume={volume} muted={muted} onVolume={onVolume} onMuted={onMuted} compact />
          <button type="button" className="btn btn-small" onClick={() => setUserPaused(true)} disabled={done || userPaused} data-testid="pause-dance">
            <Icon name="pause" size={18} /> Pause
          </button>
        </div>
      </header>

      <div className="stage-wrap">
        <Stage pose={pose} seated={seated} pulse={paused ? 0 : pulse} label={`Shadow dancer showing: ${st.move.name}`} />
        {countdown !== null && <div className="count-big" aria-hidden="true" key={countdown}>{countdown}</div>}
        {go && !paused && <div className="count-big go" aria-hidden="true">GO!</div>}
        {done && <div className="count-big go" aria-hidden="true" data-testid="dance-done-flash">Nice!</div>}
        {userPaused && (
          <div className="pause-panel" role="dialog" aria-label="Dance paused" data-testid="pause-panel">
            <h2>Paused</h2>
            <div className="row center">
              <button type="button" className="btn btn-primary" onClick={() => setUserPaused(false)} autoFocus data-testid="resume-dance"><Icon name="play" /> Resume</button>
              <button type="button" className="btn" onClick={onRestart} data-testid="restart-dance"><Icon name="restart" /> Restart dance</button>
              <button type="button" className="btn btn-ghost" onClick={onSkip} data-testid="end-dance">End dance</button>
            </div>
            <AudioControls volume={volume} muted={muted} onVolume={onVolume} onMuted={onMuted} />
          </div>
        )}
      </div>

      <div className="cue-panel" aria-live="off">
        <p className="cue-kicker" data-testid="cue-kicker">
          {st.phase === 'countin' ? 'Get ready' : `Move ${st.moveIndex + 1} of ${track.moves.length} · ${st.move.name} · Round ${st.round} of ${st.rounds}`}
        </p>
        <p className="cue" data-testid="cue" key={`${st.moveIndex}-${st.cueIndex}-${st.phase}`}>{st.cue}</p>
        <p className="next">{st.phase === 'dance' && st.next ? `Next: ${st.next.name}` : st.phase === 'countin' ? `First: ${st.move.name}` : ' '}</p>
      </div>

      <div className="beat-row">
        <div className="beat-dots" aria-hidden="true">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className={st.beatInBar === i && !paused && mode !== 'pending' ? 'on' : ''} />
          ))}
        </div>
        <div className="progress-line" role="progressbar" aria-label="Dance progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(st.progress * 100)}>
          <span style={{ width: `${st.progress * 100}%` }} />
        </div>
      </div>

      <AudioNotice status={mode === 'silent' ? (status === 'blocked' ? 'blocked' : 'unavailable') : 'idle'} />
      {seated && <p className="fine center-text">Seated version: the dancer sits, and the cues use your upper body.</p>}
      <div className="row center">
        <button type="button" className="link-btn" onClick={onSkip} data-testid="skip-dance-now">Skip the rest</button>
      </div>
    </section>
  );
}
