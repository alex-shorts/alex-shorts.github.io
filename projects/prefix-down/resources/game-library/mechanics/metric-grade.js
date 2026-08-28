/** Grade a completely blank 13×4 metric chart. Production, not recognition. */

export const COLS = ["Prefix", "Symbol", "Multiplier", "Exponential"];

function strip(s) {
  return String(s || "")
    .trim()
    .toLowerCase()
    .replace(/,/g, "")
    .replace(/×/g, "x")
    .replace(/\s+/g, "")
    .replace(/baseunit/g, "base")
    .replace(/deka/g, "deca")
    .replace(/µ/g, "μ")
    .replace(/^u$/, "μ")
    .replace(/^mu$/, "μ")
    .replace(/\^\{?(-?\d+)\}?/g, "^$1")
    .replace(/10\*\*/g, "10^")
    .replace(/1e12/g, "10^12")
    .replace(/1e9/g, "10^9")
    .replace(/1e6/g, "10^6")
    .replace(/1e3/g, "10^3")
    .replace(/1e0/g, "10^0")
    .replace(/1e-1/g, "10^-1")
    .replace(/1e-2/g, "10^-2")
    .replace(/1e-3/g, "10^-3")
    .replace(/1e-6/g, "10^-6")
    .replace(/1e-9/g, "10^-9")
    .replace(/1e-12/g, "10^-12")
    .replace(/g,l,m|g,l,m/g, "g,l,m")
    .replace(/glm/g, "g,l,m");
}

export function cellOk(got, want, col) {
  const a = strip(got);
  const b = strip(want);
  if (a === b) return true;
  if (col === 0 && (a === "base" || a === "baseunit") && b.includes("base")) return true;
  if (col === 1 && want.includes("g") && (a === "g,l,m" || a === "glm" || a === "g,l,m")) return true;
  return false;
}

/** Type-in KO answers. MCQ still matches the choice string exactly. */
export function answerOk(got, want) {
  if (cellOk(got, want, 0) || cellOk(got, want, 1) || cellOk(got, want, 2) || cellOk(got, want, 3)) return true;
  const a = strip(got);
  const b = strip(want);
  if (a === b) return true;
  if (b === "x10" && (a === "10" || a === "*10" || a === "times10")) return true;
  if (b === "x1000" && (a === "1000" || a === "*1000" || a === "times1000")) return true;
  if (b === "μ" && (a === "u" || a === "mu" || a === "micro")) return true;
  return false;
}

export function gradeChart(rows, keyRows) {
  let ok = 0;
  const total = keyRows.length * 4;
  const miss = [];
  keyRows.forEach((want, r) => {
    want.forEach((cell, c) => {
      const got = rows[r]?.[c] || "";
      if (cellOk(got, cell, c)) ok += 1;
      else miss.push({ r, c, got, want: cell });
    });
  });
  return { ok, total, pct: Math.round((100 * ok) / total), miss };
}
