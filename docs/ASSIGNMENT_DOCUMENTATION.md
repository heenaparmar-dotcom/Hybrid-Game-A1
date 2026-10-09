# RHYTHM RUSH: Assignment Documentation

*Game Design Assignment 1, Hybrid Game. Theme: wellness.*
*Solve the song. Catch the beat. Own the move.*

**How to read this document.** Every claim is labelled so nothing is mistaken for evidence:

- **[Implemented]**: exists in the playable game.
- **[Verified by automated test]**: checked by the project's own test suite (section 13).
- **[Design hypothesis]**: a reasoned assumption not yet confirmed by research.
- **[NOT YET COLLECTED]**: needs real people (interviews, playtests, faculty). Left blank on purpose.

No participant, interview, statistic or faculty comment appears here unless a real one has been written into a template by the team.

---

## 1. Game overview and concept

RHYTHM RUSH is a small music-and-movement game for friends. **[Implemented]**

**Core loop:** Solve the song > Unlock the dance > Complete the movement > Celebrate > Continue > Challenge a friend.

1. A short original lyric is scrambled into word tiles. The player drags them into order. There is **no submit button**: the game checks after every change and recognises the right order by itself.
2. Solving it unlocks a dance invitation: "You cracked the song! Ready to dance to it?" Music starts only when the player presses the button.
3. A **shadow dancer** demonstrates a routine of about 35 seconds on a stage, with the player's own spot beside it. Large cues change on the beat.
4. After a short celebration the player continues through three levels, or writes their own puzzle and sends a link to a friend, so the friend takes a movement break too.

**Wellness purpose.** Enjoyable movement, a playful mental warm-up, music and connection with friends. The game makes **no medical claims**.

## 2. What changed from the first version

The first prototype was a scored, timed, two-player game on one device. After reviewing it against the new brief, this version was rebuilt around the level flow. Decisions:

| Kept and improved | Replaced | Removed (and why) |
| --- | --- | --- |
| Rule Book (rewritten to match the new game), custom puzzle creator, challenge-link codec (links already shared still open), Web Audio music approach, seated option, accessibility groundwork | Home screen and menus became one tap-anywhere title screen; submit-based puzzle became automatic checking; the dance guide became a rigged, beat-synced shadow dancer; the plain visual style became a new art direction | Scores, timers, hints-with-penalties, two-player turns and theme unlocks. They put metrics and menus around the puzzle, which the brief asks to avoid, and did not make the game more fun to the team |

## 3. Art direction

- **Palette:** deep plum stage, warm coral and tangerine energy, cream type, a little lime and mint for success and "your spot". **[Implemented]**
- **Type:** Bricolage Grotesque (expressive display, condensed at large sizes) with Figtree for reading text; both are open-licensed and bundled locally.
- **Identity:** a condensed, bouncing wordmark (RHYTHM in cream, RUSH in a skewed coral with a tangerine shadow); a title composition of three original black dancer silhouettes: a small articulated skeleton with fixed-length bones, planted feet, knee flex and hip sway on every beat, shoulders turning against the hips and hair that trails the motion, drawn as soft curved outlines (inspired by the energy of a reference photo but not traced from it, and with no image file); the puzzle shown as a lyric line with start and end bars, like a bar of music; a curtain wipe from the tap point and a bold level splash as transitions.
- **Avoided on purpose:** gradient-everything, glass panels, dashboard cards, random floating decorations, fake statistics or leaderboards. Emoji are limited to 8 (limit 10), each with a text label, and appear only in the optional mood check-in and friend reactions.
- **Responsive:** laptop, tablet and phone layouts; the stage is cropped on phones to make the dancers larger.

## 4. Gameplay, levels and difficulty

| Level | Name | Lines (20 per level, picked at random) | Song | Words | Dance |
| --- | --- | --- | --- | --- | --- |
| 1 | Warm Up | 20 original English lines, e.g. "Sway with the sunrise" | Sunrise Sway (English, warm pop, 112 BPM) | 4 | sway, reach, step, clap, repeated twice |
| 2 | Find the Beat | 20 original Hindi lines in Roman script, each with an English meaning, e.g. "Aaj dil khol ke nacho" ("Today, dance with an open heart") | Nacho Aaj (dhol-inspired groove, 108 BPM) | 5 | step, arm lifts, hands on hips, clap, repeated twice |
| 3 | Feel the Rhythm | 20 original English lines, e.g. "Let the rhythm carry us forward" | Hook-Step Party (Latin-pop, Zumba-inspired, 126 BPM) | 6 | march, turn, wave, arm lifts, reach, repeated twice |

