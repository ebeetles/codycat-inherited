// staff.js — the hired helper who refills food. SPEC P2 #29.
// Does not touch the DOM; scene.js shows her walking to the bowl.

const Staff = (() => {
  // Once hired, refill as soon as any cat is hungry and there are coins for
  // it. A refill adds 30, so every hungry cat is fed past the hunger line
  // and this doesn't fire again until someone gets hungry again.
  function update(state, onRefill) {
    if (!state.upgrades.staff || !state.cats.some(Cats.isHungry)) return;
    if (Cats.refillAll(state) && onRefill) onRefill(state);
  }

  return { update };
})();
