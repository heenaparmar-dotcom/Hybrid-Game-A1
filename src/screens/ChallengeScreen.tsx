import { Icon } from '../components/Icon';
import { trackById, totalSeconds } from '../data/tracks';
import type { ChallengeData } from '../lib/challenge';

export type Incoming = { kind: 'none' } | { kind: 'ok'; data: ChallengeData } | { kind: 'error'; message: string };

interface Props {
  incoming: Incoming;
  onAccept: () => void;
  onPlayLevels: () => void;
  onMake: () => void;
}

/** What a friend sees when they open a challenge link. */
export function ChallengeScreen({ incoming, onAccept, onPlayLevels, onMake }: Props) {
  if (incoming.kind === 'ok') {
    const { data } = incoming;
    const track = trackById(data.track ?? 'sunrise');
    const words = data.phrase.split(' ').length;
    return (
      <section className="screen invite" aria-labelledby="ch-title" data-testid="incoming-challenge">
        <p className="kicker">A friend's puzzle</p>
        <h1 id="ch-title" className="invite-title">{data.from ? `${data.from} challenged you!` : 'A friend challenged you!'}</h1>
        <p className="sub">
          They scrambled a {words}-word song line for you. Put it back in order, then dance to <strong>{track.title}</strong> for about {Math.round(totalSeconds(track))} seconds.
        </p>
        <p className="fine">A quick movement break, together. No account needed, and nothing to compete about.</p>
        <button type="button" className="btn btn-hero" onClick={onAccept} data-testid="accept-challenge" autoFocus><Icon name="play" size={26} /> Accept the challenge</button>
        <button type="button" className="link-btn" onClick={onPlayLevels}>Play the levels instead</button>
      </section>
    );
  }

  return (
    <section className="screen invite" aria-labelledby="ch-title">
      <p className="kicker">Challenge link</p>
      <h1 id="ch-title" className="invite-title">That link did not work</h1>
      <p className="notice notice-error" role="alert" data-testid="challenge-error">
        {incoming.kind === 'error' ? incoming.message : 'There is no challenge here.'}
      </p>
      <p className="sub">Ask your friend to send it again, or start your own game.</p>
      <div className="row center">
        <button type="button" className="btn btn-hero" onClick={onPlayLevels} data-testid="play-instead"><Icon name="play" size={24} /> Play the levels</button>
        <button type="button" className="btn" onClick={onMake}><Icon name="plus" /> Make a puzzle</button>
      </div>
    </section>
  );
}
