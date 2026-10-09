# RHYTHM RUSH: Assignment Documentation

*A hybrid (digital + physical) wellness game. Solve the song. Catch the beat. Own the move.*

**How to read this document.** Statements are labelled so that nothing is mistaken for evidence:

- **[Implemented]**: exists in the prototype.
- **[Verified by automated test]**: checked by the project's own test suite (see section 16).
- **[Design hypothesis]**: a reasoned assumption that has **not** been confirmed by research.
- **[NOT YET COLLECTED]**: needs real people (playtests, faculty feedback). Left blank on purpose.

No participant, interview, statistic or faculty comment appears in this document unless a real one has been written into a template by the team.

---

## 1. Title and game overview

**RHYTHM RUSH** is a two-player (or solo) browser game for friends. Each turn has a digital half and a physical half:

1. **Solve:** unscramble an original song line on the screen (digital).
2. **Listen:** play an original, browser-generated track and preview the moves (digital).
3. **Move:** follow an animated silhouette through 8 simple moves, standing or seated (physical).
4. **Score and share:** collect points, unlock themes, then create a puzzle and send a challenge link to a friend.

**Core loop:** SCRAMBLE > SOLVE > LISTEN > DANCE > SCORE > UNLOCK > CHALLENGE A FRIEND.

## 2. Theme and wellness rationale

**Theme: wellness.** RHYTHM RUSH treats wellness as a mix of enjoyable physical movement, playful thinking, music and social connection. It deliberately avoids medical claims: the game does not claim to treat or reduce anxiety, depression or any condition, and it says so in the Rule Book.

**Why a puzzle plus dance?** [Design hypothesis] Many people spend long periods seated at screens. A short, playful reason to stand and move, anchored to something fun (music) and shared with a friend, may feel more approachable than "exercise". The puzzle gives a low-pressure warm-up for the mind and also makes the screen part a real, necessary half of the game instead of decoration.

## 3. Problem framing and design opportunity

**Design question (How might we...):** *How might we give college students a short, friendly reason to get up and move together, without making it feel like a workout or a test?*

**Design hypothesis, not research.** The following are assumptions to test, not findings:
- H1: Students in study-heavy routines often sit for long stretches, and a 4-minute break built around music could be welcome.
- H2: People are more willing to move when the activity feels like a game and when there is a seated option with no penalty.
- H3: Sending a self-made puzzle to a friend is more personal and more fun than sending a generic invite.
- H4: A puzzle phase before the dance reduces self-consciousness by giving everyone a shared, structured start.

No survey, interview or statistic supports these yet. See section 13 for how they will be checked.

## 4. Target audience and player count

- **Target audience:** college students and young adults, about 18 to 24.
- **Players:** exactly **2** in the core mode (friendly turn-based competition on one device), plus an optional **solo practice** mode.
- **Not designed for:** medical or rehabilitation use, or for children under the target age without adaptation.

## 5. Game concept and core loop

See section 1 for the loop. Key design choices **[Implemented]**:

- One device, no accounts: players hand over the screen between turns.
- Original song lines grouped by three themes; each theme has its own generated music (tempo and instruments) and its own ordering of moves.
- Both the puzzle and the movement can be skipped without ending the game, so there are no dead ends.
- A self-contained challenge link carries a friend's custom puzzle.

## 6. Alternative game ideas

### 6.1 RHYTHM RUSH: song puzzle plus dance (selected)
Unscramble a song line, listen, then dance a short sequence. Digital-to-physical hand-off is clear: the screen leads, the body follows. Social layer: custom puzzle links.

### 6.2 MOVE & MATCH: digital prompts linked to physical movement
The screen flashes a symbol or colour pair; players must match it with a movement (for example blue = arms up, orange = step side). Matching speeds up over time. Simple to learn and quick to build. Weaker points: the digital part is thin (mostly reading prompts), and the social/sharing element is less obvious.

### 6.3 MOOD IN MOTION: emotion cards linked to expressive movement
Players draw a digital emotion card (for example "calm", "bouncy", "proud") and express it with movement while a friend guesses. Strong expressive and social potential. Weaker points: it can feel personal or awkward for some players, the scoring is subjective, and it needs careful wording to avoid appearing to give emotional or therapeutic advice.

