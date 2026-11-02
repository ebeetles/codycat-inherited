// scene.js — draws the café on one pixel-art canvas: the room and its live
// details (sky, sunbeam, lights, steam, plants, clock), the cats, customers,
// the stray, and small effects. It only reads game state, never changes it.
//
// Art is 320x200 pixels, drawn at a whole-number scale. Game logic uses
// 640x400 (CONFIG.SHOP_WIDTH/HEIGHT), so logic positions are halved here.

const Scene = (() => {
  const W = 320;
  const H = 200;
  const LP = CONFIG.SHOP_WIDTH / W; // logic pixels per art pixel
  const FLOOR_Y = 72;
  const DOOR_X = 25;                // where people and strays come and go
  const WALK_Y = 80;                // customers walk along this line
  const GLASS = { x: 55, y: 15, w: 47, h: 27 }; // window glass
  const SEATS = CONFIG.SEAT_POSITIONS.map((p) => ({ x: Math.round(p.x / LP), y: Math.round(p.y / LP) }));
  const BOWL = { x: Math.round(CONFIG.BOWL_POS.x / LP), y: Math.round(CONFIG.BOWL_POS.y / LP) };
  const STRAY = { x: Math.round(CONFIG.STRAY_POS.x / LP), y: Math.round(CONFIG.STRAY_POS.y / LP) };
  const CLOCK = { x: 226, y: 30 };
  const SLOTS = CONFIG.DECOR_SLOTS.map((p) => ({ x: Math.round(p.x / LP), y: Math.round(p.y / LP) }));
  const STAFF_HOME = { x: 186, y: 88 };            // beside the counter
  const STAFF_AT_BOWL = { x: BOWL.x + 12, y: BOWL.y };
  const LOFT = { x: 256, y: 20 };                  // the loft doorway, over Cream's portrait
  const calm = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  let canvas, ctx;
  let scale = 2;
  let bg;                       // static room layer, drawn once
  let time = 0;                 // real seconds, drives every animation
  const particles = [];
  const custVis = new Map();    // customer id -> { look, x, seated }
  const walkers = [];           // leaving customers, strays going home
  const catAnim = new Map();    // cat id -> { seed, zT }
  let strayVis = null;          // { id, look, x, arrived }
  let frameDt = 0;
  let doorOpen = 0;            // seconds the door stays open
  let bell = 0;                 // bell swing energy
  let bird = null;
  let nextBird = 6;
  let steamT = 0;

  // ------------------------------------------------------------ drawing helpers
  function rect(g, x, y, w, h, c) {
    g.fillStyle = c;
    g.fillRect(x, y, w, h);
  }

  function line(g, x0, y0, x1, y1, c) {
    x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    g.fillStyle = c;
    for (;;) {
      g.fillRect(x0, y0, 1, 1);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x0 += sx; }
      if (e2 <= dx) { err += dx; y0 += sy; }
    }
  }

  function ellipse(g, cx, cy, rx, ry, c) {
    g.fillStyle = c;
    for (let dy = -ry; dy <= ry; dy++) {
      const w = Math.round(rx * Math.sqrt(1 - (dy * dy) / (ry * ry + 0.01)));
      g.fillRect(cx - w, cy + dy, w * 2 + 1, 1);
    }
  }

  function draw(img, x, y, g = ctx) {
    g.drawImage(img, Math.round(x), Math.round(y));
  }

  function seeded(seed) {
    let s = seed >>> 0;
    return () => {
      s = (s + 0x6d2b79f5) >>> 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // ------------------------------------------------------------ static room
  function drawRoom(g) {
    const rand = seeded(7);

    // Wallpaper: sage with soft stripes and tiny flowers.
    rect(g, 0, 0, W, FLOOR_Y, "#b5c7a0");
    for (let x = 0; x < W; x += 12) rect(g, x, 6, 2, 42, "#a9bc93");
    for (let x = 6, k = 0; x < W; x += 12, k++) {
      for (let y = 13 + (k % 2) * 7; y < 46; y += 14) {
        rect(g, x - 1, y, 3, 1, "#e8e2c8");
        rect(g, x, y - 1, 1, 3, "#e8e2c8");
        rect(g, x, y, 1, 1, "#e3a99a");
      }
    }
    // Crown molding.
    rect(g, 0, 0, W, 2, "#5e3b28");
    rect(g, 0, 2, W, 2, "#7d4f33");
    rect(g, 0, 4, W, 1, "#9b6844");
    rect(g, 0, 5, W, 1, "#6e4630");
    rect(g, 0, 6, W, 1, "#a1b38c");
    // Chair rail, wainscot panels, baseboard.
    rect(g, 0, 47, W, 1, "#f2e1c6");
    rect(g, 0, 48, W, 1, "#d1b18c");
    rect(g, 0, 49, W, 1, "#8a5a3c");
    rect(g, 0, 50, W, 18, "#9b6844");
    for (let x = 3; x < W; x += 26) {
      rect(g, x, 53, 20, 12, "#946240");
      rect(g, x, 53, 20, 1, "#7f5234");
      rect(g, x, 53, 1, 12, "#7f5234");
      rect(g, x, 64, 20, 1, "#b07d56");
      rect(g, x + 19, 53, 1, 12, "#b07d56");
    }
    rect(g, 0, 68, W, 1, "#b07d56");
    rect(g, 0, 69, W, 2, "#5e3b28");
    rect(g, 0, 71, W, 1, "#4a2e20");

    // Floor: honey oak planks with staggered seams and grain.
    const planks = ["#c98d5a", "#c58756", "#cd935f", "#c88b58"];
    for (let r = 0, y = FLOOR_Y; y < H; r++, y += 8) {
      rect(g, 0, y, W, 8, planks[Math.floor(rand() * planks.length)]);
      rect(g, 0, y, W, 1, "#d9a571");
      rect(g, 0, y + 7, W, 1, "#9f6a3d");
      for (let x = (r * 37) % 56; x < W; x += 56) {
        rect(g, x, y + 1, 1, 6, "#9f6a3d");
        rect(g, x + 1, y + 1, 1, 6, "#d59f6c");
      }
      for (let i = 0; i < 9; i++) {
        rect(g, Math.floor(rand() * W), y + 2 + Math.floor(rand() * 4), 3 + Math.floor(rand() * 5), 1, "#b77c4b");
      }
    }
    // Soft shadow where the floor meets the wall, and toward the front edge.
    g.fillStyle = "rgba(70, 35, 20, 0.22)";
    g.fillRect(0, FLOOR_Y, W, 2);
    g.fillStyle = "rgba(70, 35, 20, 0.1)";
    g.fillRect(0, FLOOR_Y + 2, W, 2);
    g.fillStyle = "rgba(60, 30, 40, 0.08)";
    g.fillRect(0, H - 6, W, 6);

    // Rug: dusty rose with a cream border, diamonds and fringe.
    const rug = { x: 108, y: 118, w: 124, h: 48 };
    rect(g, rug.x, rug.y, rug.w, rug.h, "#c47c7c");
    rect(g, rug.x, rug.y + rug.h, rug.w, 1, "rgba(70,35,20,0.25)");
    for (const inset of [3, 6]) {
      rect(g, rug.x + inset, rug.y + inset, rug.w - inset * 2, 1, "#f1e2c9");
      rect(g, rug.x + inset, rug.y + rug.h - inset - 1, rug.w - inset * 2, 1, "#f1e2c9");
      rect(g, rug.x + inset, rug.y + inset, 1, rug.h - inset * 2, "#f1e2c9");
      rect(g, rug.x + rug.w - inset - 1, rug.y + inset, 1, rug.h - inset * 2, "#f1e2c9");
    }
    for (let x = rug.x + 16, k = 0; x < rug.x + rug.w - 12; x += 14, k++) {
      const cy = rug.y + 24 + (k % 2 ? 6 : -6);
      for (let d = 0; d < 4; d++) {
        rect(g, x - d, cy - 3 + d, d * 2 + 1, 1, "#d99a92");
        rect(g, x - d, cy + 3 - d, d * 2 + 1, 1, "#d99a92");
      }
      rect(g, x, cy, 1, 1, "#f1e2c9");
    }
    for (let y = rug.y + 1; y < rug.y + rug.h; y += 2) {
      rect(g, rug.x - 2, y, 2, 1, "#f1e2c9");
      rect(g, rug.x + rug.w, y, 2, 1, "#f1e2c9");
    }

    // Doormat and cat bed.
    rect(g, 11, 73, 29, 6, "#7d5a3e");
    rect(g, 12, 74, 27, 4, "#9b7652");
    for (let x = 14; x < 38; x += 3) rect(g, x, 75, 1, 2, "#7d5a3e");
    ellipse(g, 41, 181, 15, 7, "#5f8a5d");
    ellipse(g, 41, 180, 15, 6, "#8fb38a");
    ellipse(g, 41, 180, 11, 4, "#efe3cc");
    ellipse(g, 41, 181, 9, 2, "#e2d2b4");

    // Door frame (the door itself is drawn live).
    rect(g, 8, 16, 34, 56, "#7d4f33");
    rect(g, 9, 17, 32, 1, "#a8714a");
    rect(g, 9, 17, 1, 55, "#a8714a");
    rect(g, 40, 17, 1, 55, "#5e3b28");

    // Window: frame, mullions, valance, sill. The glass stays clear so the
    // live sky shows through.
    rect(g, 52, 12, 53, 33, "#f2e6d0");
    rect(g, 52, 44, 53, 1, "#cbbca2");
    g.clearRect(GLASS.x, GLASS.y, GLASS.w, GLASS.h);
    rect(g, 77, GLASS.y, 2, GLASS.h, "#f2e6d0");
    rect(g, GLASS.x, 27, GLASS.w, 2, "#f2e6d0");
    for (let x = 50; x < 107; x += 6) {
      rect(g, x, 9, 6, 4, "#d98a8a");
      rect(g, x + 1, 13, 4, 1, "#d98a8a");
      rect(g, x + 2, 14, 2, 1, "#b86b6b");
    }
    rect(g, 50, 8, 57, 1, "#b86b6b");
    rect(g, 49, 44, 59, 3, "#f2e6d0");
    rect(g, 49, 47, 59, 1, "#cbbca2");
    // Succulent on the sill.
    rect(g, 92, 39, 8, 5, "#c2683f");
    rect(g, 92, 39, 8, 1, "#de8a5c");
    rect(g, 93, 43, 6, 1, "#9e4f2e");
    for (const [x, y] of [[93, 37], [95, 35], [97, 36], [99, 37], [96, 37]]) rect(g, x, y, 2, 3, "#7fae76");
    rect(g, 95, 35, 1, 1, "#a9d39c");

    // Counter with marble top, slatted front and a little paw sign.
    rect(g, 110, 40, 70, 4, "#efe4d2");
    rect(g, 110, 40, 70, 1, "#fbf5ea");
    rect(g, 110, 43, 70, 1, "#c9b9a2");
    for (let x = 116; x < 178; x += 11) rect(g, x, 41, 4, 1, "#ddd0bc");
    rect(g, 112, 44, 66, 25, "#7d4f33");
    for (let x = 114; x < 178; x += 6) {
      rect(g, x, 45, 1, 23, "#6e4429");
      rect(g, x + 1, 45, 1, 23, "#8f5d3e");
    }
    rect(g, 112, 68, 66, 4, "#4a2e20");
    rect(g, 137, 50, 16, 11, "#f2e6d0");
    rect(g, 137, 60, 16, 1, "#cbbca2");
    for (const [x, y] of [[143, 55], [145, 55], [141, 53], [144, 52], [147, 53]]) rect(g, x, y, 2, 2, "#c47c7c");
    rect(g, 143, 55, 4, 3, "#c47c7c");

    // Espresso machine.
    rect(g, 116, 27, 18, 13, "#8fc7b8");
    rect(g, 116, 27, 18, 1, "#b8e0d4");
    rect(g, 131, 28, 3, 12, "#679f90");
    rect(g, 115, 24, 20, 3, "#cfd6dc");
    rect(g, 115, 24, 20, 1, "#eef2f4");
    rect(g, 118, 22, 4, 2, "#fff8ee");
    rect(g, 123, 22, 4, 2, "#fff8ee");
    rect(g, 119, 31, 8, 2, "#cfd6dc");
    rect(g, 121, 33, 4, 1, "#8d969c");
    rect(g, 126, 32, 5, 1, "#2b2228");
    rect(g, 121, 36, 4, 3, "#fff8ee");
    rect(g, 125, 37, 1, 1, "#fff8ee");
    rect(g, 116, 39, 18, 1, "#8d969c");
    // Pressure dial.
    rect(g, 127, 28, 4, 4, "#3d4a43");
    rect(g, 128, 29, 2, 2, "#fff8ee");
    rect(g, 129, 29, 1, 1, "#c8574d");
    // Cups, cake dome, tip jar.
    for (let i = 0; i < 3; i++) {
      rect(g, 138, 37 - i * 2, 7, 2, i % 2 ? "#e9dcc6" : "#fff8ee");
      rect(g, 138, 37 - i * 2, 7, 1, "#cbbca2");
    }
    rect(g, 151, 38, 18, 2, "#cfd6dc");
    rect(g, 159, 34, 2, 4, "#cfd6dc");
    rect(g, 154, 31, 12, 4, "#f2c6c6");
    rect(g, 154, 31, 12, 1, "#fff2f2");
    rect(g, 156, 30, 2, 1, "#d94f5c");
    rect(g, 161, 30, 2, 1, "#d94f5c");
    g.fillStyle = "rgba(220, 240, 245, 0.35)";
    for (let dy = 0; dy < 12; dy++) {
      const w = Math.round(9 * Math.sqrt(1 - ((11 - dy) / 12) ** 2));
      g.fillRect(160 - w, 26 + dy, w * 2, 1);
    }
    rect(g, 155, 28, 1, 4, "rgba(255,255,255,0.7)");
    rect(g, 159, 25, 2, 1, "#cfd6dc");
    rect(g, 171, 33, 6, 7, "rgba(220,240,245,0.55)");
    rect(g, 172, 37, 4, 3, "#f2c14e");
    rect(g, 171, 33, 6, 1, "#cfd6dc");

    // Shelf with jars.
    rect(g, 136, 18, 43, 2, "#8a5a3c");
    rect(g, 136, 20, 43, 1, "#5e3b28");
    rect(g, 140, 21, 2, 3, "#5e3b28");
    rect(g, 173, 21, 2, 3, "#5e3b28");
    const jars = [[139, "#7a4a2a"], [149, "#e8c07a"], [159, "#e89a8a"]];
    for (const [x, fill] of jars) {
      rect(g, x, 10, 8, 8, "rgba(220,240,245,0.6)");
      rect(g, x + 1, 13, 6, 5, fill);
      rect(g, x, 9, 8, 2, "#b07d56");
      rect(g, x + 1, 11, 1, 5, "rgba(255,255,255,0.7)");
    }
    rect(g, 170, 13, 7, 5, "#c2683f");
    rect(g, 170, 13, 7, 1, "#de8a5c");

    // Chalkboard menu with doodles.
    rect(g, 182, 13, 17, 26, "#8a5a3c");
    rect(g, 184, 15, 13, 22, "#3d4a43");
    rect(g, 186, 17, 9, 1, "#e9efe6");
    for (const [y, w] of [[20, 8], [23, 6], [26, 9]]) {
      rect(g, 186, y, 1, 1, "#f2dc8a");
      rect(g, 188, y, w - 2, 1, "#c9d3c6");
    }
    rect(g, 186, 31, 4, 3, "#e9efe6");
    rect(g, 190, 32, 1, 1, "#e9efe6");
    rect(g, 187, 29, 1, 1, "#c9d3c6");
    for (const [x, y] of [[192, 30], [194, 30], [192, 31], [193, 31], [194, 31], [192, 32], [194, 32], [193, 33]]) {
      rect(g, x, y, 1, 1, "#f2b6b6");
    }

    // Clock face (hands are live).
    ellipse(g, CLOCK.x, CLOCK.y, 8, 8, "#5e3b28");
    ellipse(g, CLOCK.x, CLOCK.y, 7, 7, "#7d4f33");
    ellipse(g, CLOCK.x, CLOCK.y, 6, 6, "#f6ead2");
    for (const [dx, dy] of [[0, -5], [5, 0], [0, 5], [-5, 0]]) rect(g, CLOCK.x + dx, CLOCK.y + dy, 1, 1, "#5e3b28");

    // Framed portrait of Cream.
    rect(g, 259, 21, 15, 16, "#8a5a3c");
    rect(g, 259, 21, 15, 1, "#a8714a");
    rect(g, 261, 23, 11, 12, "#f2e6d0");
    rect(g, 261, 32, 11, 3, "#e9d1a3");
    g.drawImage(Sprites.icon("catHead"), 262, 25);

    // Pendant lamps over the tables.
    for (const s of SEATS) {
      rect(g, s.x, 6, 1, 15, "#4a2e20");
      rect(g, s.x - 2, 20, 5, 2, "#b77a2c");
      rect(g, s.x - 4, 22, 9, 2, "#e3a64a");
      rect(g, s.x - 5, 24, 11, 2, "#e3a64a");
      rect(g, s.x - 5, 24, 11, 1, "#f2c06a");
      rect(g, s.x - 5, 26, 11, 1, "#b77a2c");
      rect(g, s.x - 1, 27, 3, 1, "#fff2c8");
    }

    // Hanging planter on the right (vines are live).
    line(g, 307, 6, 302, 24, "#e9dcc4");
    line(g, 307, 6, 312, 24, "#e9dcc4");
    line(g, 307, 6, 307, 24, "#e9dcc4");
    rect(g, 301, 24, 13, 7, "#c2683f");
    rect(g, 301, 24, 13, 1, "#de8a5c");
    rect(g, 302, 30, 11, 1, "#9e4f2e");
    rect(g, 303, 26, 9, 1, "#e9dcc4");
  }

  // ------------------------------------------------------------ live room
  const clouds = [
    { x: 58, y: 20, w: 12 },
    { x: 86, y: 18, w: 9 },
    { x: 40, y: 24, w: 8 },
  ];
  const motes = Array.from({ length: 12 }, (_, i) => ({ u: (i * 0.37) % 1, v: (i * 0.61) % 1, p: i * 1.7 }));

  function drawSky() {
    ctx.save();
    ctx.beginPath();
    ctx.rect(GLASS.x, GLASS.y, GLASS.w, GLASS.h);
    ctx.clip();
    const bands = ["#8f86c4", "#a693c9", "#c39ec6", "#e2a7b5", "#f1b8a4", "#f8cfa0"];
    const bh = GLASS.h / bands.length;
    bands.forEach((c, i) => {
      rect(ctx, GLASS.x, GLASS.y + Math.floor(i * bh), GLASS.w, Math.ceil(bh) + 1, c);
      // Dither the seam between bands.
      if (i > 0) for (let x = GLASS.x + (i % 2); x < GLASS.x + GLASS.w; x += 2) rect(ctx, x, GLASS.y + Math.floor(i * bh) - 1, 1, 1, c);
    });
    // Low sun.
    ellipse(ctx, 64, 38, 8, 8, "#fbd8a4");
    ellipse(ctx, 64, 38, 6, 6, "#ffe9b8");
    // Clouds drift right.
    for (const c of clouds) {
      const x = Math.round(c.x);
      rect(ctx, x, c.y, c.w, 2, "#fdeee4");
      rect(ctx, x + 2, c.y - 1, c.w - 5, 1, "#fdeee4");
      rect(ctx, x + 3, c.y - 2, 4, 1, "#fdeee4");
      rect(ctx, x + 1, c.y + 2, c.w - 2, 1, "#efc2bd");
    }
    // A bird now and then.
    if (bird) {
      const up = Math.floor(time * 6) % 2;
      const bx = Math.round(bird.x), by = Math.round(bird.y);
      rect(ctx, bx, by, 1, 1, "#4a3f66");
      rect(ctx, bx - 1, by - up, 1, 1, "#4a3f66");
      rect(ctx, bx + 1, by - up, 1, 1, "#4a3f66");
    }
    // Rooftops with a few lit windows.
    const roofs = [[55, 36, 9], [63, 33, 7], [70, 37, 10], [80, 34, 8], [88, 31, 6], [94, 35, 8]];
    for (const [x, y, w] of roofs) {
      rect(ctx, x, y, w, 42 - y, "#7b6a9a");
      rect(ctx, x, y, w, 1, "#8f7fae");
    }
    for (const [x, y] of [[65, 36], [82, 37], [90, 34], [96, 38], [72, 39]]) rect(ctx, x, y, 1, 1, "#ffd98a");
    // A leafy branch reaching in from the top corner, swaying a little.
    const sway = calm ? 0 : Math.round(Math.sin(time * 0.9));
    line(ctx, 55, 15, 66 + sway, 18, "#5b4636");
    line(ctx, 60, 16, 62 + sway, 21, "#5b4636");
    const leaves = [[56, 17, 0], [59, 14, 1], [63, 16, 0], [66, 19, 1], [61, 20, 0], [58, 19, 1], [64, 13, 1]];
    for (const [x, y, light] of leaves) {
      const lx = x + (y > 17 ? sway : 0);
      rect(ctx, lx, y, 3, 2, light ? "#6d9b62" : "#4f7d4a");
      rect(ctx, lx + 1, y - 1, 1, 1, light ? "#6d9b62" : "#4f7d4a");
      if (light) rect(ctx, lx, y, 1, 1, "#8cc28a");
    }
    ctx.restore();
  }

  function drawStringLights() {
    const colors = ["#f2b45a", "#ec8f9e", "#9fd08f", "#b6a3e6"];
    const sag = (x) => 8 + Math.round(3 * Math.sin(((x % 64) / 64) * Math.PI));
    for (let x = 0; x < W; x++) rect(ctx, x, sag(x), 1, 1, "#4a3a30");
    for (let i = 0, x = 4; x < W; i++, x += 9) {
      const y = sag(x) + 1;
      const glow = calm ? 0.8 : 0.55 + 0.45 * Math.sin(time * 2 + i * 1.9);
      ctx.globalAlpha = 0.25 * glow;
      rect(ctx, x - 1, y, 4, 2, colors[i % 4]);
      rect(ctx, x, y - 1, 2, 4, colors[i % 4]);
      ctx.globalAlpha = 0.6 + 0.4 * glow;
      rect(ctx, x, y, 2, 2, colors[i % 4]);
      ctx.globalAlpha = 1;
      rect(ctx, x, y - 1, 2, 1, "#4a3a30");
    }
  }

  function drawLampGlow() {
    const flick = calm ? 0 : Math.sin(time * 3.1) * 0.01;
    for (const s of SEATS) {
      for (const [r, a] of [[22, 0.06], [15, 0.07], [9, 0.1]]) {
        ctx.fillStyle = `rgba(255, 214, 150, ${a + flick})`;
        for (let dy = -r; dy <= r; dy++) {
          const w = Math.round(Math.sqrt(r * r - dy * dy) * 1.2);
          ctx.fillRect(s.x - w, 28 + dy, w * 2 + 1, 1);
        }
      }
    }
  }

  function drawClockHands() {
    const now = new Date();
    const m = now.getMinutes() + now.getSeconds() / 60;
    const h = (now.getHours() % 12) + m / 60;
    const a1 = (m / 60) * Math.PI * 2, a2 = (h / 12) * Math.PI * 2;
    const { x, y } = CLOCK;
    line(ctx, x, y, x + Math.sin(a1) * 5, y - Math.cos(a1) * 5, "#3d261b");
    line(ctx, x, y, x + Math.sin(a2) * 3, y - Math.cos(a2) * 3, "#c8574d");
    rect(ctx, x, y, 1, 1, "#3d261b");
  }

  function drawDoor() {
    if (doorOpen > 0) {
      // Doorway shows the evening street; the door swings in against the frame.
      rect(ctx, 10, 18, 30, 54, "#8f86c4");
      rect(ctx, 10, 34, 30, 14, "#c39ec6");
      rect(ctx, 10, 48, 30, 10, "#f1b8a4");
      rect(ctx, 10, 58, 30, 14, "#6f5a8a");
      rect(ctx, 10, 58, 30, 1, "#8f7fae");
      rect(ctx, 10, 18, 6, 54, "#8f5d3e");
      rect(ctx, 15, 18, 1, 54, "#6e4429");
      rect(ctx, 12, 44, 2, 2, "#f2c14e");
    } else {
      rect(ctx, 10, 18, 30, 54, "#a8714a");
      rect(ctx, 10, 18, 30, 1, "#c08a5e");
      for (const [y, h] of [[34, 15], [53, 15]]) {
        rect(ctx, 14, y, 22, h, "#946240");
        rect(ctx, 14, y, 22, 1, "#7f5234");
        rect(ctx, 14, y + h - 1, 22, 1, "#c08a5e");
      }
      // Round window in the door.
      ellipse(ctx, 25, 26, 5, 5, "#7f5234");
      ellipse(ctx, 25, 26, 4, 4, "#c39ec6");
      rect(ctx, 22, 24, 2, 1, "#f2dcea");
      rect(ctx, 34, 47, 2, 3, "#f2c14e");
      rect(ctx, 34, 47, 1, 1, "#fff3c4");
      // Hanging heart sign.
      line(ctx, 22, 31, 25, 29, "#5e3b28");
      line(ctx, 28, 31, 25, 29, "#5e3b28");
      rect(ctx, 20, 31, 11, 6, "#f2e6d0");
      draw(Sprites.icon("heartSmall"), 24, 32);
    }
    // Bell above the door swings when it opens.
    const tilt = Math.round(Math.sin(time * 14) * Math.min(2, bell * 2));
    line(ctx, 25, 13, 25 + tilt, 15, "#5e3b28");
    rect(ctx, 23 + tilt, 15, 5, 3, "#f2c14e");
    rect(ctx, 22 + tilt, 17, 7, 1, "#c7832e");
    rect(ctx, 24 + tilt, 15, 1, 1, "#fff3c4");
  }

  function drawVines(baseX, baseY, count, length, seed) {
    for (let i = 0; i < count; i++) {
      const x0 = baseX + i * 3;
      for (let j = 0; j < length; j++) {
        const sway = calm ? 0 : Math.round(Math.sin(time * 1.1 + seed + i + j * 0.35) * (j / length) * 1.6);
        const x = x0 + sway;
        const y = baseY + j * 2;
        rect(ctx, x, y, 1, 2, "#4f7d4a");
        if (j % 2 === 0) rect(ctx, x + (j % 4 ? 1 : -2), y, 2, 2, (i + j) % 3 ? "#6d9b62" : "#8cc28a");
      }
    }
  }

  function drawSunbeam() {
    const a = calm ? 0.15 : 0.14 + Math.sin(time * 0.7) * 0.025;
    ctx.fillStyle = `rgba(255, 206, 140, ${a})`;
    for (let y = FLOOR_Y; y < 132; y++) {
      if (y >= 99 && y <= 100) continue; // mullion shadow
      const k = y - FLOOR_Y;
      const x0 = Math.round(57 + k * 0.6);
      ctx.fillRect(x0, y, 21, 1);
      ctx.fillRect(x0 + 23, y, 22, 1);
    }
    // Dust drifting in the light.
    if (calm) return;
    for (const m of motes) {
      const v = (m.v + time * 0.02) % 1;
      const y = FLOOR_Y + 2 + v * 56;
      const x = 59 + (y - FLOOR_Y) * 0.6 + m.u * 42 + Math.sin(time * 0.8 + m.p) * 2;
      ctx.fillStyle = `rgba(255, 244, 214, ${0.35 + 0.35 * Math.sin(time * 2 + m.p)})`;
      ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
    }
  }

  // ------------------------------------------------------------ cats
  function catFrame(cat) {
    let a = catAnim.get(cat.id);
    if (!a) {
      a = { seed: (cat.id * 7.31) % 10, zT: 0 };
      catAnim.set(cat.id, a);
    }
    const t = time + a.seed;
    if (cat.mode === "walk") return "walk" + (Math.floor(t * 8) % 4);
    if (cat.mode === "sleep") return Math.floor(t / 1.2) % 2 ? "sleepIn" : "sleep";
    const tail = Math.floor(t / 1.5) % 2 ? "sitTail" : "sit";
    const blinking = t % 3.7 < 0.14;
    return blinking ? tail + "Blink" : tail;
  }

  function catBox(cat) {
    const img = Sprites.cat(cat.look, catFrame(cat), cat.facing);
    const ax = Math.round(cat.x / LP), ay = Math.round(cat.y / LP);
    return { img, x: ax - Math.floor(img.width / 2), y: ay - img.height + 1, w: img.width, h: img.height, ax, ay };
  }

  function shadow(cx, cy, rx) {
    ctx.fillStyle = "rgba(70, 35, 20, 0.2)";
    ctx.fillRect(cx - rx, cy, rx * 2, 1);
    ctx.fillRect(cx - rx + 2, cy + 1, rx * 2 - 4, 1);
  }

  function drawCat(cat) {
    const b = catBox(cat);
    shadow(b.ax, b.ay, cat.mode === "sleep" ? 8 : 6);
    draw(b.img, b.x, b.y);
    if (cat.mode === "sleep" && !calm) {
      const a = catAnim.get(cat.id);
      a.zT -= frameDt;
      if (a.zT <= 0) {
        a.zT = 1.8;
        particles.push({ kind: "z", x: b.ax + 5, y: b.y - 1, vx: 3, vy: -6, life: 2.2, max: 2.2, seed: Math.random() * 6 });
      }
    }
  }

  // Bubbles, name tags and the selection arrow, drawn above everything.
  function drawCatOverlay(cat, selected, hovered) {
    const b = catBox(cat);
    const bob = calm ? 0 : Math.round(Math.sin(time * 3 + cat.id) * 1);
    let top = b.y;
    if (cat.fullness < CONFIG.HUNGRY_BELOW) {
      const bx = b.ax + 2, by = top - 11 + bob;
      rect(ctx, bx, by, 12, 8, "#5b3a29");
      rect(ctx, bx + 1, by + 1, 10, 6, "#fff8ee");
      rect(ctx, bx + 1, by + 8, 2, 1, "#5b3a29");
      rect(ctx, bx + 1, by + 7, 1, 1, "#fff8ee");
      draw(Sprites.icon("fish"), bx + 2, by + 2);
      top = by;
    }
    if (selected) draw(Sprites.icon("arrow"), b.ax - 3, top - 7 + bob);
    if (selected || hovered) nameTag(cat.name, b.ax, b.ay + 3);
  }

  function nameTag(text, cx, y) {
    ctx.font = '600 7px "Pixelify Sans", monospace';
    const w = Math.ceil(ctx.measureText(text).width) + 6;
    const x = Math.round(cx - w / 2);
    rect(ctx, x + 1, y, w - 2, 9, "rgba(43, 34, 55, 0.88)");
    rect(ctx, x, y + 1, w, 7, "rgba(43, 34, 55, 0.88)");
    ctx.fillStyle = "#fff4dc";
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    ctx.fillText(text, cx, y + 4.8);
  }

  // ------------------------------------------------------------ customers
  function drawWalker(look, x, y) {
    const step = Math.floor(time * 6) % 2 ? "stepA" : "stepB";
    const img = Sprites.customer(look, step);
    shadow(Math.round(x), y, 5);
    draw(img, x - 6, y - img.height + 1 - (step === "stepA" ? 1 : 0));
  }

  function drawTable(seat, customer, vis) {
    const x = seat.x;
    // Chair back.
    rect(ctx, x - 7, 45, 14, 2, "#8a5a3c");
    rect(ctx, x - 7, 45, 14, 1, "#a8714a");
    for (const dx of [-7, -3, 2, 6]) rect(ctx, x + dx, 47, 1, 14, "#7d4f33");
    // Customer seated behind the table.
    const seated = customer && vis && vis.seated;
    const cupIcon = customer && customer.matcha ? "cupMatcha" : "cup";
    let sipping = false;
    if (seated) {
      const img = Sprites.customer(vis.look, "seated");
      const breathe = calm ? 0 : Math.floor((time + customer.id) / 1.6) % 2;
      draw(img, x - 6, 47 + breathe);
      sipping = customer.activity === "coffee" && (time + customer.id * 1.7) % 7 < 1.4;
      if (sipping) draw(Sprites.icon(cupIcon), x - 3, 56 + breathe);
    }
    // Table with a scalloped cloth.
    rect(ctx, x - 12, 61, 24, 4, "#f4ead8");
    rect(ctx, x - 12, 61, 24, 1, "#fffaf0");
    rect(ctx, x - 12, 64, 24, 1, "#d8c6a8");
    for (let dx = -12; dx < 12; dx += 4) rect(ctx, x + dx + 1, 65, 2, 1, "#e6d7bd");
    rect(ctx, x - 1, 65, 3, 8, "#5e3b28");
    rect(ctx, x - 6, 73, 13, 2, "#4a2e20");
    shadow(x, 75, 7);
    // Bud vase with a little flower.
    rect(ctx, x - 9, 58, 3, 3, "#bcd8f5");
    rect(ctx, x - 9, 58, 1, 2, "#e9f3fc");
    rect(ctx, x - 8, 55, 1, 3, "#4f7d4a");
    rect(ctx, x - 9, 54, 3, 1, "#ec8f9e");
    rect(ctx, x - 8, 53, 1, 3, "#ec8f9e");
    rect(ctx, x - 8, 54, 1, 1, "#f2dc8a");
    if (!seated) return;
    if (customer.activity === "coffee") {
      if (!sipping) draw(Sprites.icon(cupIcon), x + 3, 57);
      vis.steamT = (vis.steamT || 0) - frameDt;
      if (!calm && vis.steamT <= 0) {
        vis.steamT = 0.9;
        particles.push({ kind: "steam", x: sipping ? x : x + 5, y: sipping ? 54 : 55, vx: 0, vy: -5, life: 1.4, max: 1.4, seed: Math.random() * 6 });
      }
    } else {
      if (customer.matcha) draw(Sprites.icon("cupMatcha"), x - 5, 57);
      // Waving a feather toy for the cats.
      const sw = calm ? 0.5 : Math.sin(time * 4 + customer.id);
      const tx = x + 6 + sw * 6, ty = 50 - Math.abs(sw) * 2;
      line(ctx, x + 4, 59, tx, ty, "#7d4f33");
      rect(ctx, Math.round(tx) - 1, Math.round(ty) - 1, 3, 2, "#ec8f9e");
      rect(ctx, Math.round(tx), Math.round(ty) + 1, 1, 2, "#f2b45a");
    }
  }

  // Holds the third table's spot until the seating upgrade is bought.
  function drawFern(x) {
    const s = (i) => (calm ? 0 : Math.round(Math.sin(time * 0.9 + i) * 0.8));
    const fronds = [[-9, 52], [-6, 47], [-1, 45], [4, 46], [8, 50], [10, 56], [-11, 58]];
    fronds.forEach(([dx, top], i) => {
      line(ctx, x, 64, x + dx + s(i), top, "#4f7d4a");
      for (let k = 0; k < 4; k++) {
        const t = (k + 1) / 5;
        const px = Math.round(x + (dx + s(i)) * t), py = Math.round(64 + (top - 64) * t);
        rect(ctx, px - 1, py, 3, 1, k % 2 ? "#6d9b62" : "#8cc28a");
      }
    });
    rect(ctx, x - 5, 64, 11, 9, "#c2683f");
    rect(ctx, x - 6, 63, 13, 2, "#de8a5c");
    rect(ctx, x - 5, 72, 11, 1, "#9e4f2e");
    shadow(x, 74, 6);
  }

  // The second cat bed that comes with the capacity upgrade.
  function drawSecondBed() {
    ellipse(ctx, 262, 185, 14, 6, "#a8524a");
    ellipse(ctx, 262, 184, 14, 5, "#d9776a");
    ellipse(ctx, 262, 184, 10, 3, "#f6e1bd");
    ellipse(ctx, 262, 185, 8, 1, "#e9cfa2");
  }

  function drawStayBar(seat, customer) {
    const x = seat.x - 7, y = 41;
    const pct = Math.min(1, customer.elapsed / CONFIG.CUSTOMER_STAY_SECONDS);
    rect(ctx, x, y, 14, 4, "#3d261b");
    rect(ctx, x + 1, y + 1, 12, 2, "#f7e6c4");
    rect(ctx, x + 1, y + 1, Math.round(12 * pct), 2, "#f2b45a");
  }

  // ------------------------------------------------------------ bowl + front decor
  function drawBowl(state) {
    const avg = state.cats.reduce((s, c) => s + c.fullness, 0) / Math.max(1, state.cats.length);
    const name = avg >= 70 ? "bowlFull" : avg >= 40 ? "bowlHalf" : avg >= 15 ? "bowlLow" : "bowlEmpty";
    shadow(BOWL.x, BOWL.y + 1, 6);
    draw(Sprites.icon(name), BOWL.x - 7, BOWL.y - 7);
  }

  function drawCatTree() {
    const sway = calm ? 0 : Math.round(Math.sin(time * 2.2) * 2);
    rect(ctx, 8, 120, 6, 70, "#d8bf95");
    for (let y = 121; y < 190; y += 2) rect(ctx, 8, y, 6, 1, "#b89c6f");
    rect(ctx, 13, 120, 1, 70, "#a8875c");
    for (const y of [118, 150]) {
      rect(ctx, 1, y, 21, 4, "#8fb38a");
      rect(ctx, 1, y, 21, 1, "#b5d1ae");
      rect(ctx, 1, y + 4, 21, 1, "#5f8a5d");
    }
    rect(ctx, 0, 188, 24, 6, "#8fb38a");
    rect(ctx, 0, 188, 24, 1, "#b5d1ae");
    rect(ctx, 0, 194, 24, 1, "#5f8a5d");
    shadow(12, 195, 11);
    // Dangling toy ball.
    line(ctx, 20, 123, 20 + sway, 133, "#e9dcc4");
    ellipse(ctx, 20 + sway, 135, 2, 2, "#ec8f9e");
    rect(ctx, 19 + sway, 134, 1, 1, "#ffd3db");
  }

  function drawFloorPlant() {
    const s = (i) => (calm ? 0 : Math.round(Math.sin(time * 0.8 + i) * 1));
    const leaves = [[296, 160, 9, 0], [312, 156, 8, 1], [303, 148, 8, 2], [318, 170, 7, 3], [292, 174, 7, 4]];
    for (const [x, y, r, i] of leaves) {
      ellipse(ctx, x + s(i), y, r, Math.round(r * 0.7), "#4f7d4a");
      ellipse(ctx, x + s(i) - 1, y - 1, r - 2, Math.round(r * 0.5), "#6d9b62");
      rect(ctx, x + s(i) - r + 3, y, r - 2, 1, "#4f7d4a");
      rect(ctx, x + s(i) + 1, y - 2, 1, 1, "#8cc28a");
    }
    for (const [x, y, i] of [[296, 160, 0], [312, 156, 1], [303, 148, 2], [292, 174, 4]]) line(ctx, x + s(i), y + 3, 306, 184, "#4f7d4a");
    rect(ctx, 298, 184, 18, 15, "#c2683f");
    rect(ctx, 296, 182, 22, 3, "#de8a5c");
    rect(ctx, 296, 184, 22, 1, "#9e4f2e");
    rect(ctx, 300, 186, 1, 12, "#de8a5c");
    rect(ctx, 314, 186, 2, 13, "#9e4f2e");
  }

  // ------------------------------------------------------------ decorations (SPEC P2 #26)
  // Each is drawn with its bottom middle at (x, y), into any canvas g, so the
  // same art works in the room and in the decorations panel. t animates.
  function floorShadow(g, x, y, rx) {
    g.fillStyle = "rgba(70, 35, 20, 0.2)";
    g.fillRect(x - rx, y, rx * 2, 1);
    g.fillRect(x - rx + 2, y + 1, rx * 2 - 4, 1);
  }

  const DECOR_ART = {
    cushion(g, x, y) {
      floorShadow(g, x, y, 11);
      ellipse(g, x, y - 3, 11, 3, "#a8524a");
      ellipse(g, x, y - 4, 11, 3, "#d9776a");
      ellipse(g, x - 1, y - 5, 8, 2, "#e8958a");
      rect(g, x - 4, y - 6, 3, 1, "#f2b0a4");
      rect(g, x, y - 4, 1, 1, "#a8524a");
      for (const dx of [-12, 12]) {
        rect(g, x + dx, y - 4, 1, 1, "#c7832e");
        rect(g, x + dx, y - 3, 1, 2, "#f2b45a");
      }
    },
    yarn(g, x, y) {
      floorShadow(g, x, y, 10);
      // Loose strand across the floor.
      line(g, x + 7, y - 9, x + 12, y - 3, "#7fa7c9");
      line(g, x + 12, y - 3, x + 17, y - 1, "#7fa7c9");
      ellipse(g, x - 4, y - 11, 4, 3, "#ec8f9e");
      line(g, x - 7, y - 12, x - 2, y - 9, "#f6c1ca");
      ellipse(g, x + 3, y - 12, 4, 4, "#7fa7c9");
      line(g, x + 1, y - 15, x + 5, y - 10, "#b3d0e8");
      ellipse(g, x + 7, y - 9, 2, 2, "#f2b45a");
      // Wicker basket.
      rect(g, x - 8, y - 9, 17, 9, "#b07d56");
      for (let r = 0; r < 4; r++) {
        for (let dx = (r % 2) * 2; dx < 17; dx += 4) rect(g, x - 8 + dx, y - 8 + r * 2, 2, 1, "#8a5a3c");
      }
      rect(g, x - 9, y - 10, 19, 2, "#d0a070");
      rect(g, x - 9, y - 10, 19, 1, "#e2b886");
      rect(g, x - 7, y - 1, 15, 1, "#7a4e30");
    },
    lamp(g, x, y, t, glow) {
      if (glow) {
        const a = 0.07 + (calm ? 0 : Math.sin(t * 2.3) * 0.008);
        for (const [r, k] of [[18, 1], [11, 1.4]]) {
          g.fillStyle = `rgba(255, 214, 150, ${a * k})`;
          for (let dy = -r; dy <= r; dy++) {
            const w = Math.round(Math.sqrt(r * r - dy * dy) * 1.1);
            g.fillRect(x - w, y - 38 + dy, w * 2 + 1, 1);
          }
        }
        g.fillStyle = `rgba(255, 214, 150, ${a})`;
        for (let dy = -3; dy <= 3; dy++) {
          const w = Math.round(16 * Math.sqrt(1 - (dy * dy) / 10));
          g.fillRect(x - w, y + dy, w * 2 + 1, 1);
        }
      }
      floorShadow(g, x, y, 6);
      ellipse(g, x, y - 1, 5, 1, "#4a2e20");
      rect(g, x - 4, y - 2, 9, 1, "#6e4630");
      rect(g, x, y - 34, 1, 32, "#4a2e20");
      rect(g, x + 1, y - 34, 1, 32, "#7d4f33");
      // Shade: wider at the bottom, with a fringe.
      for (let r = 0; r < 10; r++) {
        const half = 5 + Math.floor(r / 2);
        rect(g, x - half, y - 44 + r, half * 2 + 2, 1, r === 0 ? "#f7d88a" : r % 3 ? "#f2c06a" : "#e9b45a");
      }
      rect(g, x - 9, y - 34, 20, 1, "#fff2c8");
      for (let dx = -9; dx <= 10; dx += 2) rect(g, x + dx, y - 33, 1, 2, "#d9776a");
    },
    tank(g, x, y, t) {
      floorShadow(g, x, y, 12);
      // Cabinet.
      rect(g, x - 12, y - 10, 24, 10, "#7d4f33");
      rect(g, x - 12, y - 10, 24, 1, "#a8714a");
      rect(g, x - 10, y - 8, 9, 7, "#6e4429");
      rect(g, x + 1, y - 8, 9, 7, "#6e4429");
      rect(g, x - 3, y - 5, 1, 1, "#f2c14e");
      rect(g, x + 3, y - 5, 1, 1, "#f2c14e");
      // Glass, water, gravel.
      rect(g, x - 11, y - 26, 22, 16, "#3d4a43");
      rect(g, x - 10, y - 24, 20, 13, "#6fa8c9");
      rect(g, x - 10, y - 24, 20, 2, "#9cd0e8");
      rect(g, x - 10, y - 13, 20, 2, "#d9b77a");
      for (let dx = 0; dx < 20; dx += 3) rect(g, x - 10 + dx, y - 12, 1, 1, "#a8875c");
      // Castle and weed.
      rect(g, x + 3, y - 19, 6, 6, "#b9b0a6");
      for (let dx = 0; dx < 6; dx += 2) rect(g, x + 3 + dx, y - 20, 1, 1, "#b9b0a6");
      rect(g, x + 5, y - 16, 2, 3, "#3d4a43");
      for (let i = 0; i < 2; i++) {
        for (let j = 0; j < 6; j++) {
          const sw = calm ? 0 : Math.round(Math.sin(t * 1.5 + i * 2 + j * 0.5) * (j / 6) * 1.5);
          rect(g, x - 8 + i * 3 + sw, y - 14 - j, 1, 1, j % 2 ? "#5f8a5d" : "#8fc28a");
        }
      }
      // Two goldfish swimming back and forth.
      for (let i = 0; i < 2; i++) {
        const u = calm ? 0.3 + i * 0.4 : (t * (0.12 + i * 0.05) + i * 0.5) % 1;
        const p = u < 0.5 ? u * 2 : 2 - u * 2;
        const fx = Math.round(x - 8 + p * 14), fy = y - 21 + i * 4 + (calm ? 0 : Math.round(Math.sin(t * 2 + i) * 0.6));
        const right = u < 0.5;
        rect(g, fx, fy, 3, 2, "#f28a3c");
        rect(g, right ? fx - 1 : fx + 3, fy, 1, 2, "#f7b46a");
        rect(g, right ? fx + 2 : fx, fy, 1, 1, "#2a1c1c");
      }
      // Bubbles from the castle.
      if (!calm) {
        for (let i = 0; i < 3; i++) {
          const v = (t * 0.5 + i / 3) % 1;
          rect(g, x + 6 + Math.round(Math.sin(t * 3 + i) * 0.6), Math.round(y - 20 - v * 3.5), 1, 1, "#e6f6ff");
        }
      }
      rect(g, x - 12, y - 27, 24, 2, "#4a2e20");
      rect(g, x - 9, y - 23, 1, 9, "rgba(255,255,255,0.35)");
    },
  };

  function drawDecor(g, kind, x, y, t, glow = true) {
    DECOR_ART[kind](g, x, y, t, glow);
  }

  // Free spots while placing: a glowing pool with a ring and a bobbing arrow,
  // and a see-through preview of the decoration under the mouse.
  function drawSlotMarkers(state, view) {
    const pulse = calm ? 0.5 : 0.4 + Math.sin(time * 5) * 0.15;
    state.decor.forEach((kind, i) => {
      if (kind) return;
      const s = SLOTS[i];
      const hover = view.hoverSlot === i;
      ctx.globalAlpha = hover ? 0.7 : pulse;
      ellipse(ctx, s.x, s.y - 2, 13, 4, "#fff0c2");
      ctx.globalAlpha = 1;
      for (let a = 0; a < 32; a++) {
        if (a % 4 === 3) continue;
        const ang = (a / 32) * Math.PI * 2 + (calm ? 0 : time * 0.8);
        rect(ctx, Math.round(s.x + Math.cos(ang) * 14), Math.round(s.y - 2 + Math.sin(ang) * 5), 1, 1, "#c7832e");
      }
      if (hover) {
        ctx.globalAlpha = 0.65;
        drawDecor(ctx, view.placing, s.x, s.y, time, false);
        ctx.globalAlpha = 1;
      } else {
        const bob = calm ? 0 : Math.round(Math.sin(time * 4 + i) * 1.5);
        draw(Sprites.icon("arrow"), s.x - 3, s.y - 16 + bob);
      }
    });
  }

  // ------------------------------------------------------------ staff (SPEC P2 #29)
  // She waits by the counter; when she refills the bowl she walks over and back.
  // The refill itself already happened in the game logic.
  let staffTrip = null; // { phase: "go" | "pour" | "back", x, y, t }

  function updateStaff(dt) {
    if (!staffTrip) return;
    const goal = staffTrip.phase === "go" ? STAFF_AT_BOWL : STAFF_HOME;
    if (staffTrip.phase === "pour") {
      staffTrip.t -= dt;
      if (staffTrip.t <= 0) staffTrip.phase = "back";
      return;
    }
    const dx = goal.x - staffTrip.x, dy = goal.y - staffTrip.y;
    const dist = Math.hypot(dx, dy), step = 50 * dt;
    if (dist <= step) {
      staffTrip.x = goal.x;
      staffTrip.y = goal.y;
      if (staffTrip.phase === "go") {
        staffTrip.phase = "pour";
        staffTrip.t = 0.8;
        burst("sparkle", BOWL.x, BOWL.y - 6, 7, 12);
        particles.push({ kind: "coin", text: `-${CONFIG.FOOD_COST}`, x: BOWL.x, y: BOWL.y - 16, vx: 0, vy: -9, life: 1.2, max: 1.2, seed: 0 });
        Sound.play("refill");
      } else {
        staffTrip = null;
      }
    } else {
      staffTrip.x += (dx / dist) * step;
      staffTrip.y += (dy / dist) * step;
    }
  }

  function staffPos() {
    return staffTrip ? { x: staffTrip.x, y: staffTrip.y } : STAFF_HOME;
  }

  function drawStaff() {
    const p = staffPos();
    const walking = staffTrip && staffTrip.phase !== "pour";
    const pose = walking ? (Math.floor(time * 6) % 2 ? "stepA" : "stepB") : "stand";
    const img = Sprites.customer(Sprites.STAFF_LOOK, pose);
    const lift = walking && pose === "stepA" ? 1 : !walking && !calm && Math.floor(time / 1.8) % 2 ? 1 : 0;
    const x = Math.round(p.x), y = Math.round(p.y);
    shadow(x, y, 5);
    draw(img, x - 6, y - img.height + 1 - lift);
    if (staffTrip && staffTrip.phase === "pour") {
      // Pouring kibble from a little scoop.
      rect(ctx, x - 9, y - 11, 4, 2, "#cfd6dc");
      if (!calm && Math.floor(time * 10) % 2) rect(ctx, x - 9, y - 9, 1, 2, "#b8783f");
    }
  }

  // ------------------------------------------------------------ cat loft (SPEC P2 #29)
  // An arched doorway in the back wall with stairs up to the cats' lounge.
  let tailT = 4;

  function drawLoft(dt) {
    const x = LOFT.x, y = LOFT.y; // left edge of the frame, top of the arch
    rect(ctx, x + 4, y, 14, 2, "#7d4f33");
    rect(ctx, x + 2, y + 2, 18, 2, "#7d4f33");
    rect(ctx, x, y + 4, 22, FLOOR_Y - y - 4, "#7d4f33");
    rect(ctx, x + 4, y, 14, 1, "#a8714a");
    rect(ctx, x, y + 4, 1, FLOOR_Y - y - 4, "#a8714a");
    rect(ctx, x + 21, y + 4, 1, FLOOR_Y - y - 4, "#5e3b28");
    // Inside: warm dark, with stairs climbing to the right.
    rect(ctx, x + 5, y + 2, 12, 2, "#3b2a24");
    rect(ctx, x + 3, y + 4, 16, FLOOR_Y - y - 4, "#3b2a24");
    for (let i = 0; i < 7; i++) {
      const sy = FLOOR_Y - 3 - i * 6;
      if (sy < y + 8) break;
      rect(ctx, x + 3 + i * 2, sy, 16 - i * 2, 3, "#6e4630");
      rect(ctx, x + 3 + i * 2, sy, 16 - i * 2, 1, "#9b6844");
    }
    // Light spilling down from upstairs, and a little lantern.
    const flick = calm ? 0 : Math.sin(time * 4.3) * 0.03 + Math.sin(time * 7.1) * 0.02;
    ctx.fillStyle = `rgba(255, 204, 130, ${0.18 + flick})`;
    ctx.fillRect(x + 3, y + 4, 16, 18);
    rect(ctx, x + 8, y + 4, 1, 4, "#4a2e20");
    rect(ctx, x + 7, y + 8, 3, 3, "#f2c14e");
    rect(ctx, x + 8, y + 9, 1, 1, "#fff3c4");
    // Now and then a tail swishes at the top of the stairs.
    if (!calm) {
      tailT -= dt;
      if (tailT < -3) tailT = 7 + Math.random() * 6;
      if (tailT < 0) {
        const sw = Math.round(Math.sin(time * 3) * 2);
        line(ctx, x + 14, y + 20, x + 15 + sw, y + 13, "#f0a050");
        rect(ctx, x + 14 + sw, y + 12, 2, 2, "#c96a28");
      }
    }
    // Threshold and a paw-print sign above.
    rect(ctx, x, FLOOR_Y - 1, 22, 1, "#5e3b28");
    rect(ctx, x + 6, y - 7, 10, 6, "#f2e6d0");
    rect(ctx, x + 6, y - 2, 10, 1, "#cbbca2");
    for (const [dx, dy] of [[10, -4], [9, -6], [12, -6], [8, -5], [13, -5]]) rect(ctx, x + dx, y + dy, 1, 1, "#c47c7c");
    rect(ctx, x + 10, y - 4, 2, 2, "#c47c7c");
  }

  // ------------------------------------------------------------ effects
  function drawParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        particles.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      const age = 1 - p.life / p.max;
      const fade = Math.min(1, p.life / (p.max * 0.35));
      ctx.globalAlpha = fade;
      if (p.kind === "heart") draw(Sprites.icon("heart"), p.x - 3, p.y);
      else if (p.kind === "heartSmall") draw(Sprites.icon("heartSmall"), p.x - 1, p.y);
      else if (p.kind === "sparkle") draw(Sprites.icon(Math.floor(time * 8 + p.seed) % 2 ? "sparkle" : "sparkleSmall"), p.x - 2, p.y - 2);
      else if (p.kind === "z") draw(Sprites.icon("z"), p.x + Math.sin(time * 2 + p.seed) * 2, p.y);
      else if (p.kind === "steam") {
        const r = age < 0.5 ? 1 : 2;
        ctx.globalAlpha = 0.55 * fade;
        rect(ctx, Math.round(p.x + Math.sin(time * 3 + p.seed) * 1.5), Math.round(p.y), r, r, "#fff8ee");
      } else if (p.kind === "coin") {
        const w = Math.max(1, Math.round(Math.abs(Math.cos(age * Math.PI * 3)) * 8));
        ctx.drawImage(Sprites.icon("coin"), Math.round(p.x - w / 2), Math.round(p.y), w, 8);
        floatText(p.text, p.x, p.y - 4);
      }
      ctx.globalAlpha = 1;
    }
  }

  function floatText(text, cx, y) {
    ctx.font = '700 8px "Pixelify Sans", monospace';
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "#3d261b";
    for (const [dx, dy] of [[-0.5, 0], [0.5, 0], [0, -0.5], [0, 0.5]]) ctx.fillText(text, cx + dx, y + dy);
    ctx.fillStyle = "#ffd48a";
    ctx.fillText(text, cx, y);
  }

  function burst(kind, x, y, n, spread = 8) {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + Math.random();
      particles.push({
        kind, x: x + Math.cos(a) * 2, y, vx: Math.cos(a) * spread, vy: -10 - Math.random() * 8,
        life: 0.9 + Math.random() * 0.4, max: 1.3, seed: Math.random() * 6,
      });
    }
  }

  // ------------------------------------------------------------ bookkeeping
  let meowT = 30;

  function updateAmbient(dt, state) {
    // Now and then a cat meows on its own.
    meowT -= dt;
    if (meowT <= 0 && state.cats.length) {
      meowT = 40 + Math.random() * 50;
      const cat = state.cats[Math.floor(Math.random() * state.cats.length)];
      if (cat.mode !== "sleep") Sound.meow(cat.id);
    }
    if (!calm) {
      for (const c of clouds) {
        c.x += dt * 1.6 * (c.w / 10);
        if (c.x > GLASS.x + GLASS.w + 2) c.x = GLASS.x - c.w - 4;
      }
      nextBird -= dt;
      if (!bird && nextBird <= 0) bird = { x: GLASS.x - 3, y: 18 + Math.random() * 6 };
      if (bird) {
        bird.x += dt * 14;
        bird.y += Math.sin(time * 3) * dt * 2;
        if (bird.x > GLASS.x + GLASS.w + 3) {
          bird = null;
          nextBird = 14 + Math.random() * 16;
        }
      }
      steamT -= dt;
      if (steamT <= 0) {
        steamT = 0.45;
        particles.push({ kind: "steam", x: 120 + Math.random() * 6, y: 21, vx: 0, vy: -6, life: 1.6, max: 1.6, seed: Math.random() * 6 });
      }
    }
    doorOpen = Math.max(0, doorOpen - dt);
    bell = Math.max(0, bell - dt * 1.2);
  }

  function nearDoor(x) {
    if (Math.abs(x - DOOR_X) < 12) {
      if (doorOpen <= 0) {
        bell = 1;
        Sound.play("bell");
      }
      doorOpen = 0.5;
    }
  }

  function syncCustomers(state, dt) {
    const alive = new Set();
    for (const c of state.customers) {
      alive.add(c.id);
      let v = custVis.get(c.id);
      if (!v) {
        v = { look: Sprites.customerLook(c.id), x: DOOR_X, seated: false, seat: c.seat };
        custVis.set(c.id, v);
      }
      if (!v.seated) {
        const tx = SEATS[c.seat].x;
        v.x = Math.min(tx, v.x + 55 * dt);
        nearDoor(v.x);
        if (v.x >= tx) v.seated = true;
      }
    }
    for (const [id, v] of custVis) {
      if (alive.has(id)) continue;
      walkers.push({ look: v.look, x: v.seated ? SEATS[v.seat].x : v.x, y: WALK_Y, tx: DOOR_X, kind: "customer" });
      custVis.delete(id);
    }
  }

  function syncStray(state, dt) {
    const s = state.stray;
    if (s && (!strayVis || strayVis.id !== s.id)) {
      strayVis = { id: s.id, look: s.look, x: DOOR_X, arrived: false };
      Sound.meow(s.id);
    }
    if (strayVis && (!s || s.id !== strayVis.id)) {
      const adopted = state.cats.find((c) => c.id === strayVis.id);
      if (adopted) {
        Sound.play("adopt");
        burst("heart", Math.round(adopted.x / LP), Math.round(adopted.y / LP) - 16, 5, 10);
        burst("sparkle", Math.round(adopted.x / LP), Math.round(adopted.y / LP) - 8, 6, 14);
      } else {
        walkers.push({ look: strayVis.look, x: strayVis.x, y: STRAY.y, tx: DOOR_X - 2, kind: "stray" });
      }
      strayVis = null;
    }
    if (strayVis && !strayVis.arrived) {
      strayVis.x = Math.min(STRAY.x, strayVis.x + 30 * dt);
      nearDoor(strayVis.x);
      if (strayVis.x >= STRAY.x) strayVis.arrived = true;
    }
  }

  function updateWalkers(dt) {
    for (let i = walkers.length - 1; i >= 0; i--) {
      const w = walkers[i];
      const speed = w.kind === "stray" ? 30 : 55;
      w.x = Math.max(w.tx, w.x - speed * dt);
      nearDoor(w.x);
      if (w.x <= w.tx) walkers.splice(i, 1);
    }
  }

  function drawStray() {
    const v = strayVis;
    const bob = calm ? 0 : Math.round(Math.sin(time * 3) * 1);
    if (!v.arrived) {
      const img = Sprites.cat(v.look, "walk" + (Math.floor(time * 8) % 4), 1);
      shadow(Math.round(v.x), STRAY.y, 6);
      draw(img, v.x - 10, STRAY.y - img.height + 1);
      return;
    }
    const t = time * 0.7;
    const frame = (Math.floor(t / 1.5) % 2 ? "sitTail" : "sit") + (t % 3.7 < 0.14 ? "Blink" : "");
    const img = Sprites.cat(v.look, frame, 1);
    shadow(STRAY.x, STRAY.y, 6);
    draw(img, STRAY.x - 8, STRAY.y - img.height + 1);
    // "?" bubble: waiting for an answer.
    const bx = STRAY.x + 3, by = STRAY.y - img.height - 9 + bob;
    rect(ctx, bx, by, 9, 9, "#5b3a29");
    rect(ctx, bx + 1, by + 1, 7, 7, "#fff8ee");
    rect(ctx, bx + 1, by + 9, 2, 1, "#5b3a29");
    draw(Sprites.icon("question"), bx + 2, by + 2);
  }

  // ------------------------------------------------------------ public
  function init(canvasEl) {
    canvas = canvasEl;
    ctx = canvas.getContext("2d");
    bg = Sprites.makeCanvas(W, H);
    drawRoom(bg.getContext("2d"));
    setScale(2);
  }

  function setScale(s) {
    scale = s;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = W * s * dpr;
    canvas.height = H * s * dpr;
    canvas.style.width = W * s + "px";
    canvas.style.height = H * s + "px";
    ctx.setTransform(s * dpr, 0, 0, s * dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;
  }

  function render(state, dt, view) {
    time += dt;
    frameDt = dt;
    updateAmbient(dt, state);
    // Walking to and from the door runs on game time, like the cats, so it
    // keeps pace with ?speed= test mode.
    const walkDt = dt * CONFIG.SPEED;
    syncCustomers(state, walkDt);
    syncStray(state, walkDt);
    updateWalkers(walkDt);
    updateStaff(walkDt);

    ctx.clearRect(0, 0, W, H);
    drawSky();
    ctx.drawImage(bg, 0, 0);
    drawLampGlow();
    drawStringLights();
    drawClockHands();
    drawDoor();
    drawVines(171, 18, 2, 5, 0);
    drawVines(302, 31, 4, 8, 2);
    if (state.upgrades.capacity) drawSecondBed();
    if (state.upgrades.loft) drawLoft(dt);
    drawSunbeam();

    // Everything standing on the floor, back to front.
    const things = [];
    SEATS.forEach((seat, i) => {
      if (i >= state.seats.length) {
        things.push({ y: 75, draw: () => drawFern(seat.x) });
        return;
      }
      const c = state.customers.find((k) => k.seat === i);
      things.push({ y: 75, draw: () => drawTable(seat, c, c && custVis.get(c.id)) });
    });
    things.push({ y: BOWL.y, draw: () => drawBowl(state) });
    state.decor.forEach((kind, i) => {
      if (kind) things.push({ y: SLOTS[i].y, draw: () => drawDecor(ctx, kind, SLOTS[i].x, SLOTS[i].y, time) });
    });
    if (state.upgrades.staff) things.push({ y: staffPos().y, draw: drawStaff });
    for (const cat of state.cats) things.push({ y: cat.y / LP, draw: () => drawCat(cat) });
    for (const [, v] of custVis) if (!v.seated) things.push({ y: WALK_Y, draw: () => drawWalker(v.look, v.x, WALK_Y) });
    for (const w of walkers) {
      if (w.kind === "customer") things.push({ y: w.y, draw: () => drawWalker(w.look, w.x, w.y) });
      else things.push({ y: w.y, draw: () => {
        const img = Sprites.cat(w.look, "walk" + (Math.floor(time * 8) % 4), -1);
        shadow(Math.round(w.x), w.y, 6);
        draw(img, w.x - 10, w.y - img.height + 1);
      } });
    }
    if (strayVis) things.push({ y: STRAY.y, draw: drawStray });
    things.push({ y: 194, draw: drawCatTree });
    things.push({ y: 199, draw: drawFloorPlant });
    things.sort((a, b) => a.y - b.y);
    for (const t of things) t.draw();
    if (view.placing) drawSlotMarkers(state, view);

    // Overlays: progress bars, bubbles, name tags, effects.
    for (const c of state.customers) {
      const v = custVis.get(c.id);
      if (v && v.seated) drawStayBar(SEATS[c.seat], c);
    }
    for (const cat of state.cats) drawCatOverlay(cat, cat.id === view.selectedId, cat.id === view.hoverId);
    drawParticles(dt);
  }

  // A page point in art pixels.
  function toArt(clientX, clientY) {
    const r = canvas.getBoundingClientRect();
    return { x: ((clientX - r.left) / r.width) * W, y: ((clientY - r.top) / r.height) * H };
  }

  // Which free decoration spot (if any) is under a page point.
  function slotAt(state, clientX, clientY) {
    const { x, y } = toArt(clientX, clientY);
    const i = SLOTS.findIndex((s, k) => !state.decor[k] && Math.abs(x - s.x) <= 14 && y >= s.y - 30 && y <= s.y + 5);
    return i === -1 ? null : i;
  }

  // Which cat (if any) is under a page point. Front-most wins.
  function catAt(state, clientX, clientY) {
    const { x, y } = toArt(clientX, clientY);
    const sorted = [...state.cats].sort((a, b) => b.y - a.y);
    for (const cat of sorted) {
      const b = catBox(cat);
      if (x >= b.x - 2 && x <= b.x + b.w + 2 && y >= b.y - 2 && y <= b.y + b.h + 2) return cat.id;
    }
    return null;
  }

  function petCat(cat) {
    const b = catBox(cat);
    particles.push({ kind: "heart", x: b.ax, y: b.y - 6, vx: 0, vy: -12, life: 1.1, max: 1.1, seed: 0 });
  }

  function payment(customer, amount) {
    const seat = SEATS[customer.seat];
    particles.push({ kind: "coin", text: `+${amount}`, x: seat.x, y: 34, vx: 0, vy: -9, life: 1.4, max: 1.4, seed: 0 });
  }

  function refill(state) {
    burst("sparkle", BOWL.x, BOWL.y - 6, 7, 12);
    for (const cat of state.cats) {
      const b = catBox(cat);
      particles.push({ kind: "heartSmall", x: b.ax, y: b.y - 3, vx: 0, vy: -10, life: 1, max: 1, seed: 0 });
    }
  }

  // Sparkles where a bought upgrade appears.
  function upgrade(id) {
    if (id === "seats") {
      burst("sparkle", SEATS[2].x, 58, 10, 16);
    } else if (id === "capacity") {
      burst("sparkle", 262, 180, 10, 16);
      burst("heartSmall", 262, 176, 4, 8);
    } else if (id === "loft") {
      burst("sparkle", LOFT.x + 11, 50, 12, 18);
      burst("heartSmall", LOFT.x + 11, 40, 4, 8);
    } else if (id === "matcha") {
      burst("sparkle", 125, 30, 8, 12);
    } else if (id === "staff") {
      burst("sparkle", STAFF_HOME.x, STAFF_HOME.y - 12, 10, 14);
      burst("heartSmall", STAFF_HOME.x, STAFF_HOME.y - 20, 3, 8);
    }
  }

  function placed(kind, slot) {
    const s = SLOTS[slot];
    burst("sparkle", s.x, s.y - 8, 10, 16);
  }

  // The staff member walks to the bowl (the refill already happened).
  function staffRefill() {
    if (!staffTrip) staffTrip = { phase: "go", x: STAFF_HOME.x, y: STAFF_HOME.y, t: 0 };
  }

  // A decoration drawn into a small canvas, for the decorations panel.
  function decorPreview(el, kind) {
    const g = el.getContext("2d");
    g.clearRect(0, 0, el.width, el.height);
    drawDecor(g, kind, Math.floor(el.width / 2), el.height - 3, 0, false);
  }

  // Draw a cat's sitting portrait into a small canvas (for the panels).
  // look null draws a locked silhouette.
  function portrait(el, look, t) {
    const g = el.getContext("2d");
    g.clearRect(0, 0, el.width, el.height);
    const tt = t * 0.8 + (look || "").length;
    const frame = (Math.floor(tt / 1.5) % 2 ? "sitTail" : "sit") + (tt % 3.7 < 0.14 ? "Blink" : "");
    const img = look ? Sprites.cat(look, frame, 1) : Sprites.silhouette("sit");
    g.drawImage(img, Math.floor((el.width - img.width) / 2), el.height - img.height - 1);
  }

  return { init, setScale, render, catAt, slotAt, petCat, payment, refill, upgrade, placed, staffRefill, decorPreview, portrait, W, H };
})();
