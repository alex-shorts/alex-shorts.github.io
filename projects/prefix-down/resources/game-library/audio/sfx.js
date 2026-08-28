let ctx;

function ac() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

function tone(freq, dur, type = "square", gain = 0.05) {
  const c = ac();
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.value = gain;
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
  o.connect(g);
  g.connect(c.destination);
  o.start();
  o.stop(c.currentTime + dur);
}

export const sfx = {
  select: () => tone(520, 0.05),
  confirm: () => {
    tone(440, 0.06);
    setTimeout(() => tone(660, 0.08), 50);
  },
  correct: () => {
    tone(523, 0.07);
    setTimeout(() => tone(784, 0.12), 70);
  },
  miss: () => tone(180, 0.18, "sawtooth", 0.04),
  jump: () => tone(420, 0.08, "square", 0.04),
  coin: () => {
    tone(880, 0.06);
    setTimeout(() => tone(1320, 0.08), 40);
  },
  hit: () => tone(140, 0.1, "square", 0.06),
  whoosh: () => tone(240, 0.12, "triangle", 0.03),
  build: () => tone(300, 0.05, "square", 0.04),
  smash: () => tone(90, 0.16, "sawtooth", 0.05),
  pause: () => tone(360, 0.05),
  note: () => tone(660, 0.05, "triangle", 0.04),
  engine: () => tone(110, 0.08, "sawtooth", 0.03),
  place: () => tone(380, 0.07, "square", 0.04),
  dash: () => tone(500, 0.06, "square", 0.04),
  card: () => tone(300, 0.07, "triangle", 0.04),
  cook: () => tone(250, 0.09, "square", 0.04),
  alert: () => tone(880, 0.2, "square", 0.05),
  punch: () => tone(200, 0.05, "square", 0.06),
  whiff: () => tone(130, 0.07, "triangle", 0.03),
};
