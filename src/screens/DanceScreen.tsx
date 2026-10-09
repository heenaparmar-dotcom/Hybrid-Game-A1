import { useEffect, useMemo, useRef, useState } from 'react';
import { AudioControls, AudioNotice, useMusicStatus } from '../components/AudioControls';
import { Icon } from '../components/Icon';
import { Stage } from '../components/Stage';
import { COUNT_IN_BEATS, DANCE_TOTAL_SECONDS, routineBeats, type Track } from '../data/tracks';
import { music } from '../lib/audio';
import { poseAtBeat, stateAt } from '../lib/routine';
import { createVideoPlayer, YT_STATE, type YtPlayer } from '../lib/youtube';

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
  /** An official YouTube video of the song to dance to. If it cannot play, the game's own music is used instead. */
  video?: { id: string; start?: number; credit: string };
  /** Title of the song, for the credit line under the video. */
  songTitle?: string;
}

/**
 * The hook-step challenge. The routine is driven by the music clock (or by a silent clock if sound is unavailable),
 * so the cues and the dancer stay on the beat. Nothing watches the player: they simply dance along.
 */
export function DanceScreen({ track, kicker, seated, externalPause, volume, muted, onVolume, onMuted, onFinish, onSkip, onRestart, video, songTitle }: Props) {
  const [mode, setMode] = useState<'pending' | 'audio' | 'silent' | 'video'>('pending');
  const [videoState, setVideoState] = useState<'loading' | 'playing' | 'paused' | 'failed' | 'ended'>(video ? 'loading' : 'ended');
  const playerRef = useRef<YtPlayer | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const modeRef = useRef(mode);
  modeRef.current = mode;
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

  // A song with an official video: play it through YouTube's own player. If it cannot play, use the game's own music.
  useEffect(() => {
    if (!video) return;
    let alive = true;
    let failed = false;
    const fail = () => {
      if (!alive || failed) return;
      failed = true;
      setVideoState('failed');
      try {
        playerRef.current?.destroy();
      } catch {
        /* already gone */
      }
      playerRef.current = null;
      void music.start(track.id).then((s) => {
        if (alive) setMode(s === 'playing' ? 'audio' : 'silent');
      });
    };
    const watchdog = window.setTimeout(() => {
      if (modeRef.current === 'pending') fail();
    }, 9000);
    if (!containerRef.current) return;
    createVideoPlayer(
      containerRef.current,
      {
        id: video.id,
        start: video.start,
        onState: (st) => {
          if (!alive || failed) return;
          if (st === YT_STATE.PLAYING) {
            window.clearTimeout(watchdog);
            setVideoState('playing');
            setMode((m) => (m === 'pending' ? 'video' : m));
          } else if (st === YT_STATE.PAUSED) setVideoState('paused');
        },
        onError: fail,
      },
      () => !alive,
    )
      .then((p) => {
        if (!alive) {
          p.destroy();
          return;
        }
        playerRef.current = p;
      })
      .catch(() => {
        if (alive) fail();
      });
    return () => {
      alive = false;
      window.clearTimeout(watchdog);
      try {
        playerRef.current?.destroy();
      } catch {
        /* already gone */
      }
      playerRef.current = null;
    };
    // the video and track are fixed for the life of this screen
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The music was started by the button press on the previous screen. Find out whether it is really playing.
  useEffect(() => {
    if (video) return;
    let alive = true;
    void music.ready().then((s) => {
      if (alive) setMode(s === 'playing' ? 'audio' : 'silent');
    });
    return () => {
      alive = false;
    };
    // the video is fixed for the life of this screen
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Pause or resume the video together with the dance, and keep its volume in step with the controls.
  useEffect(() => {
    if (mode !== 'video' || done) return;
    const p = playerRef.current;
    if (!p) return;
    if (paused) p.pauseVideo();
    else p.playVideo();
  }, [paused, mode, done]);
  useEffect(() => {
    const p = playerRef.current;
    if (mode !== 'video' || !p) return;
    p.setVolume(Math.round(volume * 100));
    if (muted) p.mute();
    else p.unMute();
  }, [mode, volume, muted]);

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
      if (mode === 'video') {
        // the video's own clock keeps the dancer, the cues and the countdown in time with the song
        seconds = Math.max(0, (playerRef.current?.getCurrentTime() ?? 0) - (video?.start ?? 0));
      } else if (mode === 'audio') {
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
        setVideoState('ended');
        try {
          playerRef.current?.stopVideo();
        } catch {
          /* already gone */
        }
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
  }, [mode, paused, done, track.bpm, total, video?.start]);

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

      {video && videoState !== 'failed' && (
        <div className="video-wrap" data-testid="video-wrap" data-video-state={videoState}>
          <div ref={containerRef} className="video-box" />
          <p className="fine center-text">Playing "{songTitle ?? 'the song'}" ({video.credit}) through YouTube. The song belongs to its owners.</p>
        </div>
      )}
      {video && videoState === 'failed' && (
        <p className="notice" role="status" data-testid="video-fallback">The video could not be played here (no internet, or YouTube blocked it), so the dance uses the game's own music instead.</p>
      )}
      <AudioNotice status={mode === 'silent' ? (status === 'blocked' ? 'blocked' : 'unavailable') : 'idle'} />
      {seated && <p className="fine center-text">Seated version: the dancer sits, and the cues use your upper body.</p>}
      <div className="row center">
        <button type="button" className="link-btn" onClick={onSkip} data-testid="skip-dance-now">Skip the rest</button>
      </div>
    </section>
  );
}
