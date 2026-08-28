/**
 * Prefix Down — one fighter vs people on a side-scrolling road.
 * Clear a round, then walk forward. Three blocks before the blank chart.
 */
import { STAGE_SCALE } from "../layouts/city.js";

export const BRAWLER = {
  scene: "BrawlerScene",
  width: 12800,
  walkSpeed: 420,
  laneSpeed: 220,
  punchRange: 220,
  kickRange: 280,
  chip: 1,
  attackMs: 280,
  maxHp: 5,
  jump: 36 * STAGE_SCALE,
};

export const HERO = { id: "ash", name: "Ash" };

export function roadLayout(H) {
  const S = STAGE_SCALE;
  return {
    roadTop: 96 * S,
    curb: 14,
    floorY: Math.round(198 * S),
    laneMin: Math.round(170 * S),
    laneMax: Math.round(206 * S),
    height: H,
  };
}

const BLOCK_A = [
  { x: 2200, foes: [["wolf", -120, 1], ["thug", 140, 2]] },
  { x: 5200, foes: [["bot", 80, 1], ["thug", -160, 0]] },
  { x: 8200, foes: [["wolf", -80, 0], ["bot", 160, 2]] },
  { x: 11200, foes: [["boss", 40, 1], ["wolf", 180, 0]] },
];

const BLOCK_B = [
  { x: 2200, foes: [["wolf", -160, 0], ["bot", 80, 2]] },
  { x: 5200, foes: [["brute", -120, 1], ["wolf", 140, 0]] },
  { x: 8200, foes: [["bot", -180, 0], ["wolf", 40, 1], ["thug", 180, 2]] },
  { x: 11200, foes: [["boss", 0, 1], ["bot", 160, 0]] },
];

const BLOCK_C = [
  { x: 2200, foes: [["wolf", -100, 1], ["bot", 140, 0]] },
  { x: 5200, foes: [["wolf", -200, 0], ["bot", 0, 2], ["brute", 160, 1]] },
  { x: 8200, foes: [["bot", -80, 0], ["wolf", 120, 2]] },
  { x: 11200, foes: [["boss", 40, 1], ["wolf", -140, 0], ["bot", 180, 2]] },
];

/** Three street blocks. Chart dump only after the last. */
export const LEVELS = [
  { id: "block-a", name: "BLOCK 1", stations: BLOCK_A, hpAdd: 0, speedAdd: 0 },
  { id: "block-b", name: "BLOCK 2", stations: BLOCK_B, hpAdd: 1, speedAdd: 12 },
  { id: "block-c", name: "BLOCK 3", stations: BLOCK_C, hpAdd: 2, speedAdd: 24 },
];

export const STATIONS = BLOCK_A;

export const FOES = [
  { id: "thug", fighterId: "punk", kind: "melee", hp: 3, speed: 110, scale: 6, tint: 0xffffff },
  { id: "brute", fighterId: "punk", kind: "melee", hp: 5, speed: 78, scale: 7.2, tint: 0xf0c0a8 },
  { id: "boss", fighterId: "punk", kind: "melee", hp: 8, speed: 96, scale: 8.2, tint: 0xe07070 },
  { id: "wolf", fighterId: "wolf", kind: "melee", hp: 4, speed: 150, scale: 6, tint: 0xffffff },
  { id: "bot", fighterId: "bot", kind: "gunner", hp: 4, speed: 88, scale: 6, tint: 0xffffff },
];

export function levelOf(scene) {
  const i = Math.max(0, Math.min(LEVELS.length - 1, scene.registry.get("runLevel") || 0));
  return { i, ...LEVELS[i], last: i >= LEVELS.length - 1 };
}

export function outfitOf(scene) {
  const id = scene.registry.get("runOutfit") || "ash";
  return id;
}