## 7. Concept comparison matrix

Scores are the team's **initial self-assessment** from 1 (weak) to 5 (strong), **not** measured data. They are unweighted and should be revisited with faculty feedback and playtests.

| Criterion | RHYTHM RUSH | MOVE & MATCH | MOOD IN MOTION |
| --- | --- | --- | --- |
| Simplicity to learn | 4 | 5 | 3 |
| Wellness value | 4 | 4 | 5 |
| Social interaction | 5 | 3 | 4 |
| Originality | 4 | 3 | 4 |
| Physical / digital balance (target) | 4 | 4 | 3 |
| Feasibility (build time, risk) | 4 | 5 | 4 |
| **Total (out of 30)** | **25** | **24** | **23** |

The totals are close. The decision below rests on the qualitative reasons as much as on the sums.

## 8. Why RHYTHM RUSH was selected

- It gives the clearest, most separable digital and physical halves, which makes the 50/50 requirement something we can plan and measure.
- Its social hook (create and share a puzzle) fits the social-media-inspired requirement without needing any social network.
- It is easy to demonstrate live in a classroom in about two minutes.
- Music is original and generated, so copyright risk is low.
- It is less personal than MOOD IN MOTION and richer than MOVE & MATCH.

**Trade-offs accepted:** movement is self-reported, and the dance guide is a simple silhouette.

## 9. Faculty discussion and feedback

**Status: [NOT YET COLLECTED].** No faculty feedback has been received or is claimed. Use this template during the discussion.

| Field | Entry |
| --- | --- |
| Date | |
| Faculty member(s) (as permitted to be named) | |
| Concepts presented | |
| Questions asked by faculty | |
| Feedback on RHYTHM RUSH (in their words) | |
| Feedback on the other two concepts | |
| Suggested changes | |
| Which suggestions we accepted, and why | |
| Which suggestions we did not accept, and why | |
| Follow-up actions and owners | |

## 10. The seven game-design elements

| Element | Role in RHYTHM RUSH |
| --- | --- |
| **Players** | Two friends (18 to 24) taking turns on one device, or one solo player. Turn order is always shown; the highest round total wins; ties are shared. |
| **Goals** | Solve the song puzzle, complete the movement, earn points, unlock themes, and challenge a friend with a custom puzzle. |
| **Rules** | 45 s puzzle timer, hints cost 20, one score per action, self-confirmed movement, seated option scores the same, themes unlock every 2 song-and-dance turns. Full rules in the Rule Book. |
| **Space** | Digital space: the browser interface. Physical space: about 2 m of clear floor or a chair. The screen directs; the body performs. |
| **Time** | Planned 2:00 digital (45 s puzzle, about 30 s listen, about 45 s feedback and hand-over) and 2:00 physical (120 s movement). Timers are configurable. |
| **Resources** | Word tiles, timer, generated audio, movement animation, points, hints, themes and challenge links. |
| **Conflict** | Friendly: time pressure, puzzle difficulty, score comparison, and finishing the movement. No elimination, no violence, no body judgement. |

## 11. Rule Book summary

The full standalone manual is [`RULE_BOOK.md`](RULE_BOOK.md) and is also built into the game (Rule Book button, available on every screen and during play). In short:

- Solve the line in 45 s, then listen, then move for 2 minutes (standing or seated).
- Score: 100 correct + up to 50 speed bonus - 20 per hint (min 0 for puzzle points) + 100 for completed movement. Best turn: 250.
- Skipping or timing out is allowed and earns 0 for that part.
- Every 2 song-and-dance turns (puzzle solved **and** movement completed) unlock the next theme.
- Challenge links contain only a phrase and an optional nickname.

## 12. How the game aims for a 50/50 hybrid experience

**50/50 is the design target. It has not been validated with players.**

Planned time per standard turn:

| Phase | Type | Planned time | Nature of the limit |
| --- | --- | --- | --- |
| Puzzle countdown | Digital | 45 s | Hard limit |
| Listening and move preview | Digital | about 30 s | Soft guide |
| Feedback and hand-over | Digital | about 45 s | Allowance (estimate) |
| **Digital total** | | **about 120 s** | |
| Movement countdown | Physical | 120 s | Hard limit |

How the design keeps the halves balanced **[Implemented]**:
- A visible step track (Solve / Listen are marked Digital, Move is marked Physical) and a split bar on the home screen make the intent clear to players.
- The timers are configurable, and a Quick demo preset exists for classroom demos (not for playtests).
- The movement score (100) is as large as the base puzzle score, so neither half is a side activity.
- The game logs puzzle, listening and movement **screen time** per turn (Settings > Playtest timing log) and shows the movement share on the results screen.

Limits of that measurement: the log excludes feedback and hand-over pauses, the listening step is not enforced, and it records screen time rather than how players feel about the balance. The stopwatch method in [`PLAYTEST_PLAN.md`](PLAYTEST_PLAN.md) section 6 is needed to judge the real split. The planned numbers add up to 2:00 / 2:00 by design; real sessions may differ, and if they do, the timers should be adjusted.

## 13. Design-thinking process

| Stage | Purpose | Status |
| --- | --- | --- |
| **Empathise** | Understand the target audience's routines and attitudes to movement and games | **[NOT YET COLLECTED]** See plan below |
| **Define** | Turn what we learn into a problem statement | Draft problem statement and hypotheses H1 to H4 in section 3 (unconfirmed) |
| **Ideate** | Generate and compare concepts | Done: three concepts compared in sections 6 and 7 (team judgement) |
| **Prototype** | Build something playable | Done: working browser prototype **[Implemented]** |
| **Test** | Check with real users | Automated developer testing done (section 16). **Human playtests [NOT YET COLLECTED].** |
| **Refine** | Improve from evidence | Two developer-testing refinements logged (section 17). Playtest-driven refinements pending. |

**Empathise plan (to do).** Talk to 3 to 5 people aged 18 to 24 using short, open questions: How do you take breaks while studying? What makes you want, or not want, to move around others? What would make a shared game with a friend appealing? Record answers in the table below, in the participant's words, using codes instead of names.

| Participant code | Date | Break habits | Feelings about movement games | What would make this appealing | Concerns |
| --- | --- | --- | --- | --- | --- |
| P1 | | | | | |
| P2 | | | | | |
| P3 | | | | | |

**Insights from empathy work:** *(to be written only after real interviews)*

## 14. Original media and copyright statement

- **Song lines:** 14 original demo phrases were written for this project and are labelled as original demo content in the code. They are not lyrics from any commercial song. We did not search every existing song, so this is a good-faith statement; phrases are deliberately generic and short. Players creating their own puzzles are asked to use their own words or words they have permission to use.
- **Music:** generated live in the browser with the Web Audio API (`src/lib/audio.ts`). No recordings are used or downloaded.
- **Graphics:** logo, tiles, backgrounds and the dance silhouette are original CSS and SVG. No stock images, icon packs or web fonts are used.
- **Software:** React, Vite, TypeScript, Vitest, Playwright and ESLint (open-source licences).
- **Emoji:** the game uses 10 emoji as a special communication mode, always with text labels. They are standard Unicode characters rendered by the user's system.
- **To use licensed audio instead:** place the file in `public/audio/`, reference it from a small audio player component, and record its licence in this section. The prototype does not do this.

## 15. Accessibility, safety, ethics and privacy

**Accessibility [Implemented]**
- Keyboard play for the puzzle, all buttons and dialogs; visible focus outline; skip link; focus moves to the page content on navigation.
- Three ways to move tiles: drag, tap-to-swap, keyboard.
- Large touch targets (the automated mobile test checks that interactive controls are at least 40 px).
- Dark theme with high-contrast text; text labels accompany every emoji and icon action.
- Reduced motion: the animated guide defaults to off when the system requests reduced motion, and can be toggled in Settings; the written cue is always shown.
- Live regions announce puzzle feedback and low time.
- **Not yet tested:** screen readers, high-zoom layouts, colour-vision simulations, and a formal contrast audit.