Each time a level is entered, the game picks one of that level's 20 lines at random (never the one just played) and shuffles its tiles freshly. The three pools are separate: 60 distinct lines in total. Difficulty rises through more words, a line in another language, and longer, livelier routines. **[Implemented]** Each routine is 34 to 38 seconds of moves plus an 8-beat count-in, 39 to 42 seconds in total (limit 45) **[Verified by automated test]**.

**Hindi film-song challenges and the listening level (added later).** Warm Up now also contains 10 Hindi film-song challenges and Find the Beat 5 more. In every one the scrambled words are the song's **title** (a title is not a lyric excerpt) with a short factual hint (year and film); no lyrics are reproduced and no film-song recording is played. The dance still uses the game's own original track, and the invitation says so. Feel the Rhythm is now a listening level: two clips, each with three answer choices. With no licensed recording available, the clips are clearly labelled placeholders (original generated music with a computer voice speaking an original line), and `src/data/listen.ts` documents how to configure a licensed file. The pools are merged, not replaced: Warm Up has 30 puzzles, Find the Beat 25, and Feel the Rhythm's 20 word-order puzzles remain in the data but are no longer used. **Not yet checked:** the film and year hints on the Warm Up songs (from general knowledge), a native-speaker review of the Hindi text, and how the placeholder clips sound to listeners.

Puzzle details **[Implemented]**: drag with mouse or finger (pointer events), tap-to-swap as a single-pointer alternative, keyboard control; the tiles reflow with a short slide; gentle feedback ("2 of 4 words are in the right place") that never reveals the answer; a *Nudge* after about 14 seconds that locks one correct word; *Shuffle again*.

## 5. Music, audio and licensing (investigation)

**Decision: original synthesised music only.** All three songs are generated in the browser (`src/lib/audio.ts`) from a small step sequencer with kick, snare, hats, bass, a melody, and (for Nacho Aaj) dhol-style hits and a Hijaz-style scale. There are no recordings, downloads or third-party services. **[Implemented]**

Options considered:

| Option | Verdict |
| --- | --- |
| Popular Hindi or English songs | **Rejected.** Copyrighted, and being playable on YouTube or Spotify does not grant reuse rights. Audio recordings, lyrics and dance videos all carry rights |
| YouTube / Spotify embeds | **Rejected for the core game.** Terms and technical limits generally prevent synchronising an embedded player to the game's own beat clock, and playback needs accounts or keys. Nothing was scraped or called |
| A music API | **Not used.** No key is available, none was invented, and the core game must work without one |
| Royalty-free or Creative Commons tracks | **Possible later.** Needs the licence checked per track (attribution, no-derivatives, commercial terms). The README explains how to add one and what the dancer clock needs |
| Original generated music | **Chosen.** Zero licensing risk, works offline, and gives the dancer an exact audio clock |

**Hindi and English.** Level 2 and the Nacho Aaj track provide Hindi content. The lyric line is original; the music is "dhol-inspired", a simple synthesiser approximation that does not copy any real song. **[NOT YET COLLECTED]:** review of the Hindi phrase and cues by a native speaker, and listener feedback on the sound.

Playback behaviour **[Implemented]**: music starts only on the dance button; pause, mute and volume controls; pausing the Rule Book pauses the music; if the browser blocks sound or has no Web Audio, a clear message appears and the dance continues silently on a beat clock **[Verified by automated test]** (Web Audio removed in the test).

## 6. Social sharing: Challenge a Friend

Social interaction is a core requirement, so sharing is designed in rather than added. **[Implemented]**

