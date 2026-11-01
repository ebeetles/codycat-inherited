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

  // Upgrades (SPEC P1 #23, P2 #29). Each can be bought once; names and
  // descriptions are in upgrades.js.
  UPGRADES: {
    seats: { cost: 100, seats: 3, spawnSeconds: 10 }, // a third table; customers try to arrive every 10 s
    capacity: { cost: 150, maxCats: 5 },               // room for more cats
    loft: { cost: 300, maxCats: 9, needs: "capacity" }, // shop expansion: every roster cat fits
    matcha: { cost: 120, chance: 0.5, bonus: 10 },     // new drink: half of customers order it, +10 each
    staff: { cost: 200 },                              // refills food whenever a cat gets hungry
  },
  STAFF_NAME: "Juniper",

  // Decorations (SPEC P2 #26). Bought one at a time and placed in a free spot.
  DECOR: {
    cushion: { name: "Cat cushion", cost: 30, text: "A plump round cushion, just the right size for a nap." },
    yarn: { name: "Yarn basket", cost: 45, text: "A wicker basket of yarn balls, already a little unraveled." },
    lamp: { name: "Floor lamp", cost: 70, text: "A tall lamp with a fringed shade and a warm glow." },
    tank: { name: "Fish tank", cost: 100, text: "Two goldfish and a bubbling castle. The cats are very interested." },
  },

  // Cat personalities (SPEC P2 #27). Each changes the odds of what a cat does
  // next (walk / idle / sleep), how long it keeps doing it, and walking speed.
  // Cats without one use CAT_MODE_ODDS and CAT_MODE_SECONDS as they are.
  PERSONALITIES: {
    playful: {
      label: "Playful", text: "Always on the move: rests half as long and trots faster.",
      odds: { walk: 0.65, idle: 0.25, sleep: 0.1 }, times: { walk: 1, idle: 0.5, sleep: 0.6 }, speed: 1.3,
    },
    sleepy: {
      label: "Sleepy", text: "Naps more often, and for twice as long.",
      odds: { walk: 0.3, idle: 0.3, sleep: 0.4 }, times: { walk: 1, idle: 1, sleep: 2 }, speed: 0.85,
    },
    curious: {
      label: "Curious", text: "Wanders off more often and for longer, to check on everything.",
      odds: { walk: 0.7, idle: 0.2, sleep: 0.1 }, times: { walk: 1.6, idle: 1, sleep: 1 }, speed: 1,
    },
  },
  AFFECTION_MAX: 100,
  AFFECTION_PER_PET: 2,

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
  DECOR_SLOTS: [               // where decorations can go (the bottom middle of each one)
    { x: 132, y: 224 },
    { x: 516, y: 240 },
    { x: 172, y: 392 },
    { x: 330, y: 392 },
    { x: 444, y: 392 },
  ],
  SEAT_POSITIONS: [            // café tables against the back wall; the third comes with an upgrade
    { x: 412, y: 128 },
    { x: 492, y: 128 },
    { x: 572, y: 128 },
  ],

  // Cat behavior
  CAT_SPEED: 45, // pixels per second while walking
  CAT_MODE_SECONDS: { walk: [2, 5], idle: [2, 5], sleep: [8, 15] },
  CAT_MODE_ODDS: { walk: 0.5, idle: 0.3, sleep: 0.2 },

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
    { name: "Cream", look: "orange", personality: "sleepy", about: "The café's first resident. Naps in the sunbeam and supervises every refill." },
    { name: "Mochi", look: "white", personality: "curious", about: "Soft as a rice cake. Follows customers to their seats, then pretends she didn't." },
    { name: "Pepper", look: "black", personality: "playful", about: "Dressed for a fancy dinner every day. Purrs like a tiny engine." },
    { name: "Tofu", look: "white", personality: "sleepy", about: "Quiet and pale, and very good at sitting in boxes that are too small." },
    { name: "Luna", look: "blue", personality: "curious", about: "Wakes up when the lamps come on and watches the street from the window." },
    { name: "Biscuit", look: "brown", personality: "sleepy", about: "Kneads every cushion before sitting on it. Smells faintly of toast." },
    { name: "Smudge", look: "gray", personality: "playful", about: "Has a dark smudge on the nose and no plans to clean it." },
    { name: "Sesame", look: "tortie", personality: "curious", about: "A patchwork of black and gold, with opinions to match." },
    { name: "Pudding", look: "cream", personality: "playful", about: "Custard-colored and wobbly when running. Always first to the food bowl." },
  ],
};
