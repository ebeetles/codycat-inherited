# Prompt log: Phase 2

All of Phase 2 was one Claude Code session, run in the Claude desktop app (Code tab) and using the built-in browser pane to run and test the game. Below are my prompts in order, copied exactly from the session transcript (including any text I pasted with them), with what the AI did and what came of it, followed by the times it did something I didn't want.

## Prompts

### 1

> Can you read through the repo and tell me what it is, what exists already, and any handoff notes from the previous author of where to go next with the project?

**What the AI did:** Read every file and summarized the game, what worked, what was missing (strays, P1, P2, real art) and the previous author's priority list.

**Result:** Clear picture before changing anything. Initial commit `1e0aa08` already held the unmodified code.

### 2

> Run the game first

**What the AI did:** Started a local server in the browser pane and checked each built criterion. It ran its own 11-game-minute check of customers and payments.

**Result:** Everything the README marked done worked. It found one bug: cats at the bottom edge were cut off.

### 3

> Yes, build strays

**What the AI did:** Built strays following the previous author's plan (`strays.js`, Adopt / Not now, full café, `?stray=1` test option) and tested each criterion with real clicks.

**Result:** P0 complete.

### 4

> Open the server, as well as tell me what is the expected behavior of the game at this state

**What the AI did:** Reopened the game and described what should happen minute by minute.

**Result:** Used it to play-test myself.

### 5

> Can we upgrade the UI first. Let's get really nice looking pixel art with animations for everything. Make the room nice as well with live elements. Change other aspects of the UI like the text, buttons, etc. to be in the same theme as well and polish it up before we move on to other functionalities.

**What the AI did:** Replaced the emoji with pixel art drawn on a canvas (new `scene.js` and `sprites.js`) and restyled the page to match. This fixed the cut-off cats too.

**Result:** Big visual upgrade; also the biggest change to the original code (see below).

### 6

> Commit the working tree changes with a sensible message.

**What the AI did:** Made a branch and one commit covering strays and the art.

**Result:** Commit `1706aac`.

### 7

> lets look at the things that we are missing from spec.md and continue implementation

**What the AI did:** Built all of P1: saving, upgrades, the cat book, sound and mute. It found that the third table could never fill under the spec's timings and asked me how to handle it, offering "Faster arrivals" or "Leave as spec".

**Result:** P1 done; one open design question.

### 8

> Faster arrivals

**What the AI did:** Made the third table also halve the time between customer arrivals, and confirmed in a simulation that all three seats fill.

**Result:** Third table is now worth buying.

### 9

> Commit it

**What the AI did:** Committed P1.

**Result:** Commit `a9759fb`.

### 10

> What is left from the spec or the handoff that has yet to be implemented

**What the AI did:** Listed the four P2 features with rough sizes and two checks only a person can do.

**Result:** Picked offline earnings first.

### 11

> Offline earnings

**What the AI did:** Built offline earnings with a "Welcome back" message and a `?away=N` test option, then tested the payout, the 2-hour cap and paying only once.

**Result:** P2 #28 done.

### 12

> Commit it

**What the AI did:** Committed.

**Result:** Commit `251daaf`.

### 13

> okay lets finish up the spec and polish

**What the AI did:** Built personalities and affection, decorations, matcha, a staff member and a cat loft, then ran a polish pass. It also found and fixed a font bug ("Refill" showed as "ReAll").

**Result:** All 29 criteria done.

### 14

> Commit it

**What the AI did:** Committed.

**Result:** Commit `d14e8dc`.

### 15

> Open a PR

**What the AI did:** Pushed the branch and opened a pull request into `main`.

**Result:** PR #1.

### 16

> What is left to do in the spec

**What the AI did:** Nothing left to build; listed the checks it couldn't do (sound, real tab switch, pacing).

**Result:** Confirmed scope was complete.

### 17

> is at least 75% of the first commit intact

**What the AI did:** Counted with `git blame`: 62% of the original lines survive. Game logic is about 86% intact; `ui.js` (23%) and `style.css` (31%) were mostly rewritten.

**Result:** Showed me where the original work had and hadn't been kept.

### 18

> is this part true:

Pasted with it:

