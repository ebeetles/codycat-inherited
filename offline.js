// offline.js — coins earned while the game was closed. SPEC P2 #28.
// Does not touch the DOM; ui.js shows the "welcome back" message.
// Cats don't get hungrier while the game is closed: their fullness is
// restored exactly as saved. A hidden tab isn't "offline" (the game is
// paused, and keeps saving), so only time with the game closed counts.

const Offline = (() => {
  // Full minutes from the last save until now, up to the cap.
  // 0 if there's no save time or the clock went backwards.
  function minutesAway(savedAt, now) {
    if (!savedAt || now <= savedAt) return 0;
    return Math.min(CONFIG.OFFLINE_MAX_MINUTES, Math.floor((now - savedAt) / 60000));
  }

  // Adds the coins to state and returns { minutes, coins, capped }.
  // The caller saves right away, which moves the save time to now, so the
  // same time away is never paid twice.
  function collect(state, savedAt, now) {
    const minutes = minutesAway(savedAt, now);
    const coins = minutes * CONFIG.OFFLINE_COINS_PER_MINUTE;
    state.coins += coins;
    return { minutes, coins, capped: minutes === CONFIG.OFFLINE_MAX_MINUTES };
  }

  return { minutesAway, collect };
})();
