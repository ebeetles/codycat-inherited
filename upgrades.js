// upgrades.js — things bought once: more tables and room for cats (SPEC P1 #23),
// plus a new drink, a staff member and a shop expansion (SPEC P2 #29).
// Does not touch the DOM; ui.js shows the upgrades panel.

const Upgrades = (() => {
  // Shown in the upgrades panel, in this order and under these headings.
  // Costs and effects are in CONFIG.UPGRADES.
  const LIST = [
    { id: "seats", group: "Room", name: "Third table", text: "One more table, and customers stop by twice as often, so up to 3 can visit at once." },
    { id: "capacity", group: "Room", name: "Cozier café", text: "Room for up to 5 cats, with a second cat bed." },
    { id: "loft", group: "Room", name: "Cat loft", text: "Open a doorway to an upstairs lounge: room for all 9 cats, so every stray can find a home." },
    { id: "matcha", group: "Menu", name: "Matcha latte", text: "Add matcha to the menu. About half of customers order one and pay 10 coins extra." },
    { id: "staff", group: "Staff", name: `Hire ${CONFIG.STAFF_NAME}`, text: `${CONFIG.STAFF_NAME} refills the food bowl whenever a cat gets hungry, for the usual 10 coins.` },
  ];

  function cost(id) {
    return CONFIG.UPGRADES[id].cost;
  }

  function owned(state, id) {
    return !!state.upgrades[id];
  }

  // The upgrade that has to be bought first, or null.
  function needs(state, id) {
    const req = CONFIG.UPGRADES[id].needs;
    return req && !owned(state, req) ? req : null;
  }

  function name(id) {
    return LIST.find((u) => u.id === id).name;
  }

  function canBuy(state, id) {
    return !owned(state, id) && !needs(state, id) && state.coins >= cost(id);
  }

  // Make seats, arrival rate and cat capacity match the upgrades owned.
  function apply(state) {
    const seats = owned(state, "seats") ? CONFIG.UPGRADES.seats.seats : CONFIG.START_SEATS;
    while (state.seats.length < seats) state.seats.push(null);
    // With 30 s stays, arrivals every 20 s never fill a third seat; every 10 s does.
    state.customerSpawnSeconds = owned(state, "seats") ? CONFIG.UPGRADES.seats.spawnSeconds : CONFIG.CUSTOMER_SPAWN_SECONDS;
    state.maxCats = owned(state, "loft") ? CONFIG.UPGRADES.loft.maxCats
      : owned(state, "capacity") ? CONFIG.UPGRADES.capacity.maxCats
      : CONFIG.MAX_CATS;
  }

  // Returns "bought", "owned", "locked" (needs another upgrade first) or
  // "poor". Coins are charged only on "bought".
  function buy(state, id) {
    if (owned(state, id)) return "owned";
    if (needs(state, id)) return "locked";
    if (state.coins < cost(id)) return "poor";
    state.coins -= cost(id);
    state.upgrades[id] = true;
    apply(state);
    return "bought";
  }

  return { LIST, cost, owned, needs, name, canBuy, apply, buy };
})();
