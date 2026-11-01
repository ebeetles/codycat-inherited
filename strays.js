// strays.js — stray cats appearing at the door, adopting, and turning away.
// SPEC 2.3. Does not touch the DOM; ui.js draws the stray from state.stray.

const Strays = (() => {
  function randomItem(list) {
    return list[Math.floor(Math.random() * list.length)];
  }

  // Strays come from the roster (skipping the starting cat): any cat that
  // doesn't already live here. Turned-away cats can come back.
  function pickCat(state) {
    const here = new Set(state.cats.map((c) => c.name));
    const strays = CONFIG.CAT_ROSTER.slice(1);
    const free = strays.filter((c) => !here.has(c.name));
    return randomItem(free.length ? free : strays);
  }

  // Put a new stray at the door. Does nothing if one is already waiting.
  function spawn(state) {
    if (state.stray) return;
    const pick = pickCat(state);
    state.stray = Cats.create(pick.name, pick.look);
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
    return state.cats.length < state.maxCats;
  }

  // "Adopt": free; the stray walks in from the door with full fullness and is
  // recorded in the collection book. Returns false (and changes nothing) if
  // the café is full.
  function adopt(state) {
    const cat = state.stray;
    if (!cat || !canAdopt(state)) return false;
    cat.fullness = CONFIG.FULLNESS_MAX;
    cat.decayTimer = 0;
    cat.x = CONFIG.DOOR_POS.x;
    cat.y = CONFIG.CAT_AREA.y;
    state.cats.push(cat);
    if (!state.book.includes(cat.name)) state.book.push(cat.name);
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
