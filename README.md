# Cozy Cat Café

A cozy, low-pressure cat café game for the browser. Cats wander around the shop, customers drop in and pay, strays turn up at the door, and you keep the cats fed. Progress is saved in the browser. The full design is in [`SPEC.md`](SPEC.md); this README covers how to run the game, what works so far, and where things live in the code.

## How to run

No install, no build step, no dependencies. It's plain HTML, CSS and JavaScript.

**Option A: open the file**
1. Clone or download this repo.
2. Open `index.html` in any desktop browser (Chrome, Firefox, Safari, Edge).

**Option B: local server** (if your browser blocks local files)
```
python3 -m http.server 8000
```
Then open http://localhost:8000.

**Option C: GitHub Pages** (if enabled on this repo)
Open the Pages URL shown under Settings → Pages.

### Test mode: faster time
Add `?speed=10` to the URL (for example `index.html?speed=10`) to run the simulation 10x faster. Useful for checking timers, hunger and customer payments without waiting. Normal play uses speed 1.

### Test mode: force strays
Add `?stray=1` to the URL to make a stray appear at the door right away, and to make every later stray check succeed (so the next stray arrives exactly 60 s after you adopt or turn one away). Combine with speed for quick checks: `index.html?stray=1&speed=10` brings a new stray 6 real seconds after each one is handled. Without `?stray=1`, each check uses the normal 50% chance.

### Test mode: start over
The game saves itself (see "Saving" below). Add `?reset=1` to the URL to delete the save and start a new game. Remove it again afterwards, or every reload starts over. Options combine, e.g. `index.html?reset=1&stray=1&speed=10`.

In the browser console, `Sound.status()` shows whether audio has started and whether it's muted.

## Controls

Mouse only.

| Action | What it does |
|---|---|
| **Refill food** button | Costs 10 coins. Adds 30 fullness to every cat (max 100). Shows "Not enough coins" if you have fewer than 10. |
| Click a cat | A heart pops up, a marker appears over the cat, and the panel below the shop shows its portrait, name, look, what it's doing and its fullness. Close the panel with the × button or Esc. Hovering a cat shows its name. |
| **Adopt** (when a stray is at the door) | Free. The stray walks into the shop with 100 fullness, the cat count goes up by 1, and it's added to the cat book. Disabled, with "The café is full", when the café is at capacity (3 cats, or 5 after the upgrade). |
| **Not now** (when a stray is at the door) | The stray leaves. Nothing else changes. It may come back another time. |
| **Cat book** button (book icon) | Every cat that can live in the café. Adopted cats show their portrait, look and a short description; the rest are locked silhouettes. |
| **Upgrades** button (shop icon) | Buy a **Third table** (100 coins; customers also try to arrive every 10 s instead of 20) and **Cozier café** (150 coins, room for 5 cats). Each can be bought once; Buy is disabled, with how many coins you still need, until you can afford it. |
| **Sound** button (speaker icon) | Mutes all music and sound effects; click again to turn them back on. The setting is saved. |

