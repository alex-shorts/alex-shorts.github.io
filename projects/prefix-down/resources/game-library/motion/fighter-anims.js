/** Streets of Fight — 96×63 sheets. Girl outfits face right; punk faces left. */
export const FIGHT_FRAME = { w: 96, h: 63 };

const GIRL_MOVE = {
  faces: 1,
  scale: 6,
  body: { w: 20, h: 18, ox: 38, oy: 45 },
  sheet: { fall: "jump", death: "hit" },
  frames: { idle: 4, run: 10, jump: 4, fall: 4, punch: 3, kick: 5, hit: 2, death: 2 },
  rates: { idle: 8, run: 12, jump: 10, fall: 10, punch: 14, kick: 14, hit: 10, death: 8 },
};

function girlFiles(folder) {
  const p = folder ? `outfits/${folder}/` : "";
  return {
    idle: `${p}girl-idle.png`,
    run: `${p}girl-walk.png`,
    jump: `${p}girl-jump.png`,
    punch: `${p}girl-punch.png`,
    kick: `${p}girl-kick.png`,
    hit: `${p}girl-hurt.png`,
  };
}

export const FIGHTERS = {
  ash: { id: "ash", name: "Ash", ...GIRL_MOVE, files: girlFiles("") },
  nox: { id: "nox", name: "Nox", ...GIRL_MOVE, files: girlFiles("nox") },
  sol: { id: "sol", name: "Sol", ...GIRL_MOVE, files: girlFiles("sol") },
  punk: {
    id: "punk",
    name: "Punk",
    faces: -1,
    scale: 6,
    body: { w: 22, h: 18, ox: 37, oy: 45 },
    files: {
      idle: "punk-idle.png",
      run: "punk-walk.png",
      punch: "punk-punch.png",
      hit: "punk-hurt.png",
    },
    sheet: { jump: "idle", fall: "idle", kick: "punch", death: "hit" },
    frames: { idle: 4, run: 4, jump: 4, fall: 4, punch: 3, kick: 3, hit: 2, death: 4 },
    rates: { idle: 8, run: 10, jump: 8, fall: 8, punch: 12, kick: 12, hit: 10, death: 8 },
  },
  wolf: {
    id: "wolf",
    name: "Wolf",
    faces: 1,
    scale: 6,
    body: { w: 22, h: 20, ox: 37, oy: 43 },
    files: {
      idle: "wolf-idle.png",
      run: "wolf-walk.png",
      punch: "wolf-punch.png",
      hit: "wolf-hurt.png",
    },
    sheet: { jump: "idle", fall: "idle", kick: "punch", death: "hit" },
    frames: { idle: 4, run: 4, jump: 4, fall: 4, punch: 3, kick: 3, hit: 2, death: 4 },
    rates: { idle: 8, run: 12, jump: 8, fall: 8, punch: 12, kick: 12, hit: 10, death: 8 },
  },
  bot: {
    id: "bot",
    name: "Bot",
    faces: 1,
    scale: 6,
    body: { w: 22, h: 20, ox: 37, oy: 43 },
    files: {
      idle: "bot-idle.png",
      run: "bot-walk.png",
      punch: "bot-punch.png",
      hit: "bot-hurt.png",
    },
    sheet: { jump: "idle", fall: "idle", kick: "punch", death: "hit" },
    frames: { idle: 4, run: 4, jump: 4, fall: 4, punch: 4, kick: 4, hit: 2, death: 4 },
    rates: { idle: 8, run: 10, jump: 8, fall: 8, punch: 10, kick: 10, hit: 10, death: 8 },
  },
};

export const OUTFITS = ["ash", "nox", "sol"];

const ACTS = ["idle", "run", "jump", "fall", "punch", "kick", "hit", "death"];

export function fighterSheetKeys(id) {
  const spec = FIGHTERS[id];
  return Object.keys(spec.files).map((act) => `${id}-${act}`);
}

function sheetKey(spec, act) {
  const src = spec.sheet?.[act] || act;
  return `${spec.id}-${src}`;
}

export function registerFighterAnims(scene) {
  if (!scene.anims.exists("ash-idle")) {
    for (const spec of Object.values(FIGHTERS)) {
      for (const act of ACTS) {
        const n = spec.frames[act];
        scene.anims.create({
          key: `${spec.id}-${act}`,
          frames: scene.anims.generateFrameNumbers(sheetKey(spec, act), { start: 0, end: n - 1 }),
          frameRate: spec.rates[act],
          repeat: act === "idle" || act === "run" ? -1 : 0,
        });
      }
    }
  }
  if (!scene.anims.exists("rocket-fly")) {
    scene.anims.create({
      key: "rocket-fly",
      frames: scene.anims.generateFrameNumbers("rocket-fly", { start: 0, end: 2 }),
      frameRate: 12,
      repeat: -1,
    });
  }
}

export function fitFighterBody(sprite, spec) {
  const b = spec.body;
  sprite.body?.setSize(b.w, b.h).setOffset(b.ox, b.oy);
}

export function lockFighterSize(sprite) {
  const s = sprite.baseScale || sprite.scaleX || 6;
  sprite.setScale(s);
  sprite.setDisplaySize(FIGHT_FRAME.w * s, FIGHT_FRAME.h * s);
}

export function faceFighter(sprite, dirX, spec) {
  if (!dirX) return;
  const wantRight = dirX > 0;
  sprite.setFlipX(spec.faces === 1 ? !wantRight : wantRight);
}

export function playFighter(sprite, act) {
  const id = sprite.fighterId || "ash";
  const key = `${id}-${act}`;
  const busy = sprite.busyUntil && sprite.scene.time.now < sprite.busyUntil;
  if (busy && (act === "idle" || act === "run")) return;
  if (sprite.anims?.currentAnim?.key === key) return;
  sprite.anims?.play(key, true);
  lockFighterSize(sprite);
}

export function lockBusy(sprite, act) {
  const spec = FIGHTERS[sprite.fighterId] || FIGHTERS.ash;
  const frames = spec.frames[act] || 4;
  const rate = spec.rates[act] || 12;
  sprite.busyUntil = sprite.scene.time.now + (frames / rate) * 1000;
  playFighter(sprite, act);
}

export function sharpenTextures(scene, keys) {
  const mode = Phaser.Textures?.FilterMode?.NEAREST ?? Phaser.Textures?.NEAREST;
  if (mode == null) return;
  keys.forEach((k) => {
    try {
      const t = scene.textures.get(k);
      if (t && t.key !== "__MISSING" && t.setFilter) t.setFilter(mode);
    } catch (_) {
      /* Phaser build without per-texture filter */
    }
  });
}
