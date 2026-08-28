import { THEMES } from "../look/palettes.js";
import { fadeTo } from "../motion/transitions.js";
import { sfx } from "../audio/sfx.js";
import { gradeChart, COLS } from "./metric-grade.js";
import { homeOf } from "../systems/save.js";
import { prettyMetric } from "./strike-recall.js";

function shuffle(list) {
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function makeChip(tile) {
  const el = document.createElement("button");
  el.type = "button";
  el.className = "tile-chip";
  el.dataset.id = tile.id;
  el.dataset.value = tile.value;
  el.dataset.col = String(tile.c);
  el.textContent = tile.label;
  el.title = COLS[tile.c];
  return el;
}

/** Drag tiles onto the 13×4 chart. Tests row order and left-to-right matches. */
export class ChartTilesScene extends Phaser.Scene {
  constructor() {
    super("ChartTilesScene");
  }

  create() {
    this.cameras.main.setBackgroundColor(THEMES.snes.bg);
    this.add.text(24, 16, "TILE CHART  ·  drag every chip to its cell", {
      fontFamily: '"Nunito", "Segoe UI", sans-serif',
      fontSize: "32px",
      color: "#f0c040",
      resolution: 3,
    });
    this.add.text(24, 56, "ESC  ·  back     Top = largest     Middle = BASE     Bottom = smallest", {
      fontFamily: '"Nunito", "Segoe UI", sans-serif',
      fontSize: "22px",
      color: "#a090c0",
      resolution: 3,
    });
    if (this.input?.keyboard) this.input.keyboard.enabled = false;

    const dump = this.cache.json.get("metric-deck")?.dump;
    const key = dump?.rows || [];
    const tiles = [];
    key.forEach((row, r) => {
      row.forEach((value, c) => {
        tiles.push({
          id: `t-${r}-${c}`,
          r,
          c,
          value,
          label: c === 3 ? prettyMetric(value) : value,
        });
      });
    });

    this.wrap = document.createElement("div");
    this.wrap.id = "metric-tiles";
    this.wrap.className = "tile-chart";
    (document.getElementById("game") || document.body).appendChild(this.wrap);

    const model = document.createElement("p");
    model.className = "tile-model";
    model.textContent =
      "Across a row: Prefix → Symbol → Multiplier → Exponential (one prefix). Down the grid: Tera at the top, pico at the bottom.";
    this.wrap.appendChild(model);

    const board = document.createElement("div");
    board.className = "tile-board";
    this.wrap.appendChild(board);

    const table = document.createElement("table");
    table.className = "tile-grid";
    const head = document.createElement("tr");
    const corner = document.createElement("th");
    corner.textContent = "";
    head.appendChild(corner);
    COLS.forEach((c) => {
      const th = document.createElement("th");
      th.textContent = c;
      head.appendChild(th);
    });
    table.appendChild(head);

    this.slots = [];
    for (let r = 0; r < 13; r++) {
      const tr = document.createElement("tr");
      const lab = document.createElement("th");
      lab.className = "tile-rowlab";
      lab.textContent = r === 6 ? "base" : r < 6 ? "↑" : "↓";
      tr.appendChild(lab);
      const row = [];
      for (let c = 0; c < 4; c++) {
        const td = document.createElement("td");
        td.className = "tile-slot";
        td.dataset.r = String(r);
        td.dataset.c = String(c);
        tr.appendChild(td);
        row.push(td);
      }
      this.slots.push(row);
      table.appendChild(tr);
    }
    board.appendChild(table);

    const wells = document.createElement("div");
    wells.className = "tile-wells";
    const spacer = document.createElement("div");
    spacer.className = "tile-well-spacer";
    wells.appendChild(spacer);
    this.banks = COLS.map((name, c) => {
      const well = document.createElement("div");
      well.className = "tile-well";
      well.dataset.col = String(c);
      const h = document.createElement("h3");
      h.textContent = name;
      well.appendChild(h);
      wells.appendChild(well);
      return well;
    });
    board.appendChild(wells);

    const byCol = [[], [], [], []];
    tiles.forEach((tile) => byCol[tile.c].push(tile));
    byCol.forEach((col, c) => {
      shuffle(col).forEach((tile) => this.banks[c].appendChild(makeChip(tile)));
    });

    const bar = document.createElement("div");
    bar.className = "tile-bar";
    const grade = document.createElement("button");
    grade.type = "button";
    grade.className = "tile-grade";
    grade.textContent = "Grade";
    const reset = document.createElement("button");
    reset.type = "button";
    reset.className = "tile-reset";
    reset.textContent = "Shuffle back";
    this.scoreEl = document.createElement("div");
    this.scoreEl.className = "tile-score";
    bar.append(grade, reset, this.scoreEl);
    this.wrap.appendChild(bar);

    this.drag = null;
    this.bindDrag();
    grade.onclick = () => this.grade(key);
    reset.onclick = () => this.reshuffle();

    this.onEsc = (e) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      this.leave();
    };
    document.addEventListener("keydown", this.onEsc);
    this.events.once("shutdown", () => {
      document.removeEventListener("keydown", this.onEsc);
      this.wrap?.remove();
      if (this.input?.keyboard) this.input.keyboard.enabled = true;
    });
  }

  leave() {
    this.wrap?.remove();
    if (this.input?.keyboard) this.input.keyboard.enabled = true;
    fadeTo(this, homeOf(this));
  }

  chipIn(slot) {
    return slot.querySelector(".tile-chip");
  }

  homeBank(chip) {
    const c = Number(chip?.dataset.col);
    return this.banks[c] || this.banks[0];
  }

  place(chip, slot) {
    if (!chip || !slot) return;
    const occupant = this.chipIn(slot);
    const from = this.drag?.from;
    if (occupant && occupant !== chip) {
      if (from?.classList.contains("tile-slot")) from.appendChild(occupant);
      else this.homeBank(occupant).appendChild(occupant);
    }
    slot.appendChild(chip);
    slot.classList.remove("ok", "bad");
    sfx.select();
  }

  bindDrag() {
    const onMove = (e) => this.moveDrag(e);
    const onUp = (e) => this.drop(e);
    this.wrap.addEventListener("pointerdown", (e) => {
      const chip = e.target.closest(".tile-chip");
      if (!chip || e.button) return;
      e.preventDefault();
      const rect = chip.getBoundingClientRect();
      this.drag = {
        chip,
        from: chip.parentElement,
        dx: e.clientX - rect.left,
        dy: e.clientY - rect.top,
        w: rect.width,
      };
      document.body.appendChild(chip);
      chip.classList.add("dragging");
      chip.style.width = `${rect.width}px`;
      chip.style.left = `${rect.left}px`;
      chip.style.top = `${rect.top}px`;
      chip.setPointerCapture(e.pointerId);
      document.addEventListener("pointermove", onMove);
      document.addEventListener("pointerup", onUp);
      document.addEventListener("pointercancel", onUp);
      this._dragMove = onMove;
      this._dragUp = onUp;
    });
  }

  moveDrag(e) {
    if (!this.drag) return;
    const { chip, dx, dy } = this.drag;
    chip.style.left = `${e.clientX - dx}px`;
    chip.style.top = `${e.clientY - dy}px`;
    this.wrap.querySelectorAll(".over").forEach((s) => s.classList.remove("over"));
    chip.style.visibility = "hidden";
    const hit = document.elementFromPoint(e.clientX, e.clientY)?.closest(".tile-slot, .tile-well");
    chip.style.visibility = "";
    if (hit) hit.classList.add("over");
  }

  drop(e) {
    if (!this.drag) return;
    const { chip, from } = this.drag;
    if (this._dragMove) document.removeEventListener("pointermove", this._dragMove);
    if (this._dragUp) {
      document.removeEventListener("pointerup", this._dragUp);
      document.removeEventListener("pointercancel", this._dragUp);
    }
    this._dragMove = null;
    this._dragUp = null;
    chip.style.visibility = "hidden";
    const hit = document.elementFromPoint(e.clientX, e.clientY)?.closest(".tile-slot, .tile-well");
    chip.style.visibility = "";
    chip.classList.remove("dragging");
    chip.style.left = "";
    chip.style.top = "";
    chip.style.width = "";
    this.wrap.querySelectorAll(".over").forEach((s) => s.classList.remove("over"));
    this.drag = { ...this.drag, from };
    if (hit?.classList.contains("tile-slot")) this.place(chip, hit);
    else this.homeBank(chip).appendChild(chip);
    this.drag = null;
  }

  reshuffle() {
    const chips = [...this.wrap.querySelectorAll(".tile-chip"), ...document.querySelectorAll("body > .tile-chip")];
    const byCol = [[], [], [], []];
    chips.forEach((chip) => {
      const c = Number(chip.dataset.col) || 0;
      byCol[c].push(chip);
    });
    byCol.forEach((col, c) => {
      shuffle(col).forEach((chip) => this.banks[c].appendChild(chip));
    });
    this.slots.flat().forEach((s) => s.classList.remove("ok", "bad"));
    this.scoreEl.textContent = "";
    sfx.whoosh();
  }

  grade(key) {
    const rows = this.slots.map((row) =>
      row.map((slot) => this.chipIn(slot)?.dataset.value || ""),
    );
    const g = gradeChart(rows, key);
    this.scoreEl.textContent = `${g.ok}/${g.total}  (${g.pct}%)   same row = one prefix   down = Tera → pico`;
    this.slots.forEach((row, r) => {
      row.forEach((slot, c) => {
        slot.classList.remove("ok", "bad");
        if (!this.chipIn(slot)) {
          slot.classList.add("bad");
          return;
        }
        slot.classList.add(g.miss.some((m) => m.r === r && m.c === c) ? "bad" : "ok");
      });
    });
    sfx[g.pct >= 80 ? "correct" : "miss"]();
  }
}
