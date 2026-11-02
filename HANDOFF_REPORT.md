# Handoff report: Cozy Cat Café

An honest review of the project as I received it from Oulan, at commit `1e0aa08` ("Initial commit: unmodified code as received").

## What I received

A browser game, about 900 lines of plain HTML, CSS and JavaScript in 9 files, with no build step or dependencies:

- **`SPEC.md`:** the full design, with 29 numbered acceptance criteria split into P0 (core), P1 and P2.
- **`README.md`:** run instructions, a status table for every criterion, a code map, and a prioritized "What I'd do next" list.
- **The game:** the core loop worked. Cats walked, idled and slept; fullness dropped over time; Refill fed every cat; customers arrived, sat, stayed and paid; the game paused in a background tab.
- **Not built yet:** strays (the last core feature), any saving, and all of P1 and P2. All art was emoji placeholders.

## What was good

- **The spec is excellent to work from.** Every rule has a number, and every number is testable ("Fullness drops by 1 every 10 seconds, to a minimum of 0"). It even says what to cut first if time runs short. I never had to guess what "done" meant for P0 or P1.
- **The architecture made extending it easy.**
  - Every tunable number lives in `CONFIG`.
  - The game state is one plain object.
  - Each logic file is one global object (`Cats`, `Customers`).
  - Logic never touches the page; `UI.render(state)` redraws from state every frame.
  - I added nine new modules in the same pattern without changing that design.
- **The README was honest.** Every criterion it marked ✅ held up when I checked it in the browser:
  - start state, hunger, refill and "Not enough coins";
  - an 11-game-minute run at 10x speed in which 33 customers each paid exactly once, every payment matched `20 + 5 × fed cats`, and there were never more than 2 customers;
  - the background pause with no catch-up.

  The ⚠️ and ❌ rows were accurate too.
- **The handoff plan worked as written.** The "What I'd do next" list described exactly how to build strays: which state fields, a new `strays.js` with `update`, `adopt` and `turnAway`, where to call it, and the test option to add. I followed it and it fit. There was even a `TODO` in `createInitialState()` marking the spot.
- **Careful time handling.** Each frame's time step is capped and reset when the tab returns, so the game never jumps ahead or double-charges after being in the background. That's an easy thing to get wrong, and it was right from the start.

## Problems I found

- **Bug: cats at the bottom edge were cut off.** The cats' walking area went down to y = 370, but the shop's visible height was only 392 px (its 4 px border is counted inside the 400 px). Cats were drawn centered on their position and are about 80 px tall, so near the bottom their lower half and name label were hidden. I fixed it as part of the art rework by positioning cats by their feet.
- **The last core feature was missing.** Strays (criteria 9–14) weren't started, and the test option for random events (#21) was partial. The README said so plainly.
- **All art was placeholder.** The README said the emoji had to be replaced with drawn art, so this was expected, but it meant the presentation layer had to be rebuilt rather than extended. That's the main reason `ui.js` and `style.css` changed so much (see "Changes to the original design" in the README).
- **The README's "10-minute automated simulation" wasn't in the repo.** The claim turned out to be true when I re-ran an equivalent check, but the script itself was never committed, so the next person couldn't re-run it.
- **Problems in the spec itself:**
  - **The third table could never fill.** A customer arrives at most every 20 seconds and stays 30, so there are never more than two inside. The upgrade in #23 adds a seat that, by the spec's own numbers, never gets used. I confirmed this in a simulation and proposed a fix at the bottom of `SPEC.md`.
  - **#29 is vague.** It asks for "one new drink" and "one shop expansion" without saying what either does, so I had to design both.
  - **The collection book can't be completed under the spec's limits.** Cats can't be released and the cap is 5, so no more than 5 cats can ever be adopted. Any book longer than that (the original config already listed 8 stray names plus Cream) can never be filled. I made the shop expansion raise the cap to 9 for that reason.

## What it was like to take over

Smooth. Between the numbered spec, the accurate status table and the concrete next-step plan, I had a working stray feature in the first session, and I never found the code doing something different from what the README said. The parts I rebuilt (drawing and page styling) were ones the original author had already flagged as temporary. The parts they treated as foundation (rules, timing, state, structure) are still theirs.

If I could suggest one thing to the original author: commit the test scripts behind claims like "ran a 10-minute simulation", so the next person can repeat the check instead of taking it on trust.
