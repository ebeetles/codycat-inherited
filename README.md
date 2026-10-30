# Cozy Cat Café

A cozy, low-pressure cat café game for the browser. Cats wander around the shop, customers drop in and pay, and you keep the cats fed. The full design is in [`SPEC.md`](SPEC.md); this README covers how to run the game, what works so far, and where things live in the code.

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

## Controls

Mouse only.

| Action | What it does |
|---|---|
| **Refill food** button | Costs 10 coins. Adds 30 fullness to every cat (max 100). Shows "Not enough coins" if you have fewer than 10. |
| Click a cat | Shows its name and fullness in the panel below the shop, plus a heart. Close the panel with ✕. |

Things to know:
- 🪙 in the header is your coin balance; 🐱 shows cats / capacity (e.g. `1/3`).
- 🍽️ above a cat means it's hungry (fullness below 30). 💤 means it's sleeping.
- A customer shows ☕ (drinking coffee) or 🐾 (playing with cats). The bar under them fills up over their 30-second stay; then they pay and a `+25 🪙` effect appears.
- Switching to another tab pauses the game. Refreshing starts a new game (no saving yet).

## Art style

### Direction
**Pixel art is the recommended style.** Any other healing, cozy style is also welcome. Whatever you pick, the game should feel calm, warm and gentle: soft colors, rounded or friendly shapes, nothing harsh or flashy.

**No emoji in the final art.** The emoji currently in the game are temporary placeholders only. Replace all of them (cats, customers, furniture, status icons, coins, hearts) with drawn art in one consistent style.

### What's there now (placeholder art)
- **Mood:** warm and soft. Cream background, beige wall, light wood floor, burnt-orange buttons.
- **Cats:** a colored circle with a 🐱 face; the circle's color is the cat's fur color (orange, gray, black, white).
- **Everything else:** emoji (🚪 door, 🥣 bowl, 🪑 seats, 🧑 customers, ☕ / 🐾 activity, 💤 sleeping, 🍽️ hungry).
- **Layout:** one top-down room. The wall strip at the top holds the door, bowl and seats; the floor below is where cats wander.
- **Feedback:** hearts and `+25 🪙` float up and fade out.

These emoji are placeholders only and should all be replaced (see "No emoji" above). Do this after the stray feature is working, since strays are the last missing P0 feature.

### Where to change it
- **Colors:** the CSS variables at the top of `style.css` (`--bg`, `--wall`, `--floor`, `--accent`, …).
- **Cat look:** `.cat-body` in `style.css`, built in `createCatEl()` in `ui.js`. Fur colors are in `CONFIG.CAT_LOOKS` in `config.js`.
- **Customers, door, bowl, seats:** the emoji in `ui.js` (`renderCustomers`, `init`) and `index.html`.
- **Pixel-art tip:** if you add sprite images, add `image-rendering: pixelated;` to their CSS so they stay crisp when scaled, and keep sizes in whole multiples (e.g. 16 px art drawn at 48 px).

## Acceptance criteria status

Numbers match `SPEC.md` section 4. "Done" means implemented; the game logic was also run through a 10-minute automated simulation (no out-of-bounds cats, never more than 2 customers, every payment 20 + 5 × fed cats).

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
| 9 | Stray check every 60 s, 50% chance, one at a time | ❌ Not started |
| 10 | 3+ stray looks; each cat has own id / name / fullness | ⚠️ Partial: looks are defined in `config.js` and each cat already has its own id/name/fullness, but strays don't exist yet |
| 11 | Adopt adds the stray, count +1, coins unchanged, fullness 100 | ❌ Not started |
| 12 | At 3 cats, Adopt disabled + "The café is full" | ❌ Not started |
| 13 | "Not now" removes the stray, nothing else changes | ❌ Not started |
| 14 | Next stray check 60 s after adopt / turn away | ❌ Not started |
| 15 | Customer every 20 s if a seat is free, max 2 | ✅ Done |
| 16 | Customer stays 30 s, pays 20 + 5 × fed cats | ✅ Done |
| 17 | Each payment counted once, seat freed | ✅ Done |
| 18 | Cats at 0 fullness stay; customers and refills still work | ✅ Done |
| 19 | Runs 10 minutes with no double charges or overflows | ✅ Done (checked in the logic simulation; worth a quick manual check in the browser with `?speed=10`) |
| 20 | Pauses in background, no catch-up | ✅ Done |
| 21 | README explains how to test random events (e.g. force a stray) | ⚠️ Partial: `?speed=10` exists; a "force a stray" test option still needs adding with the stray feature |
| 22–29 | P1 / P2 features | ❌ Not started |

