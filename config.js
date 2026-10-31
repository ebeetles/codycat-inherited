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

  // Starting state (SPEC 2.1)
  START_COINS: 100,
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
  STRAY_NAMES: ["Mochi", "Pepper", "Tofu", "Luna", "Biscuit", "Smudge", "Sesame", "Pudding"],

  // Layout (pixels inside the 640x400 shop; the pixel art is drawn at half
  // this size, so each art pixel is 2 of these). Positions are where things
  // stand: a cat's x/y is the point between its feet.
  SHOP_WIDTH: 640,
  SHOP_HEIGHT: 400,
  CAT_AREA: { x: 40, y: 170, w: 560, h: 200 }, // cats never leave this box
  DOOR_POS: { x: 50, y: 90 },
  STRAY_POS: { x: 92, y: 160 }, // where a waiting stray sits, just right of the door
  BOWL_POS: { x: 196, y: 164 },
  SEAT_POSITIONS: [            // the two café tables against the back wall
    { x: 444, y: 128 },
    { x: 564, y: 128 },
  ],

  // Cat behavior
  CAT_SPEED: 45, // pixels per second while walking
  CAT_MODE_SECONDS: { walk: [2, 5], idle: [2, 5], sleep: [8, 15] },

  // Cat appearances. "orange" is Cream; strays pick from the others (3+ needed).
  CAT_LOOKS: {
    orange: { color: "#f4a259", label: "Orange tabby" },
    gray: { color: "#9aa0a6", label: "Gray" },
    black: { color: "#3b3b3b", label: "Black" },
    white: { color: "#f3efe6", label: "White" },
  },
};
