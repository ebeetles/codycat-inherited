// strays.js — stray cats appearing at the door, adopting, and turning away.
// SPEC 2.3. Does not touch the DOM; ui.js draws the stray from state.stray.

const Strays = (() => {
  function randomItem(list) {
    return list[Math.floor(Math.random() * list.length)];
  }

  // Prefer a name no current cat has; fall back to any name if all are taken.
  function pickName(state) {
    const used = new Set(state.cats.map((c) => c.name));
    const free = CONFIG.STRAY_NAMES.filter((n) => !used.has(n));
    return randomItem(free.length ? free : CONFIG.STRAY_NAMES);
  }

  // Strays use any look except Cream's orange tabby. Repeats are allowed.
  function pickLook() {
    return randomItem(Object.keys(CONFIG.CAT_LOOKS).filter((k) => k !== "orange"));
  }

  // Put a new stray at the door. Does nothing if one is already waiting.
  function spawn(state) {
    if (state.stray) return;
    state.stray = Cats.create(pickName(state), pickLook());
  }

  // While no stray is waiting, roll the chance every STRAY_CHECK_SECONDS.
  // The timer is paused while a stray waits and restarts when it's handled.
  // In ?stray=1 test mode every check succeeds.
  function update(state, dt) {
    if (state.stray) return;
    const chance = CONFIG.STRAY_TEST ? 1 : CONFIG.STRAY_CHANCE;
    state.strayCheckTimer += dt;
    while (state.strayCheckTimer >= CONFIG.STRAY_CHECK_SECONDS) {
      state.strayCheckTimer -= CONFIG.STRAY_CHECK_SECONDS;
      if (Math.random() < chance) {
        spawn(state);
        state.strayCheckTimer = 0;
        return;
      }
    }
  }

  function canAdopt(state) {
    return state.cats.length < CONFIG.MAX_CATS;
  }

  // "Adopt": free; the stray walks in from the door with full fullness.
  // Returns false (and changes nothing) if the café is full.
  function adopt(state) {
    const cat = state.stray;
    if (!cat || !canAdopt(state)) return false;
    cat.fullness = CONFIG.FULLNESS_MAX;
    cat.decayTimer = 0;
    cat.x = CONFIG.DOOR_POS.x;
    cat.y = CONFIG.CAT_AREA.y;
    state.cats.push(cat);
    state.stray = null;
    state.strayCheckTimer = 0;
    return true;
  }

  // "Not now": the stray leaves; nothing else changes.
  function turnAway(state) {
    if (!state.stray) return;
    state.stray = null;
    state.strayCheckTimer = 0;
  }

  return { spawn, update, canAdopt, adopt, turnAway };
})();
