let bed;

export function startBed() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC || bed) return;
  const ctx = new AC();
  const master = ctx.createGain();
  master.gain.value = 0.035;
  master.connect(ctx.destination);
  const notes = [196, 247, 294, 330, 392];
  let i = 0;
  const tick = () => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "triangle";
    o.frequency.value = notes[i % notes.length];
    g.gain.value = 0.2;
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
    o.connect(g);
    g.connect(master);
    o.start();
    o.stop(ctx.currentTime + 0.36);
    i += 1;
  };
  tick();
  const id = setInterval(tick, 420);
  bed = { ctx, id, master };
}

export function stopBed() {
  if (!bed) return;
  clearInterval(bed.id);
  bed.ctx.close();
  bed = null;
}
