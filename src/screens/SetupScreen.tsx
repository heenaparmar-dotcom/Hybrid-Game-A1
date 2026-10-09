import { useState } from 'react';
import { Icon } from '../components/Icon';
import type { Mode } from '../lib/types';

interface Props {
  mode: Mode;
  names: [string, string];
  onChangeMode: (m: Mode) => void;
  onContinue: (names: [string, string]) => void;
  onBack: () => void;
}

const MAX = 16;

export function SetupScreen({ mode, names, onChangeMode, onContinue, onBack }: Props) {
  const [a, setA] = useState(names[0]);
  const [b, setB] = useState(names[1]);
  const [error, setError] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const n1 = a.replace(/\s+/g, ' ').trim();
    const n2 = b.replace(/\s+/g, ' ').trim();
    if (!n1) return setError('Player 1 needs a name.');
    if (mode === 'duo') {
      if (!n2) return setError('Player 2 needs a name.');
      if (n1.toLowerCase() === n2.toLowerCase()) return setError('Please give the two players different names so scores stay clear.');
    }
    setError('');
    onContinue([n1, n2 || 'Player 2']);
  };

  return (
    <div className="screen narrow">
      <h1>Player setup</h1>
      <div className="seg" role="radiogroup" aria-label="Number of players">
        <button type="button" role="radio" aria-checked={mode === 'duo'} className={mode === 'duo' ? 'is-on' : ''} onClick={() => onChangeMode('duo')} data-testid="mode-duo">Two players</button>
        <button type="button" role="radio" aria-checked={mode === 'solo'} className={mode === 'solo' ? 'is-on' : ''} onClick={() => onChangeMode('solo')} data-testid="mode-solo">Solo practice</button>
      </div>
      <form className="card form" onSubmit={submit} noValidate>
        <label className="field">
          <span className="field-label">{mode === 'duo' ? 'Player 1 (goes first)' : 'Your name'}</span>
          <input value={a} maxLength={MAX} onChange={(e) => setA(e.target.value)} data-testid="name-1" autoComplete="off" />
        </label>
        {mode === 'duo' && (
          <label className="field">
            <span className="field-label">Player 2</span>
            <input value={b} maxLength={MAX} onChange={(e) => setB(e.target.value)} data-testid="name-2" autoComplete="off" />
          </label>
        )}
        <p className="hint-text">
          {mode === 'duo'
            ? 'Share one screen. Each round, Player 1 plays a full turn, then Player 2 does. The screen always shows whose turn it is.'
            : 'Play alone and try to beat your personal best. Your best score is saved on this device only.'}
        </p>
        <p className="hint-text">Nicknames are fine. Use a first name or nickname only; names stay in this browser.</p>
        {error && <p className="notice notice-error" role="alert" data-testid="setup-error">{error}</p>}
        <div className="row">
          <button type="button" className="btn btn-ghost" onClick={onBack}><Icon name="left" /> Back</button>
          <button type="submit" className="btn btn-primary" data-testid="setup-continue">Choose theme <Icon name="right" /></button>
        </div>
      </form>
    </div>
  );
}
