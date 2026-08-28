const KEY = "dc-game-lib-v1";

function empty() {
  return { heroId: "sand", theme: "snes", seen: {}, misses: {}, due: {}, warm: {}, xp: 0, studs: 0 };
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

export function markSeen(id) {
  const s = loadSave();
  s.seen[id] = true;
  return writeSave({ seen: s.seen });
}

export function bumpMiss(id) {
  const s = loadSave();
  s.misses[id] = (s.misses[id] || 0) + 1;
  s.due[id] = true;
  return writeSave({ misses: s.misses, due: s.due });
}

export function clearDue(id) {
  const s = loadSave();
  delete s.due[id];
  s.misses[id] = 0;
  s.xp += 1;
  return writeSave({ due: s.due, misses: s.misses, xp: s.xp });
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

export function homeOf(scene) {
  return scene.registry.get("homeScene") || "HubScene";
}
