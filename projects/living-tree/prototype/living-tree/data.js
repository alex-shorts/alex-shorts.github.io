/**
 * Living-tree data — loads collection/people/index.json (source of truth)
 * plus heritage Objects (obituaries / media expandables).
 */

/** Works for local `/` and GitHub Pages `/FamilyTree/` */
export const REPO_ROOT = new URL("../..", import.meta.url).pathname.replace(/\/?$/, "/");
export const MEDIA_ROOT = `${REPO_ROOT}collection/people/`;

function asset(path) {
  return `${REPO_ROOT}${String(path).replace(/^\//, "")}`;
}

/** Heritage objects keyed for the person panel */
export const objects = {
  "OBIT-RICHARD": {
    id: "OBIT-RICHARD",
    title: "Ventura County Star obituary (28 Oct 2009)",
    type: "obituary",
    people: ["richard"],
    blurb: "Newspaper death notice — expand to read.",
    expandable: true,
    bodyPath: asset("collection/people/richard-dorland-shorts/obituary.md"),
    sourceUrl: "https://www.findagrave.com/memorial/65483876/richard-dorland-shorts",
  },
  "MEDIA-RICHARD-STONE": {
    id: "MEDIA-RICHARD-STONE",
    title: "Headstone — Conejo Mountain",
    type: "photo",
    people: ["richard"],
    blurb: "Find A Grave memorial photo (CPL U.S. Army Air Forces, WWII).",
    thumb: asset("collection/people/richard-dorland-shorts/media/memorial-fag-2011.gif"),
    sourceUrl: "https://www.findagrave.com/memorial/65483876/richard-dorland-shorts",
  },
  "OBIT-GLORIA": {
    id: "OBIT-GLORIA",
    title: "Conejo Mountain obituary",
    type: "obituary",
    people: ["gloria"],
    blurb: "Funeral-home obituary — expand to read the full text.",
    expandable: true,
    bodyPath: asset("collection/people/gloria-martha-gatz-shorts/obituary.md"),
    sourceUrl: "https://www.conejomountain.com/obituaries/Gloria-Martha-Shorts?obId=43105866",
  },
  "MEDIA-GLORIA-HEADSTONE": {
    id: "MEDIA-GLORIA-HEADSTONE",
    title: "Headstone — Conejo Mountain",
    type: "photo",
    people: ["gloria"],
    blurb: "Find A Grave headstone photo (2020).",
    thumb: asset("collection/people/gloria-martha-gatz-shorts/media/headstone-fag-2020.jpeg"),
    sourceUrl: "https://www.findagrave.com/memorial/183422612/gloria-martha-gatz-shorts",
  },
  "MEDIA-GLORIA-PORTRAIT": {
    id: "MEDIA-GLORIA-PORTRAIT",
    title: "Portrait — Conejo Mountain obituary",
    type: "photo",
    people: ["gloria"],
    blurb: "Funeral-home / FAG portrait.",
    thumb: asset("collection/people/gloria-martha-gatz-shorts/media/portrait.jpg"),
  },
  "MEDIA-EARL-STONE": {
    id: "MEDIA-EARL-STONE",
    title: "Headstone — Live Oak",
    type: "photo",
    people: ["earl"],
    thumb: asset("collection/people/earl-stanley-shorts/media/headstone-live-oak-2012.jpg"),
  },
  "MEDIA-ANNABELLE-STONE": {
    id: "MEDIA-ANNABELLE-STONE",
    title: "Headstone — Live Oak",
    type: "photo",
    people: ["annabelle"],
    thumb: asset("collection/people/annabelle-lucretia-shorts/media/headstone-live-oak-2012.jpg"),
  },
  "MEDIA-IRVIN-STONE": {
    id: "MEDIA-IRVIN-STONE",
    title: "Headstone — Olive Lawn",
    type: "photo",
    people: ["irvin"],
    thumb: asset("collection/people/irvin-carl-gatz/media/headstone-olive-lawn-2019.jpeg"),
  },
  "MEDIA-MARTHA-STONE": {
    id: "MEDIA-MARTHA-STONE",
    title: "Headstone — Olive Lawn",
    type: "photo",
    people: ["martha"],
    thumb: asset("collection/people/martha-tuxhorn-gatz/media/headstone-olive-lawn-2019.jpeg"),
  },
  "MEDIA-LEO-PORTRAIT": {
    id: "MEDIA-LEO-PORTRAIT",
    title: "Studio portrait",
    type: "photo",
    people: ["leo_tuxhorn"],
    thumb: asset("collection/people/leo-lewis-tuxhorn/media/portrait-studio.jpg"),
  },
  "MEDIA-IDA-PORTRAIT": {
    id: "MEDIA-IDA-PORTRAIT",
    title: "Studio portrait",
    type: "photo",
    people: ["ida_tuxhorn"],
    thumb: asset("collection/people/ida-achilles-tuxhorn/media/portrait-studio.jpg"),
  },
  "MEDIA-CARLA-STONE": {
    id: "MEDIA-CARLA-STONE",
    title: "Headstone — Conejo Mountain",
    type: "photo",
    people: ["carla"],
    thumb: asset("collection/people/carla-lou-shorts/media/memorial-fag-2011.jpg"),
  },
  "MEDIA-DORLAND-STONE": {
    id: "MEDIA-DORLAND-STONE",
    title: "Mount Hope Cemetery",
    type: "photo",
    people: ["dorland"],
    thumb: asset("collection/people/dorland-shorts/media/mount-hope-cemetery-2020.jpeg"),
  },
  "FT-S11": {
    id: "FT-S11",
    title: "Wedding presentation Bible",
    type: "book",
    people: ["alexander", "morganne"],
    blurb: "Links to collection FT-0003 — Alex & Morganne presentation Bible.",
  },
};

