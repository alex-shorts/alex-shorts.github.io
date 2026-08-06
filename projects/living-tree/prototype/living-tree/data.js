/**
 * Share-view data — works from file:// (double-click) and http (npm run prototype:tree).
 * Collection paths are relative to this page: ../../collection/
 */
(function (global) {
  const COLLECTION = new URL("../../collection/", global.location.href).href;
  const PEOPLE_ROOT = new URL("people/", COLLECTION).href;
  const OBJECTS_ROOT = new URL("objects/", COLLECTION).href;

  const GEN_COLORS = {
    0: { fill: "#c4a35a", soft: "rgba(196,163,90,0.22)", label: "Gen 0", avatarBg: "c4a35a" },
    1: { fill: "#6b8f71", soft: "rgba(107,143,113,0.22)", label: "Gen 1", avatarBg: "6b8f71" },
    2: { fill: "#4a7c9b", soft: "rgba(74,124,155,0.22)", label: "Gen 2", avatarBg: "4a7c9b" },
    3: { fill: "#8b6b9e", soft: "rgba(139,107,158,0.22)", label: "Gen 3", avatarBg: "8b6b9e" },
    4: { fill: "#b56b5a", soft: "rgba(181,107,90,0.22)", label: "Gen 4 · focus", avatarBg: "b56b5a" },
    5: { fill: "#5a7a8b", soft: "rgba(90,122,139,0.22)", label: "Gen 5", avatarBg: "5a7a8b" },
  };

  const CONFIDENCE_RANK = {
    Confirmed: 4,
    Probable: 3,
    Possible: 2,
    Speculative: 1,
    Unknown: 0,
  };

  let focusId = "alexander";
  let people = {};

  function getFocusId() {
    return focusId;
  }
  function getPeople() {
    return people;
  }
  function setFocusId(id) {
    if (!people[id] || id === focusId) return false;
    focusId = id;
    for (const p of Object.values(people)) p.generation = 0;
    assignGenerations(people, focusId);
    return true;
  }

  function normalizeConfidence(value) {
    const raw = String(value || "Unknown").trim();
    if (Object.prototype.hasOwnProperty.call(CONFIDENCE_RANK, raw)) return raw;
    const hit = Object.keys(CONFIDENCE_RANK).find((k) => k.toLowerCase() === raw.toLowerCase());
    return hit || "Unknown";
  }

  function weakerConfidence(a, b) {
    const ra = CONFIDENCE_RANK[normalizeConfidence(a)] ?? 0;
    const rb = CONFIDENCE_RANK[normalizeConfidence(b)] ?? 0;
    const rank = Math.min(ra, rb);
    return Object.keys(CONFIDENCE_RANK).find((k) => CONFIDENCE_RANK[k] === rank) || "Unknown";
  }

  function linkMap(list) {
    return (list || [])
      .map((entry) => {
        if (typeof entry === "string") return { id: entry, confidence: null, ended: false };
        if (entry?.id) {
          const status = String(entry.status || "").toLowerCase();
          return {
            id: entry.id,
            confidence: entry.confidence ? normalizeConfidence(entry.confidence) : null,
            ended:
              entry.ended === true ||
              status === "divorced" ||
              status === "ended" ||
              status === "dissolved",
          };
        }
        return null;
      })
      .filter(Boolean);
  }

  function parentLinkConfidence(child, parentId) {
    const parent = people[parentId];
    const explicit = (child?.parentLinks || []).find((l) => l.id === parentId);
    if (explicit?.confidence) return explicit.confidence;
    let conf = weakerConfidence(child?.confidence, parent?.confidence);
    if (conf === "Confirmed" && !(child?.verified === true && parent?.verified === true)) conf = "Probable";
    return conf;
  }

  function spouseConfidence(a, b) {
    const fromA = (a?.spouseLinks || []).find((l) => l.id === b?.id);
    const fromB = (b?.spouseLinks || []).find((l) => l.id === a?.id);
    if (fromA?.confidence) return fromA.confidence;
    if (fromB?.confidence) return fromB.confidence;
    let conf = weakerConfidence(a?.confidence, b?.confidence);
    if (conf === "Confirmed" && !(a?.verified === true && b?.verified === true)) conf = "Probable";
    return conf;
  }

  function childConfidence(child, parentIds) {
    const ids = (parentIds || []).filter(Boolean);
    if (!ids.length) return "Unknown";
    return ids.map((pid) => parentLinkConfidence(child, pid)).reduce((acc, c) => weakerConfidence(acc, c));
  }

  function edgeClass(confidence) {
    return `edge-${normalizeConfidence(confidence).toLowerCase()}`;
  }

  /** Resolve index media entry: string path, or { ref | file | path }. */
  function mediaPath(entry) {
    if (entry == null) return null;
    if (typeof entry === "string") return entry.replace(/^\//, "");
    if (typeof entry === "object") {
      const raw = entry.ref || entry.file || entry.path || "";
      return String(raw).replace(/^\//, "") || null;
    }
    return null;
  }

  function hydrate(index) {
    focusId = index.focus_id || "alexander";
    people = {};
    for (const [id, raw] of Object.entries(index.people || {})) {
      const photoPath = mediaPath(raw.portrait) || mediaPath(raw.media && raw.media[0]) || null;
      people[id] = {
        id,
        name: raw.name,
        aka: raw.aka || "",
        years: raw.years || "",
        confidence: normalizeConfidence(raw.confidence || "Unknown"),
        verified: raw.verified === true,
        status: raw.status || "",
        note: raw.note || "",
        summary: raw.note || `${raw.name}${raw.years ? ` (${raw.years})` : ""}.`,
        parents: raw.parents || [],
        spouses: raw.spouses || [],
        children: raw.children || [],
        parentLinks: linkMap(raw.parent_links),
        spouseLinks: linkMap(raw.spouse_links),
        media: (raw.media || []).map((m) => mediaPath(m)).filter(Boolean),
        photo: photoPath ? PEOPLE_ROOT + photoPath : null,
        objectIds: [...(raw.object_ids || [])],
        sources: Array.isArray(raw.sources) ? raw.sources : [],
        generation: 0,
      };
    }
    assignGenerations(people, focusId);
    return { focusId, people, updated: index.updated };
  }

  async function loadPeopleIndex() {
    // Prefer live index over http; file:// uses people-data.js snapshot
    if (global.location.protocol !== "file:") {
      try {
        const res = await fetch(new URL("index.json", PEOPLE_ROOT).href);
        if (res.ok) return hydrate(await res.json());
      } catch (_) {
        /* fall through to snapshot */
      }
    }
    if (global.__PEOPLE_INDEX__) return hydrate(global.__PEOPLE_INDEX__);
    throw new Error("No people data. Open via folder with people-data.js, or npm run prototype:tree.");
  }

  function assignGenerations(map, focus) {
    const upDepth = {};
    function walkUp(id, d) {
      if (!map[id]) return;
      upDepth[id] = Math.max(upDepth[id] ?? 0, d);
      for (const p of map[id].parents || []) walkUp(p, d + 1);
    }
    walkUp(focus, 0);
    const maxUp = Math.max(0, ...Object.values(upDepth));
    for (const id of Object.keys(upDepth)) map[id].generation = maxUp - upDepth[id];

    const queue = Object.keys(upDepth);
    const seen = new Set(queue);
    while (queue.length) {
      const id = queue.shift();
      const g = map[id].generation;
      for (const c of map[id].children || []) {
        if (!map[c]) continue;
        const next = g + 1;
        map[c].generation = seen.has(c) ? Math.max(map[c].generation ?? 0, next) : next;
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
    // Parents of in-laws (and anyone else reached only via a child) sit one row above that child
    const parentQ = [...seen];
    while (parentQ.length) {
      const id = parentQ.shift();
      const g = map[id].generation;
      for (const p of map[id].parents || []) {
        if (!map[p] || seen.has(p)) continue;
        map[p].generation = g - 1;
        seen.add(p);
        parentQ.push(p);
        for (const s of map[p].spouses || []) {
          if (!map[s] || seen.has(s)) continue;
          map[s].generation = map[p].generation;
          seen.add(s);
          parentQ.push(s);
        }
      }
    }
    for (const p of Object.values(map)) {
      if (p.generation == null) p.generation = 0;
    }
  }

  /** All indexed people — draw every parent/spouse edge, verified or not. */
  function defaultVisible(map) {
    return new Set(Object.keys(map));
  }

  /**
   * Expected autosomal DNA shared with primary (%), from pedigree paths only
   * (not measured labs). Uses ancestor distances + MRCA sum for collaterals.
   */
  function expectedDnaShares(primaryId, map) {
    const out = new Map();
    if (!map[primaryId]) return out;

    function ancestorDists(start) {
      const dist = new Map([[start, 0]]);
      const q = [start];
      for (let i = 0; i < q.length; i++) {
        const id = q[i];
        const d = dist.get(id);
        for (const p of map[id]?.parents || []) {
          if (!map[p] || dist.has(p)) continue;
          dist.set(p, d + 1);
          q.push(p);
        }
      }
      return dist;
    }

    const ancPrimary = ancestorDists(primaryId);
    out.set(primaryId, 100);

    for (const id of Object.keys(map)) {
      if (id === primaryId) continue;
      const ancOther = ancestorDists(id);

      if (ancPrimary.has(id)) {
        out.set(id, 100 * 2 ** -ancPrimary.get(id));
        continue;
      }
      if (ancOther.has(primaryId)) {
        out.set(id, 100 * 2 ** -ancOther.get(primaryId));
        continue;
      }

      const setA = [...ancPrimary.entries()].filter(([, d]) => d > 0);
      const setB = new Map([...ancOther.entries()].filter(([, d]) => d > 0));
      const common = setA.map(([c]) => c).filter((c) => setB.has(c));
      const mrcas = common.filter((c) => {
        const kids = map[c]?.children || [];
        return !kids.some((k) => common.includes(k));
      });
      let frac = 0;
      const distA = new Map(setA);
      for (const c of mrcas) frac += 2 ** -(distA.get(c) + setB.get(c));
      out.set(id, frac > 0 ? frac * 100 : 0);
    }
    return out;
  }

  function formatDnaShare(pct) {
    if (pct == null || pct <= 0) return null;
    if (pct >= 99.5) return "100%";
    const nice = [50, 25, 12.5, 6.25, 3.125, 1.563, 0.781];
    for (const n of nice) {
      if (Math.abs(pct - n) < 0.08) {
        return Number.isInteger(n) ? `${n}%` : `${n}%`;
      }
    }
    if (pct >= 10) return `${Math.round(pct)}%`;
    if (pct >= 1) return `~${pct.toFixed(1)}%`;
    return `~${pct.toFixed(2)}%`;
  }

  /** Focus + ancestors + descendants (spine). Siblings/cousins are off-line. */
  function directLineIds(focusId, map) {
    const line = new Set();
    const up = [focusId];
    while (up.length) {
      const id = up.pop();
      if (!map[id] || line.has(id)) continue;
      line.add(id);
      for (const p of map[id].parents || []) up.push(p);
    }
    const down = [focusId];
    const seen = new Set([focusId]);
    while (down.length) {
      const id = down.pop();
      for (const c of map[id]?.children || []) {
        if (!map[c] || seen.has(c)) continue;
        seen.add(c);
        line.add(c);
        down.push(c);
      }
    }
    return line;
  }

  function portraitUrl(person) {
    if (person.photo) return person.photo;
    if (person.id === "anderson_grandma") {
      return `https://api.dicebear.com/9.x/shapes/svg?seed=unknown&backgroundColor=bdb5a8`;
    }
    const bg = (GEN_COLORS[person.generation] || GEN_COLORS[2]).avatarBg;
    return `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(person.id)}&backgroundColor=${bg}`;
  }

  function neighborIds(person) {
    return new Set([...(person.parents || []), ...(person.children || []), ...(person.spouses || [])]);
  }

  /** Works on file:// (fetch HEAD often does not). */
  function mediaExists(url) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = url;
    });
  }

  async function fetchText(url) {
    try {
      const res = await fetch(url);
      if (!res.ok) return null;
      return await res.text();
    } catch {
      return null;
    }
  }

  function parseFrontmatter(md) {
    const m = String(md || "").match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (!m) return {};
    const out = {};
    for (const line of m[1].split(/\r?\n/)) {
      const kv = line.match(/^(\w[\w_]*)\s*:\s*(.*)$/);
      if (!kv) continue;
      let v = kv[2].trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      out[kv[1]] = v;
    }
    return out;
  }

  async function probePhotos(base) {
    const found = [];
    const exts = ["jpg", "jpeg", "png", "webp", "gif"];
    for (let i = 1; i <= 8; i++) {
      const stem = String(i).padStart(2, "0");
      let hit = null;
      for (const ext of exts) {
        const url = `${base}photos/${stem}.${ext}`;
        if (await mediaExists(url)) {
          hit = url;
          break;
        }
      }
      if (!hit) {
        if (i === 1) continue;
        break;
      }
      found.push(hit);
    }
    return found;
  }

  async function loadObjectArtifact(objectId) {
    const base = `${OBJECTS_ROOT}${objectId}/`;
    const entryUrl = `${base}entry.md`;
    const body = await fetchText(entryUrl);
    const meta = body ? parseFrontmatter(body) : {};
    const photos = await probePhotos(base);
    const audioUrl = `${base}narration.webm`;
    // ponytail: assume audio path; element hides on error
    const videos = [`${base}videos/01.mp4`, `${base}videos/01.webm`].filter(Boolean);

    if (!body && !photos.length) {
      // Still show a stub so object_ids are visible
      return {
        id: objectId,
        title: objectId,
        type: "document",
        sourceUrl: "",
        bodyPath: entryUrl,
        bodyText: "",
        photos: [],
        audio: null,
        videos: [],
      };
    }

    return {
      id: objectId,
      title: meta.title || objectId,
      type: (meta.type || "document").toLowerCase(),
      sourceUrl: meta.source_url || "",
      bodyPath: entryUrl,
      bodyText: body || "",
      photos,
      audio: audioUrl,
      videos,
    };
  }

  function personMediaArtifacts(person) {
    return (person.media || [])
      .map((entry, i) => {
        const rel = mediaPath(entry);
        if (!rel) return null;
        const src = PEOPLE_ROOT + rel;
        const name = rel.split("/").pop() || `photo-${i + 1}`;
        return { id: `media:${person.id}:${i}`, title: name, type: "photo", src };
      })
      .filter(Boolean);
  }

  global.ShareData = {
    GEN_COLORS,
    PEOPLE_ROOT,
    OBJECTS_ROOT,
    getFocusId,
    setFocusId,
    getPeople,
    loadPeopleIndex,
    defaultVisible,
    directLineIds,
    expectedDnaShares,
    formatDnaShare,
    portraitUrl,
    neighborIds,
    spouseConfidence,
    childConfidence,
    edgeClass,
    loadObjectArtifact,
    personMediaArtifacts,
  };
})(window);
