/**
 * Arcade beat-em-up attacks. Ash uses the original Streets of Fight sheets:
 * Z  jab → punch → uppercut
 * X  kick → hop jump-kick → dive-kick
 * Air X/Z is jumpkick; down+kick in air is divekick.
 */
import { BRAWLER } from "./brawler-contract.js";
import { FIGHTERS, lockAttack, playFighter } from "../motion/fighter-anims.js";
import { sfx } from "../audio/sfx.js";

const WINDOW = 220;
const HITSTOP = 48;

const MOVES = {
  punch1: { act: "jab", active: [1], cancel: 2, range: 210, lunge: 20, next: "punch2", sfx: "jab", family: "punch" },
  punch2: { act: "punch", active: [1], cancel: 2, range: 250, lunge: 32, next: "punch3", sfx: "punch", family: "punch" },
  punch3: { act: "smash", active: [1], cancel: null, range: 310, lunge: 54, next: null, sfx: "smash", family: "punch", ender: true },
  kick1: { act: "kick", active: [3], cancel: 3, range: 290, lunge: 26, next: "kick2", sfx: "punch", family: "kick" },
  kick2: { act: "jumpkick", active: [1], cancel: 2, range: 310, lunge: 38, next: "kick3", sfx: "punch", family: "kick", hop: 0.42 },
  kick3: { act: "divekick", active: [2, 3], cancel: null, range: 330, lunge: 68, next: null, sfx: "smash", family: "kick", ender: true, drop: true },
  jumpkick: { act: "jumpkick", active: [1], cancel: null, range: 310, lunge: 40, next: null, sfx: "punch", air: true },
  divekick: { act: "divekick", active: [2, 3], cancel: null, range: 300, lunge: 70, next: null, sfx: "smash", air: true, drop: true },
};

function facing(hero) {
  return hero.flipX ? -1 : 1;
}

function heroSpec(scene) {
  return FIGHTERS[scene.hero?.fighterId] || FIGHTERS.ash;
}

function activeOf(scene, move) {
  return heroSpec(scene).hitFrames?.[move.act] || move.active;
}

function cancelOf(scene, move) {
  const custom = heroSpec(scene).cancelFrames;
  if (custom && move.act in custom) return custom[move.act];
  return move.cancel;
}

function frameOf(scene) {
  const atk = scene.atk;
  if (!atk) return -1;
  const elapsed = scene.time.now - atk.t0;
  return Math.floor((elapsed * atk.rate) / 1000);
}

function attacking(scene) {
  return scene.hero.attackUntil && scene.time.now < scene.hero.attackUntil;
}

function nearFloor(scene) {
  const h = scene.hero;
  return !h.air || Math.abs(h.y - (h.laneY || h.y)) < 18;
}

function inHitstop(scene) {
  return scene.time.now < (scene.hitstopUntil || 0);
}

export function bootCombat(scene) {
  scene.comboStep = 0;
  scene.comboKind = null;
  scene.comboWindow = 0;
  scene.atk = null;
  scene.atkBuffer = null;
  scene.hitstopUntil = 0;
}

export function combatBusy(scene) {
  return attacking(scene) || inHitstop(scene);
}

export function tickCombat(scene) {
  if (!scene.atk) return;
  if (inHitstop(scene)) return;
  const move = MOVES[scene.atk.id];
  const fr = frameOf(scene);
  if (!scene.atk.didHit && activeOf(scene, move).includes(fr)) {
    strikeNow(scene, move);
    scene.atk.didHit = true;
  }
  const cancelAt = cancelOf(scene, move);
  if (scene.atkBuffer && cancelAt != null && fr >= cancelAt) {
    const buf = scene.atkBuffer;
    scene.atkBuffer = null;
    if (buf === "punch" && move.family === "punch" && move.next) startMove(scene, move.next);
    else if (buf === "kick" && move.family === "punch") startMove(scene, "punch3");
    else if (buf === "kick" && move.family === "kick" && move.next) startMove(scene, move.next);
  }
  if (!attacking(scene)) {
    const ended = scene.atk.id;
    const fam = MOVES[ended]?.family;
    const move = MOVES[ended];
    scene.atk = null;
    if (ended === "jumpkick" || ended === "divekick" || move?.hop || move?.drop) {
      finishAirAttack(scene, fam === "kick" && ended === "kick2");
    } else if (nearFloor(scene) && scene.hero.air) {
      landHero(scene);
    }
    if (!(fam === "kick" && ended === "kick2")) {
      scene.comboWindow = scene.time.now + WINDOW;
    }
  }
}