const OBJECTS_BY_PERSON = {
  richard: ["OBIT-RICHARD", "MEDIA-RICHARD-STONE"],
  gloria: ["OBIT-GLORIA", "MEDIA-GLORIA-PORTRAIT", "MEDIA-GLORIA-HEADSTONE"],
  earl: ["MEDIA-EARL-STONE"],
  annabelle: ["MEDIA-ANNABELLE-STONE"],
  irvin: ["MEDIA-IRVIN-STONE"],
  martha: ["MEDIA-MARTHA-STONE"],
  leo_tuxhorn: ["MEDIA-LEO-PORTRAIT"],
  ida_tuxhorn: ["MEDIA-IDA-PORTRAIT"],
  carla: ["MEDIA-CARLA-STONE"],
  dorland: ["MEDIA-DORLAND-STONE"],
  alexander: ["FT-S11"],
  morganne: ["FT-S11"],
};

export const GEN_COLORS = {
  0: { fill: "#c4a35a", soft: "rgba(196,163,90,0.22)", label: "Gen 0", avatarBg: "c4a35a" },
  1: { fill: "#6b8f71", soft: "rgba(107,143,113,0.22)", label: "Gen 1", avatarBg: "6b8f71" },
  2: { fill: "#4a7c9b", soft: "rgba(74,124,155,0.22)", label: "Gen 2", avatarBg: "4a7c9b" },
  3: { fill: "#8b6b9e", soft: "rgba(139,107,158,0.22)", label: "Gen 3", avatarBg: "8b6b9e" },
  4: { fill: "#b56b5a", soft: "rgba(181,107,90,0.22)", label: "Gen 4 · focus", avatarBg: "b56b5a" },
  5: { fill: "#5a7a8b", soft: "rgba(90,122,139,0.22)", label: "Gen 5", avatarBg: "5a7a8b" },
};

let focusId = "alexander";
let people = {};

export function getFocusId() {
  return focusId;
}

export function getPeople() {
  return people;
}

