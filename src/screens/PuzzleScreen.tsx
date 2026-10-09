import { useMemo, useRef, useState } from 'react';
import { Icon } from '../components/Icon';
import { PuzzleBoard } from '../components/PuzzleBoard';
import { SCORING } from '../lib/constants';
import { scorePuzzle } from '../lib/scoring';
import { applyHint, countCorrect, moveTile, sameOrder, scramble, swapTiles, tokenise, type Token } from '../lib/scramble';
import type { PuzzleDraft } from '../lib/types';
import { formatClock, useCountdown } from '../lib/useCountdown';

interface Props {
  phrase: string;
  playerName: string;
  puzzleSeconds: number;
  paused: boolean;
  onDone: (draft: PuzzleDraft) => void;
}

/** Wrapper so "Restart puzzle" can fully reset the run by remounting it. */
export function PuzzleScreen(props: Props) {
  const [restarts, setRestarts] = useState(0);
  return <PuzzleRun key={restarts} {...props} restarts={restarts} onRestart={() => setRestarts((r) => r + 1)} />;
}

type Phase = 'ready' | 'playing' | 'solved' | 'timeout' | 'skipped';

function PuzzleRun({ phrase, playerName, puzzleSeconds, paused, onDone, restarts, onRestart }: Props & { restarts: number; onRestart: () => void }) {
  const solution = useMemo(() => tokenise(phrase), [phrase]);
  const totalMs = puzzleSeconds * 1000;
  const maxHints = Math.min(SCORING.maxHints, solution.length - 1);

  const [phase, setPhase] = useState<Phase>('ready');
  const [order, setOrder] = useState<Token[]>([]);
  const [locked, setLocked] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [hints, setHints] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [wrongFlash, setWrongFlash] = useState(0);
  const [draft, setDraft] = useState<PuzzleDraft | null>(null);
  const finished = useRef(false);

  const cd = useCountdown(totalMs, phase === 'playing' && !paused, () => finish('timeout'));

  function finish(outcome: PuzzleDraft['outcome'], hintsUsed = hints) {
    if (finished.current) return; // never score or end the same puzzle twice
    finished.current = true;
    const puzzleMs = cd.exactElapsedMs();
    const score = outcome === 'solved' ? scorePuzzle(Math.max(0, totalMs - puzzleMs), totalMs, hintsUsed) : { puzzlePoints: 0, speedBonus: 0, hintDeduction: 0 };
    const d: PuzzleDraft = { outcome, ...score, hintsUsed, puzzleMs, restarts };
    setDraft(d);
    setSelected(null);
    setPhase(outcome);
    if (outcome === 'solved') setFeedback('Correct! That is the line.');
    if (outcome === 'timeout') setFeedback("Time's up! Here is the line. You can still earn movement points.");
    if (outcome === 'skipped') setFeedback('Skipped. Here is the line. You can still earn movement points.');
  }

  const start = () => {
    setOrder(scramble(solution));
    setPhase('playing');
  };

  const submit = () => {
    if (phase !== 'playing' || finished.current) return;
    if (sameOrder(order, solution)) {
      finish('solved');
      return;
    }
    const right = countCorrect(order, solution);
    setAttempts((a) => a + 1);
    setWrongFlash((n) => n + 1);
    setFeedback(`Not quite. ${right} of ${solution.length} words are in the right place. Keep going!`);
  };

  const useHint = () => {
    if (phase !== 'playing' || hints >= maxHints) return;
    const res = applyHint(order, locked, solution);
    if (!res) {
      setFeedback('Everything is already in the right place. Press Submit!');
      return;
    }
    setOrder(res.order);
    setLocked(res.locked);
    setSelected(null);
    setHints((h) => h + 1);
    setFeedback(`Hint used: word ${res.locked} is now locked in place (-${SCORING.hintPenalty} points).`);
  };

  const reshuffle = () => {
    if (phase !== 'playing') return;
    setOrder((o) => scramble(o, Math.random, locked));
    setSelected(null);
  };

  const nudge = (dir: -1 | 1) => {
    if (selected === null) return;
    const to = selected + dir;
    if (to < locked || to >= order.length) return;
    setOrder((o) => moveTile(o, selected, to, locked));
    setSelected(to);
  };

  const speedNow =scorePuzzle(cd.remainingMs, totalMs, hints).speedBonus;
  const secsLeft = Math.ceil(cd.remainingMs / 1000);
  const lowTime = phase === 'playing' && secsLeft <= 10;
  const over = phase === 'solved' || phase === 'timeout' || phase === 'skipped';

  if (phase === 'ready') {
    return (
      <div className="screen narrow center">
        <h1>{playerName}, you're up</h1>
        <p className="lead">Unscramble the song line in {puzzleSeconds} seconds. The tiles appear when you press start.</p>
        <ul className="plain-list">
          <li>Drag tiles, or tap one tile then another to swap them.</li>
          <li>Keyboard: Enter picks a tile up, arrow keys move it.</li>
          <li>A hint costs {SCORING.hintPenalty} points. Wrong answers cost nothing.</li>
        </ul>
        <button className="btn btn-primary btn-xl" onClick={start} data-testid="start-puzzle">
          <Icon name="play" /> Start puzzle
        </button>
      </div>
    );
  }

  return (
    <div className="screen">
      <div className="puzzle-head">
        <div className={`timer ${lowTime ? 'is-low' : ''}`} role="timer" aria-label="Puzzle time left" data-testid="puzzle-timer">
          <span className="timer-num">{formatClock(cd.remainingMs)}</span>
          <span className="timer-bar" aria-hidden="true"><span style={{ width: `${(cd.remainingMs / totalMs) * 100}%` }} /></span>
        </div>
        <div className="stat-row">
          <div className="stat"><span>Hints</span><strong data-testid="hints-used">{hints}/{maxHints}</strong></div>
          <div className="stat"><span>Speed bonus now</span><strong>{over ? '-' : speedNow}</strong></div>
          <div className="stat"><span>Wrong tries</span><strong>{attempts}</strong></div>
        </div>
      </div>
      <p className="sr-live" role="status">{lowTime && secsLeft % 5 === 0 ? `${secsLeft} seconds left` : ''}</p>

      {over ? (
        <div className={`card result result-${phase}`} data-testid="puzzle-result">
          <h2>{phase === 'solved' ? 'Solved!' : phase === 'timeout' ? "Time's up" : 'Skipped'}</h2>
          <p className="phrase-reveal" data-testid="solved-phrase">{phrase}</p>
          <p role="status">{feedback}</p>
          {draft && (
            <dl className="points" data-testid="puzzle-points">
              <div><dt>Puzzle points</dt><dd>{draft.puzzlePoints}</dd></div>
              <div><dt>Speed bonus</dt><dd>{draft.speedBonus}</dd></div>
              {draft.hintsUsed > 0 && <div className="muted"><dt>Hints used</dt><dd>{draft.hintsUsed} (-{draft.hintDeduction})</dd></div>}
            </dl>
          )}
          <button className="btn btn-primary btn-xl" onClick={() => draft && onDone(draft)} data-testid="to-music">
            Continue to the music <Icon name="right" />
          </button>
        </div>
      ) : (
        <>
          <div key={wrongFlash} className={wrongFlash ? 'shake' : ''}>
            <PuzzleBoard
              order={order}
              locked={locked}
              selected={selected}
              disabled={paused}
              onSelect={setSelected}
              onMove={(f, t) => setOrder((o) => moveTile(o, f, t, locked))}
              onSwap={(a, b) => setOrder((o) => swapTiles(o, a, b, locked))}
            />
          </div>
          <p className={`feedback ${attempts && feedback.startsWith('Not quite') ? 'is-wrong' : ''}`} role="status" data-testid="puzzle-feedback">{feedback || 'Put the words in order to make the line.'}</p>
          <div className="row wrap">
            <button className="btn btn-primary" onClick={submit} disabled={paused} data-testid="submit-answer"><Icon name="check" /> Submit answer</button>
            <button className="btn" onClick={useHint} disabled={paused || hints >= maxHints} data-testid="hint"><Icon name="hint" /> Hint (-{SCORING.hintPenalty})</button>
            <button className="btn" onClick={() => nudge(-1)} disabled={selected === null || selected - 1 < locked} aria-label="Move picked tile left" data-testid="move-left"><Icon name="left" /> Left</button>
            <button className="btn" onClick={() => nudge(1)} disabled={selected === null || selected + 1 >= order.length} aria-label="Move picked tile right" data-testid="move-right">Right <Icon name="right" /></button>
          </div>
          <div className="row wrap secondary">
            <button className="btn btn-ghost" onClick={reshuffle} disabled={paused}><Icon name="shuffle" /> Reshuffle</button>
            <button className="btn btn-ghost" onClick={onRestart} data-testid="restart-puzzle"><Icon name="restart" /> Restart puzzle</button>
            <button className="btn btn-ghost" onClick={() => finish('skipped')} disabled={paused} data-testid="skip-puzzle"><Icon name="skip" /> Skip puzzle</button>
          </div>
        </>
      )}
    </div>
  );
}
