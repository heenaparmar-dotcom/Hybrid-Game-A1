import { Icon } from '../components/Icon';
import { totalSeconds, type Track } from '../data/tracks';

interface Props {
  track: Track;
  phrase: string;
  seated: boolean;
  onSeated: (v: boolean) => void;
  onAccept: () => void;
  onSkip: () => void;
}

/** The dance invitation. Music starts only when the player presses the big button. */
export function InviteScreen({ track, phrase, seated, onSeated, onAccept, onSkip }: Props) {
  return (
    <section className="screen invite" aria-labelledby="invite-title">
      <p className="kicker">Song unlocked</p>
      <h1 id="invite-title" className="invite-title">You cracked the song!</h1>
      <p className="invite-lyric">"{phrase}"</p>
      <p className="sub">
        <strong>{track.title}</strong> · {track.style} · about {Math.round(totalSeconds(track))} seconds
      </p>

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

      <button type="button" className="link-btn" onClick={onSkip} data-testid="skip-dance">Not now, skip the dance</button>
    </section>
  );
}
