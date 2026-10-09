import { Icon } from '../components/Icon';
import type { ThemeId } from '../data/phrases';
import { THEMES, nextLockedTheme } from '../data/themes';
import { UNLOCK_STEP } from '../lib/constants';

interface Props {
  successfulRounds: number;
  selected: ThemeId;
  onSelect: (id: ThemeId) => void;
  onStart: () => void;
  onBack: () => void;
  /** Label for the confirm button, e.g. when the theme was reached from a friend challenge. */
  startLabel?: string;
}

export function ThemeScreen({ successfulRounds, selected, onSelect, onStart, onBack, startLabel = 'Start round' }: Props) {
  const next = nextLockedTheme(successfulRounds);
  const into = next ? successfulRounds - (next.unlockAt - UNLOCK_STEP) : UNLOCK_STEP;
  return (
    <div className="screen">
      <h1>Choose a theme</h1>
      <p className="lead">Each theme has its own original song lines, music and move order. Win rounds to unlock more.</p>
      <div className="theme-grid" role="radiogroup" aria-label="Themes">
        {THEMES.map((t) => {
          const locked = successfulRounds < t.unlockAt;
          return (
            <button
              key={t.id}
              type="button"
              role="radio"
              aria-checked={selected === t.id}
              disabled={locked}
              className={`theme-card theme-${t.id} ${selected === t.id ? 'is-on' : ''} ${locked ? 'is-locked' : ''}`}
              onClick={() => onSelect(t.id)}
              data-testid={`theme-${t.id}`}
            >
              <span className="theme-name">{t.name}{locked && <Icon name="lock" size={18} />}</span>
              <span className="theme-blurb">{t.blurb}</span>
              <span className="theme-meta">{t.bpm} beats per minute</span>
              <span className="theme-state">{locked ? `Locked: unlocks after ${t.unlockAt} song-and-dance turns` : 'Unlocked'}</span>
            </button>
          );
        })}
      </div>
      <div className="card progress-card" data-testid="unlock-progress">
        {next ? (
          <>
            <p><strong>Next unlock:</strong> {next.name}</p>
            <progress max={UNLOCK_STEP} value={Math.min(UNLOCK_STEP, Math.max(0, into))} aria-label={`Progress to ${next.name}`} />
            <p className="hint-text">{Math.max(0, into)} of {UNLOCK_STEP} song-and-dance turns. A song-and-dance turn means you solved the puzzle and completed the movement.</p>
          </>
        ) : (
          <p><strong>All themes unlocked.</strong> Nice work!</p>
        )}
      </div>
      <div className="row">
        <button className="btn btn-ghost" onClick={onBack}><Icon name="left" /> Back</button>
        <button className="btn btn-primary" onClick={onStart} data-testid="theme-start">{startLabel} <Icon name="right" /></button>
      </div>
    </div>
  );
}
