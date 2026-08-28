import { THEMES } from "../look/palettes.js";
import { textStyle } from "../look/type.js";
import { sfx } from "../audio/sfx.js";
import { sparkBurst, punch } from "../motion/transitions.js";
import { isNew, markSeen, bumpMiss, clearDue, missCount } from "../systems/save.js";

export function pickItem(items, i = 0) {
  return items[i % items.length];
}

function resolveItem(item) {
  if (item.prereq && missCount(item.id) >= 2) return { ...item.prereq, parent: item };
  return item;
}

/** See → Do → Feedback. New items get a model first. Two misses drop to prereq. */
export function openRecall(scene, raw, { onDone } = {}) {
  const item = resolveItem(raw);
  const theme = THEMES.snes;
  const root = scene.add.container(0, 0).setDepth(300).setScrollFactor(0);
  const dim = scene.add.rectangle(240, 135, 480, 270, 0x000000, 0.55);
  const card = scene.add.image(240, 128, "panel-card");
  root.add([dim, card]);

  const finish = (ok) => {
    if (ok) {
      markSeen(raw.id);
      clearDue(raw.id);
      if (item.parent) clearDue(item.parent.id);
    } else bumpMiss(raw.id);
    root.destroy();
    onDone?.(ok);
  };

  const showChoices = () => {
    const stem = scene.add.text(120, 78, item.stem, textStyle(theme, "body")).setWordWrapWidth(240);
    root.add(stem);
    item.choices.forEach((c, n) => {
      const b = scene.add.image(240, 148 + n * 24, "btn-blue-up").setInteractive({ useHandCursor: true });
      const t = scene.add.text(240, 148 + n * 24, c, { ...textStyle(theme, "caption"), color: "#f8f0d8" }).setOrigin(0.5);
      root.add([b, t]);
      b.on("pointerdown", () => {
        const ok = c === item.answer || c === raw.answer;
        sfx[ok ? "correct" : "miss"]();
        if (ok) sparkBurst(scene, 240, 128);
        else punch(scene, card, 1.04);
        root.add(scene.add.image(240, 70, ok ? "stamp-ok" : "stamp-miss"));
        scene.time.delayedCall(650, () => finish(ok));
      });
    });
  };

  if (raw.model && isNew(raw.id)) {
    const model = scene.add.text(120, 88, raw.model, textStyle(theme, "body")).setWordWrapWidth(240);
    const go = scene.add.text(240, 200, "Your turn — tap", textStyle(theme, "caption")).setOrigin(0.5);
    root.add([model, go]);
    markSeen(raw.id);
    const next = () => {
      model.destroy();
      go.destroy();
      showChoices();
    };
    go.setInteractive({ useHandCursor: true }).on("pointerdown", next);
    scene.time.delayedCall(2200, () => {
      if (model.active) next();
    });
    return root;
  }

  showChoices();
  return root;
}