export function pressPunch(scene) {
  if (scene.brawlerLocked || inHitstop(scene)) return;
  if (nearFloor(scene) && scene.hero.air) landHero(scene);
  if (scene.hero.air && scene.comboKind !== "kick") {
    startAir(scene, "jumpkick");
    return;
  }
  if (attacking(scene)) {
    scene.atkBuffer = "punch";
    return;
  }
  const chain = scene.time.now <= scene.comboWindow && scene.comboKind === "punch" && scene.comboStep > 0;
  if (chain && scene.comboStep === 1) startMove(scene, "punch2");
  else if (chain && scene.comboStep >= 2) startMove(scene, "punch3");
  else startMove(scene, "punch1");
}

export function pressKick(scene) {
  if (scene.brawlerLocked || inHitstop(scene)) return;
  if (nearFloor(scene) && scene.hero.air) landHero(scene);
  if (scene.hero.air && scene.comboKind !== "kick") {
    startAir(scene, airKickId(scene));
    return;
  }
  if (attacking(scene)) {
    scene.atkBuffer = "kick";
    return;
  }
  const punchEnd = scene.time.now <= scene.comboWindow && scene.comboKind === "punch" && scene.comboStep >= 1;
  if (punchEnd) {
    startMove(scene, "punch3");
    return;
  }
  const chain = scene.time.now <= scene.comboWindow && scene.comboKind === "kick" && scene.comboStep > 0;
  if (chain && scene.comboStep === 1) startMove(scene, "kick2");
  else if (chain && scene.comboStep >= 2) startMove(scene, "kick3");
  else startMove(scene, "kick1");
}

function airKickId(scene) {
  const v = scene.ctrl.vector();
  return v.y > 0.4 ? "divekick" : "jumpkick";
}

const JUMP_UP_S = 0.22;
function jumpG() {
  return (2 * BRAWLER.jump) / (JUMP_UP_S * JUMP_UP_S);
}
function launchVy(frac = 1) {
  return -Math.sqrt(2 * jumpG() * BRAWLER.jump * frac);
}

function stopJumpTween(h) {
  const t = h.jumpTween;
  h.jumpTween = null;
  try {
    t?.stop?.();
  } catch (_) {
    /* leftover y-tween from an older jump */
  }
}

function startAir(scene, id) {
  if (scene.hero.airKick) return;
  const h = scene.hero;
  h.airKick = true;
  h.airHop = false;
  stopJumpTween(h);
  startMove(scene, id);
  const move = MOVES[id];
  if (move.drop) {
    h.airDrop = true;
    h.jumpPhase = "down";
    h.jumpVy = Math.max(400, Math.abs(launchVy(0.45)));
  }
}

function finishAirAttack(scene, keepKickCombo) {
  const h = scene.hero;
  h.airKick = false;
  h.airDrop = false;
  h.airHop = false;
  if (!h.air) {
    if (keepKickCombo) scene.comboWindow = scene.time.now + WINDOW;
    return;
  }
  if (Math.abs(h.y - h.laneY) < 10) {
    landHero(scene);
    if (keepKickCombo) {
      scene.comboKind = "kick";
      scene.comboWindow = scene.time.now + WINDOW;
    }
    return;
  }
  h.jumpPhase = "down";
  if (h.jumpVy < 200) h.jumpVy = 420;
  if (keepKickCombo) {
    scene.comboKind = "kick";
    scene.comboStep = 2;
    scene.comboWindow = scene.time.now + WINDOW;
  }
}

