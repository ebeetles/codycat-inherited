// save.js — keeps the game in the browser's local storage between visits.
// SPEC P1 #22. Saves coins, cats (with fullness and affection), upgrades,
// decorations, the collection book and the sound setting. Customers and a
// waiting stray aren't saved. Saves from before decorations and affection
// load fine: missing values start empty.
// If storage is blocked or the save is damaged, the game simply starts fresh.

const Save = (() => {
  const VERSION = 1;

  function write(state) {
    const data = {
      version: VERSION,
      savedAt: Date.now(),
      coins: state.coins,
      cats: state.cats.map((c) => ({
        id: c.id, name: c.name, look: c.look, fullness: c.fullness, decayTimer: c.decayTimer, affection: c.affection,
      })),
      upgrades: state.upgrades,
      decor: state.decor,
      book: state.book,
      muted: state.muted,
    };
    try {
      localStorage.setItem(CONFIG.SAVE_KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      return false;
    }
  }

  // The saved game, checked and cleaned up, or null if there isn't a usable one.
  function load() {
    let data;
    try {
      data = JSON.parse(localStorage.getItem(CONFIG.SAVE_KEY));
    } catch (e) {
      return null;
    }
    if (!data || data.version !== VERSION || !Number.isFinite(data.coins) || !Array.isArray(data.cats)) return null;
    const cats = data.cats.filter(
      (c) => c && Number.isInteger(c.id) && typeof c.name === "string" && CONFIG.CAT_LOOKS[c.look] && Number.isFinite(c.fullness)
    );
    if (!cats.length) return null;
    const upgrades = {};
    for (const id of Object.keys(CONFIG.UPGRADES)) upgrades[id] = !!(data.upgrades && data.upgrades[id]);
    const decor = CONFIG.DECOR_SLOTS.map((_, i) => {
      const kind = Array.isArray(data.decor) ? data.decor[i] : null;
      return CONFIG.DECOR[kind] ? kind : null;
    });
    return {
      coins: Math.max(0, Math.floor(data.coins)),
      cats,
      upgrades,
      decor,
      book: Array.isArray(data.book) ? data.book.filter((n) => typeof n === "string") : [],
      muted: !!data.muted,
      savedAt: Number(data.savedAt) || 0,
    };
  }

  function clear() {
    try {
      localStorage.removeItem(CONFIG.SAVE_KEY);
    } catch (e) {
      // Storage is blocked; nothing to clear.
    }
  }

  return { write, load, clear };
})();