- **Puzzle creator:** type a line (3 to 8 words, validated), see the scramble, shuffle again, choose one of the three songs (with a play-to-preview button), optional nickname.
- **Challenge link:** the puzzle is encoded in the URL after `#challenge=`: the line, the shuffle the creator reviewed, the song and an optional nickname, and nothing else. No server, keys or personal data. Links made before songs and shuffles existed still open.
- **Friend experience:** opening the link shows "Maya challenged you!", then the exact puzzle (same shuffle) and, after solving, the dance to the creator's chosen song. A finished challenge offers reactions to copy and "Make your own puzzle".
- **Sharing options:** Copy link, Copy message, the phone's native share sheet when available, and WhatsApp, Telegram and Email buttons built as proper share URLs (`wa.me/?text=`, `t.me/share/url`, `mailto:`).
- **Honesty:** those buttons only open the app with a ready message. The text says "Nothing is sent until you do", and the game never claims a challenge was delivered. On `localhost` it warns that friends cannot open the link.
- **Purpose:** an invitation to take a movement break together. There are no scores, rankings or comparisons of bodies.
- **Safeguards:** all link data is validated (length, characters, a small unkind-word list, permutation check for the shuffle, song code); malformed links show a clear error instead of crashing. The word list is basic and is not moderation. **[Verified by automated test]**

## 7. The seven game design elements

| Element | In RHYTHM RUSH |
| --- | --- |
| **Players** | College students and young adults (about 18 to 24). One player per device; friends take part by exchanging challenge links. No accounts or live multiplayer. |
| **Goals** | Reconstruct each lyric, complete the dance, finish three levels, and invite a friend with a puzzle of your own. |
| **Rules** | Tiles are rearranged by drag, tap-swap or keyboard; the game detects the right order automatically; the dance starts only when the player presses the button; the routine can be paused or skipped; puzzles must pass validation; links are shared only by the player. |
| **Space** | Digital: the browser (puzzle, stage, cues). Physical: a clear patch of floor about two big steps each way, or a chair. The stage shows the dancer and "your spot" side by side to connect the two. |
| **Time** | No puzzle timer. Dance 39 to 42 seconds including the count-in. A level is planned at about 2 to 3 minutes, all three at about 8 to 10 (estimates). |
| **Resources** | A device with a browser, word tiles, generated music, the dancer animation, challenge links, and floor space. Internet only for opening or sending links. |
| **Conflict** | Friendly and non-violent: deciphering a scrambled line, remembering and following moves, keeping to the beat. Sharing is an invitation, not a contest. |

## 8. The hybrid balance (physical and digital / social)

The brief frames the game as about half physical activity and half digital and social interaction. **This is a design intent and it has not been measured.**

- **Physical:** the dance, about 35 to 40 seconds per level, with a seated version.
- **Digital and social:** the puzzle (no fixed length), reading the invitation, creating a puzzle, and sending and opening links.
- Because the puzzle has no timer, the split depends on how long players take. Puzzles are short on purpose (4 to 6 words). **[NOT YET COLLECTED]:** real timings. The stopwatch method is in `docs/PLAYTEST_PLAN.md` section 4. If puzzles take far longer than the dances, the plan is to shorten lines or lengthen routines, then re-test.

## 9. Design thinking: Empathise

**Status: [NOT YET COLLECTED].** No interviews have been done, and none are claimed. The needs below are **hypotheses from the team's own experience**, to be checked:

- H1: students who study or work at screens for long periods may welcome a short, fun reason to stand and move.
- H2: people are more willing to move when it feels like a game with friends, not exercise, and when a seated option carries no penalty.
- H3: a personalised puzzle from a friend feels more inviting than a generic invitation.
- H4: solving something first can lower the self-consciousness of dancing.

**Plan:** talk to 3 to 5 people aged 18 to 24 with open questions (How do you take breaks while studying? What makes you want, or not want, to move around others? What would make a shared game with a friend appealing?). Record in their words, using codes.

| Participant | Date | Break habits | Feelings about moving in games | What would make this appealing | Concerns |
| --- | --- | --- | --- | --- | --- |
| P1 | | | | | |
| P2 | | | | | |
| P3 | | | | | |

## 10. Design thinking: Define

**Problem statement (draft, unconfirmed):** *Students who sit for long periods need a low-pressure, enjoyable reason to move that they can share with friends. How might we make the physical activity and the digital social interaction equally engaging, so that neither feels like an add-on?*

The answer chosen: make the puzzle the key that unlocks the dance, and make the social act (sending a puzzle) the way the movement break spreads.

## 11. Design thinking: Ideate

Three concepts were compared. The scores are the team's **initial self-assessment** (1 weak, 5 strong), not data.

