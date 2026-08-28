import { asset } from "../paths.js";
import { bakeKit } from "./kit-runtime.js";
import { registerAnims } from "../motion/anims.js";
import { registerFighterAnims, FIGHTERS, FIGHT_FRAME, fighterSheetKeys, sharpenTextures } from "../motion/fighter-anims.js";

const SOF = "vendor/ansimuz-sof";

export function preloadLibrary(scene) {
  scene.load.spritesheet("kenney-chars", asset("vendor/kenney-pixel-platformer/Tilemap/characters_packed.png"), {
    frameWidth: 24,
    frameHeight: 24,
  });
  scene.load.spritesheet("kenney-tiles", asset("vendor/kenney-pixel-platformer/Tilemap/tiles_packed.png"), {
    frameWidth: 18,
    frameHeight: 18,
  });
  scene.load.image("bg-bottom", asset("vendor/kenney-pixel-platformer/Background/background_bottom.png"));
  scene.load.image("bg-mid", asset("vendor/kenney-pixel-platformer/Background/background_middle.png"));
  scene.load.image("bg-top", asset("vendor/kenney-pixel-platformer/Background/background_top.png"));
  scene.load.image("kenney-coin", asset("vendor/kenney-2d/city/coin.png"));
  scene.load.image("kenney-sparkle", asset("vendor/kenney-2d/match3/particles/sparkle.png"));
  scene.load.image("cursor-open", asset("vendor/kenney-2d/match3/cursors/cursor-hand-open.png"));
  scene.load.image("cursor-closed", asset("vendor/kenney-2d/match3/cursors/cursor-hand-closed.png"));
  scene.load.json("demo-deck", new URL("../content/demo-deck.json", import.meta.url).href);
  scene.load.json("metric-deck", new URL("../content/metric-deck.json", import.meta.url).href);

  scene.load.image("sof-back", asset(`${SOF}/back.png`));
  scene.load.image("sof-street", asset(`${SOF}/street.png`));
  scene.load.image("sof-lamp", asset(`${SOF}/lamp.png`));
  scene.load.image("sof-bush", asset(`${SOF}/bush.png`));
  scene.load.image("sof-barrel", asset(`${SOF}/barrel.png`));
  scene.load.image("sof-hydrant", asset(`${SOF}/hydrant.png`));
  scene.load.image("sof-car", asset(`${SOF}/car.png`));
  scene.load.image("sof-shadow", asset(`${SOF}/shadow.png`));

  for (const spec of Object.values(FIGHTERS)) {
    for (const [act, file] of Object.entries(spec.files)) {
      scene.load.spritesheet(`${spec.id}-${act}`, asset(`${SOF}/${file}`), {
        frameWidth: FIGHT_FRAME.w,
        frameHeight: FIGHT_FRAME.h,
      });
    }
  }
  scene.load.spritesheet("rocket-fly", asset(`${SOF}/rocket-fly.png`), {
    frameWidth: 48,
    frameHeight: 24,
  });
}

export function bootLibrary(scene) {
  bakeKit(scene);
  registerAnims(scene);
  registerFighterAnims(scene);
  const keys = [
    "sof-back",
    "sof-street",
    "sof-lamp",
    "sof-bush",
    "sof-barrel",
    "sof-hydrant",
    "sof-car",
    "sof-shadow",
    ...Object.keys(FIGHTERS).flatMap((id) => fighterSheetKeys(id)),
    "rocket-fly",
  ];
  sharpenTextures(scene, keys);
}

export function demoItems(scene) {
  return scene.cache.json.get("demo-deck")?.items || [];
}

export function metricItems(scene) {
  return scene.cache.json.get("metric-deck")?.items || [];
}
