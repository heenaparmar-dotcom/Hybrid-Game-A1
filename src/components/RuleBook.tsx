import { EMOJI } from '../data/emoji';
import { LEVELS } from '../data/levels';
import { PHRASE_LIMITS } from '../lib/challenge';
import { DANCE_SECONDS, PUZZLE_SECONDS } from '../lib/timing';

/** The in-game Rule Book. Kept short on purpose: a new player should get it in one or two minutes. */
export function RuleBook() {
  return (
    <div className="rulebook">
      <section>
        <h3>The game in 30 seconds</h3>
        <ol className="steps-list">
          <li><strong>Solve the song.</strong> In Warm Up and Find the Beat, the words of a Hindi film-song title are scrambled into tiles. Drag them into order within {PUZZLE_SECONDS} seconds. The game notices when you are right, so there is no button to press.</li>
          <li><strong>Unlock the dance.</strong> When you crack the song (or time runs out and the answer is shown), you are invited to dance. Nothing plays until you say yes.</li>
          <li><strong>Move for {DANCE_SECONDS} seconds.</strong> A shadow dancer shows a short routine. Copy it like a mirror, standing or seated.</li>
          <li><strong>Listen.</strong> In Feel the Rhythm you hear a short clip and pick the line you heard.</li>
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
          <li>Solve the song puzzles by putting the scrambled words in order.</li>
          <li>Identify the music in the listening challenges.</li>
          <li>Follow the {DANCE_SECONDS}-second dance routines.</li>
          <li>Finish all {LEVELS.length} levels.</li>
          <li>Make a puzzle and challenge a friend to take a movement break.</li>
        </ul>
      </section>

      <section>
        <h3>3. Rules</h3>
        <ul>
          <li><strong>Rearranging:</strong> drag a tile to a new place, or tap one tile and then another to swap them. With a keyboard, press Enter on a tile to pick it up, use the arrow keys to move it, and press Enter to put it down. Repeated words are separate tiles.</li>
          <li><strong>Timer (Warm Up and Find the Beat):</strong> you have {PUZZLE_SECONDS} seconds. It starts when the puzzle appears and stops the moment you are right. It pauses while the Rule Book is open. <em>Shuffle again</em> starts the puzzle and the timer over.</li>
          <li><strong>Checking:</strong> the game checks the order every time it changes. A wrong order costs nothing. When it matches, the words light up and you move on.</li>
          <li><strong>Time's up:</strong> if the timer reaches zero, the correct order is shown and you can continue to the dance.</li>
          <li><strong>Hint:</strong> in Warm Up, the small Hint button shows the film and year of the song. The timer keeps running. In Find the Beat the hint is always shown.</li>
          <li><strong>The dance:</strong> it starts only when you press the dance button, and the music starts at the same moment. It lasts {DANCE_SECONDS} seconds, with a countdown. You can pause, mute or skip at any time.</li>
          <li><strong>Feel the Rhythm:</strong> press Play to hear a clip, choose the line you heard from three options, and replay or pause as you like. A wrong choice never ends the level. When you are right, move on to the next clip.</li>
          <li><strong>Moving on:</strong> when a dance ends you celebrate and go to the next level. You can skip a dance if you cannot move right now.</li>
          <li><strong>Your own puzzles:</strong> a line of {PHRASE_LIMITS.minWords} to {PHRASE_LIMITS.maxWords} words, up to {PHRASE_LIMITS.maxChars} characters. Use your own words or words you have permission to use. They have no timer.</li>
        </ul>
      </section>

      <section>
        <h3>4. Space</h3>
        <p><strong>Digital space:</strong> the browser, where the puzzle, the music and the dance guide appear.</p>
        <p><strong>Physical space:</strong> a small clear patch of floor, roughly two big steps in every direction, or a stable chair for the seated version.</p>
        <p>The dancer is on the left of the stage and <em>your spot</em> is on the right. Copy the dancer like a mirror: when they go right on the screen, you go right.</p>
      </section>

      <section>
        <h3>5. Time</h3>
        <ul>
          <li><strong>Puzzle:</strong> {PUZZLE_SECONDS} seconds in Warm Up and Find the Beat.</li>
          <li><strong>Dance:</strong> {DANCE_SECONDS} seconds, including a short count-in.</li>
          <li><strong>Listening level:</strong> no timer. Each clip is about 9 seconds long.</li>
          <li><strong>One level:</strong> about a minute to a minute and a half. <strong>All {LEVELS.length} levels:</strong> about 4 to 5 minutes. These are planned times, not measured results.</li>
        </ul>
      </section>

      <section>
        <h3>6. Resources</h3>
        <ul>
          <li><strong>You need:</strong> a phone, tablet or computer with a browser, and room to move.</li>
          <li><strong>Internet:</strong> the game itself works offline once loaded. You need internet to open or send challenge links.</li>
          <li><strong>In the game:</strong> draggable word tiles, a countdown, original music made in your browser, the dancer animation, and challenge links.</li>
        </ul>
      </section>

      <section>
        <h3>7. Conflict</h3>
        <p>The challenge is friendly and there is no violence. It comes from working out a scrambled song title against the clock, recognising a line in a music clip, and keeping up with the dancer. Sharing a puzzle is an invitation, not a competition. There are no scores or rankings.</p>
      </section>

      <section>
        <h3>Make and share a puzzle</h3>
        <ol className="steps-list">
          <li>Open <em>Make a puzzle</em> from the title screen or the end of a level.</li>
          <li>Type your line and choose a song. We scramble it and show you the result. Press <em>Shuffle again</em> if you want a different one.</li>
          <li>Press <em>Create challenge</em>, then copy the link or open WhatsApp, Telegram or Email with a ready message.</li>
        </ol>
        <p>The game never sends anything for you. You choose who gets it and press send. A link made on <code>localhost</code> only works on the same computer, so create links from the hosted game. A friend who opens your link goes straight to your puzzle, with the same shuffle you reviewed and the song you chose.</p>
      </section>

      <section>
        <h3>Replay and restart</h3>
        <ul>
          <li>Use <em>Shuffle again</em> on the puzzle screen to start the puzzle and its timer over.</li>
          <li>Use <em>Dance again</em> after a dance, or <em>Restart dance</em> from the pause screen.</li>
          <li>Tap a finished level in the level dots to play it again.</li>
        </ul>
      </section>

      <section>
        <h3>Safety and access</h3>
        <ul>
          <li>Clear the floor, wear comfortable shoes and keep water nearby.</li>
          <li>Move gently. Stop if you feel pain or dizziness. You can always pause or skip.</li>
          <li><strong>Seated version:</strong> choose it before the dance. The dancer sits on a chair and the cues use the upper body.</li>
          <li>Puzzles work with mouse, touch and keyboard. The dance is shown with words as well as the animation. In the listening level you can show the words if you cannot listen.</li>
          <li>The game needs no camera, microphone or location, and it does not watch you move. You decide how it went.</li>
        </ul>
        <p><strong>Wellness note:</strong> this is a game that encourages enjoyable movement, music and time with friends. It is not a medical treatment.</p>
      </section>

      <section>
        <h3>Privacy, music and emoji</h3>
        <ul>
          <li>Your progress and sound settings are saved only in this browser.</li>
          <li>A challenge link contains only the line, the chosen song, the word order and an optional nickname. Do not put personal details in them.</li>
          <li>The film-song puzzles use only the song title and a short fact about it. No film-song lyrics are in the game. The game's own music is original and made live in your browser. When a song has an official video set up (Kala Chashma so far), its dance plays that video through YouTube instead, which needs internet and shows a small video player; if it cannot play, the game's own music is used. The listening clips are demo clips with a computer voice.</li>
          <li>There are {EMOJI.length} emoji in the game, each with a text label: {EMOJI.map((e) => `${e.emoji} ${e.label}`).join(', ')}.</li>
        </ul>
      </section>
    </div>
  );
}
