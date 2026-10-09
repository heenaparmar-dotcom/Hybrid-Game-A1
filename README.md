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

1. **Title screen:** tap or click anywhere (or press Enter) to begin.
2. **Level puzzle:** scrambled word tiles sit on a lyric line. Drag them (mouse or finger), tap two to swap, or use the keyboard. **There is no submit button:** the order is checked after every change. A wrong order is never punished; you only hear how many words are in place. A *Nudge* appears after a while.
3. **Dance invitation:** "You cracked the song! Ready to dance to it?" Music starts only when you press **YES, LET'S DANCE**.
4. **Dance:** a count-in, then a routine of about 35 seconds. A shadow dancer demonstrates each move with large cues synced to the beat; *your spot* is beside it. Pause, mute, restart, or skip any time. A seated, low-impact version is one switch away.
5. **Celebrate and continue:** next level, dance again, or challenge a friend.
6. **Three levels:** *Warm Up* (4 words, English), *Find the Beat* (5 words, Hindi), *Feel the Rhythm* (6 words, English), each with its own original song and routine. Every time a level is entered, one of its 20 lines is picked at random (never the one just played).
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
- **Lyric lines are original** and were written for this project, including 20 Hindi lines for Level 2 (for example *Aaj dil khol ke nacho*, "Today, dance with an open heart"). They are not lyrics from any existing song. A native Hindi speaker should check the phrasing before it is shown publicly.
- **Popular songs and music services were deliberately not used.** A song being on YouTube or a streaming service does not mean it is free to reuse. Streaming embeds generally cannot be synchronised to a game clock, and many licences forbid it. No API is called and no key is needed.
- **To add a properly licensed track later:** put the file in `public/audio/`, record its licence (author, licence name, URL) in `docs/ASSIGNMENT_DOCUMENTATION.md`, and add a small player that exposes `songTime()` like `lib/audio.ts` does, so the dancer can stay on the beat. Suitable sources are tracks under Creative Commons licences that allow your use (check attribution and "no derivatives" terms), or music you commission or make yourself. Always read the licence text for the specific track.
- **Fonts:** Bricolage Grotesque and Figtree, bundled locally through the `@fontsource-variable` packages (SIL Open Font License 1.1). Graphics, the dancer and the logo are original SVG and CSS.

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
- The Hindi lines and cues have not been reviewed by a native speaker.
- Only one real browser engine (desktop Chrome) and an emulated phone viewport have been tested. Real phones, Safari, Firefox and screen readers have not.
- The content filter for custom puzzles is a small word list, not moderation.
- A level in progress is not saved on refresh; finished levels, sound and seated settings are.
- There are no scores, rankings or live multiplayer by design. Friends play by exchanging links.
- Real playtesting with people has **not** been done yet. See `docs/PLAYTEST_PLAN.md`.
