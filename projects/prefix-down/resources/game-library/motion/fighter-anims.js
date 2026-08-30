/** Streets of Fight — 96×63 sheets. Girl outfits face right; punk faces left. */
export const FIGHT_FRAME = { w: 96, h: 63 };

const GIRL_MOVE = {
  faces: 1,
  scale: 6,
  body: { w: 20, h: 18, ox: 38, oy: 45 },
  sheet: { fall: "jump", death: "hit", djump: "jump", smash: "jump" },
  frames: { idle: 4, run: 10, jump: 4, fall: 4, djump: 5, jab: 3, punch: 3, smash: 2, kick: 5, jumpkick: 3, divekick: 5, hit: 2, death: 2 },
  rates: { idle: 8, run: 12, jump: 10, fall: 10, djump: 18, jab: 18, punch: 16, smash: 10, kick: 14, jumpkick: 16, divekick: 14, hit: 10, death: 8 },
};

function girlFiles(folder) {
  const p = folder ? `outfits/${folder}/` : "";
  return {
    idle: `${p}girl-idle.png`,
    run: `${p}girl-walk.png`,
    jump: `${p}girl-jump.png`,
    jab: `${p}girl-jab.png`,
    punch: `${p}girl-punch.png`,
    kick: `${p}girl-kick.png`,
    jumpkick: `${p}girl-jumpkick.png`,
    divekick: `${p}girl-divekick.png`,
    hit: `${p}girl-hurt.png`,
  };
}

function ninjaFiles() {
  return {
    idle: "ninja/ninja-idle.png",
    run: "ninja/ninja-walk.png",
    jump: "ninja/ninja-jump.png",
    jab: "ninja/ninja-jab.png",
    punch: "ninja/ninja-punch.png",
    smash: "ninja/ninja-smash.png",
    kick: "ninja/ninja-kick.png",
    jumpkick: "ninja/ninja-jumpkick.png",
    divekick: "ninja/ninja-divekick.png",
    hit: "ninja/ninja-hurt.png",
  };
}

const KAI_MOVE = {
  faces: 1,
  scale: 6,
  body: { w: 20, h: 18, ox: 38, oy: 45 },
  sheet: { fall: "jump", death: "hit", djump: "jump" },
  frames: {
    idle: 6,
    run: 8,
    jump: 6,
    fall: 6,
    djump: 4,
    jab: 5,
    punch: 5,
    smash: 5,
    kick: 8,
    jumpkick: 5,
    divekick: 6,
    hit: 2,
    death: 2,
  },
  rates: {
    idle: 8,
    run: 14,
    jump: 12,
    fall: 12,
    djump: 16,
    jab: 16,
    punch: 14,
    smash: 12,
    kick: 16,
    jumpkick: 14,
    divekick: 14,
    hit: 10,
    death: 8,
  },
  hitFrames: { jab: [2], punch: [3], smash: [3], kick: [5, 6], jumpkick: [3], divekick: [3, 4] },
  cancelFrames: { jab: 3, punch: 3, kick: 5, jumpkick: 3 },
};

export const FIGHTERS = {
  ash: { id: "ash", name: "Ash", ...GIRL_MOVE, files: girlFiles("") },
  kai: { id: "kai", name: "Kai", ...KAI_MOVE, files: ninjaFiles() },
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
    sheet: { jump: "idle", fall: "idle", kick: "punch", death: "hit", jab: "punch", jumpkick: "punch", divekick: "punch", djump: "idle", smash: "punch" },
    frames: { idle: 4, run: 4, jump: 4, fall: 4, djump: 4, jab: 3, punch: 3, smash: 3, kick: 3, jumpkick: 3, divekick: 3, hit: 2, death: 4 },
    rates: { idle: 8, run: 10, jump: 8, fall: 8, djump: 14, jab: 14, punch: 12, smash: 10, kick: 12, jumpkick: 12, divekick: 12, hit: 10, death: 8 },
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
    sheet: { jump: "idle", fall: "idle", kick: "punch", death: "hit", jab: "punch", jumpkick: "punch", divekick: "punch", djump: "idle", smash: "punch" },
    frames: { idle: 6, run: 8, jump: 6, fall: 6, djump: 4, jab: 3, punch: 5, smash: 5, kick: 5, jumpkick: 3, divekick: 4, hit: 2, death: 4 },
    rates: { idle: 10, run: 14, jump: 10, fall: 10, djump: 14, jab: 14, punch: 14, smash: 12, kick: 14, jumpkick: 14, divekick: 14, hit: 10, death: 8 },
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
    sheet: { jump: "idle", fall: "idle", kick: "punch", death: "hit", jab: "punch", jumpkick: "punch", divekick: "punch", djump: "idle", smash: "punch" },
    frames: { idle: 6, run: 8, jump: 6, fall: 6, djump: 4, jab: 3, punch: 5, smash: 5, kick: 5, jumpkick: 3, divekick: 4, hit: 2, death: 4 },
    rates: { idle: 10, run: 14, jump: 10, fall: 10, djump: 14, jab: 14, punch: 16, smash: 12, kick: 16, jumpkick: 14, divekick: 14, hit: 10, death: 8 },
  },
};