| Concept | Idea | Simplicity | Wellness value | Social | Originality | Hybrid balance | Feasibility | Total |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **RHYTHM RUSH** | Unscramble a song line, then dance to it; share your own puzzle | 4 | 4 | 5 | 4 | 4 | 4 | **25** |
| **MOVE & MATCH** | Screen shows a symbol or colour; players match it with a movement, faster each round | 5 | 4 | 3 | 3 | 4 | 5 | 24 |
| **MOOD IN MOTION** | Draw an emotion card and express it in movement while a friend guesses | 3 | 5 | 4 | 4 | 3 | 4 | 23 |

**Selected: RHYTHM RUSH.** It has the clearest separation between a digital half and a physical half, a natural social hook (the puzzle link), it demonstrates in two minutes, and music can be original. MOVE & MATCH has a thin digital part and a weak social part; MOOD IN MOTION depends on personal emotions, scoring is subjective, and it risks seeming to give emotional advice. Variations tried on paper: scored two-player turns (built in the first prototype, then removed), and timed puzzles (removed to keep the puzzle calm).

## 12. Design thinking: Prototype

Built as a working browser game (React, TypeScript, Vite). **[Implemented]**

1. **Song puzzle:** pointer-based drag board with reflow animation, tap-swap, keyboard control, automatic checking, a celebration burst.
2. **Dance:** a joint-angle rig for the shadow dancer (nine moves, seated variant), driven by the audio clock, with cues and the stage.
3. **Sharing:** the puzzle maker, link codec, share buttons and the friend's challenge flow.
4. **Rule Book:** short, covering the seven elements.
Prototype versions: v1 (scored two-player game, retired) and this redesign.

## 13. Design thinking: Test

### 13.1 Procedure (proposed, for real people)
Use `docs/PLAYTEST_PLAN.md`: 3 to 5 consenting participants aged about 18 to 24, an unassisted first play, a checklist, timing of puzzle, dance and social task, and a short interview. **[NOT YET COLLECTED]**

### 13.2 Testing actually completed: automated developer testing only
Run by the developer on Windows with desktop Google Chrome. **These are not user tests.**

| Check | Method | Result |
| --- | --- | --- |
| Type-check, lint, production build | `npm run check` | `npm run check` exited with code 0: type-check clean, lint clean, build succeeded |
| Puzzle pools (60 lines, 20 per level, no overlap, rising word counts, all pass the custom-puzzle validation), random selection that never repeats the previous puzzle, title-dancer movement (bone lengths never change, feet stay on the floor, motion is smooth and lively), puzzle logic, scramble and hints, Devanagari, dancer poses are finite and continuous at all beats, each move visibly changes, cue timing and count-in, every routine 20 to 45 s, challenge-link encode/decode and hostile inputs, share URLs, storage sanitising, emoji budget, Rule Book numbers match the code | Vitest | 81 tests in 7 files, all passed |
| Title tap and keyboard start; shuffled tiles; no submit, check or verify button; wrong arrangement is gentle and never shows the answer; automatic detection; invitation shown; music engine not created until the dance button; "not now" never starts music | Playwright | Passed |
| Mouse drag, keyboard move, tap-swap, nudge, shuffle again | Playwright | Passed |
| **All 60 level puzzles solved through the game** (each forced once by controlling the random number), with the success state and meaning shown; entering a level again varies the puzzle and the shuffle; the title art is three vector silhouettes on a transparent background | Playwright | Passed |
| All 10 Warm Up songs and all 5 specified Find the Beat puzzles: hints visible while solving, exact fragments (TOH, capitals, repeated words as separate tiles), a same-words-wrong-places arrangement is not accepted, the song title is shown once solved, the invitation names the real music | Playwright | Passed |
| Level 3 listening: no tiles or submit button, three distinct choices with one correct, sound starts only on Play, pause / resume / replay, the line is spoken over the clip, wrong then right answer feedback, a different second clip, then the usual dance and celebration; no Web Audio, no voice, and a voice that never starts all show a message and let the player continue; leaving silences the clip | Playwright (with a controllable stand-in voice) | Passed |
| Level 3 against the real browser engine (nothing faked): Play starts, 1 audio context, 8 voices reported, the clip runs to its end with no errors | Playwright | Passed. Engine events only: a person has not listened to it |
| Full Level 1 in real time: count-in, cues change on the beat, dancer pose changes, pause freezes dancer and cues, resume, automatic end, celebration, Next level, Level 2 Hindi line, progress saved | Playwright | Passed |
| Restart dance, dance again, end dance, seated version (chair shown, upper-body cues), audio-unavailable fallback, Rule Book opens during dance and pauses it, level replay and locking, refresh | Playwright | Passed |
| Puzzle maker validation, reviewed scramble matches the friend's puzzle, copy link (clipboard read back), friend opens real puzzle and song, share URLs for WhatsApp, Telegram and Email, native share present and absent, malformed and legacy links, Devanagari puzzle, paste-a-link | Playwright | Passed |
| Mobile (390 px, touch): no sideways scroll on title, puzzle, invitation, dance, pause, celebrate, create and Rule Book; controls at least 40 px; **finger drag** of a tile; taps after a drag | Playwright with touch emulation and raw touch input | Passed |
| Smoke test of the **deployed** site (`BASE_URL=... npm run test:e2e`): title start, no submit button, automatic detection, music waits for the button, create and share link opened in a second tab, malformed and legacy links, audio fallback, Rule Book, phone layout and touch drag | Playwright against the live GitHub Pages address | 8 selected tests passed (the full suite was run locally, not against the live site) |
| Visual inspection: title, puzzle states, invitation, dance (standing and seated), celebration, create screen, Rule Book, phone views; a contact sheet of every move at several beats | Screenshots reviewed by the developer | Done; defects found and fixed (section 14) |

