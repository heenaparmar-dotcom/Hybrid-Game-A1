import { useState } from 'react';
import { Icon } from '../components/Icon';
import { EMOJI } from '../data/emoji';
import { parseChallengeInput, type ChallengeData } from '../lib/challenge';

export type Incoming = { kind: 'none' } | { kind: 'ok'; data: ChallengeData } | { kind: 'error'; message: string };

interface Props {
  incoming: Incoming;
  onLoad: (data: ChallengeData) => void;
  onPlay: () => void;
  onCreate: () => void;
  onBack: () => void;
}

export function ChallengeScreen({ incoming, onLoad, onPlay, onCreate, onBack }: Props) {
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState('');

  const open = (e: React.FormEvent) => {
    e.preventDefault();
    const res = parseChallengeInput(input);
    if (!res.ok) return setError(res.error);
    setError('');
    onLoad(res.value);
  };

  const react = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(`Copied "${text}". Paste it into your chat to reply.`);
    } catch {
      setCopied(`Could not copy automatically. Type: ${text}`);
    }
  };

  return (
    <div className="screen narrow">
      <h1>Friend challenge</h1>

      {incoming.kind === 'ok' && (
        <div className="card challenge-in" data-testid="incoming-challenge">
          <h2>{incoming.data.from ? `${incoming.data.from} challenged you!` : 'A friend challenged you!'}</h2>
          <p>Unscramble their {incoming.data.phrase.split(' ').length}-word line, then move to the beat. No account needed.</p>
          <button className="btn btn-primary btn-xl" onClick={onPlay} data-testid="play-challenge"><Icon name="play" /> Play this challenge</button>
        </div>
      )}
      {incoming.kind === 'error' && (
        <p className="notice notice-error" role="alert" data-testid="challenge-error">{incoming.message}</p>
      )}

      <div className="card">
        <h2 className="h3">Send a challenge</h2>
        <p>Create your own puzzle, get a link, and send it to a friend through any app you like. RHYTHM RUSH never posts for you.</p>
        <button className="btn btn-primary" onClick={onCreate} data-testid="go-create"><Icon name="plus" /> Create a puzzle</button>
      </div>

      <form className="card form" onSubmit={open}>
        <h2 className="h3">Open a challenge link</h2>
        <p>Got a link from a friend? Clicking it opens the game directly. You can also paste it here.</p>
        <label className="field">
          <span className="field-label">Challenge link</span>
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Paste the link here" data-testid="paste-link" autoComplete="off" />
        </label>
        {error && <p className="notice notice-error" role="alert" data-testid="paste-error">{error}</p>}
        <button type="submit" className="btn" data-testid="open-link"><Icon name="link" /> Open challenge</button>
      </form>

      <div className="card">
        <h2 className="h3">Reply with a reaction</h2>
        <div className="emoji-row" role="group" aria-label="Reactions to copy">
          {EMOJI.filter((e) => e.kind === 'reaction').map((e) => (
            <button key={e.label} type="button" className="emoji-btn" onClick={() => react(`${e.emoji} ${e.label}`)}>
              <span aria-hidden="true">{e.emoji}</span>
              <span>{e.label}</span>
            </button>
          ))}
        </div>
        <p className="hint-text" role="status">{copied || 'Tap one to copy it, then paste it into your chat.'}</p>
      </div>

      <div className="card notice">
        <strong>About links:</strong> a link made on <code>localhost</code> only opens on the same computer. For friends to join from their own devices, host the built game at a public web address first. See the README.
      </div>

      <div className="row"><button className="btn btn-ghost" onClick={onBack}><Icon name="left" /> Back</button></div>
    </div>
  );
}
