import { HERO } from "../mechanics/brawler-contract.js";
import { clearStyle } from "../look/type.js";

const MAX = 5;

export function createBrawlerHud(scene) {
  const W = scene.scale.width;
  scene.add.rectangle(0, 0, W, 96, 0x080414, 0.72).setOrigin(0).setScrollFactor(0).setDepth(3000);

  const fid = scene.hero?.fighterId || "ash";
  const portrait = scene.add.sprite(72, 86, `${fid}-idle`, 0).setScale(1.8).setScrollFactor(0).setDepth(3002);
  portrait.setOrigin(0.5, 1);

  const hpBg = scene.add.rectangle(130, 36, 360, 22, 0x201018).setOrigin(0, 0.5).setScrollFactor(0).setDepth(3001);
  const hpFg = scene.add.rectangle(134, 36, 352, 14, 0xe03838).setOrigin(0, 0.5).setScrollFactor(0).setDepth(3002);
  const name = scene.add.text(130, 56, (HERO.name || "").toUpperCase(), { ...clearStyle("#e8dcc8", 26), fontStyle: "700" }).setOrigin(0, 0).setScrollFactor(0).setDepth(3002);
  const wave = scene.add
    .text(W - 24, 22, "ROUND 0/1", { ...clearStyle("#f0c040", 32), fontStyle: "800" })
    .setOrigin(1, 0)
    .setScrollFactor(0)
    .setDepth(3002);
  const toastT = scene.add
    .text(W / 2, 108, "", { ...clearStyle("#f0c040", 40), fontStyle: "800" })
    .setOrigin(0.5, 0)
    .setScrollFactor(0)
    .setDepth(3010)
    .setAlpha(0);

  return {
    setHp(n) {
      hpFg.width = Math.max(0, 352 * (n / MAX));
    },
    setWave(n, total) {
      wave.setText("ROUND " + n + "/" + total);
    },
    setFighter(label, id) {
      name.setText(String(label || HERO.name).toUpperCase());
      if (id) portrait.setTexture(`${id}-idle`, 0);
    },
    toast(msg) {
      toastT.setText(msg).setAlpha(1);
      scene.tweens.add({ targets: toastT, alpha: 0, delay: 900, duration: 350 });
    },
    hpBg,
    portrait,
  };
}