**Safety**
- Safety checklist on the movement screen and in the Rule Book; beginner-friendly low-impact moves; **Pause** and **Skip** always available.
- Seated / low-impact alternative that earns identical points, so no one is penalised for choosing it.
- No claim of medical benefit; no body measurement or tracking.

**Ethics**
- No violence, body-shaming or offensive content. Conflict is friendly.
- Creator phrases are validated (length, characters) and checked against a small basic word list. This is a limited safeguard, not moderation.
- No fake friends, fake feeds or simulated sharing success. The game never claims a challenge was posted anywhere.

**Privacy**
- No camera, microphone, location or biometric data. No server, accounts, analytics or API keys.
- Names, settings, unlocks and scores stay in the browser's localStorage.
- Challenge links contain only the phrase and an optional nickname (visible to anyone who has the link).

## 16. Testing plan and actual results

### 16.1 Plan
Human playtest script, observation sheet and 50/50 measurement method: [`PLAYTEST_PLAN.md`](PLAYTEST_PLAN.md).

### 16.2 Actual results so far: automated developer testing only

These were run by the developer on a Windows machine with desktop Google Chrome. **They are not user tests.**

| Check | Method | Result |
| --- | --- | --- |
| Type-check, lint, production build | `npm run check` | `npm run check` exited with code 0: type-check clean, lint clean, build succeeded |
| Scoring, scrambling, hints, session flow, theme unlock, storage sanitising, challenge-link encode/decode/validation, emoji budget, Rule Book numbers match code | Vitest unit tests | 48 tests in 4 files, all passed |
| Full journey (Home > Setup > Puzzle > Music > Dance > Results > Theme unlock > Next round), two players | Playwright | Passed |
| Incorrect answer, hint, no duplicate scoring, timeout, skip puzzle, skip movement, seated scoring | Playwright | Passed |
| Pause/Resume, Rule Book during play pauses timer, keyboard tile movement, restart, leave confirmation, name validation | Playwright | Passed |
| Create puzzle validation, preview, copy link (clipboard checked), open link in a second tab and play the real challenge, malformed links, paste link, native share present/absent | Playwright | Passed |
| Refresh persistence of settings and theme unlock | Playwright | Passed |
| Audio fallback when Web Audio is unavailable | Playwright (AudioContext removed) | Passed; game continues |
| Mobile layout (375 x 667 emulated viewport, touch): no sideways scroll, targets at least 40 px, tap-to-swap, full round | Playwright emulation | Passed |
| Dance figure animates and freezes when paused | Playwright (computed transforms) | Passed |
| Visual inspection of Home, Puzzle, Dance (standing, seated) | Screenshots reviewed by the developer | Done; one defect found (section 17) |

Counts at the time of writing: 48 unit tests passed; 22 browser tests passed in a clean full run. In one earlier full run, a single browser test failed with `net::ERR_NETWORK_CHANGED` while loading the page (a transient network event on the test machine); it passed when re-run alone and in the later full run. Reproduce with `npm run check` and `npm run test:e2e`.

### 16.3 What has NOT been tested
- **Any real human playtest** (understanding rules without coaching, enjoyment, comfort, real 50/50 balance): [NOT YET COLLECTED].
- **A real movement session.** The movement phase was only tested as software (timers, buttons, scoring). No one has verified that the moves are comfortable or well explained.
- Real audio output quality or loudness on speakers and headphones (automated tests cannot hear).
- Real phones and tablets, Safari and Firefox, screen readers.
- Sharing between two devices over a hosted URL, and the real native share sheet on a phone.

### 16.4 Playtest results

| Participant | Date | Unassisted understanding | Digital time (s) | Physical time (s) | Comfort / enjoyment notes | Bugs / barriers |
| --- | --- | --- | --- | --- | --- | --- |
| P1 | | | | | | |
| P2 | | | | | | |
| P3 | | | | | | |
| P4 | | | | | | |
| P5 | | | | | | |

## 17. Iteration log

Entries 1 and 2 come from **developer testing**. Rows 3 onward are **placeholders for playtest-driven changes**; none has happened yet.

