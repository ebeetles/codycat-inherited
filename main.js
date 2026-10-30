// main.js — creates the game state and runs the main loop.
// Load order (see index.html): config.js, cats.js, customers.js, ui.js, main.js

function createInitialState() {
  return {
    coins: CONFIG.START_COINS,
    cats: [Cats.create("Cream", "orange")], // guaranteed starting cat
    customers: [],
    seats: CONFIG.SEAT_POSITIONS.map(() => null), // customer id or null
    customerSpawnTimer: 0,
    // TODO (SPEC 2.3): stray cats. Suggested fields:
    // stray: null,          // the cat waiting at the door, or null
    // strayCheckTimer: 0,   // counts up to CONFIG.STRAY_CHECK_SECONDS
  };
}

const state = createInitialState();

UI.init({
  onRefill() {
    if (!Cats.refillAll(state)) UI.showMessage("Not enough coins");
  },
});

// One simulation step. dt is in game seconds.
function update(dt) {
  for (const cat of state.cats) Cats.update(cat, dt);
  Customers.update(state, dt, UI.showPayment);
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
});

requestAnimationFrame(frame);
