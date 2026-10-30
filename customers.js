// customers.js — customer arrival, seating, staying, and paying.
// SPEC 2.4. Does not touch the DOM; ui.js draws customers from this data.

const Customers = (() => {
  let nextId = 1;

  function freeSeatIndex(state) {
    return state.seats.findIndex((s) => s === null);
  }

  // Try to bring in one customer. Skipped if every seat is taken.
  function trySpawn(state) {
    const seat = freeSeatIndex(state);
    if (seat === -1) return;
    const customer = {
      id: nextId++,
      seat,
      elapsed: 0,
      activity: Math.random() < 0.5 ? "coffee" : "cats",
    };
    state.seats[seat] = customer.id;
    state.customers.push(customer);
  }

  // 20 + 5 for each cat with fullness >= 30 at checkout time.
  function paymentFor(state) {
    const fedCats = state.cats.filter((c) => c.fullness >= CONFIG.HUNGRY_BELOW).length;
    return CONFIG.CUSTOMER_BASE_PAY + CONFIG.CUSTOMER_BONUS_PER_FED_CAT * fedCats;
  }

  // Pay once, free the seat, remove the customer.
  function checkout(state, customer) {
    const amount = paymentFor(state);
    state.coins += amount;
    state.seats[customer.seat] = null;
    state.customers = state.customers.filter((c) => c.id !== customer.id);
    return amount;
  }

  // onPaid(customer, amount) lets the UI show a "+25" effect.
  function update(state, dt, onPaid) {
    state.customerSpawnTimer += dt;
    while (state.customerSpawnTimer >= CONFIG.CUSTOMER_SPAWN_SECONDS) {
      state.customerSpawnTimer -= CONFIG.CUSTOMER_SPAWN_SECONDS;
      trySpawn(state);
    }

    for (const customer of [...state.customers]) {
      customer.elapsed += dt;
      if (customer.elapsed >= CONFIG.CUSTOMER_STAY_SECONDS) {
        const amount = checkout(state, customer);
        if (onPaid) onPaid(customer, amount);
      }
    }
  }

  return { update, paymentFor };
})();
