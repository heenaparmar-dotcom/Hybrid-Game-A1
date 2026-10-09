import { useState } from 'react';
import { Icon } from '../components/Icon';
import { EMOJI } from '../data/emoji';
import { nextLockedTheme } from '../data/themes';
import { SCORING, UNLOCK_STEP } from '../lib/constants';
import { roundWinner } from '../lib/session';
import type { Session } from '../lib/types';

interface Props {
  session: Session;
  successfulRounds: number;
  onNext: () => void;
  onReplay: () => void;
  onThemes: () => void;
  onHome: () => void;
  onChallenge: () => void;
}

const sec = (ms: number) => `${Math.round(ms / 1000)} s`;

export function ResultsScreen({ session, successfulRounds, onNext, onReplay, onThemes, onHome, onChallenge }: Props) {
  const [mood, setMood] = useState<string | null>(null);
  const winner = roundWinner(session);
  const next = nextLockedTheme(successfulRounds);
  const into = next ? successfulRounds - (next.unlockAt - UNLOCK_STEP) : UNLOCK_STEP;

  const totalPuzzle = session.turns.reduce((n, t) => n + t.listenMs + t.draft.puzzleMs, 0);
  const totalMove = session.turns.reduce((n, t) => n + t.moveMs, 0);
  const share = totalPuzzle + totalMove > 0 ? Math.round((totalMove / (totalPuzzle + totalMove)) * 100) : 0;

  return (
    <div className="screen">
      <h1>{session.phrase.custom ? 'Friend puzzle results' : `Round ${session.round} results`}</h1>

      <div className="card winner-card" data-testid="winner-banner" aria-live="polite">
        <Icon name="trophy" size={28} />
        {winner.kind === 'win' && <p className="winner" data-testid="winner">{session.names[winner.player]} wins the round!</p>}
        {winner.kind === 'tie' && <p className="winner" data-testid="winner">It is a tie. Both players win!</p>}
        {winner.kind === 'solo' && (
          <p className="winner" data-testid="winner">
            {session.newBest ? 'New personal best!' : 'Round complete!'} You scored {session.turns[0]?.total ?? 0}.
          </p>
        )}
        {winner.kind === 'solo' && (
          <p className="hint-text" data-testid="personal-best">Previous personal best: {session.previousBest ?? 0}. {session.newBest ? 'You beat it.' : 'Keep practising, you can beat it.'}</p>
        )}
      </div>

      <div className="score-grid">
        {session.turns.map((t) => (
          <article key={t.player} className="card score-card" data-testid={`score-card-${t.player}`}>
            <h2>{session.names[t.player]}</h2>
            <p className="phrase-small">"{t.phrase}"</p>
            <dl className="points">
              <div><dt>Puzzle ({t.draft.outcome})</dt><dd>{t.draft.puzzlePoints}</dd></div>
              <div><dt>Speed bonus</dt><dd>{t.draft.speedBonus}</dd></div>
              {t.draft.hintsUsed > 0 && <div className="muted"><dt>Hints used (already deducted, -{SCORING.hintPenalty} each)</dt><dd>{t.draft.hintsUsed}</dd></div>}
              <div><dt>Movement ({t.moveCompleted ? (t.seated ? 'seated' : 'standing') : 'not completed'})</dt><dd>{t.movePoints}</dd></div>
              <div className="total"><dt>Turn total</dt><dd data-testid={`turn-total-${t.player}`}>{t.total}</dd></div>
            </dl>
          </article>
        ))}
      </div>

      {session.mode === 'duo' && (
        <p className="match" data-testid="match-totals">Match totals: {session.names.map((n, i) => `${n} ${session.totals[i]}`).join('  |  ')}</p>
      )}

      <div className="card progress-card" data-testid="results-unlock">
        {session.unlockedNow && <p className="unlocked" role="status" data-testid="unlocked-banner">Theme unlocked: <strong>{session.unlockedNow}</strong>! Pick it on the theme screen.</p>}
        {next ? (
          <>
            <p><strong>Theme progress:</strong> {Math.max(0, into)} of {UNLOCK_STEP} song-and-dance turns toward {next.name}</p>
            <progress max={UNLOCK_STEP} value={Math.min(UNLOCK_STEP, Math.max(0, into))} aria-label={`Progress to ${next.name}`} />
          </>
        ) : (
          <p><strong>All themes unlocked.</strong></p>
        )}
        <p className="hint-text">Total song-and-dance turns on this device: {successfulRounds}.</p>
      </div>

      <div className="card timing" data-testid="timing-summary">
        <h2 className="h3">Measured time this round</h2>
        <p>Puzzle and listening screens: <strong>{sec(totalPuzzle)}</strong>. Movement: <strong>{sec(totalMove)}</strong>. Movement share of measured time: <strong>{share}%</strong>.</p>
        <p className="hint-text">Hand-overs and feedback pauses are not timed, and one round is not a playtest. The 50/50 target needs real sessions to check.</p>
      </div>

      <div className="card">
        <h2 className="h3">How do you feel? (optional)</h2>
        <div className="emoji-row" role="group" aria-label="Mood check-in">
          {EMOJI.filter((e) => e.kind === 'mood').map((e) => (
            <button key={e.label} type="button" className={`emoji-btn ${mood === e.label ? 'is-on' : ''}`} aria-pressed={mood === e.label} onClick={() => setMood(mood === e.label ? null : e.label)}>
              <span aria-hidden="true">{e.emoji}</span>
              <span>{e.label}</span>
            </button>
          ))}
        </div>
        <p className="hint-text" role="status">{mood ? `Thanks for checking in: ${mood}. This stays on your screen and is not saved.` : 'Just for you. Nothing is saved or sent.'}</p>
      </div>

      <div className="row wrap">
        <button className="btn btn-primary btn-lg" onClick={onNext} data-testid="next-round"><Icon name="right" /> Next round</button>
        <button className="btn" onClick={onReplay} data-testid="replay"><Icon name="restart" /> Replay</button>
        <button className="btn" onClick={onThemes} data-testid="change-theme">Change theme</button>
        <button className="btn" onClick={onChallenge} data-testid="challenge-friend"><Icon name="share" /> Challenge a friend</button>
        <button className="btn btn-ghost" onClick={onHome} data-testid="return-home"><Icon name="home" /> Return home</button>
      </div>
    </div>
  );
}
