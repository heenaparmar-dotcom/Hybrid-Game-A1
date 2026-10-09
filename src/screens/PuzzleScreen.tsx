import { useEffect, useMemo, useRef, useState } from 'react';
import { Burst } from '../components/Burst';
import { Icon } from '../components/Icon';
import { PuzzleBoard } from '../components/PuzzleBoard';
import { applyHint, applyOrder, countCorrect, sameOrder, scramble, tokenise, type Token } from '../lib/scramble';

interface Props {
  kicker: string;
  prompt: string;
  phrase: string;
  /** A creator-chosen shuffle (from a friend's challenge). Otherwise the tiles are shuffled at random. */
  initialOrder?: number[];
  songTitle: string;
  /** Plain-English meaning of a non-English line, revealed once solved. */
  meaning?: string;
  /** For a Hindi film-song puzzle: a hint, and the song title shown once solved. */
  song?: { title: string; hint: string };
  /** 'visible' keeps the hint on screen while solving; 'button' hides it behind a small Hint button. */
  hintMode?: 'visible' | 'button';
  /** Seconds the player has to solve it. Leave out for an untimed puzzle (friend challenges, your own puzzles). */
  timeLimit?: number;
  /** Freeze the countdown (for example while the level splash or the Rule Book covers the puzzle). */
  paused?: boolean;
  /** Called once: a moment after a correct answer (timedOut: false), or when the player continues after time ran out (timedOut: true). */
  onSolved: (result: { timedOut: boolean }) => void;
}

const NUDGE_AFTER_MS = 14000;
const CELEBRATION_MS = 2300;

type Phase = 'play' | 'solved' | 'timeout';

/**
 * Level screen 1: put the lyric (or song title) back in order.
 * The order is checked automatically after every change. There is no submit button.
 * With a time limit there is exactly one active countdown; it stops on success, on timeout and on unmount.
 */