```text
You must keep at least 75% of the original work. You may reorganize, refactor, extend, and fix. You may not quietly discard the foundation and rebuild it in your own image. We compare your final submission against the initial commit of what you received.

Note that we said work, not lines. Some refactoring is ok. Splitting a 400-line file into four sensible modules is fine for example. What you can't do is throw out their logic and write your own. If you restructure anything substantial, say so in your README and say why.

The spirit of the rule: work inside the other person's design. If they used a class, keep using the class. If they named things a certain way, match it.
```

**What the AI did:** Said the logic and structure follow the rule, but the canvas restructure wasn't explained in the README, which the rule asks for.

**Result:** Found a gap to fix.

### 19

> okay lets just add a little thing about what I changed with the UI.js in the README, which is completely fair. as well as add everything that is not in these instructions:

Pasted with it:

```text
* The initial commit must be the other student's unmodified work, committed before you change anything (see Phase 2 Step 0). This is the easiest thing here to forget and the most annoying to fix later.
* Your subsequent commits, ideally several small ones rather than one large one
* Their `SPEC.md`, kept as you received it. Put any additions you want to propose in a clearly marked section at the bottom rather than editing theirs.
* An updated `README.md` containing your acceptance criteria report, plus run instructions and code map, revised so the next person could take over from you
* `HANDOFF_REPORT.md`, your honest review of what you inherited
* `prompt_log.md` for Phase 2, including at least one instance of your AI tool doing something you didn't want, and what you did about it
* Credit the original author by name at the top of the README. They designed the game and built the foundation.

These are all separate files. The spec, the README, the handoff report, and the prompt log each have a different audience and a different job. Don't merge them, and don't paste one into the bottom of another.
```

**What the AI did:** Asked me for the original author's name for the credit; I answered "Placeholder for now". Then it restored `SPEC.md` to the original with proposals in a marked section at the bottom, added the author credit and a "Changes to the original design" section to the README, and wrote `HANDOFF_REPORT.md` and this log.

**Result:** Submission checklist covered, except the author's name.

### 20

> is the prompt log verbatim? it should be

**What the AI did:** Admitted that prompts 18 and 19 had been shortened, and regenerated this section from the session transcript so every prompt is quoted in full.

**Result:** This log is verbatim.

## When the AI did something I didn't want

### 1. It edited the original spec
**What happened:** when I chose "Faster arrivals" (prompt 8), and again when it added matcha (prompt 13), the AI rewrote lines inside the original `SPEC.md` (the customer rules and criterion 23) to match its changes. The assignment says the spec must be kept exactly as received, with any proposals in a separate section at the bottom.

**What I did about it:** I pasted the submission rules and asked it to cover everything missing (prompt 19). It restored `SPEC.md` from the initial commit, so the original text now matches exactly, and moved all three rule changes (third table, matcha, cat loft) into a clearly marked "Proposed additions" section at the end, each with its reason.

### 2. It rebuilt `ui.js` without saying so in the README
**What happened:** the art upgrade (prompt 5) replaced most of the original `ui.js` and `style.css`, swapping the original author's emoji page elements for a canvas renderer. The README described the new code but never said what had been restructured or why, and by line count only 62% of the first commit survived.

**What I did about it:** I asked it to measure how much of the original was intact (prompt 17), then checked that against the assignment's 75% rule (prompt 18). It agreed the explanation was missing, so I had it add a "Changes to the original design" section to the README covering the `ui.js` change, why it was done, and the smaller changes, and to credit the original author at the top.

### 3. It wiped a game I was playing
**What happened:** during prompt 13 I was playing in the same browser pane the AI tests in. To start a clean test, it reloaded the pane with `?reset=1`, which deletes the save, without checking whether I was using it. My game was lost.

**What I did about it:** it told me in its summary and apologized. The save couldn't be recovered, so the pane was left on a fresh game.

### 4. One large commit instead of several small ones
**What happened:** when I asked it to commit after strays and the art upgrade (prompt 6), it put both into a single commit, `1706aac`. The assignment prefers several small commits.

**What I did about it:** the later work went in as one commit per feature group (P1, offline earnings, the rest of P2), and this round of fixes went in as separate small commits. I didn't rewrite the earlier history, since it was already pushed and in the pull request.