Browser tests: 48 passed in the final full run.

### 13.3 What has NOT been tested
- **Any human playtest.** Understanding without coaching, enjoyment, comfort, whether the cues are easy to follow, and the real hybrid balance are all unknown.
- **Whether the moves are comfortable or safe** when actually performed.
- **How the music sounds** to real listeners, or its loudness on real speakers. Automated tests cannot hear.
- Real phones and tablets, Safari, Firefox, screen readers, high zoom, colour-vision checks, a contrast audit.
- Native Hindi review of the phrase, and cross-device sharing over the live site.

### 13.4 Playtest results

| Participant | Date | Unassisted start? | Puzzle time (s) | Dance time (s) | Followed the dance? | Comfort / enjoyment | Bugs / barriers |
| --- | --- | --- | --- | --- | --- | --- | --- |
| P1 | | | | | | | |
| P2 | | | | | | | |
| P3 | | | | | | | |
| P4 | | | | | | | |
| P5 | | | | | | | |

## 14. Design thinking: Refine (iteration log)

Entries 1 to 7 come from **developer testing**. Rows 8 onward are **placeholders for playtest-driven changes**; none has happened yet.

| # | Issue | Evidence | Change | Retest result |
| --- | --- | --- | --- | --- |
| 1 | After dragging a tile with a **finger**, later taps were ignored and the tile looked stuck | Automated touch-drag test: the event log showed `lostpointercapture` before `pointerup` because React moves the tile in the DOM during a drag, so the tile never heard the finger lift | Listen for pointer move, up and cancel on the window instead of relying on pointer capture | Regression tests: after a mouse drag and after a touch drag, no tile is left dragging and tapping swaps tiles. Passed, plus 12 repeated touch-solve rounds in a throwaway stress test |
| 2 | A dragged tile could overshoot its target and land one place too far | Mouse-drag test failed: dropped word was one slot off, because tiles of different widths reflow under the pointer | Swap only once the pointer passes the middle of the target tile | Mouse and touch drag tests pass |
| 3 | The **seated** dancer looked like a short standing figure, so "seated" was not communicated | Reviewed the pose contact sheet for seated mode | Added a visible chair with backrest and seat, spread the knees | Re-rendered the contact sheet: reads clearly as seated. Visual check only |
| 4 | Arms in front of the body (clap) vanished into the torso, and the arm-lift move passed through a T-pose on every beat | Pose contact sheet | Pale edge on arms; torso reshaped; arm lifts now peak on the beat; hips sway period matches its cue | Re-rendered contact sheet; unit tests check poses are finite, continuous and moving |
| 5 | The count-in cue wrapped off the screen and the beat dots fell below the fold on a 1280 x 720 screen | Screenshots at laptop and phone sizes | Shorter count-in cue ("Find your spot"), capped stage height, cropped stage on phones | Re-captured screenshots: fixed |
| 6 | Mobile title wordmark was clipped at the right edge | Phone screenshot | Smaller responsive size | Re-captured: fixed |
| 7 | Two of the new Hindi puzzle lines were wrong for the level: one had 4 words, one repeated a word so two tiles looked identical | New puzzle-pool unit tests failed on both lines | Rewrote both lines (5 distinct words each) | Pool tests pass; the 60-puzzle browser test passes |
| 8 | *[placeholder]* | *[playtest evidence]* | *[change]* | *[retest with whom, how, and result, including if it failed]* |
| 9 | *[placeholder]* | | | |

