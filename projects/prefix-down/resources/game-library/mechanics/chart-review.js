import { THEMES } from "../look/palettes.js";
import { fadeTo } from "../motion/transitions.js";
import { sfx } from "../audio/sfx.js";
import { COLS } from "./metric-grade.js";
import { homeOf, itemMastery, loadSave, resetSave } from "../systems/save.js";
import { prettyMetric } from "./strike-recall.js";
import { makeControls } from "../input/controls.js";
import { clearStyle } from "../look/type.js";
import { mapItem } from "./chart-map.js";

const BLUE = [36, 92, 220];
const GREEN = [28, 176, 72];

function lerpColor(t) {
  const u = Math.max(0, Math.min(1, t));
  const rgb = BLUE.map((b, i) => Math.round(b + (GREEN[i] - b) * u));
  return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
}

function inkFor(t) {
  return t > 0.55 ? "#06140a" : "#fff6dc";
}

function cellScores(items) {
  const acc = Array.from({ length: 13 }, () => Array.from({ length: 4 }, () => ({ w: 0, s: 0 })));
  items.forEach((item) => {
    const m = itemMastery(item.id);
    const cells = mapItem(item.id);
    const weak = item.id === "step-10" || item.id === "jump-1000" || item.id === "jump-factor" ? 0.25 : 1;
    cells.forEach(([r, c]) => {
      acc[r][c].s += m * weak;
      acc[r][c].w += weak;
    });
  });
  return acc.map((row) => row.map((cell) => (cell.w ? cell.s / cell.w : 0)));
}

function band(t) {
  if (t >= 0.95) return "mastered";
  if (t >= 0.5) return "warm";
  if (t > 0.08) return "learning";
  return "unknown";
}

export class ChartReviewScene extends Phaser.Scene {
  constructor() {
    super("ChartReviewScene");
  }

  create() {
    this.cameras.main.setBackgroundColor(THEMES.snes.bg);
    this.ctrl = makeControls(this);
    const W = this.scale.width;
    this.add.text(W / 2, 28, "FILLED CHART  ·  review, then fight", {
      ...clearStyle("#f0c040", 42),
      fontStyle: "800",
    }).setOrigin(0.5, 0);
    this.add.text(W / 2, 78, "Color is what the game thinks you know   ·   ENTER fight   ·   R reset   ·   ESC title", {
      ...clearStyle("#c8b8e0", 24),
    }).setOrigin(0.5, 0);

    this.dumpRows = this.cache.json.get("metric-deck")?.dump?.rows || [];
    this.items = this.cache.json.get("metric-deck")?.items || [];

    this.wrap = document.createElement("div");
    this.wrap.id = "chart-review";
    this.wrap.className = "chart-review";
    const canvas = document.querySelector("#game canvas") || document.querySelector("canvas");
    if (canvas) {
      const b = canvas.getBoundingClientRect();
      Object.assign(this.wrap.style, {
        position: "fixed",
        left: `${b.left + b.width * 0.06}px`,
        top: `${b.top + 100}px`,
        width: `${b.width * 0.88}px`,
        maxHeight: `${b.height * 0.78}px`,
        transform: "none",
      });
    }
    const table = document.createElement("table");
    const head = document.createElement("tr");
    COLS.forEach((c) => {
      const th = document.createElement("th");
      th.textContent = c;
      head.appendChild(th);
    });
    table.appendChild(head);
    this.dumpRows.forEach((row) => {
      const tr = document.createElement("tr");
      row.forEach((val, c) => {
        const td = document.createElement("td");
        td.textContent = c === 3 ? prettyMetric(val) : val;
        tr.appendChild(td);
      });
      table.appendChild(tr);
    });
    this.wrap.appendChild(table);
    this.table = table;

    const legend = document.createElement("div");
    legend.className = "chart-review-legend";
    [
      [0, "unknown"],
      [0.35, "learning"],
      [0.62, "MCQ warm"],
      [1, "mastered"],
    ].forEach(([t, lab]) => {
      const chip = document.createElement("span");
      chip.className = "chart-review-swatch";
      chip.style.background = lerpColor(t);
      chip.style.color = inkFor(t);
      chip.textContent = lab;
      legend.appendChild(chip);
    });
    const tally = document.createElement("span");
    tally.className = "chart-review-tally";
    legend.appendChild(tally);
    this.tally = tally;
    this.wrap.appendChild(legend);

    const bar = document.createElement("div");
    bar.className = "chart-review-bar";
    const go = document.createElement("button");
    go.type = "button";
    go.className = "chart-review-go";
    go.textContent = "ENTER  ·  FIGHT";
    go.addEventListener("click", () => this.goFight());
    const reset = document.createElement("button");
    reset.type = "button";
    reset.className = "chart-review-reset";
    reset.textContent = "R  ·  RESET KNOWLEDGE";
    reset.addEventListener("click", () => this.resetKnowledge());
    bar.append(go, reset);
    this.wrap.appendChild(bar);

    (document.getElementById("game") || document.body).appendChild(this.wrap);

    this.onKey = (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        this.goFight();
      } else if (e.key === "Escape") {
        e.preventDefault();
        this.goTitle();
      } else if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        this.resetKnowledge();
      }
    };
    document.addEventListener("keydown", this.onKey);
    this.events.once("shutdown", () => {
      document.removeEventListener("keydown", this.onKey);
      this.wrap?.remove();
    });

    this.paint();
    const save = loadSave();
    if (!Object.keys(save.seen).length && !Object.keys(save.warm).length) {
      this.foot = this.add.text(W / 2, this.scale.height - 36, "Nothing mastered yet  ·  whole chart is unknown blue", {
        ...clearStyle("#a090c0", 22),
      }).setOrigin(0.5, 1);
    }
  }

  paint() {
    const scores = cellScores(this.items);
    const counts = { unknown: 0, learning: 0, warm: 0, mastered: 0 };
    const body = [...this.table.querySelectorAll("tr")].slice(1);
    body.forEach((tr, r) => {
      [...tr.children].forEach((td, c) => {
        const t = scores[r][c];
        td.style.background = lerpColor(t);
        td.style.color = inkFor(t);
        td.title = `${Math.round(t * 100)}%`;
        counts[band(t)] += 1;
      });
    });
    if (this.tally) {
      this.tally.textContent = `${counts.unknown} unknown   ${counts.learning} learning   ${counts.warm} warm   ${counts.mastered} mastered`;
    }
  }

  resetKnowledge() {
    resetSave();
    sfx.whoosh();
    this.paint();
    const W = this.scale.width;
    this.foot?.destroy();
    this.foot = this.add.text(W / 2, this.scale.height - 36, "Knowledge wiped  ·  whole chart is unknown blue", {
      ...clearStyle("#f0c040", 22),
    }).setOrigin(0.5, 1);
  }

  goFight() {
    sfx.confirm();
    this.wrap?.remove();
    fadeTo(this, "BrawlerScene");
  }

  goTitle() {
    sfx.select();
    this.wrap?.remove();
    fadeTo(this, homeOf(this));
  }
}
