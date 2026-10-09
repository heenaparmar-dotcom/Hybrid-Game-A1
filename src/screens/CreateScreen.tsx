import { useMemo, useState } from 'react';
import { Icon } from '../components/Icon';
import { SharePanel } from '../components/SharePanel';
import { buildChallengeUrl, validateNickname, validatePhrase } from '../lib/challenge';
import { PHRASE_LIMITS } from '../lib/constants';
import { scramble, tokenise } from '../lib/scramble';

interface Props {
  onTry: (phrase: string, from?: string) => void;
  onBack: () => void;
}

export function CreateScreen({ onTry, onBack }: Props) {
  const [text, setText] = useState('');
  const [nick, setNick] = useState('');
  const [seed, setSeed] = useState(0);
  const [url, setUrl] = useState('');

  const phrase = validatePhrase(text);
  const nickname = validateNickname(nick);
  const valid = phrase.ok && nickname.ok;
  const showError = text.trim().length > 0 && !phrase.ok;
  const clean = phrase.ok ? phrase.value : '';

  const preview = useMemo(() => {
    void seed;
    return clean ? scramble(tokenise(clean)) : [];
  }, [clean, seed]);

  const make = () => {
    if (!phrase.ok || !nickname.ok) return;
    setUrl(buildChallengeUrl({ phrase: phrase.value, from: nickname.value || undefined }));
  };

  // Any edit invalidates the previously created link so it can never be out of sync with the text.
  const edit = (setter: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setter(e.target.value);
    setUrl('');
  };

  return (
    <div className="screen narrow">
      <h1>Create a puzzle</h1>
      <p className="lead">Write a short, original line (or one you have permission to use). We scramble it, and your friend puts it back in order.</p>

      <div className="card form">
        <label className="field">
          <span className="field-label">Your phrase ({PHRASE_LIMITS.minWords} to {PHRASE_LIMITS.maxWords} words)</span>
          <input value={text} onChange={edit(setText)} maxLength={PHRASE_LIMITS.maxChars + 20} placeholder="e.g. Jump into the sunshine" data-testid="phrase-input" autoComplete="off" aria-invalid={showError} aria-describedby="phrase-help" />
          <span id="phrase-help" className="hint-text">{text.trim().length}/{PHRASE_LIMITS.maxChars} characters. Letters, numbers and simple punctuation only. Keep it kind.</span>
        </label>
        {showError && !phrase.ok && <p className="notice notice-error" role="alert" data-testid="phrase-error">{phrase.error}</p>}
        <label className="field">
          <span className="field-label">Your nickname (optional, shown to your friend)</span>
          <input value={nick} onChange={edit(setNick)} maxLength={PHRASE_LIMITS.maxNickname + 10} placeholder="First name or nickname only" data-testid="nickname-input" autoComplete="off" />
        </label>
        {!nickname.ok && <p className="notice notice-error" role="alert">{nickname.error}</p>}
        <p className="hint-text">Do not include personal details such as surnames, phone numbers or addresses. They would be visible inside the link.</p>
      </div>

      {valid && (
        <div className="card" data-testid="puzzle-preview">
          <h2 className="h3">Preview</h2>
          <ul className="tiles preview">
            {preview.map((t, i) => <li key={i}><span className="tile static">{t.text}</span></li>)}
          </ul>
          <div className="row wrap">
            <button className="btn btn-ghost" onClick={() => setSeed((s) => s + 1)}><Icon name="shuffle" /> Shuffle preview</button>
            <button className="btn" onClick={() => onTry(clean, nickname.ok ? nickname.value || undefined : undefined)} data-testid="try-puzzle"><Icon name="play" /> Try it myself</button>
            <button className="btn btn-primary" onClick={make} data-testid="make-link"><Icon name="link" /> Make challenge link</button>
          </div>
        </div>
      )}

      {url && (
        <div className="card" data-testid="created-link">
          <h2 className="h3">Challenge a friend</h2>
          <SharePanel url={url} from={nickname.ok ? nickname.value || undefined : undefined} />
        </div>
      )}

      <div className="row">
        <button className="btn btn-ghost" onClick={onBack}><Icon name="left" /> Back</button>
      </div>
    </div>
  );
}
