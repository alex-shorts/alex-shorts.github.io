import { THEMES } from "../look/palettes.js";

export const VIEW = { w: 480, h: 270 };
export const BRAWL_VIEW = { w: 2560, h: 1440 };

export function gameConfig(sceneList, themeId = "snes", opts = {}) {
  const theme = THEMES[themeId] || THEMES.snes;
  const w = opts.w || VIEW.w;
  const h = opts.h || VIEW.h;
  return {
    type: Phaser.AUTO,
    parent: "game",
    width: w,
    height: h,
    backgroundColor: theme.bg,
    pixelArt: opts.pixelArt !== false,
    roundPixels: opts.pixelArt !== false,
    antialias: opts.pixelArt === false,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    physics: {
      default: "arcade",
      arcade: { gravity: { x: 0, y: 0 }, debug: false },
    },
    input: { gamepad: true },
    callbacks: {
      preBoot(game) {
        if (opts.startScene) game.registry.set("startScene", opts.startScene);
        if (opts.homeScene) game.registry.set("homeScene", opts.homeScene);
      },
    },
    scene: sceneList,
  };
}
