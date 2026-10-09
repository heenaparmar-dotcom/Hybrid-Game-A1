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
  /** Called a moment after the puzzle is solved, once the celebration has played. */
  onSolved: () => void;
}

const NUDGE_AFTER_MS = 14000;
const CELEBRATION_MS = 2300;

/**
 * Level screen 1: put the lyric back in order.
 * The order is checked automatically after every change. There is no submit button.
 */
export function PuzzleScreen({ kicker, prompt, phrase, initialOrder, songTitle, meaning, onSolved }: Props) {
  const solution = useMemo(() => tokenise(phrase), [phrase]);
  const [order, setOrder] = useState<Token[]>(() => (initialOrder ? applyOrder(solution, initialOrder) : scramble(solution)));
  const [locked, setLocked] = useState(0);
  const [solved, setSolved] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [live, setLive] = useState('');
  const [showNudge, setShowNudge] = useState(false);
  const [round, setRound] = useState(0);
  const solvedRef = useRef(false);
  const onSolvedRef = useRef(onSolved);
  useEffect(() => {
    onSolvedRef.current = onSolved;
  });

  useEffect(() => {
    const id = window.setTimeout(() => setShowNudge(true), NUDGE_AFTER_MS);
    return () => window.clearTimeout(id);
  }, [round]);

  useEffect(() => {
    if (!solved) return;
    const id = window.setTimeout(() => onSolvedRef.current(), CELEBRATION_MS);
    return () => window.clearTimeout(id);
  }, [solved]);

  const check = (next: Token[]) => {
    if (solvedRef.current) return;
    if (sameOrder(next, solution)) {
      solvedRef.current = true;
      setSolved(true);
      setFeedback('');
      setLive(`You got it! Song unlocked: ${songTitle}.`);
      return;
    }
    const right = countCorrect(next, solution);
    setFeedback(right === 0 ? 'Not yet. Try a different order.' : `${right} of ${solution.length} words are in the right place.`);
  };

  const onReorder = (next: Token[]) => {
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

  const again = () => {
    setOrder(scramble(solution));
    setLocked(0);
    setFeedback('');
    setShowNudge(false);
    setRound((r) => r + 1);
    setLive('Shuffled the words again.');
  };

  return (
    <section className="screen puzzle" aria-labelledby="puzzle-title">
      <p className="kicker">{kicker}</p>
      <h1 id="puzzle-title" className="screen-title">Put the song back in order</h1>
      <p className="sub">{prompt}</p>

      <div className={`board-wrap ${solved ? 'is-solved' : ''}`}>
        <PuzzleBoard order={order} locked={locked} disabled={false} solved={solved} onReorder={onReorder} announce={setLive} />
        {solved && <Burst />}
      </div>

      <div className="puzzle-foot">
        {solved ? (
          <div className="unlocked" role="status" data-testid="song-unlocked">
            <p className="unlocked-big">You got it!</p>
            <p className="unlocked-sub">Song unlocked: <strong>{songTitle}</strong></p>
            {meaning && <p className="unlocked-meaning">"{meaning}"</p>}
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
