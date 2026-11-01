// config.js — every tunable number from SPEC.md lives here.
// Change balance or layout here instead of hunting through the logic files.

const urlParams = new URLSearchParams(window.location.search);

const CONFIG = {
  // Test helper: open index.html?speed=10 to run the simulation 10x faster.
  // Normal play is speed 1.
  SPEED: Math.max(1, Number(urlParams.get("speed")) || 1),

  // Test helper: open index.html?stray=1 to make a stray appear right away,
  // and make every later stray check succeed. Normal play uses STRAY_CHANCE.
  STRAY_TEST: urlParams.get("stray") === "1",

  // Test helper: open index.html?reset=1 to delete the saved game and start over.
  RESET_SAVE: urlParams.get("reset") === "1",

  // Test helper: open index.html?away=30 to load the save as if the game had
  // been closed for 30 minutes (pays offline coins on every load while set).
  AWAY_TEST: Math.max(0, Number(urlParams.get("away")) || 0),

  // Starting state (SPEC 2.1)
  START_COINS: 100,
  START_SEATS: 2,
  MAX_CATS: 3,

  // Cat care (SPEC 2.2)
  FULLNESS_MAX: 100,
  FULLNESS_DECAY_SECONDS: 10, // lose 1 fullness every 10 s
  HUNGRY_BELOW: 30,           // hunger marker shows below this
  FOOD_COST: 10,
  FOOD_AMOUNT: 30,

  // Customers (SPEC 2.4)
  CUSTOMER_SPAWN_SECONDS: 20,
  CUSTOMER_STAY_SECONDS: 30,
  CUSTOMER_BASE_PAY: 20,
  CUSTOMER_BONUS_PER_FED_CAT: 5,

  // Strays (SPEC 2.3)
  STRAY_CHECK_SECONDS: 60,
  STRAY_CHANCE: 0.5,

  // Facility upgrades (SPEC P1 #23). Each can be bought once.
  UPGRADES: {
    seats: { cost: 100, seats: 3, spawnSeconds: 10 }, // a third table; customers try to arrive every 10 s
    capacity: { cost: 150, maxCats: 5 },               // room for more cats
  },

  // Saving (SPEC P1 #22)
  SAVE_KEY: "cozy-cat-cafe-save",
  SAVE_EVERY_SECONDS: 5,

  // Offline earnings (SPEC P2 #28)
  OFFLINE_COINS_PER_MINUTE: 10,
  OFFLINE_MAX_MINUTES: 120,

  // Layout (pixels inside the 640x400 shop; the pixel art is drawn at half
  // this size, so each art pixel is 2 of these). Positions are where things
  // stand: a cat's x/y is the point between its feet.
  SHOP_WIDTH: 640,
  SHOP_HEIGHT: 400,
  CAT_AREA: { x: 40, y: 170, w: 560, h: 200 }, // cats never leave this box
  DOOR_POS: { x: 50, y: 90 },
  STRAY_POS: { x: 92, y: 160 }, // where a waiting stray sits, just right of the door
  BOWL_POS: { x: 196, y: 164 },
  SEAT_POSITIONS: [            // café tables against the back wall; the third comes with an upgrade
    { x: 412, y: 128 },
    { x: 492, y: 128 },
    { x: 572, y: 128 },
  ],

  // Cat behavior
  CAT_SPEED: 45, // pixels per second while walking
  CAT_MODE_SECONDS: { walk: [2, 5], idle: [2, 5], sleep: [8, 15] },

  // Cat appearances (palettes are in sprites.js). "orange" is only Cream.
  CAT_LOOKS: {
    orange: { label: "Orange tabby" },
    gray: { label: "Gray tabby" },
    black: { label: "Tuxedo" },
    white: { label: "White" },
    cream: { label: "Cream tabby" },
    blue: { label: "Blue gray" },
    brown: { label: "Brown tabby" },
    tortie: { label: "Tortoiseshell" },
  },

  // Every cat that can live in the café, for strays and the collection book.
  // The first is the starting cat; strays are drawn from the rest.
  CAT_ROSTER: [
    { name: "Cream", look: "orange", about: "The café's first resident. Naps in the sunbeam and supervises every refill." },
    { name: "Mochi", look: "white", about: "Soft as a rice cake. Follows customers to their seats, then pretends she didn't." },
    { name: "Pepper", look: "black", about: "Dressed for a fancy dinner every day. Purrs like a tiny engine." },
    { name: "Tofu", look: "white", about: "Quiet and pale, and very good at sitting in boxes that are too small." },
    { name: "Luna", look: "blue", about: "Wakes up when the lamps come on and watches the street from the window." },
    { name: "Biscuit", look: "brown", about: "Kneads every cushion before sitting on it. Smells faintly of toast." },
    { name: "Smudge", look: "gray", about: "Has a dark smudge on the nose and no plans to clean it." },
    { name: "Sesame", look: "tortie", about: "A patchwork of black and gold, with opinions to match." },
    { name: "Pudding", look: "cream", about: "Custard-colored and wobbly when running. Always first to the food bowl." },
  ],
};