export function tryJump(scene) {
  const h = scene.hero;
  if (scene.brawlerLocked || attacking(scene) || inHitstop(scene) || h.airKick) return;
  if (!h.air) {
    h.jumpsLeft = 1;
    h.laneY = h.y;
    h.air = true;
    h.airDrop = false;
    h.airHop = false;
    h.jumpPhase = "up";
    h.jumpVy = launchVy(1);
    stopJumpTween(h);
    sfx.jump();
    playFighter(h, "jump");
    return;
  }
  if (h.jumpsLeft > 0) {
    h.jumpsLeft -= 1;
    h.jumpPhase = "flip";
    h.jumpVy = launchVy(0.78);
    stopJumpTween(h);
    sfx.jump();
    playFighter(h, "djump");
  }
}

export function tickJump(scene, delta) {
  const h = scene.hero;
  if (!h?.air || scene.brawlerLocked) return;
  const hanging = h.airKick && !h.airDrop && !h.airHop;
  if (hanging) {
    h.jumpVy = 0;
    return;
  }
  const dt = Math.min(delta || 16, 50) / 1000;
  h.jumpVy = (h.jumpVy || 0) + jumpG() * dt;
  h.y += h.jumpVy * dt;
  if (h.jumpVy > 0) h.jumpPhase = "down";
  if (h.y >= h.laneY) landHero(scene);
}

export function landHero(scene) {
  const h = scene.hero;
  stopJumpTween(h);
  h.y = h.laneY;
  h.jumpVy = 0;
  h.air = false;
  h.airKick = false;
  h.airDrop = false;
  h.airHop = false;
  h.jumpPhase = null;
  h.jumpsLeft = 0;
}

function startHop(scene, frac) {
  const h = scene.hero;
  if (!h.air) h.laneY = h.y;
  h.air = true;
  h.airKick = true;
  h.airHop = true;
  h.airDrop = false;
  h.jumpPhase = "up";
  stopJumpTween(h);
  h.jumpVy = launchVy(frac);
}

function startMove(scene, id) {
  const move = MOVES[id];
  const spec = scene.hero;
  const ms = lockAttack(spec, move.act);
  const anim = spec.scene.anims.get(`${spec.fighterId}-${move.act}`);
  scene.atk = { id, t0: scene.time.now, rate: anim?.frameRate || 14, didHit: false };
  scene.atkBuffer = null;
  scene.comboWindow = 0;
  if (move.family === "punch") {
    scene.comboKind = "punch";
    scene.comboStep = id === "punch1" ? 1 : id === "punch2" ? 2 : 3;
  } else if (move.family === "kick") {
    scene.comboKind = "kick";
    scene.comboStep = id === "kick1" ? 1 : id === "kick2" ? 2 : 3;
  } else {
    scene.comboKind = null;
    scene.comboStep = 0;
  }
  if (move.hop) startHop(scene, move.hop);
  if (move.drop) {
    stopJumpTween(spec);
    spec.air = true;
    spec.airKick = true;
    spec.airDrop = true;
    spec.jumpPhase = "down";
    spec.jumpVy = Math.max(400, Math.abs(launchVy(0.45)));
  }
  const dx = facing(spec) * move.lunge;
  scene.tweens.add({ targets: spec, x: spec.x + dx, duration: 70, ease: "Quad.easeOut" });
  if (typeof sfx[move.sfx] === "function") sfx[move.sfx]();
  else sfx.whoosh();
  if (!move.air && !move.hop && !move.drop) spec.setVelocity(0, 0);
  return ms;
}

function strikeNow(scene, move) {
  const target = scene.nearestFoe(move.range);
  if (!target) {
    sfx.whoosh();
    return;
  }
  hitstop(scene, move.ender ? HITSTOP + 30 : HITSTOP);
  if (target.hp > 1) {
    scene.chip(target, move.ender ? 1.35 : 1);
    return;
  }
  scene.askKo(target);
}

function hitstop(scene, ms) {
  scene.hitstopUntil = scene.time.now + ms;
  scene.hero.anims?.pause();
  scene.aliveFoes().forEach((e) => e.anims?.pause());
  scene.time.delayedCall(ms, () => {
    scene.hero.anims?.resume();
    scene.aliveFoes().forEach((e) => e.active && e.anims?.resume());
  });
}
