import { Icon } from '../components/Icon';
import { Logo } from '../components/Logo';
import { TIMING } from '../lib/constants';
import type { ScreenId } from '../lib/types';

interface Props {
  onStartDuo: () => void;
  onStartSolo: () => void;
  onNav: (s: ScreenId) => void;
  onRules: () => void;
}

export function HomeScreen({ onStartDuo, onStartSolo, onNav, onRules }: Props) {
  return (
    <div className="screen home">
      <section className="hero">
        <Logo size="lg" />
        <h1 className="tagline">Solve the song. Catch the beat. Own the move.</h1>
        <p className="lead">
          A two-player party game for friends. Unscramble a song line on the screen, then get up and move to an original beat. Puzzle brains and dancing feet each get half of the round.
        </p>
        <div className="cta-grid">
          <button className="btn btn-primary btn-xl" onClick={onStartDuo} data-testid="start-game">
            <Icon name="play" /> Start game <small>2 players</small>
          </button>
          <button className="btn btn-xl" onClick={onStartSolo} data-testid="solo-practice">
            <Icon name="stand" /> Solo practice
          </button>
          <button className="btn btn-xl" onClick={() => onNav('create')} data-testid="create-puzzle">
            <Icon name="plus" /> Create a puzzle
          </button>
          <button className="btn btn-xl" onClick={() => onNav('challenge')} data-testid="friend-challenge">
            <Icon name="share" /> Friend challenge
          </button>
          <button className="btn btn-xl btn-ghost" onClick={onRules} data-testid="open-rules">
            <Icon name="book" /> Rule Book
          </button>
        </div>
      </section>

      <section className="card how" aria-labelledby="how-title">
        <h2 id="how-title">How a round works</h2>
        <div className="split-bar" role="img" aria-label="Design target: about half digital, about half physical">
          <div className="split-digital"><strong>Digital</strong> about 2 min</div>
          <div className="split-physical"><strong>Physical</strong> about 2 min</div>
        </div>
        <ol className="how-steps">
          <li><span className="how-kind digital">Digital</span><strong>Solve</strong><span>Unscramble the line in {TIMING.puzzleSeconds} seconds. Hints cost points.</span></li>
          <li><span className="how-kind digital">Digital</span><strong>Listen</strong><span>Play the original track and preview the moves.</span></li>
          <li><span className="how-kind physical">Physical</span><strong>Move</strong><span>Follow the silhouette for {TIMING.moveSeconds / 60} minutes. Standing or seated.</span></li>
          <li><span className="how-kind digital">Digital</span><strong>Score and share</strong><span>Collect points, unlock themes, then challenge a friend.</span></li>
        </ol>
        <p className="fine">
          Why it exists: music, movement and play are enjoyable ways to take a break and connect with friends. RHYTHM RUSH is a game, not a medical treatment. The 50/50 split is a design target that playtesting still needs to confirm.
        </p>
      </section>
    </div>
  );
}
