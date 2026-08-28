export function fadeTo(scene, next, data = {}, ms = 280) {
  scene.cameras.main.fadeOut(ms, 0, 0, 0);
  scene.cameras.main.once("camerafadeoutcomplete", () => {
    scene.scene.start(next, data);
  });
}

export function flash(scene, color = 0xffffff, ms = 80) {
  scene.cameras.main.flash(ms, (color >> 16) & 255, (color >> 8) & 255, color & 255);
}

export function shake(scene, duration = 120, intensity = 0.01) {
  scene.cameras.main.shake(duration, intensity);
}

export function punch(scene, target, scale = 1.15) {
  scene.tweens.add({
    targets: target,
    scale: scale,
    duration: 80,
    yoyo: true,
    ease: "Quad.easeOut",
  });
}

export function popIn(scene, target) {
  target.setScale(0.2);
  scene.tweens.add({ targets: target, scale: 1, duration: 180, ease: "Back.easeOut" });
}

export function floaty(scene, target, px = 4) {
  scene.tweens.add({
    targets: target,
    y: target.y - px,
    duration: 700,
    yoyo: true,
    repeat: -1,
    ease: "Sine.easeInOut",
  });
}

export function typewriter(scene, textObj, full, cps = 38) {
  textObj.setText("");
  let i = 0;
  const ev = scene.time.addEvent({
    delay: 1000 / cps,
    repeat: full.length - 1,
    callback: () => {
      i += 1;
      textObj.setText(full.slice(0, i));
    },
  });
  return ev;
}

export function sparkBurst(scene, x, y, n = 8) {
  for (let i = 0; i < n; i++) {
    const s = scene.add.image(x, y, "fx-spark").setScale(0.7);
    const a = (i / n) * Math.PI * 2;
    scene.tweens.add({
      targets: s,
      x: x + Math.cos(a) * 28,
      y: y + Math.sin(a) * 28,
      alpha: 0,
      duration: 320,
      onComplete: () => s.destroy(),
    });
  }
}

export function xpPop(scene, x, y, label = "+1") {
  const t = scene.add.text(x, y, label, {
    fontFamily: "Silkscreen, monospace",
    fontSize: "14px",
    color: "#f0d060",
  }).setOrigin(0.5);
  scene.tweens.add({
    targets: t,
    y: y - 22,
    alpha: 0,
    duration: 500,
    onComplete: () => t.destroy(),
  });
}
