// upgrades.js — facility upgrades: a third table and room for more cats.
// SPEC P1 #23. Does not touch the DOM; ui.js shows the upgrades panel.

const Upgrades = (() => {
  // Shown in the upgrades panel, in this order. Costs and effects are in CONFIG.UPGRADES.
  const LIST = [
    { id: "seats", name: "Third table", text: "One more table, and customers stop by twice as often, so up to 3 can visit at once." },
    { id: "capacity", name: "Cozier café", text: "Room for up to 5 cats, with a second cat bed." },
  ];

  function cost(id) {
    return CONFIG.UPGRADES[id].cost;
  }

  function owned(state, id) {
    return !!state.upgrades[id];
  }

  function canBuy(state, id) {
    return !owned(state, id) && state.coins >= cost(id);
  }

  // Make seats, arrival rate and cat capacity match the upgrades owned.
  function apply(state) {
    const seats = owned(state, "seats") ? CONFIG.UPGRADES.seats.seats : CONFIG.START_SEATS;
    while (state.seats.length < seats) state.seats.push(null);
    // With 30 s stays, arrivals every 20 s never fill a third seat; every 10 s does.
    state.customerSpawnSeconds = owned(state, "seats") ? CONFIG.UPGRADES.seats.spawnSeconds : CONFIG.CUSTOMER_SPAWN_SECONDS;
    state.maxCats = owned(state, "capacity") ? CONFIG.UPGRADES.capacity.maxCats : CONFIG.MAX_CATS;
  }

  // Returns "bought", "owned" or "poor". Coins are charged only on "bought".
  function buy(state, id) {
    if (owned(state, id)) return "owned";
    if (state.coins < cost(id)) return "poor";
    state.coins -= cost(id);
    state.upgrades[id] = true;
    apply(state);
    return "bought";
  }

  return { LIST, cost, owned, canBuy, apply, buy };
})();
