import { THEMES } from "../look/palettes.js";
import { textStyle } from "../look/type.js";
import { fadeTo } from "../motion/transitions.js";

export function hearts(scene, x, y, hp, max = 3) {
  const icons = [];
  for (let i = 0; i < max; i++) {
    icons.push(scene.add.image(x + i * 16, y, i < hp ? "icon-heart" : "icon-heart-empty").setOrigin(0, 0).setScrollFactor(0).setDepth(200));
  }
  return {
    set(n) {
      icons.forEach((im, i) => im.setTexture(i < n ? "icon-heart" : "icon-heart-empty"));
    },
  };
}

export function bar(scene, x, y, w, color) {
  const bg = scene.add.rectangle(x, y, w, 6, 0x101018).setOrigin(0, 0).setScrollFactor(0).setDepth(200);
  const fg = scene.add.rectangle(x + 1, y + 1, w - 2, 4, color).setOrigin(0, 0).setScrollFactor(0).setDepth(201);
  return {
    set(t) {
      fg.width = Math.max(0, (w - 2) * Phaser.Math.Clamp(t, 0, 1));
    },
    fg,
    bg,
  };
}

export function hint(scene, str) {
  return scene.add.text(8, 254, str, textStyle(THEMES.snes, "caption")).setScrollFactor(0).setDepth(210);
}

export function backToHub(scene, controls) {
  if (controls.cancel()) fadeTo(scene, "HubScene");
}

export function titleBar(scene, label, theme) {
  scene.add.rectangle(0, 0, 480, 22, theme.shadow, 0.65).setOrigin(0).setScrollFactor(0).setDepth(199);
  scene.add.text(8, 5, label, textStyle(theme, "caption")).setScrollFactor(0).setDepth(200);
}

function padBtn(scene, x, y, label, onDown, onUp) {
  const r = scene.add.circle(x, y, 16, 0x1a2030, 0.7).setScrollFactor(0).setDepth(220).setInteractive();
  scene.add.text(x, y, label, { fontFamily: "Tiny5, monospace", fontSize: "12px", color: "#eef2f6" }).setOrigin(0.5).setScrollFactor(0).setDepth(221);
  r.on("pointerdown", onDown);
  r.on("pointerup", onUp);
  r.on("pointerout", onUp);
}

export function attachTouchPad(scene, controls) {
  const t = controls.touch;
  padBtn(scene, 36, 210, "L", () => { t.x = -1; }, () => { t.x = t.x < 0 ? 0 : t.x; });
  padBtn(scene, 68, 210, "R", () => { t.x = 1; }, () => { t.x = t.x > 0 ? 0 : t.x; });
  padBtn(scene, 52, 178, "U", () => { t.y = -1; }, () => { t.y = t.y < 0 ? 0 : t.y; });
  padBtn(scene, 52, 242, "D", () => { t.y = 1; }, () => { t.y = t.y > 0 ? 0 : t.y; });
  padBtn(scene, 420, 230, "A", () => { t.action = true; t.jump = true; }, () => {});
  padBtn(scene, 452, 200, "B", () => { t.cancel = true; }, () => {});
}

export function kitChrome(scene, label, theme, controls, opts = {}) {
  titleBar(scene, label, theme);
  if (opts.touch !== false) attachTouchPad(scene, controls);
}