export async function loadPeopleIndex() {
  const res = await fetch(`${REPO_ROOT}collection/people/index.json`);
  if (!res.ok) throw new Error(`Failed to load people index (${res.status})`);
  const index = await res.json();
  focusId = index.focus_id || "alexander";
  people = {};

  for (const [id, raw] of Object.entries(index.people || {})) {
    const photoPath = raw.portrait || (raw.media && raw.media[0]) || null;
    people[id] = {
      id,
      name: raw.name,
      aka: raw.aka || "",
      years: raw.years || "",
      confidence: raw.confidence || "Unknown",
      status: raw.status || "",
      note: raw.note || "",
      summary: raw.note || `${raw.name}${raw.years ? ` (${raw.years})` : ""}.`,
      place: "",
      parents: raw.parents || [],
      spouses: raw.spouses || [],
      children: raw.children || [],
      media: raw.media || [],
      photo: photoPath ? MEDIA_ROOT + photoPath : null,
      objectIds: OBJECTS_BY_PERSON[id] || [],
      generation: 0,
    };
  }

  assignGenerations(people, focusId);

  // Enrich summaries from person.md is optional later; keep index notes for now
  return { focusId, people, updated: index.updated };
}

/** Depth from oldest ancestors of focus → generation bands (0 = oldest) */
function assignGenerations(map, focus) {
  const upDepth = {};
  function walkUp(id, d) {
    if (!map[id]) return;
    upDepth[id] = Math.max(upDepth[id] ?? 0, d);
    for (const p of map[id].parents || []) walkUp(p, d + 1);
  }
  walkUp(focus, 0);
  const maxUp = Math.max(0, ...Object.values(upDepth));

  for (const id of Object.keys(upDepth)) {
    map[id].generation = maxUp - upDepth[id];
  }

  // Descendants of anyone already assigned
  const queue = Object.keys(upDepth);
  const seen = new Set(queue);
  while (queue.length) {
    const id = queue.shift();
    const g = map[id].generation;
    for (const c of map[id].children || []) {
      if (!map[c]) continue;
      const next = g + 1;
      if (map[c].generation == null || map[c].generation < next || !seen.has(c)) {
        map[c].generation = seen.has(c) ? Math.max(map[c].generation, next) : next;
      }
      if (!seen.has(c)) {
        seen.add(c);
        queue.push(c);
      }
    }
    for (const s of map[id].spouses || []) {
      if (!map[s] || seen.has(s)) continue;
      map[s].generation = g;
      seen.add(s);
      queue.push(s);
    }
  }

  // Anyone left (disconnected) — leave gen 0
  for (const p of Object.values(map)) {
    if (p.generation == null) p.generation = 0;
  }
}

/** Default visible: focus spine + siblings/spouses + one collateral ring */
export function defaultVisible(map, focus) {
  const vis = new Set([focus]);
  function add(id) {
    if (map[id]) vis.add(id);
  }
  function addAncestors(id) {
    const p = map[id];
    if (!p) return;
    for (const par of p.parents || []) {
      add(par);
      for (const s of map[par]?.spouses || []) add(s);
      addAncestors(par);
    }
  }
  addAncestors(focus);
  const self = map[focus];
  for (const s of self?.spouses || []) add(s);
  for (const par of self?.parents || []) {
    for (const sib of map[par]?.children || []) {
      add(sib);
      for (const sp of map[sib]?.spouses || []) add(sp);
    }
  }
  // grandparents' other children (aunts/uncles)
  for (const par of self?.parents || []) {
    for (const gp of map[par]?.parents || []) {
      for (const aunt of map[gp]?.children || []) {
        add(aunt);
        for (const sp of map[aunt]?.spouses || []) add(sp);
      }
    }
  }
  return vis;
}

export function portraitUrl(person) {
  if (person.photo) return person.photo;
  if (person.id === "anderson_grandma") {
    return `https://api.dicebear.com/9.x/shapes/svg?seed=unknown&backgroundColor=bdb5a8`;
  }
  const bg = (GEN_COLORS[person.generation] || GEN_COLORS[2]).avatarBg;
  return `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(person.id)}&backgroundColor=${bg}`;
}

export function neighborIds(person) {
  return new Set([...(person.parents || []), ...(person.children || []), ...(person.spouses || [])]);
}
