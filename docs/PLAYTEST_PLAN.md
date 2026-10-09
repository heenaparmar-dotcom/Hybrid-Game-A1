# RHYTHM RUSH: Playtest Plan

This is a practical script for a real playtest with **3 to 5 consenting people** from the target audience (college students and young adults, about 18 to 24). Nothing in this file is a result. All observation tables are **blank on purpose**; fill them in only with what you actually see.

## 1. Before you start

**Set up**
- One laptop (or tablet) with the game running at its **Standard** timer settings (45 s puzzle, 120 s movement). Do not use the Quick demo preset for a playtest, because it shortens both phases and distorts the balance.
- About 2 metres of clear floor, plus one chair for seated play.
- A stopwatch or phone timer, this sheet (printed or open), and a pen.
- Clear the game's timing log first: Settings > Playtest timing log > Clear log.

**Consent and comfort (read aloud)**
- "This tests the game, not you. You can stop, skip or sit at any time, with no explanation needed."
- "Nothing is recorded by the game except timings on this device. I will take notes by hand. I will not record video or audio unless you agree."
- Ask: "Is there any movement you would prefer not to do?" Point out the seated option.
- Record participants by code (P1, P2...), never by full name.

## 2. Session script (about 25 minutes each pair or individual)

| Step | Minutes | What the facilitator does |
| --- | --- | --- |
| Welcome and consent | 3 | Read the consent text. Do not explain the rules. |
| **Unassisted start** | 2 | Say only: "Try to play one round." Start the stopwatch. Do not coach. Note every question asked and every pause longer than 10 s. |
| Round 1 (full turn each) | 8 | Observe. Intervene only for safety or if stuck for over 60 s (record that you intervened). |
| Quick interview | 4 | Ask the questions in section 5. |
| Round 2 with the Rule Book | 5 | Ask them to open the Rule Book during play. Note whether it helped. |
| Friend challenge task | 3 | Ask them to create a puzzle, copy the link, and open it in a second browser tab. |
| Wrap-up | 2 | Thank them. Ask for any other comments. |

## 3. Participant tasks

1. Start a two-player game (or solo), enter names and pick a theme, **without help**.
2. Solve the puzzle. Try one hint and one wrong answer on purpose if they have not already.
3. Play the track, and follow the movement for the full countdown (standing or seated, their choice).
4. Read the results screen and say out loud who won and why.
5. Repeat until a second theme unlocks (or note how many turns it took).
6. Create a puzzle, copy the link, open it in a new tab, and play it.
7. Open the Rule Book during play and find the scoring rules.

## 4. Observation checklist (one sheet per participant or pair)

Mark Y / N / partly, and add notes.

| # | Question | Y/N/partly | Notes (what you actually saw) |
| --- | --- | --- | --- |
| 1 | Started a game without coaching | | |
| 2 | Understood the puzzle goal without coaching | | |
| 3 | Found a way to move tiles without coaching (drag, tap-swap, keyboard) | | |
| 4 | Understood what the hint does and what it costs | | |
| 5 | Understood how the timer works | | |
| 6 | Understood the movement cues | | |
| 7 | Found the seated option, and felt free to use it | | |
| 8 | Understood that *they* confirm movement (no tracking) | | |
| 9 | Could explain how the score was calculated | | |
| 10 | Noticed the theme unlock progress | | |
| 11 | Created a puzzle and copied the link without help | | |
| 12 | The opened link loaded the actual challenge | | |
| 13 | Audio worked (and they noticed the Play button was needed) | | |
| 14 | Any technical bug or confusing moment (describe) | | |
| 15 | Any accessibility barrier (keyboard, contrast, text size, motion) | | |
| 16 | Any physical discomfort or safety issue | | |

## 5. Interview questions

Ask open questions and write down the answer in their words.
1. What did you think you were supposed to do when the game started?
2. Which part felt longest? Which felt shortest?
3. Did the screen part and the moving part feel balanced? Which felt bigger?
4. How did the movement phase feel (enjoyable, awkward, tiring, too long, too short)?
5. Was there anything you were unsure about, or that you wanted to skip?
6. Would you send a challenge to a friend? Why or why not?
7. What one thing would you change first?

Rate from 1 (strongly disagree) to 5 (strongly agree):

| Statement | P1 | P2 | P3 | P4 | P5 |
| --- | --- | --- | --- | --- | --- |
| The rules were easy to understand | | | | | |
| The movement phase was enjoyable | | | | | |
| The movement phase was comfortable for me | | | | | |
| The screen and movement parts felt balanced | | | | | |
| I would play again with friends | | | | | |

## 6. Measuring the 50/50 balance

The 50/50 split is the **design target**, not a proven fact. Gather both objective and subjective evidence.

**A. Stopwatch method (recommended).** For each full turn, time these phases by hand:
- Digital: from pressing *Start puzzle* until pressing *Start moving* (puzzle, feedback, listening, preview).
- Physical: from pressing *Start moving* until pressing *I completed it*.
- Count hand-over and reading pauses as digital unless the participants are standing and moving.

| Turn | Digital (s) | Physical (s) | Physical share = Physical / (Digital + Physical) |
| --- | --- | --- | --- |
| P_ turn 1 | | | |
| P_ turn 2 | | | |

**B. In-game timing log.** Settings > Playtest timing log shows puzzle, listen and movement screen time per turn and an average movement share. It does **not** include feedback or hand-over pauses, so it will tend to read as more physical than a stopwatch would. Use *Copy as CSV* to save it.

**C. Perceived balance.** Ask the interview question 3, and the 1 to 5 balance statement.

**How to judge.** Suggested working rule (a team decision, not a standard): a physical share of roughly 40% to 60% on the stopwatch method, and most participants calling it balanced, supports the target. If the share is outside this range, change the timers or the listening step and re-test. Write down your own criteria before the session.

## 7. Technical checks to repeat on each device used

| Check | Pass / Fail | Device, browser, notes |
| --- | --- | --- |
| Game loads and all screens are reachable | | |
| Puzzle works with touch (tap-swap) | | |
| Puzzle works with keyboard | | |
| Sound plays after pressing Play track | | |
| Sound stops when leaving the screen | | |
| Challenge link copies and opens the real puzzle | | |
| Layout fits the screen without sideways scrolling | | |
| Settings and unlocks survive a page refresh | | |

## 8. After the session

1. Copy the timing log (CSV) and save it with the date.
2. Transcribe your notes into the **Iteration log** in `docs/ASSIGNMENT_DOCUMENTATION.md`: issue, evidence, change, and re-test result.
3. Make at least one evidence-based change, then re-test that change with at least one person (or by repeating the failing task) and record the outcome honestly, including if it did **not** fix the problem.