export function PuzzleScreen({ kicker, prompt, phrase, initialOrder, songTitle, meaning, song, hintMode = 'visible', timeLimit, paused = false, onSolved }: Props) {
  const solution = useMemo(() => tokenise(phrase), [phrase]);
  const [order, setOrder] = useState<Token[]>(() => (initialOrder ? applyOrder(solution, initialOrder) : scramble(solution)));
  const [locked, setLocked] = useState(0);
  const [phase, setPhase] = useState<Phase>('play');
  const [feedback, setFeedback] = useState('');
  const [live, setLive] = useState('');
  const [showNudge, setShowNudge] = useState(false);
  const [hintOpen, setHintOpen] = useState(false);
  const [round, setRound] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(timeLimit ?? 0);
  const phaseRef = useRef<Phase>('play'); // the single guard against a second ending (solved AND timed out)
  const remainingMs = useRef((timeLimit ?? 0) * 1000);
  const reported = useRef(false);
  const onSolvedRef = useRef(onSolved);
  useEffect(() => {
    onSolvedRef.current = onSolved;
  });

  const solved = phase === 'solved';
  const timedOut = phase === 'timeout';

  const end = (next: 'solved' | 'timeout') => {
    if (phaseRef.current !== 'play') return false;
    phaseRef.current = next;
    setPhase(next);
    return true;
  };

  // the countdown: one interval, only while the puzzle is live, visible and not paused
  useEffect(() => {
    if (!timeLimit || paused || phase !== 'play') return;
    let last = performance.now();
    const id = window.setInterval(() => {
      const now = performance.now();
      remainingMs.current -= now - last;
      last = now;
      setSecondsLeft(Math.max(0, Math.ceil(remainingMs.current / 1000)));
      if (remainingMs.current <= 0 && end('timeout')) {
        setOrder(solution); // reveal the correct sequence
        setLocked(0);
        setFeedback("Time's up! Here's the correct order.");
        setLive("Time's up! The correct order is now shown.");
      }
    }, 100);
    return () => window.clearInterval(id);
  }, [timeLimit, paused, phase, round, solution]);

  useEffect(() => {
    if (!timeLimit) {
      const id = window.setTimeout(() => setShowNudge(true), NUDGE_AFTER_MS);
      return () => window.clearTimeout(id);
    }
  }, [round, timeLimit]);

  // after a correct answer: celebrate for a moment, then move on (once)
  useEffect(() => {
    if (!solved) return;
    const id = window.setTimeout(() => {
      if (reported.current) return;
      reported.current = true;
      onSolvedRef.current({ timedOut: false });
    }, CELEBRATION_MS);
    return () => window.clearTimeout(id);
  }, [solved]);

  const check = (next: Token[]) => {
    if (phaseRef.current !== 'play') return;
    if (sameOrder(next, solution)) {
      if (!end('solved')) return;
      setFeedback('');
      setLive(song ? `You got it! The song is ${song.title}.` : `You got it! Song unlocked: ${songTitle}.`);
      return;
    }
    const right = countCorrect(next, solution);
    setFeedback(right === 0 ? 'Not yet. Try a different order.' : `${right} of ${solution.length} words are in the right place.`);
  };

  const onReorder = (next: Token[]) => {
    if (phaseRef.current !== 'play') return;
    setOrder(next);
    check(next);
  };

  const nudge = () => {
    const res = applyHint(order, locked, solution);
    if (!res) return;
    setOrder(res.order);
    setLocked(res.locked);
    setLive(`Locked word ${res.locked} in place.`);
    check(res.order);
  };

  /** Restart the puzzle: fresh shuffle and a fresh countdown. */
  const again = () => {
    if (phaseRef.current !== 'play') return;
    setOrder(scramble(solution));
    setLocked(0);
    setFeedback('');
    setShowNudge(false);
    remainingMs.current = (timeLimit ?? 0) * 1000;
    setSecondsLeft(timeLimit ?? 0);
    setRound((r) => r + 1);
    setLive('Shuffled the words again. The timer started over.');
  };

  const goOn = () => {
    if (reported.current) return;
    reported.current = true;
    onSolvedRef.current({ timedOut: true });
  };

  const showHint = song && (hintMode === 'visible' || hintOpen || solved || timedOut);
  const low = !!timeLimit && secondsLeft <= 3 && phase === 'play';

  return (
    <section className="screen puzzle" aria-labelledby="puzzle-title">
      <p className="kicker">{kicker}</p>
      <h1 id="puzzle-title" className="screen-title">Put the song back in order</h1>
      <p className="sub">{prompt}</p>

      {!!timeLimit && (
        <div className={`puzzle-timer ${low ? 'is-low' : ''} ${phase !== 'play' ? 'is-stopped' : ''}`} role="timer" aria-label="Time left to solve" data-testid="puzzle-timer">
          <span className="puzzle-timer-num" data-testid="puzzle-timer-num">{secondsLeft}</span>
          <span className="puzzle-timer-unit">sec</span>
          <span className="puzzle-timer-bar" aria-hidden="true"><span style={{ width: `${(secondsLeft / timeLimit) * 100}%` }} /></span>
        </div>
      )}

      {song && hintMode === 'button' && !solved && !timedOut && (
        <button type="button" className="btn btn-ghost btn-small hint-btn" onClick={() => setHintOpen((o) => !o)} aria-expanded={hintOpen} data-testid="puzzle-hint-button">
          <Icon name="hint" size={16} /> {hintOpen ? 'Hide hint' : 'Hint'}
        </button>
      )}
      {showHint && <p className="puzzle-hint" data-testid="puzzle-hint"><span>Hint</span> {song.hint}</p>}

      <div className={`board-wrap ${solved ? 'is-solved' : ''} ${timedOut ? 'is-revealed' : ''}`}>
        <PuzzleBoard order={order} locked={locked} disabled={timedOut} solved={solved} onReorder={onReorder} announce={setLive} />
        {solved && <Burst />}
      </div>

      <div className="puzzle-foot">
        {solved ? (
          <div className="unlocked" role="status" data-testid="song-unlocked">
            <p className="unlocked-big">You got it!</p>
            {song ? (
              <p className="unlocked-sub" data-testid="song-title">Song: <strong>{song.title}</strong> <span className="unlocked-meta">({song.hint})</span></p>
            ) : (
              <p className="unlocked-sub">Song unlocked: <strong>{songTitle}</strong></p>
            )}
            {meaning && <p className="unlocked-meaning">"{meaning}"</p>}
          </div>
        ) : timedOut ? (
          <div className="unlocked is-timeout" role="status" data-testid="puzzle-timeout">
            <p className="unlocked-big timeout-big">Time's up!</p>
            <p className="unlocked-sub">Here's the correct order.</p>
            {song && <p className="unlocked-sub" data-testid="song-title">Song: <strong>{song.title}</strong></p>}
            <button type="button" className="btn btn-primary" onClick={goOn} data-testid="timeout-continue">
              <Icon name="right" /> Continue to the dance
            </button>
          </div>
        ) : (
          <>
            <p className="feedback" data-testid="puzzle-feedback">{feedback || 'Drag the words into place. It checks itself.'}</p>
            <div className="row center">
              <button type="button" className="btn btn-ghost" onClick={again} data-testid="shuffle-again">
                <Icon name="shuffle" /> Shuffle again
              </button>
              {showNudge && (
                <button type="button" className="btn btn-ghost" onClick={nudge} data-testid="nudge">
                  <Icon name="hint" /> Need a nudge?
                </button>
              )}
            </div>
          </>
        )}
      </div>
      <p className="sr-only" role="status" aria-live="polite" data-testid="puzzle-live">{live}</p>
    </section>
  );
}
