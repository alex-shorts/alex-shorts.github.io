import { sfx } from "../audio/sfx.js";
import { sparkBurst } from "../motion/transitions.js";
import { markSeen, bumpMiss, clearDue, missCount, isWarm, markWarm } from "../systems/save.js";
import { answerOk } from "./metric-grade.js";
import { setFightKeys } from "../input/controls.js";

const MCQ_MS = 15000;

const SUPER = { "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹", "-": "⁻" };

export function prettyMetric(s) {
  return String(s ?? "").replace(/10\^(-?\d+)/g, (_, n) => "10" + [...n].map((ch) => SUPER[ch] || ch).join(""));
}

function resolveItem(item) {
  if (item.prereq && missCount(item.id) >= 2) return { ...item.prereq, parent: item };
  return item;
}

function canvasBox() {
  const c = document.querySelector("#game canvas") || document.querySelector("canvas");
  return c ? c.getBoundingClientRect() : { left: 0, top: 0, width: innerWidth, height: innerHeight, right: innerWidth, bottom: innerHeight };
}

/** Street band on the 2560×1440 canvas: below shops, full sidewalk + road. */
function panelBox() {
  const r = canvasBox();
  const top = r.top + r.height * 0.36;
  return { left: r.left, top, width: r.width, height: Math.max(120, r.bottom - top) };
}

function place(el) {
  const b = panelBox();
  Object.assign(el.style, {
    position: "fixed",
    left: `${b.left}px`,
    top: `${b.top}px`,
    width: `${b.width}px`,
    height: `${b.height}px`,
    zIndex: "80",
    boxSizing: "border-box",
  });
}

export function insertAtCursor(inp, text) {
  const start = inp.selectionStart ?? inp.value.length;
  const end = inp.selectionEnd ?? inp.value.length;
  inp.value = inp.value.slice(0, start) + text + inp.value.slice(end);
  const pos = start + text.length;
  inp.setSelectionRange(pos, pos);
  inp.focus();
}

export const EXP_CHIPS = [
  { label: "10¹²", insert: "10^12" },
  { label: "10⁹", insert: "10^9" },
  { label: "10⁶", insert: "10^6" },
  { label: "10³", insert: "10^3" },
  { label: "10²", insert: "10^2" },
  { label: "10¹", insert: "10^1" },
  { label: "10⁰", insert: "10^0" },
  { label: "10⁻¹", insert: "10^-1" },
  { label: "10⁻²", insert: "10^-2" },
  { label: "10⁻³", insert: "10^-3" },
  { label: "10⁻⁶", insert: "10^-6" },
  { label: "10⁻⁹", insert: "10^-9" },
  { label: "10⁻¹²", insert: "10^-12" },
];

export const TOKEN_CHIPS = [
  { label: "10^", insert: "10^" },
  { label: "^", insert: "^" },
  { label: "−", insert: "-" },
  { label: "μ", insert: "μ" },
  { label: "×", insert: "×" },
];

