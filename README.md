# RHYTHM RUSH

**Solve the song. Catch the beat. Own the move.**

A browser game for a university Game Design assignment (Hybrid Game, theme: wellness). Players unscramble an original song lyric by dragging word tiles, then dance alongside an animated shadow dancer to an original track. They can also write their own puzzle and send it to a friend as a link.

> RHYTHM RUSH is a game that encourages enjoyable movement, music and time with friends. It is **not** a medical treatment and makes no health claims.

Live: <https://heenaparmar-dotcom.github.io/Hybrid-Game-A1/>

## Run it

Requires Node.js 18 or newer.

```bash
npm install
npm run dev        # open http://localhost:5173
```

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Type-check and build to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run check` | Type-check, lint, unit tests and build |
| `npm test` | Unit tests (Vitest) |
| `npm run test:e2e` | Browser tests (Playwright, using the Google Chrome installed on your machine) |
| `npm run deploy` | Build and publish to the `gh-pages` branch (GitHub Pages) |

No API keys, accounts, database or backend. The game works offline once loaded.

## How it plays

1. **Title screen:** press **TAP TO START** (or tap or click anywhere, or press Enter) to begin.
2. **Level puzzle:** scrambled word tiles sit on a lyric line. Drag them (mouse or finger), tap two to swap, or use the keyboard. **There is no submit button:** the order is checked after every change. A wrong order is never punished; you only hear how many words are in place. A *Nudge* appears after a while.
3. **Dance invitation:** "You cracked the song! Ready to dance to it?" Music starts only when you press **YES, LET'S DANCE**.
4. **Dance:** exactly **30 seconds** (a short count-in is part of it), with a visible countdown. A shadow dancer demonstrates each move with large cues synced to the beat; *your spot* is beside it. Pause, mute, restart, or skip any time. A seated, low-impact version is one switch away.
5. **Celebrate and continue:** next level, dance again, or challenge a friend.
6. **Three levels:** *Warm Up* and *Find the Beat* are word-order puzzles; *Feel the Rhythm* is a listening level. Every time a puzzle level is entered, one of its puzzles is picked at random (never the one just played).
   - **Warm Up:** a timed puzzle (30 seconds for a lyric line, 10 for a short title). The words of a line from one of **8 songs** are scrambled (Badtameez Dil, Kala Chashma, Gallan Goodiyaan, Sapphire, Jhoome Jo Pathaan, Swag Se Swagat, Jamaican (Bam Bam), Let's Nacho). The first Warm Up puzzle of a visit is always Kala Chashma. A small **Hint** button shows the film and year without stopping the timer. If time runs out, the correct order is shown and the dance is still offered.
   - **Find the Beat:** the same 10-second timer, with **11 film-song title puzzles** and their hints always visible (Aankh Marey, Dola Re Dola, Tauba Tauba, Jhoome Jo Pathaan, Kaho Na Pyaar Hai, Caller Tune, Kajra Re, Jai Jai Shivshankar, Om Shanti Om, Desi Girl, Dhana Dhin Dha). After solving the shuffled title you do the **Hook-Step dance**. **Camera points (optional):** if you switch the camera on, a body tracker (Google MediaPipe Pose Landmarker, Apache-2.0) runs **in your browser**, traces your arms and legs and gives 0 to 100 points and up to 3 stars for copying the dancer. Nothing is recorded, saved or sent anywhere, the tracker and its model are bundled in `public/mediapipe/`, and the camera turns off when the dance ends. One player only; it compares you with this game's own routine, not the films' real choreography.
   - **Feel the Rhythm:** three **instrumental listening clips**. Press Play, hear a piano or flute version of a song, and choose which song it was from three titles. A clue (the instrument) is available if you cannot listen.
7. **Make a puzzle:** write a line, review the scramble, pick one of the three songs, and share a link by copy, native share, WhatsApp, Telegram or Email. A friend who opens it plays that exact puzzle, with the same shuffle and song.

The in-game **How to play** is the Rule Book (also in [`docs/RULE_BOOK.md`](docs/RULE_BOOK.md)). It opens from every screen, and during a dance it pauses the routine.

## Documentation

- [`docs/ASSIGNMENT_DOCUMENTATION.md`](docs/ASSIGNMENT_DOCUMENTATION.md): the assignment write-up: concept, art direction, design thinking, concept comparison, testing evidence and iteration log.
- [`docs/RULE_BOOK.md`](docs/RULE_BOOK.md): the manual covering the seven design elements.
- [`docs/PLAYTEST_PLAN.md`](docs/PLAYTEST_PLAN.md): a practical script and blank observation sheets for real playtests.

## Sharing with friends

A link created on `localhost` only opens on the same computer. For friends, create links from the hosted game (the Live address above). The game never posts anything: WhatsApp, Telegram and Email buttons only **open** those apps with a ready message, and you choose the friend and press send. Links carry only the puzzle line, an optional nickname, the song and the word order, so do not put personal details in them.

## Deploying (GitHub Pages)

```bash
npm run deploy
```

This builds the game and pushes `dist/` to the `gh-pages` branch of `origin`. The first time, enable Pages in the repository: *Settings > Pages > Build and deployment > Deploy from a branch > `gh-pages` > `/ (root)`*. The build uses relative paths and a `#` fragment for challenge links, so it works from the repository sub-path with no server configuration. Any static host also works: upload the contents of `dist/`.

