import { LEVELS } from '../data/levels';
import { EMOJI } from '../data/emoji';
import { TRACKS, routineSeconds, totalSeconds, trackById } from '../data/tracks';
import { PHRASE_LIMITS } from '../lib/challenge';

const secs = (n: number) => Math.round(n);
const longest = Math.max(...TRACKS.map(totalSeconds));
const shortest = Math.min(...TRACKS.map(totalSeconds));

/** The in-game Rule Book. Kept short on purpose: a new player should get it in one or two minutes. */
export function RuleBook() {
  return (
    <div className="rulebook">
      <section>
        <h3>The game in 30 seconds</h3>
        <ol className="steps-list">
          <li><strong>Solve the song.</strong> A lyric line is scrambled into word tiles. Drag them into order. The game notices when you are right, so there is no button to press.</li>
          <li><strong>Unlock the dance.</strong> When the line is right, you can choose to dance to its song.</li>
          <li><strong>Move.</strong> A shadow dancer shows a short routine. Copy it like a mirror, standing or seated.</li>
          <li><strong>Challenge a friend.</strong> Write your own puzzle and send a link so a friend can take a movement break too.</li>
        </ol>
      </section>

      <section>
        <h3>1. Players</h3>
        <p><strong>Who it is for:</strong> college students and young adults, about 18 to 24.</p>
        <p><strong>How many:</strong> one player on one device. Friends join by opening a challenge link on their own device, so the best way to play is 2 or more friends sending each other puzzles. The game does not have accounts or live multiplayer.</p>
      </section>

      <section>
        <h3>2. Goals</h3>
        <ul>
          <li>Put each scrambled lyric back in order.</li>
          <li>Follow the dance for the song you unlocked.</li>
          <li>Finish all {LEVELS.length} levels.</li>
          <li>Make a puzzle and invite a friend to take a movement break.</li>
        </ul>
      </section>

      <section>
        <h3>3. Rules</h3>
        <ul>
          <li><strong>Rearranging:</strong> drag a tile to a new place, or tap one tile and then another to swap them. With a keyboard, press Enter on a tile to pick it up, use the arrow keys to move it, and press Enter to put it down.</li>
          <li><strong>Checking:</strong> the game checks the order every time it changes. When it matches, the words light up and the song unlocks. A wrong order never costs anything, and the game only tells you how many words are in the right place.</li>
          <li><strong>Nudge:</strong> if you are stuck, a Nudge button appears and locks one correct word in place.</li>
          <li><strong>The dance:</strong> it starts only when you press the dance button, and the music starts at the same moment. You can pause or mute at any time.</li>
          <li><strong>Moving on:</strong> when the routine ends you celebrate and go to the next level. You can skip a dance if you cannot move right now.</li>
          <li><strong>Your own puzzles:</strong> a line of {PHRASE_LIMITS.minWords} to {PHRASE_LIMITS.maxWords} words, up to {PHRASE_LIMITS.maxChars} characters. Use your own words or words you have permission to use.</li>
        </ul>
      </section>

      <section>
        <h3>4. Space</h3>
        <p><strong>Digital space:</strong> the browser, where the puzzle, the music and the dance guide appear.</p>
        <p><strong>Physical space:</strong> a clear patch of floor, roughly two big steps in every direction, or a stable chair for the seated version.</p>
        <p>The dancer is on the left of the stage and <em>your spot</em> is on the right. Copy the dancer like a mirror: when they go right on the screen, you go right.</p>
      </section>

      <section>
        <h3>5. Time</h3>
        <p>These are planned times, not measured results.</p>
        <ul>
          <li><strong>Puzzle:</strong> there is no timer. Most people should need around a minute or less.</li>
          <li><strong>Dance:</strong> {secs(shortest)} to {secs(longest)} seconds, including a short count-in. Each dance has {secs(routineSeconds(trackById('sunrise')))} to {secs(Math.max(...TRACKS.map(routineSeconds)))} seconds of moves.</li>
          <li><strong>One level:</strong> about 2 to 3 minutes. <strong>All {LEVELS.length} levels:</strong> about 8 to 10 minutes.</li>
        </ul>
      </section>

      <section>
        <h3>6. Resources</h3>
        <ul>
          <li><strong>You need:</strong> a phone, tablet or computer with a browser, and room to move.</li>
          <li><strong>Internet:</strong> the game itself works offline once loaded. You need internet to open or send challenge links.</li>
          <li><strong>In the game:</strong> draggable word tiles, original music made in your browser, the dancer animation, and challenge links.</li>
        </ul>
      </section>

      <section>
        <h3>7. Conflict</h3>
        <p>The challenge is friendly and there is no violence. It comes from three things: working out a scrambled lyric, remembering and following the dance, and keeping up with the beat. Sharing a puzzle is an invitation, not a competition. There are no scores or rankings.</p>
      </section>

      <section>
        <h3>Make and share a puzzle</h3>
        <ol className="steps-list">
          <li>Open <em>Make a puzzle</em> from the title screen or the end of a level.</li>
          <li>Type your line and choose a song. We scramble it and show you the result. Press <em>Shuffle again</em> if you want a different one.</li>
          <li>Press <em>Create challenge</em>, then copy the link or open WhatsApp, Telegram or Email with a ready message.</li>
        </ol>
        <p>The game never sends anything for you. You choose who gets it and press send. A link made on <code>localhost</code> only works on the same computer, so create links from the hosted game. A friend who opens your link goes straight to your puzzle.</p>
      </section>

      <section>
        <h3>Replay and restart</h3>
        <ul>
          <li>Use <em>Shuffle again</em> on the puzzle screen to start the puzzle over.</li>
          <li>Use <em>Dance again</em> after a dance, or <em>Restart dance</em> from the pause screen.</li>
          <li>Tap a finished level in the level dots to play it again.</li>
        </ul>
      </section>

      <section>
        <h3>Safety and access</h3>
        <ul>
          <li>Clear the floor, wear comfortable shoes and keep water nearby.</li>
          <li>Move gently. Stop if you feel pain or dizziness. You can always pause or skip.</li>
          <li><strong>Seated version:</strong> choose it before the dance. The dancer sits on a stool and the cues use the upper body.</li>
          <li>Puzzles work with mouse, touch and keyboard. The dance is shown with words as well as the animation.</li>
          <li>The game needs no camera, microphone or location, and it does not watch you move. You decide how it went.</li>
        </ul>
        <p><strong>Wellness note:</strong> this is a game that encourages enjoyable movement, music and time with friends. It is not a medical treatment.</p>
      </section>

      <section>
        <h3>Privacy, music and emoji</h3>
        <ul>
          <li>Your progress and sound settings are saved only in this browser.</li>
          <li>A challenge link contains only the line, the chosen song, the word order and an optional nickname. Do not put personal details in them.</li>
          <li>All songs are original and made live in your browser. All lyric lines were written for this game.</li>
          <li>There are {EMOJI.length} emoji in the game, each with a text label: {EMOJI.map((e) => `${e.emoji} ${e.label}`).join(', ')}.</li>
        </ul>
      </section>
    </div>
  );
}