| # | Issue | Evidence | Change | Retest result |
| --- | --- | --- | --- | --- |
| 1 | The unlock rule was ambiguous. "Round" means a pair of turns in two-player mode, so "two completed rounds" could be read two ways. | Found while writing the automated unlock test: one two-player round gives two successful turns, which unlocks the next theme. | Defined the unit as a **song-and-dance turn** (puzzle solved and movement completed, counted per player turn). Updated the screens, Rule Book (in-app and `docs/RULE_BOOK.md`), and README. The decision on whether "round" in the brief should mean a turn is flagged for faculty (section 9). | Unit test and Playwright test confirm one solo turn gives 1 of 2, the second unlocks Retro Rewind, and a two-player round unlocks it too. A unit test checks the Rule Book wording matches the code. |
| 2 | The Pause button icon looked like a single block, not two bars. | Seen in a screenshot of the Dance screen during developer inspection (the bars' gap was too small at 20 px). | Widened the gap between the two bars in the icon path (`src/components/Icon.tsx`). | Re-captured the button after the change: two separate bars are now visible. Automated tests do not check icon appearance, so this was a visual check by the developer. |
| 3 | *[placeholder]* | *[evidence from playtest: observation, quote, timing]* | *[change]* | *[retest with whom, how, and the result, including if it failed]* |
| 4 | *[placeholder]* | | | |
| 5 | *[placeholder]* | | | |

**Requirement note.** The assignment asks for at least one evidence-based improvement after testing. Entries 1 and 2 are real but come from developer testing. Add at least one change driven by a human playtest and re-test it before submission.

## 18. Known limitations and future improvements

**Known limitations**
- Movement completion is self-reported by design; there is no tracking.
- The silhouette is a simple front-facing figure; some moves (for example step-touch) are approximated. Written cues are always shown.
- 50/50 balance is a design target and unvalidated. The timing log excludes hand-overs and feedback.
- Challenge links work between devices only if the game is hosted publicly.
- The content filter is a small word list, not moderation.
- A round in progress is not saved on refresh.
- Only desktop Chrome and an emulated mobile viewport were tested.
- Synthesised music is simple.

**Possible future improvements** (not implemented)
- Real playtest-driven tuning of timers and moves.
- Optional recorded, properly licensed music.
- More themes and phrase packs, and a daily challenge.
- Better movement illustrations or a side-view figure; per-move difficulty levels.
- A screen-reader and colour-contrast audit.
- Optional two-device play with a shared room (would require a backend, which the assignment avoids).

## 19. How to run and demonstrate the prototype

```bash
npm install
npm run dev        # open http://localhost:5173
```

Class demo, about 5 minutes:
1. Settings > **Quick demo** for both timers (20 s puzzle, 24 s movement). Use **Standard** for real playtests.
2. Start game > two names > Fresh Beats. Show the step track (Digital / Digital / Physical).
3. Player 1: Start puzzle, make a wrong answer, use a hint, solve, Continue. Play track, adjust volume, Continue to movement. Show **Seated / low-impact** and Pause.
4. Player 2 takes a turn. Show the results, the winner, and the theme unlock banner (Retro Rewind).
5. Create a puzzle, make a link, copy it, open it in a second tab. Mention that a public host is needed for friends.
6. Open the Rule Book during play. Show Settings > Playtest timing log.
7. Reset for the next audience: Settings > Reset progress and scores.

Checks: `npm run check` (type-check, lint, unit tests, build) and `npm run test:e2e` (browser tests).

## 20. Final reflection template

*To be completed after real playtesting. Do not fill in before the evidence exists.*

1. **What did we set out to achieve?** *(your words)*
2. **What did players actually do?** *(link to observations in 16.4)*
3. **Was the 50/50 target met? Evidence:** *(stopwatch shares, perceived balance)*
4. **Which hypotheses (H1 to H4) were supported, partly supported or contradicted?** *(table)*
5. **What surprised us?**
6. **What did we change because of evidence, and did it work?** *(link to iteration log)*
7. **What would we change next?**
8. **What did we learn about designing for wellness without making medical claims?**
9. **Individual contributions** *(if group work)*
