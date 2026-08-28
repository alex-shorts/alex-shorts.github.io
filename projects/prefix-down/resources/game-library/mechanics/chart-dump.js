import { THEMES } from "../look/palettes.js";
import { fadeTo } from "../motion/transitions.js";
import { sfx } from "../audio/sfx.js";
import { gradeChart, COLS } from "./metric-grade.js";
import { homeOf } from "../systems/save.js";
import { EXP_CHIPS, TOKEN_CHIPS, insertAtCursor } from "./strike-recall.js";

/** Exam dump: every cell empty. They produce the whole chart. */
export class ChartDumpScene extends Phaser.Scene {
  constructor() {
    super("ChartDumpScene");
  }

  create() {
    this.cameras.main.setBackgroundColor(THEMES.snes.bg);
    this.add.text(24, 16, "BLANK CHART  ·  fill every cell  ·  no cues", {
      fontFamily: '"Nunito", "Segoe UI", sans-serif',
      fontSize: "32px",
      color: "#f0c040",
      resolution: 3,
    });
    this.add.text(24, 56, "ESC  ·  back     Grade when ready     sit = 80% twice with sleep", {
      fontFamily: '"Nunito", "Segoe UI", sans-serif',
      fontSize: "22px",
      color: "#a090c0",
      resolution: 3,
    });
    if (this.input?.keyboard) this.input.keyboard.enabled = false;
    const dump = this.cache.json.get("metric-deck")?.dump;
    const key = dump?.rows || [];
    this.wrap = document.createElement("div");
    this.wrap.id = "metric-dump";
    Object.assign(this.wrap.style, {
      position: "absolute",
      left: "50%",
      top: "96px",
      transform: "translateX(-50%)",
      zIndex: "20",
      maxHeight: "78%",
      overflow: "auto",
      background: "#1a1030",
      padding: "16px",
      fontFamily: '"Nunito", "Segoe UI", sans-serif',
      fontSize: "18px",
      color: "#f8f0d8",
      border: "2px solid #f0c040",
    });
    const table = document.createElement("table");
    table.style.borderCollapse = "collapse";
    const head = document.createElement("tr");
    COLS.forEach((c) => {
      const th = document.createElement("th");
      th.textContent = c;
      th.style.padding = "2px 6px";
      head.appendChild(th);
    });
    table.appendChild(head);
    this.inputs = [];
    for (let r = 0; r < 13; r++) {
      const tr = document.createElement("tr");
      const row = [];
      for (let c = 0; c < 4; c++) {
        const td = document.createElement("td");
        const inp = document.createElement("input");
        inp.autocomplete = "off";
        inp.spellcheck = false;
        Object.assign(inp.style, {
          width: "180px",
          fontSize: "18px",
          background: "#120c24",
          color: "#f8f0d8",
          border: "1px solid #504070",
          padding: "6px",
        });
        inp.addEventListener("keydown", (e) => e.stopPropagation());
        inp.addEventListener("focus", () => {
          this.lastCell = inp;
        });
        td.appendChild(inp);
        tr.appendChild(td);
        row.push(inp);
      }
      this.inputs.push(row);
      table.appendChild(tr);
    }
    this.lastCell = this.inputs[0][0];
    this.wrap.appendChild(table);

    const chips = document.createElement("div");
    chips.className = "ko-chips";
    chips.style.marginTop = "10px";
    [...TOKEN_CHIPS, ...EXP_CHIPS].forEach((chip) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "ko-chip";
      b.textContent = chip.label;
      b.addEventListener("mousedown", (e) => e.preventDefault());
      b.addEventListener("click", () => {
        const el = this.lastCell || this.inputs[0][0];
        insertAtCursor(el, chip.insert);
      });
      chips.appendChild(b);
    });
    this.wrap.appendChild(chips);

    const btn = document.createElement("button");
    btn.textContent = "Grade";
    btn.style.marginTop = "8px";
    btn.style.marginRight = "8px";
    this.scoreEl = document.createElement("div");
    btn.onclick = () => {
      const rows = this.inputs.map((row) => row.map((i) => i.value));
      const g = gradeChart(rows, key);
      this.scoreEl.textContent = `${g.ok}/${g.total}  (${g.pct}%)   sit signal is ≥80% twice with sleep between`;
      g.miss.forEach(({ r, c }) => {
        this.inputs[r][c].style.background = "#4a1820";
      });
      rows.forEach((row, r) =>
        row.forEach((_, c) => {
          if (!g.miss.some((m) => m.r === r && m.c === c)) this.inputs[r][c].style.background = "#1a3a20";
        }),
      );
      sfx[g.pct >= 80 ? "correct" : "miss"]();
    };
    this.wrap.appendChild(btn);
    this.wrap.appendChild(this.scoreEl);
    (document.getElementById("game") || document.body).appendChild(this.wrap);

    this.onEsc = (e) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      this.wrap?.remove();
      if (this.input?.keyboard) this.input.keyboard.enabled = true;
      fadeTo(this, homeOf(this));
    };
    document.addEventListener("keydown", this.onEsc);

    this.events.once("shutdown", () => {
      document.removeEventListener("keydown", this.onEsc);
      this.wrap?.remove();
      if (this.input?.keyboard) this.input.keyboard.enabled = true;
    });
  }
}
