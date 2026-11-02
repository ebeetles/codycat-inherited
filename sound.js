// sound.js — background music and sound effects, synthesized live with the
// Web Audio API (no audio files). SPEC P1 #25.
// Browsers only allow audio after the player clicks or presses a key, so
// nothing plays until unlock() runs from the first input. Muting suspends
// all audio; so does hiding the tab, like the rest of the game.

const Sound = (() => {
  let ctx = null;
  let master, music, sfx, noise;
  let muted = false;
  let unlocked = false;
  let nextTime = 0;
  let step = 0;

  // Music: a slow music-box loop at 72 bpm over Fmaj7, Em7, Dm7, Cmaj7,
  // arpeggiated in eighth notes, with a soft top line every other pass.
  const EIGHTH = 60 / 72 / 2;
  const CHORDS = [[53, 57, 60, 64], [52, 55, 59, 62], [50, 53, 57, 60], [48, 52, 55, 59]];
  const ARP = [0, 2, 1, 3, 2, 1, 3, 2];
  const MELODY = [[[0, 76], [3, 74], [6, 72]], [[0, 74], [4, 71]], [[0, 72], [3, 74], [6, 77]], [[0, 76], [5, 79]]];

  const hz = (midi) => 440 * Math.pow(2, (midi - 69) / 12);

  function setup() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    master = ctx.createGain();
    master.connect(ctx.destination);
    const soften = ctx.createBiquadFilter();
    soften.type = "lowpass";
    soften.frequency.value = 3200;
    soften.connect(master);
    music = ctx.createGain();
    music.gain.value = 0.5;
    music.connect(soften);
    sfx = ctx.createGain();
    sfx.gain.value = 0.8;
    sfx.connect(master);
    noise = ctx.createBuffer(1, ctx.sampleRate / 2, ctx.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    return true;
  }

  // One soft plucked note.
  function pluck(freq, t, vol, dest, decay = 1.2, type = "triangle") {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
    o.connect(g);
    g.connect(dest);
    o.start(t);
    o.stop(t + decay + 0.05);
  }

  // Queue the next quarter second of music; runs every 50 ms.
  function scheduleMusic() {
    if (!ctx || ctx.state !== "running") return;
    if (nextTime < ctx.currentTime) nextTime = ctx.currentTime + 0.05;
    while (nextTime < ctx.currentTime + 0.25) {
      const bar = Math.floor(step / 8) % 4;
      const i = step % 8;
      const chord = CHORDS[bar];
      pluck(hz(chord[ARP[i]] + 12), nextTime, 0.05, music, 1.2);
      if (i === 0 || i === 4) pluck(hz(chord[0] - 12), nextTime, 0.07, music, 2, "sine");
      if (Math.floor(step / 32) % 2) {
        for (const [at, note] of MELODY[bar]) if (at === i) pluck(hz(note), nextTime, 0.045, music, 1.6, "sine");
      }
      nextTime += EIGHTH;
      step++;
    }
  }

  function ready() {
    return ctx && unlocked && !muted && ctx.state === "running";
  }

  // Call from the first click or key press.
  function unlock() {
    if (unlocked || !setup()) return;
    unlocked = true;
    nextTime = ctx.currentTime + 0.1;
    setInterval(scheduleMusic, 50);
    if (muted) ctx.suspend();
  }

  function setMuted(value) {
    muted = value;
    if (!ctx) return;
    if (muted) ctx.suspend();
    else if (!document.hidden) ctx.resume();
  }

  document.addEventListener("visibilitychange", () => {
    if (!ctx) return;
    if (document.hidden) ctx.suspend();
    else if (!muted) ctx.resume();
  });

  // A meow; each cat id gets its own pitch.
  function meow(seed = 0) {
    if (!ready()) return;
    const t = ctx.currentTime;
    const p = 0.85 + ((seed * 37) % 10) / 25;
    const o = ctx.createOscillator();
    const f = ctx.createBiquadFilter();
    const g = ctx.createGain();
    o.type = "sawtooth";
    o.frequency.setValueAtTime(480 * p, t);
    o.frequency.linearRampToValueAtTime(760 * p, t + 0.12);
    o.frequency.linearRampToValueAtTime(560 * p, t + 0.42);
    f.type = "bandpass";
    f.Q.value = 5;
    f.frequency.setValueAtTime(800, t);
    f.frequency.linearRampToValueAtTime(1500, t + 0.14);
    f.frequency.linearRampToValueAtTime(900, t + 0.45);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.35, t + 0.06);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
    o.connect(f);
    f.connect(g);
    g.connect(sfx);
    o.start(t);
    o.stop(t + 0.55);
  }

  function kibble(t) {
    for (let k = 0; k < 7; k++) {
      const at = t + k * 0.045 + Math.random() * 0.02;
      const src = ctx.createBufferSource();
      const f = ctx.createBiquadFilter();
      const g = ctx.createGain();
      src.buffer = noise;
      f.type = "bandpass";
      f.frequency.value = 2500 + Math.random() * 1500;
      f.Q.value = 8;
      g.gain.setValueAtTime(0.5, at);
      g.gain.exponentialRampToValueAtTime(0.001, at + 0.04);
      src.connect(f);
      f.connect(g);
      g.connect(sfx);
      src.start(at, Math.random() * 0.4, 0.05);
    }
  }

  const EFFECTS = {
    coin: (t) => {
      pluck(1319, t, 0.12, sfx, 0.12);
      pluck(1760, t + 0.07, 0.12, sfx, 0.45);
    },
    bell: (t) => {
      pluck(1568, t, 0.04, sfx, 0.8, "sine");
      pluck(2349, t, 0.025, sfx, 0.6, "sine");
      pluck(1568, t + 0.13, 0.025, sfx, 0.6, "sine");
    },
    refill: kibble,
    adopt: (t) => {
      [72, 76, 79, 84].forEach((n, k) => pluck(hz(n), t + k * 0.09, 0.08, sfx, 0.5));
    },
    upgrade: (t) => {
      [79, 83, 86, 91, 95].forEach((n, k) => pluck(hz(n), t + k * 0.06, 0.06, sfx, 0.6, "sine"));
    },
    nope: (t) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "triangle";
      o.frequency.setValueAtTime(330, t);
      o.frequency.linearRampToValueAtTime(247, t + 0.16);
      g.gain.setValueAtTime(0.08, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
      o.connect(g);
      g.connect(sfx);
      o.start(t);
      o.stop(t + 0.22);
    },
    tap: (t) => pluck(880, t, 0.035, sfx, 0.06, "sine"),
  };

  function play(name) {
    if (ready() && EFFECTS[name]) EFFECTS[name](ctx.currentTime);
  }

  // For checking from the console: { unlocked, muted, playing }.
  function status() {
    return { unlocked, muted, playing: !!ctx && ctx.state === "running" };
  }

  return { unlock, setMuted, play, meow, status };
})();
