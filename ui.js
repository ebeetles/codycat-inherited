// ui.js — everything that touches the page: drawing the shop, cats,
// customers, the coin bar, messages, and click handling.
// Game logic stays in cats.js / customers.js; this file only reads state.

const UI = (() => {
  const els = {};
  const catEls = new Map();      // cat id -> element
  const customerEls = new Map(); // customer id -> element
  let selectedCatId = null;
  let messageTimeout = null;

  function byId(id) {
    return document.getElementById(id);
  }

  function makeDiv(className, html = "") {
    const el = document.createElement("div");
    el.className = className;
    el.innerHTML = html;
    return el;
  }

  // Elements are centered on (x, y) by CSS (translate -50%, -50%).
  function place(el, pos) {
    el.style.left = pos.x + "px";
    el.style.top = pos.y + "px";
  }

  function init(handlers) {
    els.coins = byId("coins");
    els.catCount = byId("cat-count");
    els.shop = byId("shop");
    els.info = byId("info");
    els.infoText = byId("info-text");
    els.message = byId("message");

    els.shop.style.width = CONFIG.SHOP_WIDTH + "px";
    els.shop.style.height = CONFIG.SHOP_HEIGHT + "px";

    byId("refill").addEventListener("click", handlers.onRefill);
    byId("info-close").addEventListener("click", () => (selectedCatId = null));

    place(byId("door"), CONFIG.DOOR_POS);
    place(byId("bowl"), CONFIG.BOWL_POS);

    for (const pos of CONFIG.SEAT_POSITIONS) {
      const seat = makeDiv("seat", "🪑");
      place(seat, pos);
      els.shop.appendChild(seat);
    }
  }

  // ---------- floating effects (hearts, +coins) ----------
  function floatText(x, y, text) {
    const el = makeDiv("float", text);
    place(el, { x, y });
    els.shop.appendChild(el);
    el.addEventListener("animationend", () => el.remove());
  }

  function showMessage(text) {
    els.message.textContent = text;
    els.message.classList.add("visible");
    clearTimeout(messageTimeout);
    messageTimeout = setTimeout(() => els.message.classList.remove("visible"), 2000);
  }

  // ---------- cats ----------
  function createCatEl(cat) {
    const el = makeDiv(
      "cat",
      `<div class="cat-status">
         <span class="hunger-mark" title="Hungry">🍽️</span>
         <span class="sleep-mark">💤</span>
       </div>
       <div class="cat-body">🐱</div>
       <div class="cat-name"></div>`
    );
    el.querySelector(".cat-name").textContent = cat.name;
    el.querySelector(".cat-body").style.background = CONFIG.CAT_LOOKS[cat.look].color;
    el.addEventListener("click", (e) => {
      e.stopPropagation();
      selectedCatId = cat.id;
      floatText(cat.x, cat.y - 35, "❤️");
    });
    return el;
  }

  function renderCats(state) {
    const alive = new Set();
    for (const cat of state.cats) {
      alive.add(cat.id);
      let el = catEls.get(cat.id);
      if (!el) {
        el = createCatEl(cat);
        catEls.set(cat.id, el);
        els.shop.appendChild(el);
      }
      place(el, cat);
      el.style.zIndex = 10 + Math.round(cat.y);
      el.classList.toggle("sleeping", cat.mode === "sleep");
      el.classList.toggle("hungry", Cats.isHungry(cat));
      el.querySelector(".cat-body").style.transform = `scaleX(${cat.facing})`;
    }
    for (const [id, el] of catEls) {
      if (!alive.has(id)) {
        el.remove();
        catEls.delete(id);
      }
    }
  }

  // ---------- customers ----------
  function renderCustomers(state) {
    const alive = new Set();
    for (const c of state.customers) {
      alive.add(c.id);
      let el = customerEls.get(c.id);
      if (!el) {
        const icon = c.activity === "coffee" ? "☕" : "🐾";
        el = makeDiv(
          "customer",
          `<div class="customer-body">🧑</div>
           <div class="customer-activity">${icon}</div>
           <div class="stay-bar"><div class="stay-fill"></div></div>`
        );
        place(el, CONFIG.SEAT_POSITIONS[c.seat]);
        customerEls.set(c.id, el);
        els.shop.appendChild(el);
      }
      const pct = Math.min(100, (c.elapsed / CONFIG.CUSTOMER_STAY_SECONDS) * 100);
      el.querySelector(".stay-fill").style.width = pct + "%";
    }
    for (const [id, el] of customerEls) {
      if (!alive.has(id)) {
        el.remove();
        customerEls.delete(id);
      }
    }
  }

  function showPayment(customer, amount) {
    const pos = CONFIG.SEAT_POSITIONS[customer.seat];
    floatText(pos.x, pos.y - 40, `+${amount} 🪙`);
  }

  // ---------- header + info panel ----------
  function renderHud(state) {
    els.coins.textContent = state.coins;
    els.catCount.textContent = `${state.cats.length}/${CONFIG.MAX_CATS}`;

    const cat = state.cats.find((c) => c.id === selectedCatId);
    if (cat) {
      els.infoText.textContent = `${cat.name} · Fullness ${cat.fullness}/${CONFIG.FULLNESS_MAX}`;
      els.info.classList.add("visible");
    } else {
      els.info.classList.remove("visible");
    }
  }

  function render(state) {
    renderCats(state);
    renderCustomers(state);
    renderHud(state);
  }

  return { init, render, showMessage, showPayment };
})();
