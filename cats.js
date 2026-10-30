// cats.js — cat data, autonomous behavior, fullness, and feeding.
// SPEC 2.2. Does not touch the DOM; ui.js draws cats from this data.

const Cats = (() => {
  let nextId = 1;

  function randomBetween([min, max]) {
    return min + Math.random() * (max - min);
  }

  function randomPointInArea() {
    const a = CONFIG.CAT_AREA;
    return { x: a.x + Math.random() * a.w, y: a.y + Math.random() * a.h };
  }

  function clampToArea(cat) {
    const a = CONFIG.CAT_AREA;
    cat.x = Math.min(Math.max(cat.x, a.x), a.x + a.w);
    cat.y = Math.min(Math.max(cat.y, a.y), a.y + a.h);
  }

  // Create a cat. Each cat has its own id, name and fullness,
  // even if two cats share the same look.
  function create(name, look) {
    const p = randomPointInArea();
    const cat = {
      id: nextId++,
      name,
      look,
      fullness: CONFIG.FULLNESS_MAX,
      decayTimer: 0,
      x: p.x,
      y: p.y,
      facing: 1,      // 1 = right, -1 = left
      mode: "idle",   // "walk" | "idle" | "sleep"
      modeTimer: 0,
      target: null,
    };
    chooseNextMode(cat);
    return cat;
  }

  // Pick the cat's next activity: 50% walk, 30% idle, 20% sleep.
  function chooseNextMode(cat) {
    const r = Math.random();
    cat.mode = r < 0.5 ? "walk" : r < 0.8 ? "idle" : "sleep";
    cat.modeTimer = randomBetween(CONFIG.CAT_MODE_SECONDS[cat.mode]);
    cat.target = cat.mode === "walk" ? randomPointInArea() : null;
  }

  function updateFullness(cat, dt) {
    cat.decayTimer += dt;
    while (cat.decayTimer >= CONFIG.FULLNESS_DECAY_SECONDS) {
      cat.decayTimer -= CONFIG.FULLNESS_DECAY_SECONDS;
      cat.fullness = Math.max(0, cat.fullness - 1);
    }
  }

  function updateBehavior(cat, dt) {
    cat.modeTimer -= dt;

    if (cat.mode === "walk" && cat.target) {
      const dx = cat.target.x - cat.x;
      const dy = cat.target.y - cat.y;
      const dist = Math.hypot(dx, dy);
      const step = CONFIG.CAT_SPEED * dt;
      if (Math.abs(dx) > 1) cat.facing = dx < 0 ? -1 : 1;
      if (dist <= step) {
        cat.x = cat.target.x;
        cat.y = cat.target.y;
        cat.mode = "idle"; // arrived; rest until the timer runs out
        cat.target = null;
      } else {
        cat.x += (dx / dist) * step;
        cat.y += (dy / dist) * step;
      }
    }

    if (cat.modeTimer <= 0) chooseNextMode(cat);
    clampToArea(cat);
  }

  function update(cat, dt) {
    updateFullness(cat, dt);
    updateBehavior(cat, dt);
  }

  function isHungry(cat) {
    return cat.fullness < CONFIG.HUNGRY_BELOW;
  }

  // "Refill food": costs FOOD_COST, feeds every cat. Returns false if too poor.
  function refillAll(state) {
    if (state.coins < CONFIG.FOOD_COST) return false;
    state.coins -= CONFIG.FOOD_COST;
    for (const cat of state.cats) {
      cat.fullness = Math.min(CONFIG.FULLNESS_MAX, cat.fullness + CONFIG.FOOD_AMOUNT);
    }
    return true;
  }

  return { create, update, isHungry, refillAll };
})();
