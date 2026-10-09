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
}

export function AudioControls({ volume, muted, onVolume, onMuted }: Props) {
  return (
    <div className="audio-controls">
      <button type="button" className="btn btn-ghost btn-icon" onClick={() => onMuted(!muted)} aria-pressed={muted} aria-label={muted ? 'Unmute music' : 'Mute music'} data-testid="mute">
        <Icon name={muted ? 'mute' : 'volume'} />
      </button>
      <label className="slider">
        <span className="sr-only">Music volume</span>
        <input type="range" min={0} max={100} value={Math.round(volume * 100)} onChange={(e) => onVolume(Number(e.target.value) / 100)} aria-valuetext={`${Math.round(volume * 100)} percent`} data-testid="volume" />
      </label>
      <span className="audio-label" aria-hidden="true">{muted ? 'Muted' : `${Math.round(volume * 100)}%`}</span>
    </div>
  );
}

/** Plain-language explanation of the current audio state, with a fallback so the game can always continue. */
export function AudioNotice({ status }: { status: MusicStatus }) {
  if (status === 'unavailable') {
    return (
      <p className="notice notice-warn" role="status" data-testid="audio-fallback">
        Audio is not available in this browser or could not start. You can still play: follow the on-screen beat pulse and the movement cues, or play your own music from another app.
      </p>
    );
  }
  if (status === 'blocked') {
    return (
      <p className="notice notice-warn" role="status" data-testid="audio-blocked">
        Your browser blocked the sound. Tap the Play button again to allow it. You can continue without sound if you prefer.
      </p>
    );
  }
  return null;
}