export const OUTFITS = ["ash", "nox", "sol"];
export const PLAYABLE = ["ash", "kai"];

const ACTS = ["idle", "run", "jump", "fall", "djump", "jab", "punch", "smash", "kick", "jumpkick", "divekick", "hit", "death"];

export function fighterSheetKeys(id) {
  const spec = FIGHTERS[id];
  return Object.keys(spec.files).map((act) => `${id}-${act}`);
}

function sheetKey(spec, act) {
  const src = spec.sheet?.[act] || act;
  return `${spec.id}-${src}`;
}

export function registerFighterAnims(scene) {
  for (const spec of Object.values(FIGHTERS)) {
    for (const act of ACTS) {
      const key = `${spec.id}-${act}`;
      if (scene.anims.exists(key)) continue;
      const n = spec.frames[act];
      if (!n) continue;
      const sheet = sheetKey(spec, act);
      const frames =
        act === "djump" && spec.files?.jump
          ? scene.anims.generateFrameNumbers(sheet, {
              start: 1,
              end: spec.id === "kai" ? Math.min(4, (spec.frames.jump || 6) - 1) : 3,
            })
          : act === "smash" && spec.files?.jump && !spec.files?.smash
            ? scene.anims.generateFrameNumbers(sheet, { start: 0, end: 1 })
            : scene.anims.generateFrameNumbers(sheet, { start: 0, end: n - 1 });
      scene.anims.create({
        key,
        frames,
        frameRate: spec.rates[act],
        repeat: act === "idle" || act === "run" ? -1 : 0,
      });
    }
  }
  if (!scene.anims.exists("rocket-fly")) {
    scene.anims.create({
      key: "rocket-fly",
      frames: scene.anims.generateFrameNumbers("rocket-fly", { start: 0, end: 3 }),
      frameRate: 16,
      repeat: -1,
    });
  }
}

export function fitFighterBody(sprite, spec) {
  const b = spec.body;
  sprite.body?.setSize(b.w, b.h).setOffset(b.ox, b.oy);
}

export function lockFighterSize(sprite) {
  const spec = FIGHTERS[sprite.fighterId];
  const s = sprite.baseScale || spec?.scale || 6;
  sprite.baseScale = s;
  sprite.setScale(s);
}

export function faceFighter(sprite, dirX, spec) {
  if (!dirX) return;
  const wantRight = dirX > 0;
  sprite.setFlipX(spec.faces === 1 ? !wantRight : wantRight);
}

export function playFighter(sprite, act) {
  const id = sprite.fighterId || "ash";
  const key = `${id}-${act}`;
  const now = sprite.scene.time.now;
  const attacking = sprite.attackUntil && now < sprite.attackUntil;
  const busy = sprite.busyUntil && now < sprite.busyUntil;
  if (attacking && (act === "idle" || act === "run" || act === "jump" || act === "fall" || act === "djump")) return;
  if (busy && (act === "idle" || act === "run")) return;
  let keyPlay = key;
  if (!sprite.scene.anims.exists(keyPlay)) {
    if (act === "djump" || act === "fall") keyPlay = `${id}-jump`;
    else return;
  }
  if (!sprite.scene.anims.exists(keyPlay)) return;
  const looping = act === "idle" || act === "run";
  if (sprite.anims?.currentAnim?.key === keyPlay && (looping || sprite.anims?.isPlaying)) return;
  if (sprite.anims?.currentAnim?.key === keyPlay && !looping) return;
  try {
    sprite.anims?.play(keyPlay, true);
  } catch (_) {
    return;
  }
  lockFighterSize(sprite);
}

export function lockAttack(sprite, act) {
  const spec = FIGHTERS[sprite.fighterId] || FIGHTERS.ash;
  const frames = spec.frames[act] || 4;
  const rate = spec.rates[act] || 12;
  const ms = (frames / rate) * 1000;
  sprite.attackUntil = sprite.scene.time.now + ms;
  sprite.busyUntil = sprite.attackUntil;
  playFighter(sprite, act);
  return ms;
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