## Music and licensing

- **All three songs are original and synthesised live in the browser** with the Web Audio API (`src/lib/audio.ts`). No recordings, samples, downloads or third-party music services are used. The English tracks are a warm pop groove and a Latin-pop groove. The Hindi-line track uses a dhol-inspired rhythm and a Hijaz-style scale, written as a simple original synth tune; it is "inspired by", not a recording of, any real music tradition or song.
- **Songs that were solved can play through YouTube.** A puzzle can carry an official YouTube video (`video` in `src/data/puzzles.ts`: `id`, `start` second, `credit`). When the player says yes to the dance, the game plays **that video through YouTube's own embedded player** (no key needed, nothing downloaded or copied, the player stays visible as YouTube requires) and the dancer, cues and 30-second countdown follow the video's clock. If the video cannot play (offline, blocked, removed), the game says so and uses its own music. **Set up so far: Kala Chashma only** (official video by Zee Music Company). To add another song, add its video ID to that song's entry. Each video's owner decides whether it can be embedded and whether ads show. The songs belong to their owners. The dancer's steps are tuned to the game's own tempos, so with a real song they are approximate, not choreographed to it.
- **Song lines and recordings in Warm Up are supplied by the team, not by the code.** The lyric lines in `src/data/lyricLines.ts` and the MP3 clips in `public/audio/` (listed in `src/data/songAudio.ts`) were added by the project owner, and the game plays each clip as audio only for that song's dance (short clips repeat to cover the 30 seconds; if a file cannot load the game falls back to the YouTube video where one is set, then to its own music). **These are third-party recordings and lyric lines served publicly with the game: the team is responsible for having the right to use them.** The other lyric lines in the game are original, including 20 Hindi lines for Level 2 (for example *Aaj dil khol ke nacho*, "Today, dance with an open heart"). They are not lyrics from any existing song. A native Hindi speaker should check the phrasing before it is shown publicly.
- **Apart from the optional YouTube videos above, popular songs and music services are not used.** A song being on YouTube or a streaming service does not mean it is free to reuse. Streaming embeds generally cannot be synchronised to a game clock, and many licences forbid it. No API is called and no key is needed.
- **To add a properly licensed track later:** put the file in `public/audio/`, record its licence (author, licence name, URL) in `docs/ASSIGNMENT_DOCUMENTATION.md`, and add a small player that exposes `songTime()` like `lib/audio.ts` does, so the dancer can stay on the beat. Suitable sources are tracks under Creative Commons licences that allow your use (check attribution and "no derivatives" terms), or music you commission or make yourself. Always read the licence text for the specific track.
- **Fonts:** Bricolage Grotesque and Figtree, bundled locally through the `@fontsource-variable` packages (SIL Open Font License 1.1). Graphics, the dancer and the logo are original SVG and CSS.

