import { useEffect, useMemo, useState } from 'react';
import { Icon } from '../components/Icon';
import { SharePanel } from '../components/SharePanel';
import { TRACKS, totalSeconds, type TrackId } from '../data/tracks';
import { music } from '../lib/audio';
import { buildChallengeUrl, parseChallengeInput, PHRASE_LIMITS, validateNickname, validatePhrase, type ChallengeData } from '../lib/challenge';
import { orderOf, scramble, tokenise } from '../lib/scramble';
import { useMusicStatus } from '../components/AudioControls';

interface Props {
  onTry: (data: ChallengeData) => void;
  onOpenLink: (data: ChallengeData) => void;
}

/** Puzzle maker: write a line, review the scramble, pick the song, then share a challenge. */
export function CreateScreen({ onTry, onOpenLink }: Props) {
  const [text, setText] = useState('');
  const [nick, setNick] = useState('');
  const [trackId, setTrackId] = useState<TrackId>('sunrise');
  const [seed, setSeed] = useState(0);
  const [url, setUrl] = useState('');
  const [paste, setPaste] = useState('');
  const [pasteError, setPasteError] = useState('');
  const musicStatus = useMusicStatus();

  const phrase = validatePhrase(text);
  const nickname = validateNickname(nick);
  const valid = phrase.ok && nickname.ok;
  const clean = phrase.ok ? phrase.value : '';
  const from = nickname.ok ? nickname.value || undefined : undefined;
  const showError = text.trim().length > 0 && !phrase.ok;

  // The shuffle the creator reviews is the shuffle the friend gets.
  const tokens = useMemo(() => (clean ? tokenise(clean) : []), [clean]);
  const shuffled = useMemo(() => {
    void seed;
    return tokens.length ? scramble(tokens) : [];
  }, [tokens, seed]);

  useEffect(() => () => music.stop(), []);

  const data = (): ChallengeData => ({ phrase: clean, from, track: trackId, order: orderOf(tokens, shuffled) });

  const edit = (setter: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setter(e.target.value);
    setUrl('');
  };

  const create = () => {
    if (!valid) return;
    music.stop();
    setUrl(buildChallengeUrl(data()));
  };

  const previewSong = (id: TrackId) => {
    if (musicStatus === 'playing') {
      music.stop();
      return;
    }
    void music.start(id);
  };

  const open = (e: React.FormEvent) => {
    e.preventDefault();
    const res = parseChallengeInput(paste);
    if (!res.ok) return setPasteError(res.error);
    setPasteError('');
    onOpenLink(res.value);
  };

  return (
    <section className="screen create" aria-labelledby="create-title">
      <p className="kicker">Challenge a friend</p>
      <h1 id="create-title" className="screen-title">Make a song puzzle</h1>
      <p className="sub">Write a short line of your own. We scramble it, your friend puts it back in order, then you both dance.</p>

      <div className="panel">
        <label className="field">
          <span className="field-label">1. Your line ({PHRASE_LIMITS.minWords} to {PHRASE_LIMITS.maxWords} words)</span>
          <input value={text} onChange={edit(setText)} maxLength={PHRASE_LIMITS.maxChars + 20} placeholder="e.g. Jump into the sunshine" data-testid="phrase-input" autoComplete="off" aria-invalid={showError} aria-describedby="phrase-help" />
          <span id="phrase-help" className="fine">{text.trim().length}/{PHRASE_LIMITS.maxChars} characters. Use your own words, or words you have permission to use. Keep it kind. Hindi and other languages work too.</span>
        </label>
        {showError && !phrase.ok && <p className="notice notice-error" role="alert" data-testid="phrase-error">{phrase.error}</p>}

        {valid && (
          <div className="preview" data-testid="puzzle-preview">
            <p className="field-label">2. Preview the scramble</p>
            <ul className="preview-tiles">
              {shuffled.map((t) => <li key={t.id}><span className="tile tile-static">{t.text}</span></li>)}
            </ul>
            <button type="button" className="btn btn-small btn-ghost" onClick={() => { setSeed((s) => s + 1); setUrl(''); }} data-testid="reshuffle-preview">
              <Icon name="shuffle" size={16} /> Shuffle again
            </button>
          </div>
        )}

        <fieldset className="field tracks">
          <legend className="field-label">{valid ? '3.' : '2.'} Pick the song they will dance to</legend>
          <div className="track-grid" role="radiogroup" aria-label="Song">
            {TRACKS.map((t) => (
              <div key={t.id} className={`track-card ${trackId === t.id ? 'is-on' : ''}`}>
                <button type="button" role="radio" aria-checked={trackId === t.id} className="track-pick" onClick={() => { setTrackId(t.id); setUrl(''); }} data-testid={`track-${t.id}`}>
                  <span className="track-title">{t.title}</span>
                  <span className="track-meta">{t.language} · {t.style}</span>
                  <span className="track-meta">About {Math.round(totalSeconds(t))} seconds of dancing</span>
                </button>
                <button type="button" className="icon-btn" onClick={() => { setTrackId(t.id); previewSong(t.id); }} aria-label={`${musicStatus === 'playing' && trackId === t.id ? 'Stop' : 'Preview'} ${t.title}`} data-testid={`preview-${t.id}`}>
                  <Icon name={musicStatus === 'playing' && trackId === t.id ? 'pause' : 'play'} />
                </button>
              </div>
            ))}
          </div>
        </fieldset>

        <label className="field">
          <span className="field-label">Your nickname (optional, your friend sees it)</span>
          <input value={nick} onChange={edit(setNick)} maxLength={PHRASE_LIMITS.maxNickname + 10} placeholder="A first name or nickname only" data-testid="nickname-input" autoComplete="off" />
        </label>
        {!nickname.ok && <p className="notice notice-error" role="alert">{nickname.error}</p>}
        <p className="fine">Anything you type is stored inside the link, so leave out surnames, phone numbers and addresses.</p>

        <div className="row">
          <button type="button" className="btn btn-primary" disabled={!valid} onClick={create} data-testid="make-link"><Icon name="link" /> Create challenge</button>
          <button type="button" className="btn" disabled={!valid} onClick={() => { music.stop(); onTry(data()); }} data-testid="try-puzzle"><Icon name="play" /> Try it first</button>
        </div>
      </div>

      {url && (
        <div className="panel" data-testid="created-link">
          <h2 className="panel-title">Send it to a friend</h2>
          <SharePanel url={url} from={from} />
        </div>
      )}

      <form className="panel" onSubmit={open}>
        <h2 className="panel-title">Got a friend's link?</h2>
        <label className="field">
          <span className="field-label">Paste it here to open their puzzle</span>
          <input value={paste} onChange={(e) => setPaste(e.target.value)} placeholder="Paste the link" data-testid="paste-link" autoComplete="off" />
        </label>
        {pasteError && <p className="notice notice-error" role="alert" data-testid="paste-error">{pasteError}</p>}
        <button type="submit" className="btn" data-testid="open-link"><Icon name="link" /> Open puzzle</button>
      </form>
    </section>
  );
}
