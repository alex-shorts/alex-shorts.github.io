/**
 * Prefix Down — one fighter vs people on a side-scrolling road.
 * Clear a round, then walk forward. Three blocks before the blank chart.
 */
import { STAGE_SCALE } from "../layouts/city.js";
import { loadSave } from "../systems/save.js";

export const BRAWLER = {
  scene: "BrawlerScene",
  width: 9200,
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
  { x: 1600, foes: [["wolf", -120, 1], ["thug", 140, 2]] },
  { x: 2700, foes: [["bot", 80, 1], ["thug", -160, 0]] },
  { x: 3800, foes: [["wolf", -80, 0], ["bot", 160, 2]] },
  { x: 4900, foes: [["wolf", -160, 0], ["thug", 140, 1]] },
  { x: 6000, foes: [["bot", -80, 1], ["wolf", 160, 0]] },
  { x: 7100, foes: [["wolf", -80, 0], ["bot", 160, 2], ["thug", 40, 1]] },
  { x: 8400, foes: [["wrecker", 80, 1]] },
];

const BLOCK_B = [
  { x: 1600, foes: [["wolf", -160, 0], ["bot", 80, 2]] },
  { x: 2700, foes: [["brute", -120, 1], ["wolf", 140, 0]] },
  { x: 3800, foes: [["bot", -180, 0], ["wolf", 40, 1], ["thug", 180, 2]] },
  { x: 4900, foes: [["wolf", -100, 1], ["bot", 140, 0]] },
  { x: 6000, foes: [["brute", 80, 0], ["thug", -160, 2]] },
  { x: 7100, foes: [["bot", -80, 0], ["wolf", 120, 2], ["thug", 40, 1]] },
  { x: 8400, foes: [["wrecker", 40, 1]] },
];

const BLOCK_C = [
  { x: 1600, foes: [["wolf", -100, 1], ["bot", 140, 0]] },
  { x: 2700, foes: [["wolf", -200, 0], ["bot", 0, 2], ["brute", 160, 1]] },
  { x: 3800, foes: [["bot", -80, 0], ["wolf", 120, 2]] },
  { x: 4900, foes: [["thug", -140, 1], ["wolf", 80, 0]] },
  { x: 6000, foes: [["bot", 40, 2], ["brute", -160, 0]] },
  { x: 7100, foes: [["wolf", -80, 1], ["bot", 160, 0], ["thug", 40, 2]] },
  { x: 8400, foes: [["wrecker", 80, 1]] },
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
  { id: "wrecker", fighterId: "wrecker", kind: "boss", hp: 5, layers: 5, speed: 96, scale: 6, tint: 0xffffff },
];

export function levelOf(scene) {
  const i = Math.max(0, Math.min(LEVELS.length - 1, scene.registry.get("runLevel") || 0));
  return { i, ...LEVELS[i], last: i >= LEVELS.length - 1 };
}

export function outfitOf(scene) {
  const id = scene.registry.get("runOutfit") || loadSave().fighterId || "ash";
  return id === "kai" ? "kai" : "ash";
}