## Level 3 listening clips

Feel the Rhythm has **three instrumental clips**: a piano version of Pehla Nasha, a flute version of Dekha Hazaro Dafa and a piano or keyboard version of Lag Ja Gale. The player hears a clip and answers **"Which song did you hear?"** from the three song titles. The files are in `public/audio/` (`listen-*.mp3`) and are set up in `src/data/listen.ts`.

- **These clips were supplied by the project owner, not created by the code. They are third-party recordings, and the team is responsible for having the right to use and publish them.**
- A player who cannot listen can show a **clue** (the instrument, never the answer), so the level can always be finished.
- If a file cannot load, the game says so and plays its own demo clip (generated music with a computer voice) instead.
- To change a clip: copy the audio into `public/audio/`, then edit that challenge's `src`, `line` (the correct song title), `options` and `clue` in `src/data/listen.ts`, and run `npm run check`.

## Controls

| Action | Mouse / touch | Keyboard |
| --- | --- | --- |
| Start the game | Click or tap anywhere on the title screen | Enter or Space |
| Move a tile | Drag it, or tap one tile then another to swap | Tab to a tile, Enter to pick it up, arrows to move, Enter to put it down, Escape to cancel |
| Pause the dance | Pause button | Tab to Pause, Enter |
| Close the Rule Book | Close button or click outside | Escape |

## Project layout

```
src/
  App.tsx            flow: title > level (puzzle > invite > dance > celebrate) > next level; create; challenge
  screens/           Title, Puzzle, Invite, Dance, Celebrate, Create, Challenge
  components/        PuzzleBoard (drag/tap/keyboard), Dancer + Stage (SVG), Burst, Rule Book, Share panel, ...
  data/              levels, songs, moves, emoji
  lib/               audio engine, dancer pose maths, routine timeline, challenge links, sharing, storage
  styles/app.css     design system
tests/unit/          Vitest
tests/e2e/           Playwright
scripts/             deploy script
docs/                assignment documents
```

## Troubleshooting

- **No sound:** browsers only allow sound after a tap, so the music starts when you press the dance button. Check the mute button and your device volume. If sound is blocked or unavailable, the dance still runs in silence on the beat dots and a message explains why.
- **A shared link opens the title screen:** the link was cut when pasted. It must include everything after `#challenge=`. Use **Copy link**.
- **A friend cannot open my link:** it was made on `localhost`. Create it from the hosted game.
- **Progress disappeared:** progress is stored in this browser only. It is lost if site data is cleared, in some private windows, or on another browser or device.
- **`npm run test:e2e` cannot find a browser:** the tests use Google Chrome (`channel: 'chrome'` in `playwright.config.ts`). Install Chrome, change the channel to `msedge`, or run `npx playwright install chromium` and remove the channel.
- **Port 5173 in use:** stop the other process. The dev server uses a fixed port because the e2e tests expect it.

## Known limitations

- The dancer is a simple front-facing 2D figure with nine moves; it cannot show every movement precisely, so a written cue is always shown too. The dance is not checked in any way: nothing tracks the player.
- The songs are simple synthesised tracks and will not sound like produced music. Their sound was not evaluated by listeners, and automated tests cannot hear audio.
- The Hindi lines and cues have not been reviewed by a native speaker. The film and year hints on the song puzzles come from general knowledge (the Find the Beat hints are as supplied by the project owner); please check them.
- Level 3's instrumental clips are supplied by the owner (see above). The in-game Rule Book still describes every level as rearranging words and has not been updated for the listening level.
- Only one real browser engine (desktop Chrome) and an emulated phone viewport have been tested. Real phones, Safari, Firefox and screen readers have not.
- The content filter for custom puzzles is a small word list, not moderation.
- A level in progress is not saved on refresh; finished levels, sound and seated settings are.
- There are no scores, rankings or live multiplayer by design. Friends play by exchanging links.
- Real playtesting with people has **not** been done yet. See `docs/PLAYTEST_PLAN.md`.