/** KO overlay. New atoms = 15s MCQ. Warm atoms = untimed type-in. */
export function openStrike(scene, raw, { onLand, onWhiff } = {}) {
  const item = resolveItem(raw);
  const typeIn = isWarm(raw.id) && raw.answer;
  const W = scene.scale.width;
  const H = scene.scale.height;
  scene.brawlerLocked = true;
  let closed = false;
  const root = scene.add.container(0, 0).setDepth(4000).setScrollFactor(0);
  const dim = scene.add.rectangle(W / 2, H * 0.18, W, H * 0.36, 0x080414, 0.55);
  root.add(dim);

  let wrap;
  let timerAnim;
  let onKey;
  let onResize;
  let reviewing = false;
  const correct = item.answer || raw.answer;

  function cleanupDom() {
    wrap?.remove();
    wrap = null;
    if (onKey) document.removeEventListener("keydown", onKey, true);
    if (onResize) {
      window.removeEventListener("resize", onResize);
      scene.scale?.off?.("resize", onResize);
    }
    if (scene.input?.keyboard) scene.input.keyboard.enabled = true;
    setFightKeys(scene, true);
  }

  function closeOut() {
    closed = true;
    timerAnim?.cancel?.();
    cleanupDom();
    root.destroy();
    scene.brawlerLocked = false;
  }

  function ackMiss() {
    if (closed || !reviewing) return;
    closeOut();
    onWhiff?.();
  }

  function showCorrect() {
    if (reviewing || closed) return;
    reviewing = true;
    timerAnim?.cancel?.();
    bumpMiss(raw.id);
    sfx.miss();
    wrap.querySelectorAll(".ko-grid, .ko-timer, .ko-chips, .ko-input, .ko-enter, .ko-hint").forEach((el) => el.remove());
    wrap.classList.add("ko-miss");
    const tag = document.createElement("div");
    tag.className = "ko-wrong";
    tag.textContent = "Wrong";
    const ans = document.createElement("div");
    ans.className = "ko-answer";
    ans.textContent = prettyMetric(correct);
    const got = document.createElement("button");
    got.type = "button";
    got.className = "ko-gotit";
    got.textContent = "Got it  ·  Enter";
    got.addEventListener("click", ackMiss);
    wrap.appendChild(tag);
    wrap.appendChild(ans);
    wrap.appendChild(got);
    got.focus();
  }

  function finish(ok) {
    if (closed || reviewing) return;
    if (!ok) {
      showCorrect();
      return;
    }
    markSeen(raw.id);
    clearDue(raw.id);
    if (item.parent) clearDue(item.parent.id);
    if (!typeIn) markWarm(raw.id);
    sfx.correct();
    sparkBurst(scene, W / 2, H * 0.7);
    closeOut();
    onLand?.();
  }

  scene.events.once("shutdown", () => {
    if (!closed) {
      closed = true;
      timerAnim?.cancel?.();
      cleanupDom();
      root.destroy();
    }
  });

  wrap = document.createElement("div");
  wrap.id = "ko-overlay";
  wrap.className = typeIn ? "ko-overlay ko-type" : "ko-overlay ko-mcq";
  place(wrap);
  onResize = () => {
    if (wrap) place(wrap);
  };
  window.addEventListener("resize", onResize);
  scene.scale?.on?.("resize", onResize);

  const stem = document.createElement("div");
  stem.className = "ko-stem";
  stem.textContent = item.stem;
  wrap.appendChild(stem);

  if (scene.input?.keyboard) scene.input.keyboard.enabled = false;
  setFightKeys(scene, false);

  if (typeIn) {
    const hint = document.createElement("div");
    hint.className = "ko-hint";
    hint.textContent = "Type or tap a symbol  ·  Enter to lock in  ·  no timer";
    wrap.appendChild(hint);

    const inp = document.createElement("input");
    inp.className = "ko-input";
    inp.autocomplete = "off";
    inp.spellcheck = false;
    inp.placeholder = "answer";
    inp.addEventListener("keydown", (e) => e.stopPropagation());
    wrap.appendChild(inp);

    const tokens = document.createElement("div");
    tokens.className = "ko-chips";
    TOKEN_CHIPS.forEach((chip) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "ko-chip";
      b.textContent = chip.label;
      b.addEventListener("click", () => insertAtCursor(inp, chip.insert));
      tokens.appendChild(b);
    });
    wrap.appendChild(tokens);

    const exps = document.createElement("div");
    exps.className = "ko-chips ko-exps";
    EXP_CHIPS.forEach((chip) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "ko-chip ko-exp";
      b.textContent = chip.label;
      b.addEventListener("click", () => insertAtCursor(inp, chip.insert));
      exps.appendChild(b);
    });
    wrap.appendChild(exps);

    const go = document.createElement("button");
    go.type = "button";
    go.className = "ko-enter";
    go.textContent = "Enter";
    go.addEventListener("click", () => finish(answerOk(inp.value, item.answer) || answerOk(inp.value, raw.answer)));
    wrap.appendChild(go);

    onKey = (e) => {
      if (closed) return;
      if (reviewing) {
        if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
          e.preventDefault();
          e.stopPropagation();
          ackMiss();
        }
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        e.stopPropagation();
        finish(answerOk(inp.value, item.answer) || answerOk(inp.value, raw.answer));
      }
    };
    document.addEventListener("keydown", onKey, true);
    (document.getElementById("game") || document.body).appendChild(wrap);
    requestAnimationFrame(() => {
      place(wrap);
      inp.focus();
    });
    return;
  }

  const timer = document.createElement("div");
  timer.className = "ko-timer";
  const timerFg = document.createElement("div");
  timerFg.className = "ko-timer-fg";
  timer.appendChild(timerFg);
  wrap.appendChild(timer);

  const grid = document.createElement("div");
  grid.className = "ko-grid";
  const choices = (item.choices || []).slice(0, 4);

  function pick(n) {
    if (closed || reviewing || n >= choices.length) return;
    const c = choices[n];
    finish(c === item.answer || c === raw.answer || answerOk(c, item.answer) || answerOk(c, raw.answer));
  }

  choices.forEach((c, n) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "ko-choice";
    const num = document.createElement("span");
    num.className = "ko-num";
    num.textContent = String(n + 1);
    const lab = document.createElement("span");
    lab.className = "ko-lab";
    lab.textContent = prettyMetric(c);
    b.appendChild(num);
    b.appendChild(lab);
    b.addEventListener("click", () => pick(n));
    grid.appendChild(b);
  });
  wrap.appendChild(grid);

  onKey = (e) => {
    if (closed) return;
    if (reviewing) {
      if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
        e.preventDefault();
        e.stopPropagation();
        ackMiss();
      }
      return;
    }
    const n = { 1: 0, 2: 1, 3: 2, 4: 3 }[e.key];
    if (n == null) return;
    e.preventDefault();
    e.stopPropagation();
    pick(n);
  };
  document.addEventListener("keydown", onKey, true);

  const t0 = performance.now();
  function tick(now) {
    if (closed || reviewing) return;
    const p = Math.min(1, (now - t0) / MCQ_MS);
    timerFg.style.transform = `scaleX(${1 - p})`;
    if (p >= 1) {
      finish(false);
      return;
    }
    timerAnim = {
      cancel() {
        reviewing = reviewing;
      },
    };
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  (document.getElementById("game") || document.body).appendChild(wrap);
  requestAnimationFrame(() => place(wrap));
}

export { MCQ_MS };
