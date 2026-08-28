import { COLS } from "./metric-grade.js";

export { COLS };

export const PREFIX = [
  "tera",
  "giga",
  "mega",
  "kilo",
  "hecto",
  "deca",
  "base",
  "deci",
  "centi",
  "milli",
  "micro",
  "nano",
  "pico",
];

export const BASE_ROW = 6;

const EXTRA = {
  "base-units": [6, 1],
  "base-exp": [6, 3],
  "kilo-meaning": [3, 2],
  "milli-meaning": [9, 2],
  "rev-10e3": [3, 0],
  "rev-10e-3": [9, 0],
  "rev-da": [5, 0],
  "order-1": [0, 0],
  "order-after-tera": [1, 0],
  "order-after-giga": [2, 0],
  "order-after-mega": [3, 0],
  "order-center": [6, 0],
  "order-bottom": [12, 0],
  "neighbor-kilo": [4, 0],
  "neighbor-milli": [10, 0],
};

const GIVEN = {
  "order-after-tera": [[0, 0]],
  "order-after-giga": [[1, 0]],
  "order-after-mega": [[2, 0]],
  "neighbor-kilo": [[3, 0]],
  "neighbor-milli": [[9, 0]],
  "rev-10e3": [[3, 3]],
  "rev-10e-3": [[9, 3]],
  "rev-da": [[5, 1]],
  "jump-1000": [[0, 0]],
  "step-10": [[6, 2]],
  "kilo-meaning": [[3, 0]],
  "milli-meaning": [[9, 0]],
  "order-bottom": [[6, 0]],
};

export function mapItem(id) {
  if (id === "step-10") return [[5, 2]];
  if (id === "jump-1000") return [[1, 0]];
  if (EXTRA[id]) return [EXTRA[id]];
  const mult = id.match(/^mult-(.+)$/);
  if (mult) {
    const r = PREFIX.indexOf(mult[1]);
    return r >= 0 ? [[r, 2]] : [];
  }
  const named = id.match(/^(tera|giga|mega|kilo|hecto|deca|deci|centi|milli|micro|nano|pico)-(sym|exp)$/);
  if (named) {
    const r = PREFIX.indexOf(named[1]);
    const c = named[2] === "sym" ? 1 : 3;
    return r >= 0 ? [[r, c]] : [];
  }
  return [];
}

export function targetCell(id) {
  return mapItem(id)[0] || [BASE_ROW, 0];
}

export function givenCells(id) {
  if (GIVEN[id]) return GIVEN[id].map((p) => [...p]);
  const named = id.match(/^(tera|giga|mega|kilo|hecto|deca|deci|centi|milli|micro|nano|pico)-(sym|exp)$/);
  if (named) return [[PREFIX.indexOf(named[1]), 0]];
  const mult = id.match(/^mult-(.+)$/);
  if (mult) {
    const r = PREFIX.indexOf(mult[1]);
    return r >= 0 ? [[r, 0]] : [];
  }
  return [];
}

function add(set, r, c) {
  if (r < 0 || r > 12 || c < 0 || c > 3) return;
  set.add(`${r},${c}`);
}

/** Cells to fill as hints. Target stays blank unless revealTarget. BASE row always filled. */
export function hintCells(id, scaffold) {
  const show = new Set();
  for (let c = 0; c < 4; c++) add(show, BASE_ROW, c);
  givenCells(id).forEach(([r, c]) => add(show, r, c));
  const [tr, tc] = targetCell(id);
  const n = Math.max(0, Math.min(4, scaffold | 0));
  if (n >= 1) {
    add(show, tr - 1, 0);
    add(show, tr + 1, 0);
  }
  if (n >= 2) {
    for (let c = 0; c < 4; c++) if (c !== tc) add(show, tr, c);
  }
  if (n >= 3) {
    for (const r of [tr - 1, tr + 1]) {
      for (let c = 0; c < 4; c++) add(show, r, c);
    }
  }
  if (n >= 4) {
    for (let r = 0; r < 13; r++) {
      for (let c = 0; c < 4; c++) add(show, r, c);
    }
  }
  show.delete(`${tr},${tc}`);
  return show;
}