## Code map

Scripts are plain (no modules) and load in this order from `index.html`: `config.js` → `cats.js` → `customers.js` → `ui.js` → `main.js`. Each logic file exposes one global object.

| File | Responsible for | Go here to change… |
|---|---|---|
| `index.html` | Page structure: header (coins, cat count, Refill button), the `#shop` box, info panel, message bar, script tags | Buttons or panels on the page |
| `style.css` | All visuals. Colors are CSS variables at the top. Everything inside `#shop` is absolutely positioned and centered on its (x, y) | Colors, sizes, cat/customer look, animations |
| `config.js` | `CONFIG`: every number from the spec (costs, timers, chances), layout positions, cat looks, stray names, the `?speed=` test option | Balance, timings, where the door / bowl / seats are, cat colors |
| `cats.js` | `Cats`: `create(name, look)`, `update(cat, dt)` (fullness decay + walk/idle/sleep behavior), `isHungry(cat)`, `refillAll(state)` | How cats move, hunger rules, feeding |
| `customers.js` | `Customers`: `update(state, dt, onPaid)` handles spawning every 20 s, seating, the 30 s stay and checkout; `paymentFor(state)` computes the bill | Customer timing and payment rules |
| `ui.js` | `UI`: `init(handlers)`, `render(state)` (draws cats, customers, header, info panel every frame), `showMessage(text)`, `showPayment(customer, amount)` | Anything you see or click |
| `main.js` | `createInitialState()`, the `update(dt)` step, and the `requestAnimationFrame` loop with background pause | Starting state, adding a new system to the game loop |

### How the pieces fit
- **State** is one plain object (`state` in `main.js`): `coins`, `cats[]`, `customers[]`, `seats[]` (customer id or `null`), `customerSpawnTimer`.
- **Logic files never touch the DOM.** They change `state`; `UI.render(state)` redraws from it every frame. Keep this split when adding features.
- **Time** is in game seconds. The loop caps each frame's `dt` at 0.25 s and resets when the tab is hidden, so nothing catches up after the tab was in the background.

## What I'd do next (priority order)

1. **Stray cats (criteria 9–14), the last missing P0 feature.** Suggested approach:
   - Add `stray: null` and `strayCheckTimer: 0` to `createInitialState()` (there's a TODO there).
   - New file `strays.js` with an `update(state, dt)` that, when `state.stray` is null, counts up to `CONFIG.STRAY_CHECK_SECONDS` and rolls `CONFIG.STRAY_CHANCE`. On success, create the stray with `Cats.create(name, look)` using a random name from `CONFIG.STRAY_NAMES` and a random non-orange look from `CONFIG.CAT_LOOKS`.
   - `adopt(state)` pushes it into `state.cats` (only if under `CONFIG.MAX_CATS`); `turnAway(state)` clears it. Both reset `strayCheckTimer` to 0.
   - In `ui.js`, draw the stray at `CONFIG.DOOR_POS` with "Adopt" / "Not now" buttons; disable Adopt and show "The café is full" at 3 cats.
   - Call `Strays.update` from `update(dt)` in `main.js`, and add `<script src="strays.js">` before `ui.js`.
2. **Test option for strays (criterion 21)**, e.g. `?stray=1` makes a stray appear right away. Document it in this README.
3. **Manual pass over all P0 criteria** in the browser using `?speed=10`.
4. **P1, in this order:** local save → facility upgrades → collection book → sound.
5. **P2** only if everything above is done.
