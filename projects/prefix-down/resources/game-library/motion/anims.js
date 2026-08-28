import { ARCHETYPES, SKINS } from "../look/palettes.js";

export const KENNEY_HEROES = [
  { id: "sand", idle: 0, walk: 1 },
  { id: "rose", idle: 2, walk: 3 },
  { id: "sky", idle: 4, walk: 5 },
  { id: "leaf", idle: 6, walk: 7 },
  { id: "gold", idle: 8, walk: 9 },
  { id: "mint", idle: 10, walk: 11 },
  { id: "bee", idle: 12, walk: 13 },
  { id: "mouse", idle: 14, walk: 15 },
  { id: "block", idle: 16, walk: 17 },
];

export function registerAnims(scene) {
  if (scene.anims.exists("sand-idle")) return;
  for (const h of KENNEY_HEROES) {
    scene.anims.create({
      key: `${h.id}-idle`,
      frames: [{ key: "kenney-chars", frame: h.idle }],
      frameRate: 1,
    });
    scene.anims.create({
      key: `${h.id}-walk`,
      frames: [
        { key: "kenney-chars", frame: h.idle },
        { key: "kenney-chars", frame: h.walk },
      ],
      frameRate: 8,
      repeat: -1,
    });
  }
}

export function playMove(sprite, moving) {
  const id = sprite.heroId || "sand";
  const key = moving ? `${id}-walk` : `${id}-idle`;
  if (sprite.anims?.currentAnim?.key !== key) sprite.anims?.play(key, true);
  if (sprite.body && sprite.body.velocity.x < -10) sprite.setFlipX(true);
  if (sprite.body && sprite.body.velocity.x > 10) sprite.setFlipX(false);
}

export { ARCHETYPES, SKINS };
