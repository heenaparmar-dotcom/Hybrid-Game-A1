import { MOVES_PER_SEQUENCE, PHRASE_LIMITS, SCORING, TIMING, UNLOCK_STEP } from '../lib/constants';
import { EMOJI } from '../data/emoji';
import { THEMES } from '../data/themes';

const digitalSeconds = TIMING.puzzleSeconds + TIMING.listenGuideSeconds + TIMING.transitionAllowanceSeconds;
const clock = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

/** The full Rule Book. Numbers come from lib/constants.ts so the screen, scoring and timers always agree. */
export function RuleBook() {
  return (
    <div className="rulebook">
      <nav className="toc" aria-label="Rule Book contents">
        {['quick', 'players', 'goals', 'rules', 'space', 'time', 'resources', 'conflict', 'example', 'safety', 'privacy', 'original'].map((id) => (
          <a key={id} href={`#rb-${id}`} onClick={(e) => { e.preventDefault(); document.getElementById(`rb-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}>
            {id === 'quick' ? 'Quick start' : id === 'example' ? 'Example round' : id === 'safety' ? 'Safety & access' : id === 'privacy' ? 'Privacy' : id === 'original' ? 'Original content' : id.charAt(0).toUpperCase() + id.slice(1)}
          </a>
        ))}
      </nav>

      <section id="rb-quick">
        <h3>Quick start</h3>
        <ol>
          <li>Choose <strong>Start game</strong> (two players) or <strong>Solo practice</strong>, then pick a theme.</li>
          <li><strong>Solve</strong> the scrambled song line before the timer ends (digital).</li>
          <li><strong>Listen</strong> to the generated track and preview the moves (digital).</li>
          <li><strong>Move</strong> through the {MOVES_PER_SEQUENCE}-move sequence in a clear space, standing or seated (physical).</li>
          <li>Confirm you finished, collect your points, then <strong>challenge a friend</strong> with your own puzzle link.</li>
        </ol>
        <p>Clear a safe space, keep water nearby, and move only as far as feels comfortable.</p>
      </section>

      <section id="rb-players">
        <h3>1. Players</h3>
        <ul>
          <li><strong>Target audience:</strong> college students and young adults, about 18 to 24 years old.</li>
          <li><strong>Two-player mode:</strong> exactly two players share one device and take turns. No accounts and no second device needed.</li>
          <li><strong>Solo practice:</strong> one player practises and tries to beat a personal best.</li>
          <li><strong>Turns:</strong> in each round Player 1 plays a full turn (solve, listen, move), then Player 2 plays a full turn with a different line. The screen always shows whose turn it is.</li>
          <li><strong>Winner:</strong> the player with the higher round total wins the round. Match totals add up across rounds. Equal totals are a tie and both players win.</li>
        </ul>
      </section>

      <section id="rb-goals">
        <h3>2. Goals</h3>
        <ul>
          <li>Solve the scrambled word puzzle.</li>
          <li>Complete the physical movement phase.</li>
          <li>Earn points and unlock new themes.</li>
          <li>Challenge a friend with a puzzle you created and share it as a link.</li>
        </ul>
      </section>

      <section id="rb-rules">
        <h3>3. Rules</h3>
        <h4>Setup</h4>
        <p>Pick the number of players, edit names (up to 16 characters), choose an unlocked theme, and make sure you have room to move. Timer lengths can be changed in Settings.</p>
        <h4>Puzzle and timer</h4>
        <ul>
          <li>Each turn has one scrambled line. Put the words in the correct order. The default countdown is {TIMING.puzzleSeconds} seconds and starts when you press <em>Start puzzle</em>.</li>
          <li>Move tiles by dragging, by tapping one tile and then another to swap them, or with the keyboard (Enter to pick up a tile, arrow keys to move it).</li>
          <li><strong>Submit</strong> checks your answer. A wrong answer costs no points: you are told how many tiles are in the right place and can keep trying until time runs out.</li>
          <li>A solved puzzle can only score once. Submitting again does nothing.</li>
          <li><strong>Hint:</strong> locks the next correct word in place. Each hint costs {SCORING.hintPenalty} points from the puzzle score (up to {SCORING.maxHints} hints). Puzzle points never go below 0.</li>
          <li><strong>Timeout or skip:</strong> the answer is shown, you earn no puzzle points, and you still go on to the music and movement.</li>
          <li><strong>Reshuffle</strong> re-mixes unlocked tiles. <strong>Restart puzzle</strong> resets the timer and hints; use it fairly (for example after an interruption). Restarts are counted in the timing log.</li>
        </ul>
        <h4>Music and movement</h4>
        <ul>
          <li>Press <em>Play track</em> to hear the original generated music (browsers need a tap first). If sound fails, the game continues without it.</li>
          <li>The movement phase shows {MOVES_PER_SEQUENCE} moves, one at a time, across a countdown of {TIMING.moveSeconds} seconds by default. Use Start, Pause and Resume as needed.</li>
          <li>The game cannot see you. When the countdown ends, <strong>you</strong> confirm with <em>I completed it</em>. Play honestly.</li>
          <li>Choose <strong>Standing</strong> or <strong>Seated / low-impact</strong> at any time. Both earn identical points.</li>
        </ul>
        <h4>Scoring</h4>
        <table className="rb-table">
          <thead><tr><th>Action</th><th>Points</th></tr></thead>
          <tbody>
            <tr><td>Correct puzzle answer</td><td>{SCORING.puzzleBase}</td></tr>
            <tr><td>Speed bonus (scales with time left on the puzzle timer)</td><td>0 to {SCORING.speedBonusMax}</td></tr>
            <tr><td>Each hint used</td><td>-{SCORING.hintPenalty} from puzzle points (never below 0)</td></tr>
            <tr><td>Completing the movement phase (standing or seated)</td><td>{SCORING.movePoints}</td></tr>
            <tr><td>Skipping the movement phase</td><td>0 (you may continue)</td></tr>
          </tbody>
        </table>
        <p>Turn total = puzzle points + speed bonus + movement points. Best possible turn: {SCORING.puzzleBase + SCORING.speedBonusMax + SCORING.movePoints}.</p>
        <h4>Theme unlocks</h4>
        <p>A <strong>song-and-dance turn</strong> is a turn where you solved the puzzle and completed the movement. Every {UNLOCK_STEP} song-and-dance turns unlock the next theme. Each player's turn counts on its own, so in a two-player game one round where both players solve and move unlocks a theme:</p>
        <ul>
          {THEMES.map((t) => (
            <li key={t.id}><strong>{t.name}</strong>: {t.unlockAt === 0 ? 'available from the start' : `unlocks after ${t.unlockAt} song-and-dance turns`}.</li>
          ))}
        </ul>
        <h4>Skipping and accessibility</h4>
        <p>You may skip a puzzle or a movement at any time. Choosing the seated option never reduces your score. You can turn the animated guide off in Settings and follow the written cues instead.</p>
        <h4>Winning and replaying</h4>
        <p>After each round the results screen shows every score. Choose <em>Next round</em>, <em>Replay</em> (new match, same players) or <em>Return home</em>. Each action is scored once, even if you revisit the screen.</p>
      </section>

      <section id="rb-space">
        <h3>4. Space</h3>
        <ul>
          <li><strong>Digital space:</strong> the browser interface holds the puzzle, timer, music controls, movement guide and scores.</li>
          <li><strong>Physical space:</strong> a clear, safe area, about two metres across if standing, or a stable chair if seated.</li>
          <li><strong>How they connect:</strong> the screen tells you what to do and when; your body does it in the room. The digital solve unlocks the physical dance, and the physical confirmation unlocks the score.</li>
        </ul>
      </section>

      <section id="rb-time">
        <h3>5. Time</h3>
        <p>A standard turn lasts about four minutes. The design target is roughly <strong>50% digital and 50% physical</strong>. This is an intended target that still needs to be checked in playtesting; the game logs your actual phase times to help.</p>
        <table className="rb-table">
          <thead><tr><th>Phase</th><th>Planned time</th></tr></thead>
          <tbody>
            <tr><td>Digital: puzzle countdown</td><td>{TIMING.puzzleSeconds} s (hard limit)</td></tr>
            <tr><td>Digital: listen and preview (soft guide)</td><td>about {TIMING.listenGuideSeconds} s</td></tr>
            <tr><td>Digital: feedback and hand-over</td><td>about {TIMING.transitionAllowanceSeconds} s</td></tr>
            <tr><td><strong>Digital total</strong></td><td><strong>about {clock(digitalSeconds)}</strong></td></tr>
            <tr><td><strong>Physical: movement countdown</strong></td><td><strong>{clock(TIMING.moveSeconds)}</strong></td></tr>
          </tbody>
        </table>
        <p>When the puzzle timer runs out the answer is revealed and play continues to the music. When the movement timer ends you confirm completion or continue without movement points. Timers stop while the Rule Book is open or when you press Pause.</p>
      </section>

      <section id="rb-resources">
        <h3>6. Resources</h3>
        <ul>
          <li><strong>Word tiles:</strong> the puzzle pieces you reorder.</li>
          <li><strong>Timer:</strong> creates the pacing and friendly pressure.</li>
          <li><strong>Generated audio:</strong> an original track made in your browser; it sets the tempo for the movement.</li>
          <li><strong>Movement animation:</strong> the silhouette that demonstrates each move.</li>
          <li><strong>Points:</strong> the shared score you compare.</li>
          <li><strong>Hints:</strong> limited help, up to {SCORING.maxHints} per puzzle, at a cost of {SCORING.hintPenalty} points each.</li>
          <li><strong>Themes:</strong> unlockable sounds, colours and move sets.</li>
          <li><strong>Challenge links:</strong> a self-contained link to a puzzle you made, shared by you.</li>
        </ul>
      </section>

      <section id="rb-conflict">
        <h3>7. Conflict</h3>
        <p>The challenge is friendly and non-violent. It comes from time pressure, puzzle difficulty, comparing scores with a friend, and finishing the movement phase. Nobody is eliminated and nobody is judged on their body or ability.</p>
      </section>

      <section id="rb-example">
        <h3>Example round</h3>
        <ol>
          <li>Sam and Priya choose Fresh Beats. It is Sam's turn.</li>
          <li>Sam sees the tiles <em>skies / neon / under / Dancing</em>, uses one hint, solves it with 30 s left of {TIMING.puzzleSeconds}: {SCORING.puzzleBase - SCORING.hintPenalty} puzzle points + {Math.round((SCORING.speedBonusMax * 30) / TIMING.puzzleSeconds)} speed bonus.</li>
          <li>Sam plays the track, completes the movement and earns {SCORING.movePoints}. Turn total: {SCORING.puzzleBase - SCORING.hintPenalty + Math.round((SCORING.speedBonusMax * 30) / TIMING.puzzleSeconds) + SCORING.movePoints}.</li>
          <li>Priya takes her turn, then the results screen names the round winner and shows progress toward the next theme.</li>
        </ol>
      </section>

      <section id="rb-safety">
        <h3>Safety and accessibility</h3>
        <ul>
          <li>Clear the floor, wear comfortable footwear, and keep water nearby.</li>
          <li>Move gently. Stop at once if you feel pain, dizziness or discomfort. Skipping is always allowed.</li>
          <li>Seated and low-impact options are first-class and score the same.</li>
          <li>The game works with keyboard, touch and mouse, has visible focus, large touch targets, and respects reduced-motion settings.</li>
          <li>The game needs no camera, microphone, location or body tracking.</li>
          <li>Be kind. Do not use phrases that mock, shame or exclude anyone.</li>
        </ul>
        <p><strong>Wellness note:</strong> RHYTHM RUSH encourages enjoyable activity, music and friendship. It is not a medical treatment or therapy and makes no health claims.</p>
      </section>

      <section id="rb-privacy">
        <h3>Privacy and sharing</h3>
        <ul>
          <li>Settings, names, best scores and unlocks are stored only in your own browser (localStorage). Nothing is sent to a server.</li>
          <li>A challenge link contains only the puzzle phrase and an optional nickname, encoded in the link. Do not put personal details in a phrase.</li>
          <li>Phrases: {PHRASE_LIMITS.minWords} to {PHRASE_LIMITS.maxWords} words, up to {PHRASE_LIMITS.maxChars} characters. Use only your own original words or words you have permission to use.</li>
          <li>The game never posts anywhere. You copy the link and choose where to send it.</li>
          <li>A link from <code>localhost</code> only works on the same computer. Friends need the game hosted at a public web address.</li>
          <li>Optional emoji check-ins use exactly {EMOJI.length} emoji, each with a text label: {EMOJI.map((e) => `${e.emoji} ${e.label}`).join(', ')}.</li>
        </ul>
      </section>

      <section id="rb-original">
        <h3>Original content and licensing</h3>
        <p>All song lines are original demo content written for this project, not lyrics from any commercial song. Music is generated live in your browser with the Web Audio API. Logo, tiles, backgrounds and the dancing silhouette are original CSS and SVG. No stock images, fonts or recordings are used. If you create your own puzzle, use your own words.</p>
      </section>
    </div>
  );
}
