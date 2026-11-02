// decor.js — buying decorations and placing them in free spots. SPEC P2 #26.
// Does not touch the DOM; scene.js draws them and ui.js runs the placing.
// state.decor has one entry per spot in CONFIG.DECOR_SLOTS: a kind or null.

const Decor = (() => {
  const KINDS = Object.keys(CONFIG.DECOR);

  function cost(kind) {
    return CONFIG.DECOR[kind].cost;
  }

  function freeSlots(state) {
    return state.decor.flatMap((kind, i) => (kind ? [] : [i]));
  }

  function canBuy(state, kind) {
    return state.coins >= cost(kind) && freeSlots(state).length > 0;
  }

  // Buy one decoration and put it in a spot. Returns "placed", "poor" or
  // "taken" (the spot isn't free). Coins are charged only on "placed".
  function place(state, kind, slot) {
    if (!CONFIG.DECOR[kind] || !(slot in state.decor) || state.decor[slot]) return "taken";
    if (state.coins < cost(kind)) return "poor";
    state.coins -= cost(kind);
    state.decor[slot] = kind;
    return "placed";
  }

  return { KINDS, cost, freeSlots, canBuy, place };
})();
