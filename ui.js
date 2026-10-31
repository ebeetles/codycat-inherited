// ui.js — everything around the canvas: header, buttons, the door and cat
// panels, messages, and mouse handling. Each frame it hands the state to
// Scene (scene.js), which draws the room.
// Game logic stays in cats.js / customers.js / strays.js; this file only reads state.

const UI = (() => {
  const els = {};
  let current = null;          // latest state, for mouse handling
  let selectedCatId = null;
  let hoverCatId = null;
  let messageTimeout = null;
  let lastNow = null;
  let clock = 0;               // real seconds, for portrait animation
  let shownCoins = null;       // number shown in the header, eases toward state.coins
  let lastCoins = null;

  const STATUS = { walk: "Strolling", idle: "Taking a break", sleep: "Napping" };

  function byId(id) {
    return document.getElementById(id);
  }

  // Only touch the DOM when text actually changes.
  function setText(el, text) {
    if (el.textContent !== text) el.textContent = text;
  }

  function restartAnimation(el, cls) {
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
  }

  // Largest whole-number scale that fits the window, so pixels stay square.
  function fitScale() {
    const byWidth = Math.floor((window.innerWidth - 32) / Scene.W);
    const byHeight = Math.floor((window.innerHeight - 290) / Scene.H);
    const s = Math.max(1, Math.min(4, byWidth, byHeight));
    document.documentElement.style.setProperty("--s", s);
    Scene.setScale(s);
  }

  // A few pixel stars for the evening sky around the café.
  function starryBackground() {
    const c = Sprites.makeCanvas(64, 64);
    const g = c.getContext("2d");
    const stars = [[5, 9, "#6a5a86"], [22, 3, "#4b3d63"], [41, 14, "#6a5a86"], [57, 6, "#4b3d63"], [13, 33, "#4b3d63"],
      [33, 27, "#7d6c9c"], [50, 39, "#4b3d63"], [8, 52, "#6a5a86"], [27, 58, "#4b3d63"], [46, 54, "#6a5a86"]];
    for (const [x, y, col] of stars) {
      g.fillStyle = col;
      g.fillRect(x, y, 1, 1);
    }
    document.body.style.backgroundImage = `url(${c.toDataURL()})`;
  }

  function init(handlers) {
    for (const id of ["coins", "cat-count", "stat-coins", "refill", "shop", "message", "info", "info-name", "info-meta",
      "info-value", "info-bar", "info-fill", "info-hungry", "info-portrait", "info-empty", "stray-panel", "stray-text",
      "stray-meta", "stray-full", "stray-portrait", "stray-empty", "adopt"]) {
      els[id] = byId(id);
    }

    // Icons are sized in art pixels (CSS reads --w/--h), so they stay crisp.
    for (const img of document.querySelectorAll("img[data-icon]")) {
      const icon = Sprites.icon(img.dataset.icon);
      img.src = Sprites.iconDataURL(img.dataset.icon);
      img.style.setProperty("--w", icon.width);
      img.style.setProperty("--h", icon.height);
    }
    starryBackground();

    Scene.init(els.shop);
    fitScale();
    window.addEventListener("resize", fitScale);

    els.refill.addEventListener("click", handlers.onRefill);
    els.adopt.addEventListener("click", handlers.onAdopt);
    byId("turn-away").addEventListener("click", handlers.onTurnAway);
    byId("info-close").addEventListener("click", () => (selectedCatId = null));
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") selectedCatId = null;
    });

    els.shop.addEventListener("click", (e) => {
      const id = current && Scene.catAt(current, e.clientX, e.clientY);
      if (id == null) return;
      selectedCatId = id;
      Scene.petCat(current.cats.find((c) => c.id === id));
    });
    els.shop.addEventListener("mousemove", (e) => {
      hoverCatId = current && Scene.catAt(current, e.clientX, e.clientY);
      els.shop.style.cursor = hoverCatId == null ? "default" : "pointer";
    });
    els.shop.addEventListener("mouseleave", () => (hoverCatId = null));
  }

  function showMessage(text) {
    els.message.textContent = text;
    restartAnimation(els.message, "visible");
    clearTimeout(messageTimeout);
    messageTimeout = setTimeout(() => els.message.classList.remove("visible"), 2000);
  }

  function showPayment(customer, amount) {
    Scene.payment(customer, amount);
  }

  function showRefill(state) {
    Scene.refill(state);
  }

  // ---------- header ----------
  function renderHud(state, dt) {
    if (shownCoins === null) shownCoins = lastCoins = state.coins;
    if (state.coins > lastCoins) restartAnimation(els["stat-coins"], "gain");
    else if (state.coins < lastCoins) restartAnimation(els["stat-coins"], "spend");
    lastCoins = state.coins;

    const diff = state.coins - shownCoins;
    if (diff !== 0) shownCoins += Math.sign(diff) * Math.min(Math.abs(diff), Math.max(1, Math.ceil(Math.abs(diff) * dt * 6)));
    setText(els.coins, String(shownCoins));
    setText(els["cat-count"], `${state.cats.length}/${CONFIG.MAX_CATS}`);
    els.refill.classList.toggle("short", state.coins < CONFIG.FOOD_COST);
  }

  // ---------- the door ----------
  function renderStray(state) {
    const stray = state.stray;
    els["stray-panel"].classList.toggle("visible", !!stray);
    els["stray-empty"].hidden = !!stray;
    if (!stray) return;
    const look = CONFIG.CAT_LOOKS[stray.look].label.toLowerCase();
    setText(els["stray-text"], `${stray.name} is waiting at the door.`);
    setText(els["stray-meta"], `A ${look} stray looking for a home.`);
    const full = !Strays.canAdopt(state);
    els.adopt.disabled = full;
    els["stray-full"].classList.toggle("visible", full);
    Scene.portrait(els["stray-portrait"], stray.look, clock);
  }

  // ---------- the selected cat ----------
  function renderInfo(state) {
    const cat = state.cats.find((c) => c.id === selectedCatId);
    if (!cat) selectedCatId = null;
    els.info.classList.toggle("visible", !!cat);
    els["info-empty"].hidden = !!cat;
    if (!cat) return;
    const hungry = Cats.isHungry(cat);
    setText(els["info-name"], cat.name);
    setText(els["info-meta"], `${CONFIG.CAT_LOOKS[cat.look].label} · ${STATUS[cat.mode]}`);
    setText(els["info-value"], `${cat.fullness}/${CONFIG.FULLNESS_MAX}`);
    els["info-fill"].style.width = (cat.fullness / CONFIG.FULLNESS_MAX) * 100 + "%";
    els["info-bar"].classList.toggle("low", hungry);
    els["info-hungry"].hidden = !hungry;
    Scene.portrait(els["info-portrait"], cat.look, clock);
  }

  function render(state) {
    current = state;
    const now = performance.now();
    const dt = lastNow === null ? 0 : Math.min((now - lastNow) / 1000, 0.1);
    lastNow = now;
    clock += dt;
    if (hoverCatId != null && !state.cats.some((c) => c.id === hoverCatId)) hoverCatId = null;

    Scene.render(state, dt, { selectedId: selectedCatId, hoverId: hoverCatId });
    renderHud(state, dt);
    renderStray(state);
    renderInfo(state);
  }

  return { init, render, showMessage, showPayment, showRefill };
})();
