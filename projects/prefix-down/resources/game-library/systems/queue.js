import { loadSave } from "./save.js";

/** Due misses first, then unseen helpers, then other unseen, then shuffle. Skip avoidId on KO barrage. */
export function pickMetricItem(items, avoidId) {
  if (!items?.length) return { stem: "kilo exponential?", choices: ["10^2", "10^3", "10^6"], answer: "10^3" };
  const s = loadSave();
  const not = (i) => i.id !== avoidId;
  const due = items.filter((i) => s.due[i.id] && not(i));
  if (due.length) return due[0];
  const helpers = items.filter((i) => i.section === "helper" && !s.seen[i.id] && not(i));
  if (helpers.length) return helpers[0];
  const unseen = items.filter((i) => !s.seen[i.id] && not(i));
  if (unseen.length) return unseen[0];
  const rest = items.filter(not);
  return rest[Math.floor(Math.random() * rest.length)] || items[0];
}
