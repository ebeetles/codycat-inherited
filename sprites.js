// sprites.js — all pixel art for the café, drawn from text grids.
// Each grid is an array of equal-length strings; each character is one pixel,
// looked up in a palette ('.' is transparent). Grids become small canvases,
// cached, which scene.js and ui.js draw at whole-number scales.

const Sprites = (() => {
  const cache = new Map();

  function makeCanvas(w, h) {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    return c;
  }

  function fromGrid(rows, palette) {
    const w = Math.max(...rows.map((r) => r.length));
    const c = makeCanvas(w, rows.length);
    const g = c.getContext("2d");
    rows.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        const color = palette[row[x]];
        if (color) {
          g.fillStyle = color;
          g.fillRect(x, y, 1, 1);
        }
      }
    });
    return c;
  }

  function flip(src) {
    const c = makeCanvas(src.width, src.height);
    const g = c.getContext("2d");
    g.translate(src.width, 0);
    g.scale(-1, 1);
    g.drawImage(src, 0, 0);
    return c;
  }

  function cached(key, build) {
    if (!cache.has(key)) cache.set(key, build());
    return cache.get(key);
  }

  // Grid helpers: work on arrays of char arrays so frames can be composed.
  function toMatrix(rows, w, h) {
    const m = [];
    for (let y = 0; y < h; y++) {
      const row = rows[y] || "";
      m.push(Array.from({ length: w }, (_, x) => row[x] || "."));
    }
    return m;
  }

  function stamp(m, rows, ox, oy) {
    rows.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        if (row[x] !== "." && m[oy + y] && m[oy + y][ox + x] !== undefined) m[oy + y][ox + x] = row[x];
      }
    });
    return m;
  }

  const toRows = (m) => m.map((r) => r.join(""));

  function shade(hex, f) {
    const n = parseInt(hex.slice(1), 16);
    const ch = (v) => Math.max(0, Math.min(255, Math.round(v * f)));
    const r = ch(n >> 16), g = ch((n >> 8) & 255), b = ch(n & 255);
    return "#" + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
  }

  // ---------------------------------------------------------------- cats
  // o outline, b fur, d fur shade, t stripe, c chest/muzzle/paws,
  // p pink (ears, nose), e eyes, x closed eyes.
  const CAT_PALETTES = {
    orange: { o: "#6b3a22", b: "#f0a050", d: "#d27f38", t: "#c96a28", c: "#fff1dc", p: "#f49a9a", e: "#3a2016", x: "#8a4a22" },
    gray:   { o: "#363945", b: "#a7adb9", d: "#878e9c", t: "#8a909e", c: "#f1f2f5", p: "#f0a0a8", e: "#20222a", x: "#4f5462" },
    black:  { o: "#120f17", b: "#3b3544", d: "#2b2633", t: "#3b3544", c: "#f6f1e7", p: "#e88d9a", e: "#f2d24a", x: "#18141e" },
    white:  { o: "#7a6b62", b: "#fbf6ee", d: "#e3d9cb", t: "#fbf6ee", c: "#ffffff", p: "#f6a5b0", e: "#4a8fc9", x: "#a8968a" },
    cream:  { o: "#7a5a3e", b: "#f6e1bd", d: "#e3c79c", t: "#e8b77a", c: "#fffaf0", p: "#f4a5a5", e: "#5a3a24", x: "#b08a64" },
    blue:   { o: "#2f3644", b: "#7d8aa0", d: "#65718a", t: "#7d8aa0", c: "#93a0b5", p: "#c98a9a", e: "#9ed46e", x: "#4a5468" },
    brown:  { o: "#3e2618", b: "#9a6a44", d: "#7c5232", t: "#5a3a24", c: "#ead6b4", p: "#e89a8a", e: "#2a1a10", x: "#5a3a24" },
    tortie: { o: "#1e1712", b: "#3d2e27", d: "#2b211c", t: "#d9883e", c: "#e0a050", p: "#d98a8a", e: "#e8c84a", x: "#120e0b" },
  };

  // Side view, facing right. Legs are added per frame below.
  const CAT_WALK_BODY = [
    ".............o....o.",
    "..o.........opo..opo",
    ".obo........obbttbbo",
    ".obo........obebbebo",
    "..obo.......obebbebo",
    "..obooooooooobcppcbo",
    "...obbtbbtbbbbccccbo",
    "...obbtbbtbbboooooo.",
    "...obbtbbtbbbccco...",
    "...odbbbbbbbbcco....",
    "....odddddddddo.....",
  ];

  // Leg positions for the 4-frame walk: x = left column, far = shaded
  // (behind the body), up = mid-step (shorter).
  const WALK_LEGS = [
    [{ x: 4, far: 1 }, { x: 7, up: 1 }, { x: 10, far: 1, up: 1 }, { x: 12 }],
    [{ x: 5, far: 1 }, { x: 6 }, { x: 11, far: 1 }, { x: 11 }],
    [{ x: 7, far: 1, up: 1 }, { x: 4 }, { x: 12, far: 1 }, { x: 10, up: 1 }],
    [{ x: 6, far: 1 }, { x: 5 }, { x: 11, far: 1 }, { x: 12 }],
  ];

  function catWalkRows(i) {
    const m = toMatrix(CAT_WALK_BODY, 20, 14);
    const legs = WALK_LEGS[i];
    for (const leg of [...legs.filter((l) => l.far), ...legs.filter((l) => !l.far)]) {
      const fill = leg.far ? "d" : "b";
      const paw = leg.far ? "d" : "c";
      const rows = leg.up ? ["o" + fill + "o", "ooo"] : ["o" + fill + "o", "o" + paw + "o", "ooo"];
      stamp(m, rows, leg.x, 11);
    }
    return toRows(m);
  }

  // Sitting, facing right (used for resting and for the stray at the door).
  const CAT_SIT = [
    "........o....o..",
    ".......opo..opo.",
    ".......obbttbbo.",
    ".......obebbebo.",
    ".......obebbebo.",
    ".......obcppcbo.",
    "......obbccccbo.",
    ".....obtbbccccbo",
    "....obtbtbbcccbo",
    "....obtbtbbbccbo",
    "...odbtbtbbbccbo",
    "o..oddbbbbbbccbo",
    "obooddddbbbocco.",
    "obbbbddddddocco.",
    ".oooooooooooooo.",
  ];
  // Same pose with the tail tip down (alternated for a slow tail swish).
  const CAT_SIT_TAIL = CAT_SIT.map((r, y) =>
    y === 11 ? "...oddbbbbbbccbo" : y === 12 ? "ooooddddbbbocco." : r
  );

  // Curled up asleep, facing right.
  const CAT_SLEEP = [
    "..........o...o...",
    ".........opo.opo..",
    "...ooooooobbtbbbo.",
    "..obbtbbtbbbbbbbo.",
    ".obtbbtbbbbxxbxxo.",
    ".obtbbtbbbbbcppco.",
    ".oddbbbbbbbbcccco.",
    ".oddddobbtbbtbbbo.",
    "..oooooooooooooo..",
  ];
  // Breathing in: the top half rises one pixel.
  const CAT_SLEEP_IN = [...CAT_SLEEP.slice(0, 4), CAT_SLEEP[3], ...CAT_SLEEP.slice(4)];

  // Blink: top eye pixel becomes fur, bottom eye pixel becomes a closed-eye line.
  function blink(rows) {
    let seen = false;
    return rows.map((r) => {
      if (!r.includes("e")) return r;
      const out = r.replace(/e/g, seen ? "x" : "b");
      seen = true;
      return out;
    });
  }

  const CAT_FRAMES = {
    walk0: () => catWalkRows(0),
    walk1: () => catWalkRows(1),
    walk2: () => catWalkRows(2),
    walk3: () => catWalkRows(3),
    sit: () => CAT_SIT,
    sitBlink: () => blink(CAT_SIT),
    sitTail: () => CAT_SIT_TAIL,
    sitTailBlink: () => blink(CAT_SIT_TAIL),
    sleep: () => CAT_SLEEP,
    sleepIn: () => CAT_SLEEP_IN,
  };

  // A cat not met yet: one flat color, for locked collection-book entries.
  function silhouette(frame) {
    return cached(`cat:silhouette:${frame}`, () => {
      const pal = {};
      for (const k of "obdtcpex") pal[k] = "#4b3d63";
      return fromGrid(CAT_FRAMES[frame](), pal);
    });
  }

  function cat(look, frame, facing = 1) {
    return cached(`cat:${look}:${frame}:${facing}`, () => {
      const right = cached(`cat:${look}:${frame}:1`, () =>
        fromGrid(CAT_FRAMES[frame](), CAT_PALETTES[look] || CAT_PALETTES.orange)
      );
      return facing < 0 ? flip(right) : right;
    });
  }

  // ---------------------------------------------------------------- customers
  // Front-facing chibi people, 12x20. o outline, k skin, h hair, H hair shade,
  // e eyes, m blush, s shirt, S shirt shade, p pants, f shoes, a hat, A hat band.
  const FACE = [
    ".ohkkkkkkho.",
    ".okekkkkeko.",
    ".okmkkkkmko.",
    "..okkkkkko..",
    "...oooooo...",
  ];
  const HEADS = {
    short: ["............", "............", "...oooooo...", "..ohhhhhho..", ".ohhhhhhhho.", ".ohHhhhhHho.", ...FACE],
    bun: ["....oooo....", "...ohhhho...", "..oohhhhoo..", "..ohhhhhho..", ".ohhhhhhhho.", ".ohHhhhhHho.", ...FACE],
    beanie: ["....oaao....", "...oaaaao...", "..oaaaaaao..", ".oaaaaaaaao.", ".oAAAAAAAAo.", ".ohhkkkkhho.", ...FACE],
    long: [
      "............", "............", "...oooooo...", "..ohhhhhho..", ".ohhhhhhhho.", "ohhhhhhhhhho",
      "ohhkkkkkkhho", "ohkekkkkekho", "ohkmkkkkmkho", "ohhkkkkkkhho", "ohhoooooohho",
    ],
  };
  // Long hair falls over the shoulders, drawn on top of the body.
  const LONG_HAIR_FRONT = ["oho......oho", ".o........o."];
  const BODY = [
    "..osssssso..",
    ".osssssssso.",
    ".okssssssko.",
    ".ooSSSSSSoo.",
  ];
  // A shop apron over the shirt and upper legs, for staff.
  const APRON = ["....w..w....", "...wwwwww...", "...wwwwww...", "...WWWWWW...", "...wwwwww...", "...WWWWWW..."];
  const LEGS = {
    stand: ["..oppppppo..", "..oppooppo..", "..oppooppo..", "..offooffo..", "..oooooooo.."],
    stepA: ["..oppppppo..", "..oppooppo..", "..offooppo..", "..oooooffo..", "......oooo.."],
    stepB: ["..oppppppo..", "..oppooppo..", "..oppooffo..", "..offooooo..", "..oooo......"],
  };

  const SKINS = ["#f6d2b8", "#e8b48f", "#c98d64", "#8d5a3c"];
  const HAIRS = ["#3b2a22", "#6b4226", "#c98a3c", "#2d2a35", "#b5524a", "#ead7a8"];
  const SHIRTS = ["#7fa7c9", "#d98a8a", "#8fb38a", "#e0b45a", "#a58ac9", "#e9e2d2"];
  const PANTS = ["#4a4e69", "#5b4636", "#3d5a6c"];
  const STYLES = ["short", "bun", "beanie", "long"];

  // Staff wear the same shapes as customers, plus an apron.
  const STAFF_LOOK = { skin: "#e8b48f", hair: "#2d2a35", shirt: "#8fb38a", pants: "#4a4e69", style: "bun", hat: "#8fb38a", apron: "#fff4dc" };

  // A stable look for each customer id.
  function customerLook(id) {
    let s = (id * 2654435761) >>> 0;
    const pick = (list) => {
      s = (s * 1664525 + 1013904223) >>> 0;
      return list[s % list.length];
    };
    return {
      skin: pick(SKINS), hair: pick(HAIRS), shirt: pick(SHIRTS), pants: pick(PANTS),
      style: pick(STYLES), hat: pick(SHIRTS),
    };
  }

  function customer(look, pose) {
    const key = `cust:${look.skin}${look.hair}${look.shirt}${look.pants}${look.style}${look.hat}${look.apron || ""}:${pose}`;
    return cached(key, () => {
      const m = toMatrix([], 12, 20);
      stamp(m, HEADS[look.style], 0, 0);
      stamp(m, BODY, 0, 11);
      stamp(m, LEGS[pose === "seated" ? "stand" : pose], 0, 15);
      if (look.apron) stamp(m, APRON, 0, 11);
      if (look.style === "long") stamp(m, LONG_HAIR_FRONT, 0, 11);
      const rows = toRows(pose === "seated" ? m.slice(0, 15) : m);
      return fromGrid(rows, {
        o: "#3a2828", k: look.skin, h: look.hair, H: shade(look.hair, 0.8), e: "#2a1c1c",
        m: shade(look.skin, 0.9), s: look.shirt, S: shade(look.shirt, 0.82), p: look.pants,
        f: "#4a3530", a: look.hat, A: shade(look.hat, 0.8),
        w: look.apron, W: look.apron && shade(look.apron, 0.88),
      });
    });
  }

  // ---------------------------------------------------------------- props + icons
  const GRIDS = {
    coin: {
      rows: ["..oooo..", ".oyyyyo.", "oywyyyyo", "oywyddyo", "oyyyddyo", "oyyyyyyo", ".oddddo.", "..oooo.."],
      pal: { o: "#7a4a12", y: "#f2c14e", w: "#fff3c4", d: "#d99a2b" },
    },
    heart: {
      rows: [".oo.oo.", "orrorro", "orwrrro", "orrrrro", ".orrro.", "..oro..", "...o..."],
      pal: { o: "#7a2a3a", r: "#ec6a83", w: "#ffd3db" },
    },
    heartEmpty: {
      rows: [".oo.oo.", "oeeoeeo", "oeeeeeo", "oeeeeeo", ".oeeeo.", "..oeo..", "...o..."],
      pal: { o: "#a8714a", e: "#ead2a8" },
    },
    heartSmall: {
      rows: ["r.r", "rrr", ".r."],
      pal: { r: "#f08aa0" },
    },
    sparkle: {
      rows: ["..w..", "..y..", "wyWyw", "..y..", "..w.."],
      pal: { w: "#fff6d8", y: "#f7d77a", W: "#ffffff" },
    },
    sparkleSmall: {
      rows: [".y.", "yWy", ".y."],
      pal: { y: "#f7d77a", W: "#ffffff" },
    },
    fish: {
      rows: ["..ooo..o", ".obbbooo", "obebbbbo", ".obbbooo", "..ooo..o"],
      pal: { o: "#3e5a7a", b: "#8fc1e3", e: "#1e2a3a" },
    },
    z: {
      rows: ["oooo", "..o.", ".o..", "oooo"],
      pal: { o: "#e9ecff" },
    },
    question: {
      rows: [".ooo.", "o...o", "...o.", "..o..", ".....", "..o.."],
      pal: { o: "#5b3a29" },
    },
    arrow: {
      rows: ["ooooooo", "oyyyyyo", ".oyyyo.", "..oyo..", "...o..."],
      pal: { o: "#5b3a29", y: "#f2b45a" },
    },
    cup: {
      rows: ["oooo.", "owwoo", "owwoo", ".oo..", "ooooo"],
      pal: { o: "#7a5a4a", w: "#fff8ee" },
    },
    cupMatcha: {
      rows: ["oooo.", "oggoo", "oGgoo", ".oo..", "ooooo"],
      pal: { o: "#5a6a4a", g: "#9cc77a", G: "#d8eec4" },
    },
    bowlEmpty: {
      rows: ["..............", "..............", "..oooooooooo..", ".oiiiiiiiiiio.", "obbbbbbbbbbbbo", "obwbbbbbbbbbbo", ".obbbbbbbbbbo.", "..oooooooooo.."],
      pal: null,
    },
    bowlLow: {
      rows: ["..............", "..............", "..oooooooooo..", ".oiikKiiKkiio.", "obbbbbbbbbbbbo", "obwbbbbbbbbbbo", ".obbbbbbbbbbo.", "..oooooooooo.."],
      pal: null,
    },
    bowlHalf: {
      rows: ["..............", "..............", "..oKkkKkkKko..", ".okkKkkkKkkko.", "obbbbbbbbbbbbo", "obwbbbbbbbbbbo", ".obbbbbbbbbbo.", "..oooooooooo.."],
      pal: null,
    },
    bowlFull: {
      rows: ["..............", "....kKkkKk....", "..okkKkkkKko..", ".okKkkkKkkKko.", "obbbbbbbbbbbbo", "obwbbbbbbbbbbo", ".obbbbbbbbbbo.", "..oooooooooo.."],
      pal: null,
    },
    book: {
      rows: ["oooooo.", "orrrrro", "orwwwro", "orrrrro", "orrprro", "orrrrro", "owwwwwo", "ooooooo"],
      pal: { o: "#3d261b", r: "#c47c7c", w: "#fff4dc", p: "#f2b45a" },
    },
    shop: {
      rows: [".oooooo.", "orwrwrwo", "orwrwrwo", ".oooooo.", ".owwwwo.", ".obbwgo.", ".obbwwo.", "oooooooo"],
      pal: { o: "#3d261b", r: "#d9776a", w: "#fff4dc", b: "#a8714a", g: "#8fc1e3" },
    },
    plant: {
      rows: ["..g.g...", ".gGgGg..", "gGggGgg.", ".gggGg..", "..oooo..", ".otttto.", ".otttto.", "..oooo.."],
      pal: { o: "#3d261b", g: "#5f8a5d", G: "#8fc28a", t: "#d9776a" },
    },
    soundOn: {
      rows: ["...o..o.", "..oo...o", "oooo.o.o", "oooo.o.o", "oooo.o.o", "..oo...o", "...o..o."],
      pal: { o: "#3d261b" },
    },
    soundOff: {
      rows: ["...o....", "..oo....", "oooo.o.o", "oooo..o.", "oooo.o.o", "..oo....", "...o...."],
      pal: { o: "#3d261b" },
    },
    close: {
      rows: ["oo...oo", ".oo.oo.", "..ooo..", ".oo.oo.", "oo...oo"],
      pal: { o: "#3d261b" },
    },
    // Small head used as the HUD cat icon.
    catHead: {
      rows: [".o....o.", "opo..opo", "obbttbbo", "obebbebo", "obebbebo", "obcppcbo", ".occcco.", "..oooo.."],
      pal: CAT_PALETTES.orange,
    },
  };
  const BOWL_PAL = { o: "#2f4466", i: "#3c4e6e", b: "#6f9fd8", w: "#bcd8f5", k: "#b8783f", K: "#7e4a26" };

  function icon(name) {
    return cached(`icon:${name}`, () => {
      const g = GRIDS[name];
      return fromGrid(g.rows, g.pal || BOWL_PAL);
    });
  }

  // Icons as image URLs, for <img> tags in the page chrome.
  function iconDataURL(name) {
    return cached(`url:${name}`, () => icon(name).toDataURL());
  }

  return { cat, silhouette, customer, customerLook, STAFF_LOOK, icon, iconDataURL, shade, makeCanvas, CAT_PALETTES };
})();