**Requirement note.** The assignment asks for at least one evidence-based improvement after testing. Entries 1 to 7 are genuine but come from the developer's testing. Add at least one change driven by a human playtest and re-test it before submission.

## 15. Accessibility, safety, ethics and privacy

**Accessibility [Implemented]**: keyboard play for puzzle and every control; tap-to-swap as an alternative to dragging; visible focus; skip link; focus moves on navigation; live regions announce puzzle progress; dance cues shown as large text as well as animation; seated version; reduced-motion preference turns off decorative motion (the dancer keeps moving, because it is the content); high-contrast cream-on-plum text; 44 px minimum controls. **Not yet tested:** screen readers, zoom, colour-vision, formal contrast audit.

**Safety**: safety line on the invitation and in the Rule Book; low-impact beginner moves; pause and skip always available; no pressure to perform. No camera or body tracking.

**Ethics**: friendly conflict only; no scores or body comparison; custom lines validated and checked against a small word list (not moderation); no fake friends or fake sharing success.

**Privacy**: no server, accounts, analytics or keys. Progress and sound settings are in the browser's localStorage. A challenge link contains only the line, song, shuffle and optional nickname, visible to anyone with the link.

## 16. Originality and copyright

- **Lyric lines:** original, written for this project. We did not search every existing song, so this is a good-faith statement; the lines are deliberately generic.
- **Music:** original, generated live. No recordings or third-party music services.
- **Graphics and animation:** original SVG and CSS, including the dancer rig and logo. No stock images, icon packs or video.
- **Fonts:** Bricolage Grotesque and Figtree (SIL Open Font License 1.1), bundled locally via `@fontsource-variable` packages.
- **Software:** React, Vite, TypeScript, Vitest, Playwright, ESLint (open-source licences).
- The UI does not copy any commercial game.

## 17. Limitations and future improvements

**Limitations**: the dancer is a simple front-facing figure with nine moves; completion is not checked, by design; music is synthesised and simple; Hindi unreviewed; only desktop Chrome and an emulated phone tested; no real playtests; the word filter is basic; a level in progress is not saved on refresh; sharing between devices needs the hosted site.

**Possible next steps (not built)**: playtest-driven tuning of puzzle length and routines; a native-speaker review and more Hindi lines; licensed or commissioned recorded music; side-view or more detailed dancer; more levels and a daily challenge; a screen-reader and contrast audit.

## 18. How to run, demonstrate and deploy

```bash
npm install
npm run dev          # http://localhost:5173
npm run check        # type-check, lint, unit tests, build
npm run test:e2e     # browser tests (needs Google Chrome)
npm run deploy       # publish to GitHub Pages (gh-pages branch)
```

**Live:** <https://heenaparmar-dotcom.github.io/Hybrid-Game-A1/>

**Demo script (about 5 minutes):** tap the title; drag the tiles (show a wrong order, then the right one, with no button); the invitation; pause and the seated switch on the dance; Level 2 (Hindi); Make a puzzle, preview, create, copy and open the link on a phone; open *How to play*.

## 19. Faculty discussion and feedback

**Status: [NOT YET COLLECTED].** No faculty feedback has been received or is claimed.

| Field | Entry |
| --- | --- |
| Date | |
| Faculty member(s) | |
| Questions asked | |
| Feedback on RHYTHM RUSH (their words) | |
| Feedback on the other two concepts | |
| Suggested changes | |
| Accepted, and why | |
| Not accepted, and why | |

## 20. Final reflection template

*Complete this only after real playtesting.*

1. What did we set out to achieve?
2. What did players actually do? (link to 13.4)
3. Was the hybrid balance reached? Evidence: stopwatch shares, perceived balance.
4. Which hypotheses (H1 to H4) were supported, partly supported or contradicted?
5. What surprised us?
6. What did we change because of evidence, and did it work? (link to section 14)
7. What would we change next?
8. What did we learn about designing for wellness without medical claims?
9. Individual contributions (if group work).