Things to know:
- Strays walk in through the door and sit just to its right with a "?" bubble; the left panel below the shop names them. Only one waits at a time, and it waits until you choose. Turned-away strays walk back out.
- The header shows your coins (with a coin icon) and cats / capacity (e.g. `1/3`). The coin count ticks up when customers pay.
- A fish bubble over a cat means it's hungry (fullness below 30). Floating "z"s mean it's asleep. The food bowl looks fuller or emptier with the cats' average fullness.
- Customers walk in from the door, sit at a table, and either sip coffee or wave a feather toy for the cats. The bar above them fills over their 30-second stay; then a coin pops up with the amount they paid and they walk out.
- Switching to another tab pauses the game and its sound.
- Sound starts after your first click or key press (browsers don't allow it sooner): a soft music-box loop, meows (each cat has its own pitch; when you pet a cat, when a stray arrives, and now and then on their own), a coin chime, the door bell, kibble rattling on refill, and little jingles for adopting and upgrades. It's all synthesized in the browser; there are no audio files.

### Saving
The game saves to your browser's local storage every 5 seconds, when you adopt or buy something, and when you leave or hide the page. A reload brings back your coins, cats (with their fullness), upgrades, cat book and sound setting; you don't get the starting coins or a second Cream again. Customers and a waiting stray aren't saved. If storage is blocked (some private windows), the game still works but starts fresh each time. To start over, use `?reset=1`.
- If the page looks unchanged after an update, hard-refresh (Cmd+Shift+R / Ctrl+Shift+R): the Python server lets browsers cache the files.

## Art style

### Direction
**Pixel art is the recommended style.** Any other healing, cozy style is also welcome. Whatever you pick, the game should feel calm, warm and gentle: soft colors, rounded or friendly shapes, nothing harsh or flashy.

**No emoji in the final art.** All art is now drawn pixel art in one style; keep it that way.

### What's there now: "evening at the café"
- **Mood:** the café is a warmly lit room at sunset, set in a dusky plum page with a few pixel stars, so the room glows. Sage wallpaper, honey-oak floor, dusty-rose rug, walnut wood, cream tablecloths.
- **Cats:** 20×14 side-view sprites with a 4-frame walk, sitting (tail swish, blinks) and curled-up sleeping (breathing). Eight looks: orange tabby (Cream only), gray tabby, black tuxedo with yellow eyes, white with blue eyes, cream tabby, blue gray with green eyes, brown tabby, tortoiseshell.
- **Upgrades show in the room:** until the Third table is bought its spot holds a potted fern; Cozier café adds a second (rose) cat bed.
- **Customers:** chibi people with a stable random look per customer (skin, hair style and color, shirt, pants).
- **Live room:** drifting clouds, the setting sun and an occasional bird in the window; a sunbeam with dust motes on the floor; twinkling string lights; pendant lamp glow; espresso machine and coffee cup steam; swaying plants and cat-tree toy; a wall clock showing your real local time; the door opening with a swinging bell when someone comes or goes.
- **Page chrome:** wooden header, parchment cards and honey/sage buttons with pixel-notched corners. Every border and offset is a whole number of art pixels.
- **Fonts:** Jersey 10 (title, numbers) and Pixelify Sans (everything else), from Google Fonts; a monospace fallback is used offline.
- **Scale:** the art is 320×200 pixels, drawn at the largest whole-number scale that fits the window (1× on phones, usually 2–3× on desktop), so pixels stay square and crisp.
- **Reduced motion:** with the OS "reduce motion" setting, ambient effects (dust, clouds, birds, twinkling, plant sway) and page animations are turned off; the cats and customers still move.

### Where to change it
- **Page colors and fonts:** the tokens at the top of `style.css` (`--dusk`, `--parchment`, `--walnut`, `--honey`, `--sage`, …).
- **Sprites** (cats, customers, icons, bowl): text grids in `sprites.js`, one character per pixel, with palettes. Cat fur colors are `CAT_PALETTES`; customer colors are `SKINS`, `HAIRS`, `SHIRTS`, `PANTS`.
- **Cats in the game:** `CONFIG.CAT_ROSTER` in `config.js` (name, look, cat book description). Add a look by adding a palette in `sprites.js` and a label in `CONFIG.CAT_LOOKS`.
- **Music and sounds:** `sound.js` (the chords and tempo are at the top; each effect is a small function in `EFFECTS`).
- **The room** (wall, floor, counter, window, door, decor): `drawRoom()` in `scene.js`, drawn once. Live details each have their own `draw…()` function in `scene.js`.
- **Where things stand:** `CONFIG.DOOR_POS`, `STRAY_POS`, `BOWL_POS`, `SEAT_POSITIONS` and `CAT_AREA` in `config.js` (game coordinates are 640×400, twice the art size).

## Acceptance criteria status

Numbers match `SPEC.md` section 4. "Done" means implemented and checked in the browser; the game was also run through 10-minute automated simulations (no out-of-bounds cats, never more customers than seats, every payment 20 + 5 × fed cats).

| # | Criterion | Status |
|---|---|---|
| 1 | Opens in a browser, no login | ✅ Done |
| 2 | Starts with 100 coins, Cream, 2 empty seats, `1/3` | ✅ Done |
| 3 | Cats walk / pause / sleep on their own, stay in the activity area | ✅ Done |
| 4 | Click a cat → name, fullness, heart | ✅ Done |
| 5 | Fullness starts at 100, −1 every 10 s, min 0 | ✅ Done |
| 6 | Hunger marker below 30, disappears at 30+ | ✅ Done |
| 7 | Refill food: −10 coins, +30 fullness to all cats, max 100 | ✅ Done |
| 8 | Refill with < 10 coins → "Not enough coins", nothing changes | ✅ Done |
| 9 | Stray check every 60 s, 50% chance, one at a time | ✅ Done (2,000 checks came out at 51%; no second stray while one waits) |
| 10 | 3+ stray looks; each cat has own id / name / fullness | ✅ Done (7 stray looks; Mochi and Tofu share a look but are different cats) |
| 11 | Adopt adds the stray, count +1, coins unchanged, fullness 100 | ✅ Done |
| 12 | At 3 cats, Adopt disabled + "The café is full" | ✅ Done (5 cats after the capacity upgrade) |
| 13 | "Not now" removes the stray, nothing else changes | ✅ Done |
| 14 | Next stray check 60 s after adopt / turn away | ✅ Done |
| 15 | Customer every 20 s if a seat is free, max 2 | ✅ Done (after the Third table: 3 seats, an arrival try every 10 s) |
| 16 | Customer stays 30 s, pays 20 + 5 × fed cats | ✅ Done |
| 17 | Each payment counted once, seat freed | ✅ Done |
| 18 | Cats at 0 fullness stay; customers and refills still work | ✅ Done |
| 19 | Runs 10 minutes with no double charges or overflows | ✅ Done (checked in the browser with `?speed=10` over 11 game minutes, before strays were added) |
| 20 | Pauses in background, no catch-up | ✅ Done |
| 21 | README explains how to test random events (e.g. force a stray) | ✅ Done: see "Test mode: force strays" above |
| 22 | Refresh restores coins, cats, fullness; no second Cream or starting coins | ✅ Done (also restores upgrades, cat book and sound setting; damaged saves start a new game) |
| 23 | Seats 2 → 3 for 100, cats 3 → 5 for 150, once each, not without coins | ✅ Done. The Third table also halves the arrival interval to 10 s (a spec change, now in `SPEC.md`), since with 20 s arrivals and 30 s stays the third seat never filled. Simulated: 28 → 57 customers per 10 minutes, all three seats full 95% of the time |
| 24 | Cat book: adopted cats with descriptions, others locked | ✅ Done (9 cats) |
| 25 | Mute button turns all music and effects off and back on | ✅ Done (audio start/stop checked in the browser; how it sounds still needs a listen) |
| 26–29 | P2 features | ❌ Not started |

## Code map

Scripts are plain (no modules) and load in this order from `index.html`: `config.js` → `cats.js` → `customers.js` → `strays.js` → `upgrades.js` → `save.js` → `sprites.js` → `sound.js` → `scene.js` → `ui.js` → `main.js`. Each file exposes one global object.

| File | Responsible for | Go here to change… |
|---|---|---|
| `index.html` | Page structure: header (coins, cat count, Cat book / Upgrades / Sound buttons, Refill), the `#shop` canvas and message bubble, door panel (Adopt / Not now), cat panel, the Upgrades and Cat book dialogs, script tags | Buttons, panels or dialogs on the page |
| `style.css` | The page chrome: header, buttons, panels, messages, page background. Color and font tokens at the top; sizes in `--px` (one art pixel) | Page colors, fonts, button and panel looks |
| `sprites.js` | `Sprites`: every sprite as a text grid + palette, turned into cached canvases. `cat(look, frame, facing)`, `customer(look, pose)`, `customerLook(id)`, `icon(name)` | How cats, customers and icons look; adding animation frames |
| `scene.js` | `Scene`: draws the room on the canvas each frame: static room (`drawRoom`), live details, cats, customers walking and sitting, the stray, effects (hearts, coins, sparkles, steam, z's). `catAt()` hit-tests clicks. Reads state, never changes it | The room, decor, ambient animation, effects |
| `config.js` | `CONFIG`: every number from the spec (costs, timers, chances, upgrade prices), layout positions, cat looks, the cat roster, save settings, the `?speed=`, `?stray=` and `?reset=` test options | Balance, timings, upgrade prices, where things stand, which cats exist |
| `cats.js` | `Cats`: `create(name, look)`, `restore(saved)`, `update(cat, dt)` (fullness decay + walk/idle/sleep behavior), `isHungry(cat)`, `refillAll(state)` | How cats move, hunger rules, feeding |
| `customers.js` | `Customers`: `update(state, dt, onPaid)` handles spawning (every `state.customerSpawnSeconds`: 20 s, or 10 s with the Third table), seating, the 30 s stay and checkout; `paymentFor(state)` computes the bill | Customer timing and payment rules |
| `strays.js` | `Strays`: `update(state, dt)` runs the 60 s check; `spawn(state)` puts a roster cat at the door; `adopt(state)` / `turnAway(state)` handle the two buttons (adopting also records the cat in the book); `canAdopt(state)` checks capacity | Stray timing, chance, which cats come by, what adopting does |
| `upgrades.js` | `Upgrades`: `LIST` (names and descriptions), `buy(state, id)` (returns `"bought"`, `"owned"` or `"poor"`), `canBuy`, `owned`, `apply(state)` (sets seats, arrival interval and cat capacity from what's owned) | What upgrades exist and what they do |
| `save.js` | `Save`: `write(state)`, `load()` (checked save or `null`), `clear()` | What gets saved |
| `sound.js` | `Sound`: `unlock()` (first input), `setMuted(bool)`, `play(name)`, `meow(catId)`, `status()`; music and effects synthesized with Web Audio | Music, sound effects, volumes |
| `ui.js` | `UI`: `init(handlers, state)`, `render(state)` (hands the state to `Scene`, then updates the header, panels and open dialog every frame), `showMessage(text)`, `showPayment`, `showRefill`, `showUpgrade`; picks the pixel scale, handles mouse input, builds the dialogs | Anything outside the canvas, clicks and hover |
| `main.js` | `createInitialState(saved)` (new game or loaded save), the button handlers, autosave, the `update(dt)` step, and the `requestAnimationFrame` loop with background pause | Starting state, adding a new system to the game loop |

### How the pieces fit
- **State** is one plain object (`state` in `main.js`): `coins`, `cats[]`, `customers[]`, `seats[]` (customer id or `null`, one per table), `customerSpawnTimer`, `customerSpawnSeconds`, `stray` (the cat at the door or `null`), `strayCheckTimer`, `upgrades` (`{ seats, capacity }`), `maxCats`, `book` (names of every cat ever adopted), `muted`. Only coins, cats, upgrades, book and muted are saved.
- **A stray is a normal cat object** made with `Cats.create()`. It isn't in `cats[]` while it waits, so it doesn't get hungry, count toward capacity or add to customer payments. Adopting moves the same object into `cats[]`.
- **Logic files never touch the DOM.** They change `state`; `UI.render(state)` redraws from it every frame. Keep this split when adding features.
- **Animation that isn't gameplay lives in `scene.js`.** Customers walking to and from the door, a stray walking in or leaving, and all effects are visual only: the game logic seats a customer and starts their 30 s the moment they arrive, and the scene shows them walking over. Walking runs on game time so `?speed=` keeps it in step; ambient effects run on real time.
- **Time** is in game seconds. The loop caps each frame's `dt` at 0.25 s and resets when the tab is hidden, so nothing catches up after the tab was in the background.

## What I'd do next (priority order)

All P0 and P1 features are in, with final pixel art. (The old bug where cats at the bottom edge were cut off is gone: cats are now positioned by their feet and fit inside the room.)

1. **Listen to the sound** in a normal browser: music volume, meows, coin, bell, kibble. It was only checked that audio starts, stops and mutes.
2. **Check the pause with a real tab switch** in a normal browser. It was only tested by faking the page's hidden state.
3. **P2**: decorations, cat personalities and affection, offline earnings (the save already stores `savedAt`), expanded management.
