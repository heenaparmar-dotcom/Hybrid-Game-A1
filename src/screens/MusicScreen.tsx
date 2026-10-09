import { useEffect } from 'react';
import { AudioControls, AudioNotice, useMusicStatus } from '../components/AudioControls';
import { Icon } from '../components/Icon';
import type { ThemeId } from '../data/phrases';
import { sequenceFor } from '../data/moves';
import { themeById } from '../data/themes';
import { music } from '../lib/audio';
import { TIMING } from '../lib/constants';
import { useCountdown } from '../lib/useCountdown';

interface Props {
  phrase: string;
  custom: boolean;
  from?: string;
  themeId: ThemeId;
  volume: number;
  muted: boolean;
  paused: boolean;
  onVolume: (v: number) => void;
  onMuted: (m: boolean) => void;
  onDone: (listenMs: number) => void;
}

export function MusicScreen({ phrase, custom, from, themeId, volume, muted, paused, onVolume, onMuted, onDone }: Props) {
  const status = useMusicStatus();
  const theme = themeById(themeId);
  const moves = sequenceFor(themeId);
  // Counts only active (unpaused) time on this screen so the timing log stays honest.
  const clock = useCountdown(60 * 60 * 1000, !paused);
  const guideMs = TIMING.listenGuideSeconds * 1000;
  const playing = status === 'playing';

  useEffect(() => () => music.stop(), []);
  useEffect(() => {
    if (paused && music.getStatus() === 'playing') void music.pause();
    if (!paused && music.getStatus() === 'paused') void music.resume();
  }, [paused]);

  const toggle = () => {
    if (playing || status === 'paused') music.stop();
    else void music.start(themeId);
  };

  return (
    <div className="screen narrow">
      <h1>Listen up</h1>
      <div className="card lyric-card">
        <span className="chip">{custom ? (from ? `Puzzle from ${from}` : 'Custom puzzle') : 'Original demo line'}</span>
        <p className="lyric" data-testid="music-phrase">{phrase}</p>
        <p className="hint-text">Theme: {theme.name} at {theme.bpm} beats per minute. The track is generated live in your browser.</p>
      </div>

      <div className="card">
        <div className={`beat-visual ${playing ? 'is-playing' : ''}`} style={{ ['--beat' as string]: `${60 / theme.bpm}s` }} aria-hidden="true">
          <i /><i /><i /><i /><i /><i /><i />
        </div>
        <div className="row wrap center">
          <button className="btn btn-primary btn-lg" onClick={toggle} data-testid="play-track">
            <Icon name={playing ? 'pause' : 'play'} /> {playing ? 'Stop track' : 'Play track'}
          </button>
          <AudioControls volume={volume} muted={muted} onVolume={onVolume} onMuted={onMuted} />
        </div>
        <p className="hint-text center-text">Browsers only allow sound after you tap or click, so press Play track to start. Sound is optional: you can always continue.</p>
        <AudioNotice status={status} />
        <p className="sr-live" role="status">{playing ? 'Track playing' : ''}</p>
      </div>

      <div className="card">
        <h2 className="h3">Preview your moves</h2>
        <ol className="move-preview">
          {moves.map((m) => (
            <li key={m.id + m.name}><strong>{m.name}</strong></li>
          ))}
        </ol>
        <p className="hint-text">Get ready: clear some space, or pull up a chair. Seated versions are available on the next screen.</p>
        <progress max={guideMs} value={Math.min(guideMs, clock.exactElapsedMs())} aria-label="Suggested listening time" className="guide-progress" />
        <p className="hint-text">Suggested listening time: about {TIMING.listenGuideSeconds} seconds. Continue whenever you are ready.</p>
      </div>

      <div className="row">
        <button className="btn btn-primary btn-xl" onClick={() => onDone(clock.exactElapsedMs())} data-testid="to-dance">
          Continue to movement <Icon name="right" />
        </button>
      </div>
    </div>
  );
}
