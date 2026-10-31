// main.js — creates the game state and runs the main loop.
// Load order (see index.html): config.js, cats.js, customers.js, strays.js,
// sprites.js, scene.js, ui.js, main.js

function createInitialState() {
  return {
    coins: CONFIG.START_COINS,
    cats: [Cats.create("Cream", "orange")], // guaranteed starting cat
    customers: [],
    seats: CONFIG.SEAT_POSITIONS.map(() => null), // customer id or null
    customerSpawnTimer: 0,
    stray: null,          // the cat waiting at the door, or null
    strayCheckTimer: 0,   // counts up to CONFIG.STRAY_CHECK_SECONDS
  };
}

const state = createInitialState();
if (CONFIG.STRAY_TEST) Strays.spawn(state); // ?stray=1: first stray right away

UI.init({
  onRefill() {
    if (Cats.refillAll(state)) UI.showRefill(state);
    else UI.showMessage("Not enough coins");
  },
  onAdopt() {
    if (!Strays.adopt(state)) UI.showMessage("The café is full");
  },
  onTurnAway() {
    Strays.turnAway(state);
  },
});

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
});

requestAnimationFrame(frame);
