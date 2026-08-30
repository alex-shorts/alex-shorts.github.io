const KEY = "dc-game-lib-v1";

function empty() {
  return { heroId: "sand", fighterId: "ash", theme: "snes", seen: {}, misses: {}, due: {}, warm: {}, typed: {}, scaffold: 0, xp: 0, studs: 0 };
}

export function loadSave() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "{}");
    const base = empty();
    return {
      ...base,
      ...raw,
      seen: { ...base.seen, ...raw.seen },
      misses: { ...base.misses, ...raw.misses },
      due: { ...base.due, ...raw.due },
      warm: { ...base.warm, ...raw.warm },
      typed: { ...base.typed, ...raw.typed },
      scaffold: Number.isFinite(raw.scaffold) ? Math.max(0, Math.min(4, raw.scaffold)) : 0,
    };
  } catch {
    return empty();
  }
}

export function writeSave(patch) {
  const next = { ...loadSave(), ...patch };
  localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

export function resetSave() {
  localStorage.removeItem(KEY);
  return empty();
}

export function markSeen(id) {
  const s = loadSave();
  s.seen[id] = true;
  return writeSave({ seen: s.seen });
}

export function bumpMiss(id) {
  const s = loadSave();
  s.misses[id] = (s.misses[id] || 0) + 1;
  s.due[id] = true;
  s.scaffold = Math.min(4, (s.scaffold || 0) + 1);
  return writeSave({ misses: s.misses, due: s.due, scaffold: s.scaffold });
}

export function clearDue(id) {
  const s = loadSave();
  delete s.due[id];
  s.misses[id] = 0;
  s.xp += 1;
  s.scaffold = Math.max(0, (s.scaffold || 0) - 1);
  return writeSave({ due: s.due, misses: s.misses, xp: s.xp, scaffold: s.scaffold });
}

export function missCount(id) {
  return loadSave().misses[id] || 0;
}

export function isNew(id) {
  return !loadSave().seen[id];
}

/** Warm = answered correctly once as MCQ; type-in punches may follow. */
export function isWarm(id) {
  return !!loadSave().warm[id];
}

export function markWarm(id) {
  const s = loadSave();
  s.warm[id] = true;
  return writeSave({ warm: s.warm });
}

export function markTyped(id) {
  const s = loadSave();
  s.typed[id] = true;
  s.warm[id] = true;
  return writeSave({ typed: s.typed, warm: s.warm });
}

/** 0 unknown (blue) → 1 mastered (green). */
export function itemMastery(id) {
  const s = loadSave();
  if (s.due[id]) return Math.max(0.12, 0.38 - 0.06 * Math.min(4, s.misses[id] || 1));
  if (s.typed[id]) return 1;
  if (s.warm[id]) return 0.62;
  if (s.seen[id]) return 0.4;
  if (s.misses[id]) return 0.22;
  return 0;
}

export function scaffoldOf() {
  return loadSave().scaffold || 0;
}

export function homeOf(scene) {
  return scene.registry.get("homeScene") || "HubScene";
}
