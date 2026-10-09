import { useSyncExternalStore } from 'react';
import { music, type MusicStatus } from '../lib/audio';
import { Icon } from './Icon';

export function useMusicStatus(): MusicStatus {
  return useSyncExternalStore(music.subscribe, music.getStatus);
}

interface Props {
  volume: number;
  muted: boolean;
  onVolume: (v: number) => void;
  onMuted: (m: boolean) => void;
  /** Hide the slider and show only the mute button. */
  compact?: boolean;
}

export function AudioControls({ volume, muted, onVolume, onMuted, compact }: Props) {
  return (
    <div className="audio-controls">
      <button type="button" className="icon-btn" onClick={() => onMuted(!muted)} aria-pressed={muted} aria-label={muted ? 'Unmute music' : 'Mute music'} data-testid="mute">
        <Icon name={muted ? 'mute' : 'volume'} />
      </button>
      {!compact && (
        <label className="slider">
          <span className="sr-only">Music volume</span>
          <input type="range" min={0} max={100} value={Math.round(volume * 100)} onChange={(e) => onVolume(Number(e.target.value) / 100)} aria-valuetext={`${Math.round(volume * 100)} percent`} data-testid="volume" />
        </label>
      )}
    </div>
  );
}

/** Plain-language explanation when sound cannot play, so the game can always continue. */
export function AudioNotice({ status }: { status: MusicStatus }) {
  if (status === 'unavailable') {
    return (
      <p className="notice" role="status" data-testid="audio-fallback">
        Sound is not available in this browser, so the dance runs in silence. Follow the dancer and the beat dots, or play your own music nearby.
      </p>
    );
  }
  if (status === 'blocked') {
    return (
      <p className="notice" role="status" data-testid="audio-blocked">
        Your browser blocked the sound, so the dance runs in silence. The beat dots still keep time.
      </p>
    );
  }
  return null;
}
