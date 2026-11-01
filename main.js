// main.js — creates the game state (or loads the saved one) and runs the main loop.
// Load order (see index.html): config.js, cats.js, customers.js, strays.js,
// upgrades.js, save.js, sprites.js, sound.js, scene.js, ui.js, main.js

function createInitialState(saved) {
  const state = {
    coins: CONFIG.START_COINS,
    cats: [],
    customers: [],
    seats: [],            // customer id or null, one per table
    customerSpawnTimer: 0,
    customerSpawnSeconds: CONFIG.CUSTOMER_SPAWN_SECONDS,
    stray: null,          // the cat waiting at the door, or null
    strayCheckTimer: 0,   // counts up to CONFIG.STRAY_CHECK_SECONDS
    upgrades: { seats: false, capacity: false },
    maxCats: CONFIG.MAX_CATS,
    book: [],             // names of every cat ever adopted (collection book)
    muted: false,
  };
  if (saved) {
    // Returning player: no starting coins or second Cream.
    state.coins = saved.coins;
    state.cats = saved.cats.map(Cats.restore);
    state.upgrades = saved.upgrades;
    state.book = saved.book;
    state.muted = saved.muted;
  } else {
    const first = CONFIG.CAT_ROSTER[0];
    state.cats = [Cats.create(first.name, first.look)]; // guaranteed starting cat
  }
  for (const cat of state.cats) if (!state.book.includes(cat.name)) state.book.push(cat.name);
  Upgrades.apply(state);
  return state;
}

if (CONFIG.RESET_SAVE) Save.clear(); // ?reset=1: start over
const state = createInitialState(Save.load());
if (CONFIG.STRAY_TEST) Strays.spawn(state); // ?stray=1: first stray right away

UI.init({
  onRefill() {
    if (Cats.refillAll(state)) UI.showRefill(state);
    else UI.showMessage("Not enough coins");
  },
  onAdopt() {
    if (!Strays.adopt(state)) UI.showMessage("The café is full");
    Save.write(state);
  },
  onTurnAway() {
    Strays.turnAway(state);
  },
  onBuy(id) {
    const result = Upgrades.buy(state, id);
    if (result === "bought") UI.showUpgrade(id);
    else if (result === "poor") UI.showMessage("Not enough coins");
    Save.write(state);
  },
  onToggleSound() {
    state.muted = !state.muted;
    Sound.setMuted(state.muted);
    Save.write(state);
  },
}, state);

// Save every few seconds, and whenever the page is hidden or closed.
setInterval(() => Save.write(state), CONFIG.SAVE_EVERY_SECONDS * 1000);
window.addEventListener("pagehide", () => Save.write(state));

// One simulation step. dt is in game seconds.
function update(dt) {
  for (const cat of state.cats) Cats.update(cat, dt);
  Customers.update(state, dt, UI.showPayment);
  Strays.update(state, dt);
}

// Main loop. The simulation pauses while the tab is hidden and does NOT
// catch up afterwards (SPEC 2.5): lastTime is reset when the tab returns,
// and each frame's dt is capped.
let lastTime = null;

function frame(now) {
  if (document.hidden) {
    lastTime = null;
  } else {
    if (lastTime !== null) {
      const dt = Math.min((now - lastTime) / 1000, 0.25) * CONFIG.SPEED;
      update(dt);
    }
    lastTime = now;
  }
  UI.render(state);
  requestAnimationFrame(frame);
}

document.addEventListener("visibilitychange", () => {
  lastTime = null;
  if (document.hidden) Save.write(state);
});

requestAnimationFrame(frame);
