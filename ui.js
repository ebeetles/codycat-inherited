// ui.js — everything around the canvas: header, buttons, the door and cat
// panels, the upgrades, decorations, cat book and welcome-back dialogs,
// placing decorations, messages, and mouse handling.
// Each frame it hands the state to Scene (scene.js), which draws the room.
// Game logic stays in cats.js / customers.js / strays.js / upgrades.js /
// decor.js / staff.js / offline.js;
// this file only reads state and calls the handlers main.js passes in.

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
  let holdCoins = false;       // keep the header still until offline coins are collected
  let placing = null;          // decoration kind being placed, or null
  let hoverSlot = null;        // free decoration spot under the mouse while placing
  const upgradeRows = {};      // upgrade id -> { button, note }
  const decorRows = {};        // decoration kind -> { button, note }
  const hearts = [];           // affection meter images on the cat card

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

  function make(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined) el.textContent = text;
    return el;
  }

  // Icons are sized in art pixels (CSS reads --w/--h), so they stay crisp.
  function setIcon(img, name) {
    const icon = Sprites.icon(name);
    img.src = Sprites.iconDataURL(name);
    img.style.setProperty("--w", icon.width);
    img.style.setProperty("--h", icon.height);
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

  // ---------- dialogs ----------
  function openDialog(dialog) {
    Sound.play("tap");
    stopPlacing();
    if (dialog === els["book-dialog"]) buildBook(current);
    if (!dialog.open) dialog.showModal();
    renderUpgrades(current);
    renderDecor(current);
  }

  function buildUpgrades(handlers) {
    const list = byId("upgrade-list");
    let group = null;
    for (const up of Upgrades.LIST) {
      if (up.group !== group) {
        group = up.group;
        list.append(make("li", "list-group", group));
      }
      const row = make("li", "upgrade");
      const body = make("div", "upgrade-body");
      body.append(make("p", "upgrade-name", up.name), make("p", "upgrade-text", up.text));
      const price = make("span", "price");
      const coin = make("img", "icon");
      coin.alt = "";
      setIcon(coin, "coin");
      price.append(coin, String(Upgrades.cost(up.id)));
      const side = make("div", "upgrade-side");
      const button = make("button", "btn btn-honey", "Buy");
      button.addEventListener("click", () => handlers.onBuy(up.id));
      const note = make("p", "upgrade-note");
      side.append(price, button, note);
      row.append(body, side);
      list.append(row);
      upgradeRows[up.id] = { button, note };
    }
  }

  function renderUpgrades(state) {
    if (!els["upgrades-dialog"].open) return;
    for (const up of Upgrades.LIST) {
      const { button, note } = upgradeRows[up.id];
      const owned = Upgrades.owned(state, up.id);
      const needs = Upgrades.needs(state, up.id);
      const short = Upgrades.cost(up.id) - state.coins;
      setText(button, owned ? "Owned" : "Buy");
      button.disabled = !Upgrades.canBuy(state, up.id);
      setText(note, owned ? "" : needs ? `Needs ${Upgrades.name(needs)}` : short > 0 ? `${short} more coins needed` : "");
    }
  }

  // ---------- decorations ----------
  function buildDecor() {
    const list = byId("decor-list");
    for (const kind of Decor.KINDS) {
      const info = CONFIG.DECOR[kind];
      const row = make("li", "upgrade decor-row");
      const pic = make("canvas", "decor-preview");
      pic.width = 34;
      pic.height = 48;
      Scene.decorPreview(pic, kind);
      const body = make("div", "upgrade-body");
      body.append(make("p", "upgrade-name", info.name), make("p", "upgrade-text", info.text));
      const price = make("span", "price");
      const coin = make("img", "icon");
      coin.alt = "";
      setIcon(coin, "coin");
      price.append(coin, String(info.cost));
      const side = make("div", "upgrade-side");
      const button = make("button", "btn btn-honey", "Place");
      button.addEventListener("click", () => startPlacing(kind));
      const note = make("p", "upgrade-note");
      side.append(price, button, note);
      row.append(pic, body, side);
      list.append(row);
      decorRows[kind] = { button, note };
    }
  }

  function renderDecor(state) {
    if (!els["decor-dialog"].open) return;
    const free = Decor.freeSlots(state).length;
    setText(els["decor-sub"], free
      ? `${free} of ${CONFIG.DECOR_SLOTS.length} spots free. Pick a decoration, then click a glowing spot in the café.`
      : "Every spot has a decoration now.");
    for (const kind of Decor.KINDS) {
      const { button, note } = decorRows[kind];
      const short = Decor.cost(kind) - state.coins;
      button.disabled = !Decor.canBuy(state, kind);
      setText(note, !free ? "No free spots" : short > 0 ? `${short} more coins needed` : "");
    }
  }

  // Placing: the dialog closes, free spots glow, and a click on one buys and
  // places the decoration. Esc or Cancel stops without charging.
  function startPlacing(kind) {
    Sound.play("tap");
    els["decor-dialog"].close();
    placing = kind;
    hoverSlot = null;
    selectedCatId = null;
    setText(els["place-text"], `Click a glowing spot to place the ${CONFIG.DECOR[kind].name.toLowerCase()}.`);
    els["place-bar"].hidden = false;
  }

  function stopPlacing() {
    placing = null;
    hoverSlot = null;
    if (els["place-bar"]) els["place-bar"].hidden = true;
  }

  function buildBook(state) {
    const grid = byId("book-grid");
    grid.replaceChildren();
    const roster = CONFIG.CAT_ROSTER;
    const met = roster.filter((c) => state.book.includes(c.name)).length;
    setText(byId("book-count"), `${met} of ${roster.length} cats adopted`);
    for (const entry of roster) {
      const known = state.book.includes(entry.name);
      const card = make("li", known ? "book-card" : "book-card locked");
      const pic = make("canvas", "portrait");
      pic.width = 20;
      pic.height = 17;
      Scene.portrait(pic, known ? entry.look : null, 0);
      const name = make("p", "book-name", known ? entry.name : "???");
      const pers = CONFIG.PERSONALITIES[entry.personality];
      const look = make("p", "book-look", known ? `${CONFIG.CAT_LOOKS[entry.look].label} · ${pers.label}` : "Not adopted yet");
      const about = make("p", "book-about", known ? entry.about : "Maybe they'll stop by the door one evening.");
      card.append(pic, name, look, about);
      grid.append(card);
    }
  }

  // "1 hour 25 minutes", "2 hours", "1 minute"
  function duration(minutes) {
    const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (!h) return plural(m, "minute");
    return m ? `${plural(h, "hour")} ${plural(m, "minute")}` : plural(h, "hour");
  }

  // Coins earned while the game was closed. They're already in state.coins;
  // the header counts up to them when the player collects.
  function showAway(state, away) {
    const cats = byId("away-cats");
    cats.replaceChildren();
    for (const cat of state.cats) {
      const pic = make("canvas", "portrait");
      pic.width = 20;
      pic.height = 17;
      Scene.portrait(pic, cat.look, 0);
      cats.append(pic);
    }
    const who = state.cats.length === 1 ? state.cats[0].name : "Your cats";
    setText(byId("away-text"), `${who} kept the café open for ${duration(away.minutes)} while you were away.`);
    setText(byId("away-coins"), `+${away.coins}`);
    const note = byId("away-note");
    note.textContent = away.capped ? `Earnings while you're away stop at ${duration(CONFIG.OFFLINE_MAX_MINUTES)}.` : "";
    note.hidden = !away.capped;

    shownCoins = state.coins - away.coins;
    lastCoins = state.coins;
    holdCoins = true;
    const dialog = els["away-dialog"];
    dialog.addEventListener("close", () => {
      holdCoins = false;
      restartAnimation(els["stat-coins"], "gain");
      Sound.play("coin");
    }, { once: true });
    dialog.showModal();
  }

  // ---------- setup ----------
  function init(handlers, state) {
    current = state;
    for (const id of ["coins", "cat-count", "stat-coins", "refill", "shop", "message", "info", "info-name", "info-meta",
      "info-value", "info-bar", "info-fill", "info-hungry", "info-portrait", "info-empty", "stray-panel", "stray-text",
      "stray-meta", "stray-full", "stray-portrait", "stray-empty", "adopt", "mute-btn", "mute-icon",
      "upgrades-dialog", "book-dialog", "away-dialog", "decor-dialog", "decor-sub", "place-bar", "place-text",
      "info-hearts", "info-affection"]) {
      els[id] = byId(id);
    }

    for (const img of document.querySelectorAll("img[data-icon]")) setIcon(img, img.dataset.icon);
    starryBackground();

    Scene.init(els.shop);
    fitScale();
    window.addEventListener("resize", fitScale);

    // Audio can only start after the player interacts with the page.
    Sound.setMuted(state.muted);
    const unlock = () => Sound.unlock();
    document.addEventListener("pointerdown", unlock, { once: true });
    document.addEventListener("keydown", unlock, { once: true });

    els.refill.addEventListener("click", handlers.onRefill);
    els.adopt.addEventListener("click", handlers.onAdopt);
    byId("turn-away").addEventListener("click", () => {
      Sound.play("tap");
      handlers.onTurnAway();
    });
    byId("info-close").addEventListener("click", () => (selectedCatId = null));
    els["mute-btn"].addEventListener("click", () => {
      handlers.onToggleSound();
      Sound.play("tap");
    });
    byId("upgrades-btn").addEventListener("click", () => openDialog(els["upgrades-dialog"]));
    byId("book-btn").addEventListener("click", () => openDialog(els["book-dialog"]));
    byId("decor-btn").addEventListener("click", () => openDialog(els["decor-dialog"]));
    byId("place-cancel").addEventListener("click", () => {
      Sound.play("tap");
      stopPlacing();
    });
    for (const dialog of [els["upgrades-dialog"], els["book-dialog"], els["decor-dialog"]]) {
      dialog.querySelector("[data-close]").addEventListener("click", () => dialog.close());
      // Clicking the dimmed area outside the dialog closes it.
      dialog.addEventListener("click", (e) => {
        if (e.target === dialog) dialog.close();
      });
    }
    els["away-dialog"].addEventListener("click", (e) => {
      if (e.target === els["away-dialog"]) els["away-dialog"].close();
    });
    buildUpgrades(handlers);
    buildDecor();
    for (let i = 0; i < 5; i++) {
      const img = make("img", "icon");
      img.alt = "";
      setIcon(img, "heartEmpty");
      els["info-hearts"].append(img);
      hearts.push(img);
    }

    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape" || document.querySelector("dialog[open]")) return;
      if (placing) stopPlacing();
      else selectedCatId = null;
    });

    els.shop.addEventListener("click", (e) => {
      if (!current) return;
      if (placing) {
        const slot = Scene.slotAt(current, e.clientX, e.clientY);
        if (slot != null && handlers.onPlace(placing, slot) === "placed") stopPlacing();
        return;
      }
      const id = Scene.catAt(current, e.clientX, e.clientY);
      if (id == null) return;
      const cat = current.cats.find((c) => c.id === id);
      selectedCatId = id;
      handlers.onPet(cat);
      Scene.petCat(cat);
      Sound.meow(id);
    });
    els.shop.addEventListener("mousemove", (e) => {
      if (!current) return;
      if (placing) {
        hoverSlot = Scene.slotAt(current, e.clientX, e.clientY);
        hoverCatId = null;
        els.shop.style.cursor = hoverSlot == null ? "default" : "pointer";
        return;
      }
      hoverCatId = Scene.catAt(current, e.clientX, e.clientY);
      els.shop.style.cursor = hoverCatId == null ? "default" : "pointer";
    });
    els.shop.addEventListener("mouseleave", () => {
      hoverCatId = null;
      hoverSlot = null;
    });
  }

  // ---------- feedback ----------
  function toast(text) {
    els.message.textContent = text;
    restartAnimation(els.message, "visible");
    clearTimeout(messageTimeout);
    messageTimeout = setTimeout(() => els.message.classList.remove("visible"), 2000);
  }

  // Something the player tried didn't work ("Not enough coins", "The café is full").
  function showMessage(text) {
    toast(text);
    Sound.play("nope");
  }

  function showPayment(customer, amount) {
    Scene.payment(customer, amount);
    Sound.play("coin");
  }

  function showRefill(state) {
    Scene.refill(state);
    Sound.play("refill");
  }

  const UPGRADE_TOASTS = {
    seats: "Third table added",
    capacity: `Room for ${CONFIG.UPGRADES.capacity.maxCats} cats now`,
    loft: `The cat loft is open: room for ${CONFIG.UPGRADES.loft.maxCats} cats`,
    matcha: "Matcha latte is on the menu",
    staff: `${CONFIG.STAFF_NAME} is on shift`,
  };

  function showUpgrade(id) {
    Scene.upgrade(id);
    Sound.play("upgrade");
    toast(UPGRADE_TOASTS[id]);
  }

  function showPlaced(kind, slot) {
    Scene.placed(kind, slot);
    Sound.play("upgrade");
    toast(`${CONFIG.DECOR[kind].name} placed`);
  }

  // The staff member refilled the bowl; the scene shows her walking over.
  function showStaffRefill() {
    Scene.staffRefill();
  }

  // ---------- header ----------
  function renderHud(state, dt) {
    if (shownCoins === null) shownCoins = lastCoins = state.coins;
    if (state.coins > lastCoins) restartAnimation(els["stat-coins"], "gain");
    else if (state.coins < lastCoins) restartAnimation(els["stat-coins"], "spend");
    lastCoins = state.coins;

    const diff = state.coins - shownCoins;
    if (diff !== 0 && !holdCoins) shownCoins += Math.sign(diff) * Math.min(Math.abs(diff), Math.max(1, Math.ceil(Math.abs(diff) * dt * 6)));
    setText(els.coins, String(shownCoins));
    setText(els["cat-count"], `${state.cats.length}/${state.maxCats}`);
    els.refill.classList.toggle("short", state.coins < CONFIG.FOOD_COST);

    const label = state.muted ? "Turn sound on" : "Mute sound";
    if (els["mute-btn"].getAttribute("aria-label") !== label) {
      els["mute-btn"].setAttribute("aria-label", label);
      els["mute-btn"].title = label;
      els["mute-btn"].setAttribute("aria-pressed", String(state.muted));
      setIcon(els["mute-icon"], state.muted ? "soundOff" : "soundOn");
    }
  }

  // ---------- the door ----------
  function renderStray(state) {
    const stray = state.stray;
    els["stray-panel"].classList.toggle("visible", !!stray);
    els["stray-empty"].hidden = !!stray;
    if (!stray) {
      const allHome = CONFIG.CAT_ROSTER.every((entry) => state.cats.some((c) => c.name === entry.name));
      setText(els["stray-empty"], allHome ? "Every cat has a home here now." : "No one at the door. Strays wander by now and then.");
      return;
    }
    const look = CONFIG.CAT_LOOKS[stray.look].label.toLowerCase();
    const pers = CONFIG.PERSONALITIES[stray.personality];
    setText(els["stray-text"], `${stray.name} is waiting at the door.`);
    setText(els["stray-meta"], `A ${pers ? pers.label.toLowerCase() + " " : ""}${look} stray looking for a home.`);
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
    const pers = CONFIG.PERSONALITIES[cat.personality];
    setText(els["info-meta"], [CONFIG.CAT_LOOKS[cat.look].label, pers && pers.label, STATUS[cat.mode]].filter(Boolean).join(" · "));
    els["info-meta"].title = pers ? pers.text : "";
    const per = CONFIG.AFFECTION_MAX / hearts.length;
    hearts.forEach((img, i) => {
      const name = cat.affection >= (i + 1) * per ? "heart" : "heartEmpty";
      if (img.dataset.icon !== name) {
        img.dataset.icon = name;
        setIcon(img, name);
      }
    });
    setText(els["info-affection"], `${cat.affection}/${CONFIG.AFFECTION_MAX}`);
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

    if (placing && !Decor.freeSlots(state).length) stopPlacing();
    Scene.render(state, dt, { selectedId: selectedCatId, hoverId: hoverCatId, placing, hoverSlot });
    renderHud(state, dt);
    renderStray(state);
    renderInfo(state);
    renderUpgrades(state);
    renderDecor(state);
  }

  return { init, render, showMessage, showPayment, showRefill, showUpgrade, showPlaced, showStaffRefill, showAway };
})();
