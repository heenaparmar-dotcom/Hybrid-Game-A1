# RHYTHM RUSH

**Solve the song. Catch the beat. Own the move.**

A browser-based hybrid wellness game for a university Game Design assignment. Players unscramble an original song line on the screen (digital), then follow an animated silhouette to a generated beat (physical). Players can also create a puzzle and share it as a link with a friend.

> RHYTHM RUSH is a game that encourages enjoyable movement, music and friendship. It is **not** a medical treatment and makes no health claims.

## Run it

Requires Node.js 18 or newer.

```bash
npm install
npm run dev
```

Then open <http://localhost:5173>.

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Type-check and create a production build in `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run typecheck` | TypeScript check only |
| `npm run lint` | ESLint |
| `npm test` | Unit tests (Vitest) |
| `npm run test:e2e` | Browser tests (Playwright; uses the Google Chrome installed on your machine) |
| `npm run check` | Type-check, lint, unit tests and build |

No API keys, accounts, databases or backend are needed. After `npm install`, the game works offline.

## Features (implemented)

- **Screens:** Home, Player setup, Theme selection, Puzzle, Music, Dance challenge, Results, Create a puzzle, Friend challenge, Settings, and a Rule Book that opens from anywhere (including during play, where it pauses the timers).
- **Two-player local turns** on one device, plus **solo practice** with a saved personal best.
- **Puzzle:** drag-and-drop, tap-to-swap and keyboard control, a 45 s timer (configurable), hints (-20 points, up to 3), reshuffle, restart, skip, timeout handling, and protection against scoring the same puzzle twice.
- **Music:** original tracks generated live with the Web Audio API (no audio files), with volume, mute and a clear message when sound is blocked or unavailable. The game continues without sound.
- **Dance:** an original SVG silhouette animated with CSS, 8 beginner-friendly moves per theme, Start / Pause / Resume / Complete, and a **seated / low-impact** option that scores the same. The game never tracks the body; the player confirms completion.
- **Scoring:** 100 for a correct puzzle, up to 50 speed bonus, 100 for movement, -20 per hint. One scoring system is used everywhere (see `src/lib/constants.ts`).
- **Themes:** Fresh Beats (open), Retro Rewind (after 2 song-and-dance turns), Hook-Step Party (after 4). Saved in the browser.
- **Friend challenges:** a self-contained, validated link (`#challenge=...`) that opens the real puzzle. Copy link, copy message, and the native share sheet where the browser has one.
- **Emoji mode:** exactly 10 emoji, always with text labels (mood check-in and reactions).
- **Playtest tools:** an in-game timing log (puzzle, listening and movement screen time) with CSV export.
- **Accessibility:** keyboard operation, visible focus, ARIA labels and live regions, large touch targets, reduced-motion support, and an option to turn the animation off.

## How to demonstrate it in class

1. `npm run dev`, then open the game.
2. In **Settings**, pick **Quick demo** for both timers (20 s puzzle, 24 s movement) so a full round fits in about two minutes. Switch back to **Standard** for real playtests.
3. Play: Start game > names > theme > Solve > Listen > Move > Results. After one two-player round where both players solve and move, **Retro Rewind** unlocks.
4. Show **Create a puzzle**, copy the link, and open it in a second tab to show it loads the actual challenge.
5. Show the Rule Book during play, the seated option, and Settings > Playtest timing log.

To reset the demo: Settings > **Reset progress and scores**.

## Sharing with friends (important)

A link created while running on `localhost` only works on the same computer. For friends to open challenges on their own devices, host the built game at a public web address:

```bash
npm run build      # creates dist/
```

Upload the contents of `dist/` to any static host (for example GitHub Pages, Netlify or Vercel's static hosting), then create challenge links from the hosted address. The game uses relative paths and a `#` fragment, so it works from a sub-folder. The game never posts to any social network: you copy the link and choose where to send it. The link contains only the puzzle phrase and an optional nickname.

## Documentation

- [`docs/ASSIGNMENT_DOCUMENTATION.md`](docs/ASSIGNMENT_DOCUMENTATION.md): the assignment write-up (design thinking, concepts, matrix, testing, iteration log).
- [`docs/RULE_BOOK.md`](docs/RULE_BOOK.md): the full standalone manual (also inside the app).
- [`docs/PLAYTEST_PLAN.md`](docs/PLAYTEST_PLAN.md): a script and blank observation sheets for a real playtest.

## Controls

| Action | Mouse / touch | Keyboard |
| --- | --- | --- |
| Move a tile | Drag it, or tap one tile then another to swap | Tab to a tile, Enter to pick it up, Left/Right arrows to move, Escape to put down |
| Move a picked tile | Left / Right buttons | Tab to the buttons, Enter |
| Close the Rule Book or a dialog | Close button or click outside | Escape |

## Project layout

```
src/
  App.tsx             navigation and game flow
  screens/            one file per screen
  components/         tiles, dance figure, logo, rule book, share panel, ...
  data/               original phrases, themes, moves, emoji list
  lib/                scoring, scrambling, challenge links, storage, audio, session logic
  styles/app.css      design system
tests/unit/           Vitest unit tests
tests/e2e/            Playwright browser tests
docs/                 assignment documents
```

## Troubleshooting

- **No sound:** browsers only allow sound after a click or tap. Press **Play track** (or **Start moving**). Check the volume and mute controls, and your device volume. The game works without sound.
- **A shared link opens the home screen:** the link was cut off when pasted. It must include everything after `#challenge=`. Use **Copy link** rather than copying from the address bar by hand.
- **A friend cannot open my link:** it was created on `localhost`. See "Sharing with friends".
- **Progress disappeared:** progress is stored in this browser only. It is lost if site data is cleared, in some private windows, or on a different browser or device.
- **`npm run test:e2e` cannot find a browser:** the tests use the installed Google Chrome (`channel: 'chrome'` in `playwright.config.ts`). Install Chrome, or change the channel to `msedge`, or run `npx playwright install chromium` and remove the channel.
- **Port 5173 in use:** stop the other process; the dev server uses a fixed port because the e2e tests expect it.

## Copyright and originality

- All song lines are **original demo content written for this project** and are not lyrics from any commercial song. They were not checked against every song in existence, so do not swap them for real lyrics, and use your own words when creating puzzles.
- All music is generated in the browser by `src/lib/audio.ts`. No recordings were downloaded or included.
- The logo, tiles, backgrounds and dance silhouette are original CSS and SVG. There are no stock images, icon packs or web fonts (the system font stack is used).
- Dependencies are open source (React, Vite, TypeScript, Vitest, Playwright, ESLint).

## Known limitations

- The dance guide is a simple abstract silhouette seen from the front. It cannot show every movement precisely, so the written cue is always shown too.
- Movement completion is self-reported by design. There is no tracking.
- The 50/50 digital/physical split is a **design target**. The planned timings add up to it, but it has not yet been validated with real players (see `docs/PLAYTEST_PLAN.md`).
- The in-game timing log does not include feedback and hand-over pauses.
- The phrase filter is a small basic word list, not real moderation. A challenge link can contain any phrase that passes the filter, so only share links with people you know.
- Challenge links need a public host to work between devices (see above).
- A round in progress is not saved; refreshing the page returns to the home screen (settings, unlocks and scores are kept). Opening a challenge link, and refreshing it, still shows the challenge.
- Tested in desktop Chrome (automated). Other browsers, real phones and screen readers have not been tested.
- Music uses simple synthesised sounds and will not match the polish of recorded tracks.
