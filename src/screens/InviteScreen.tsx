import { Icon } from '../components/Icon';
import { totalSeconds, type Track } from '../data/tracks';

interface Props {
  track: Track;
  phrase: string;
  /** Shown after a film-song title puzzle: says plainly which music the dance uses. */
  songNote?: string;
  /** The puzzle timer ran out: the answer was revealed, and the dance is still on offer. */
  timedOut?: boolean;
  seated: boolean;
  onSeated: (v: boolean) => void;
  onAccept: () => void;
  onSkip: () => void;
  /** Offered in Find the Beat for one player: let the camera trace the moves and give points. */
  camera?: { on: boolean; onChange: (on: boolean) => void };
}

/** The dance invitation. Music starts only when the player presses the big button. */
export function InviteScreen({ track, phrase, songNote, timedOut, seated, onSeated, onAccept, onSkip, camera }: Props) {
  return (
    <section className="screen invite" aria-labelledby="invite-title">
      <p className="kicker">{timedOut ? 'Time ran out' : 'Song unlocked'}</p>
      <h1 id="invite-title" className="invite-title" data-testid="invite-title">{timedOut ? "Here's the song!" : 'You cracked the song!'}</h1>
      <p className="invite-lyric">"{phrase}"</p>
      <p className="sub">
        <strong>{track.title}</strong> · {track.style} · about {Math.round(totalSeconds(track))} seconds
      </p>

      {songNote && <p className="fine" data-testid="song-note">{songNote}</p>}
      <p className="invite-ask">Ready to dance to it?</p>
      <button type="button" className="btn btn-hero" onClick={onAccept} data-testid="accept-dance" autoFocus>
        <Icon name="play" size={26} /> YES, LET'S DANCE
      </button>
      <p className="fine">The music starts when you press the button. Clear a little space first: two big steps each way is plenty.</p>

      <label className="switch">
        <input type="checkbox" checked={seated} onChange={(e) => onSeated(e.target.checked)} data-testid="seated-toggle" />
        <span className="switch-track" aria-hidden="true" />
        <span className="switch-label"><Icon name="seat" size={18} /> Seated, low-impact version</span>
      </label>

      {camera && (
        <div className="camera-offer">
          <label className="switch">
            <input type="checkbox" checked={camera.on} onChange={(e) => camera.onChange(e.target.checked)} data-testid="camera-toggle" />
            <span className="switch-track" aria-hidden="true" />
            <span className="switch-label"><Icon name="check" size={18} /> Score my moves with the camera (optional)</span>
          </label>
          <p className="fine" data-testid="camera-privacy">
            The camera traces your arms and legs on this device and gives you points for copying the dancer. Nothing is recorded, saved or sent anywhere, and the camera turns off when the dance ends. Stand back so your whole body is in view. You can dance without it.
          </p>
        </div>
      )}

      <button type="button" className="link-btn" onClick={onSkip} data-testid="skip-dance">Not now, skip the dance</button>
    </section>
  );
}
