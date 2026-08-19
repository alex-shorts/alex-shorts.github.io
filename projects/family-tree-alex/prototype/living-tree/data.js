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
  /** Accession id → { dir, photos[], entry } from collection/objects/index.json */
  let objectsIndex = null;
  let objectsIndexPromise = null;

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

  function asAkaList(raw) {
    if (Array.isArray(raw)) return raw.map((s) => String(s).trim()).filter(Boolean);
    if (!raw) return [];
    return String(raw)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  function maidenFrom(aka) {
    return asAkaList(aka).find((s) => /^(née|nee)\b/i.test(s)) || "";
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
        if (typeof entry === "string") return { id: entry, confidence: null, ended: false, kind: "biological" };
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
            kind: normalizeParentKind(entry.kind),
          };
        }
        return null;
      })
      .filter(Boolean);
  }

  function normalizeParentKind(kind) {
    const k = String(kind || "biological").toLowerCase().trim();
    if (k === "adopted") return "adoptive";
    if (k === "stepfather" || k === "stepmother" || k === "step-parent" || k === "stepparent") {
      return "step";
    }
    if (k === "adoptive" || k === "step" || k === "biological") return k;
    return "biological";
  }

  function parentLinkKind(child, parentId) {
    const explicit = (child?.parentLinks || []).find((l) => l.id === parentId);
    return normalizeParentKind(explicit?.kind);
  }

  function isBloodParent(child, parentId) {
    return parentLinkKind(child, parentId) === "biological";
  }

  function bloodParentsOf(person) {
    return (person?.parents || []).filter((pid) => isBloodParent(person, pid));
  }

  function hasNonBloodParent(person) {
    return (person?.parents || []).some((pid) => !isBloodParent(person, pid));
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

  /** Face only — never a PDF or vital scan as the card portrait. */
  function isFaceMedia(entry) {
    if (entry == null) return false;
    const kind = String(typeof entry === "object" ? entry.kind || "" : "").toLowerCase();
    const file = String(mediaPath(entry) || "").toLowerCase();
    if (!file || /\.pdf(\?|$)/.test(file)) return false;
    return kind === "portrait" || /(^|\/)portrait/.test(file);
  }

  function pickFacePhoto(slug, raw) {
    if (raw?.portrait) return peopleMediaUrl(slug, raw.portrait);
    for (const m of raw?.media || []) {
      if (isFaceMedia(m)) return peopleMediaUrl(slug, m);
    }
    return null;
  }

  /** Higher = better card face. 0 = skip (PDF / not an image). */
  function cardPhotoScore(entry) {
    const file = String(mediaPath(entry) || "").toLowerCase();
    if (!file || /\.pdf(\?|$)/.test(file)) return 0;
    if (!/\.(jpe?g|png|webp|gif)(\?|$)/i.test(file) && !file.includes("/media/")) return 0;
    const kind = String(typeof entry === "object" ? entry.kind || "" : "").toLowerCase();
    if (kind === "portrait" || /(^|\/)portrait/.test(file)) return 100;
    const gallery = inferGalleryKey(file.split("/").pop(), kind);
    if (kind === "headstone" || gallery === "headstones") return 80;
    if (gallery === "career-photos" || gallery === "baseball-cards") return 60;
    if (gallery === "photos") return 50;
    if (gallery === "clippings") return 40;
    if (gallery === "census") return 20;
    return 30;
  }

  function pickObjectPhoto(objectIds) {
    const idx = objectsIndex || global.OBJECTS_INDEX || {};
    let best = null;
    let bestScore = 0;
    for (const oid of objectIds || []) {
      const row = idx[oid];
      if (!row?.dir || !row.photos?.length) continue;
      for (const rel of row.photos) {
        const n = String(rel).toLowerCase();
        if (!/\.(jpe?g|png|webp|gif)(\?|$)/i.test(n)) continue;
        let score = 30;
        if (/portrait/.test(n)) score = 100;
        else if (/headstone|grave|memorial|fag/.test(n)) score = 80;
        if (score > bestScore) {
          bestScore = score;
          best = `${OBJECTS_ROOT}${row.dir}/${rel}`;
        }
      }
    }
    return best;
  }

  /** Portrait, else headstone / other defining image, else a linked object photo. */
  function pickCardPhoto(slug, raw) {
    const face = pickFacePhoto(slug, raw);
    if (face) return face;
    let bestUrl = null;
    let bestScore = 0;
    for (const m of raw?.media || []) {
      const score = cardPhotoScore(m);
      const url = peopleMediaUrl(slug, m);
      if (score > bestScore && url) {
        bestScore = score;
        bestUrl = url;
      }
    }
    return bestUrl || pickObjectPhoto(raw?.object_ids);
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

  /**
   * Path under collection/people/ for a media entry.
   * - `ref` / cross-folder paths: already `other-slug/media/...`
   * - `file: media/...`: local to this person's slug folder
   */
  function peopleMediaRel(slug, entry) {
    const rel = mediaPath(entry);
    if (!rel) return null;
    if (/^https?:\/\//i.test(rel)) return rel;
    if (typeof entry === "object" && entry.ref) return rel;
    if (!rel.startsWith("media/") && rel.includes("/")) return rel;
    if (!slug) return null;
    return `${slug}/${rel}`;
  }

  function peopleMediaUrl(slug, entry) {
    const rel = peopleMediaRel(slug, entry);
    if (!rel) return null;
    if (/^https?:\/\//i.test(rel)) return rel;
    return PEOPLE_ROOT + rel;
  }

  const GALLERY_LABELS = {
    headstones: "Headstones",
    "baseball-cards": "Baseball cards",
    "career-photos": "Career photos",
    census: "Census",
    clippings: "Clippings",
    portraits: "Portraits",
    photos: "Photos",
  };

  const OBJECT_TYPE_LABELS = {
    newspaper: "Newspaper",
    census: "Census",
    obituary: "Obituary",
    vital: "Vital record",
    deed: "Deed",
    military: "Military",
    church: "Church",
    place: "Place",
    book: "Book",
    genealogy: "Genealogy",
    photo: "Photo",
    artifact: "Artifact",
    adoption: "Adoption",
    recipe: "Recipe",
    headstone: "Headstones",
    document: "Document",
  };

  function isAccessionId(s) {
    return /^FT-\d+$/i.test(String(s || "").trim());
  }

  function humanizeObjectDir(dir) {
    const slug = String(dir || "")
      .replace(/^FT-\d+-?/i, "")
      .replace(/-/g, " ")
      .trim();
    if (!slug) return "";
    return slug.replace(/\b\w/g, (c) => c.toUpperCase());
  }

  function inferTypeFromDir(dir) {
    const d = String(dir || "").toLowerCase();
    if (/obituar|funeral/.test(d)) return "obituary";
    if (/census/.test(d)) return "census";
    if (/newspaper|press-|star-|clipping|sentinel|chronicle/.test(d)) return "newspaper";
    if (/headstone|grave|memorial|fag/.test(d)) return "headstone";
    if (/vital|birth|marriage|death/.test(d)) return "vital";
    if (/deed|probate|land/.test(d)) return "deed";
    if (/military|war-|veteran|roster/.test(d)) return "military";
    if (/church|baptism|pew/.test(d)) return "church";
    return "";
  }

  /** Type word only: Newspaper, Obituary, … */
  function objectGalleryLabel(o) {
    const type = String(o?.type || inferTypeFromDir(o?.dirName) || "").toLowerCase();
    if (type && OBJECT_TYPE_LABELS[type] && type !== "document") return OBJECT_TYPE_LABELS[type];
    const title = String(o?.title || "").trim();
    if (title && !isAccessionId(title)) {
      const short = title.split(/[—–|]/)[0].trim();
      return short.length > 42 ? `${short.slice(0, 40)}…` : short;
    }
    return humanizeObjectDir(o?.dirName) || OBJECT_TYPE_LABELS[type] || "Document";
  }

  /** Finder label for the museum: FT-0097 · Obituary */
  function objectAccessionLabel(o) {
    const kind = objectGalleryLabel(o);
    const id = String(o?.id || "").toUpperCase();
    return /^FT-\d+$/.test(id) ? `${id} · ${kind}` : kind;
  }

  /** Sidebar list: human title primary (not FT-####). */
  function objectListTitle(o) {
    const title = String(o?.title || "").trim();
    if (title && !isAccessionId(title)) {
      return title.length > 80 ? `${title.slice(0, 78)}…` : title;
    }
    return humanizeObjectDir(o?.dirName || o?.dir) || "Artifact";
  }

  /** Sidebar list: accession + type as secondary line. */
  function objectListMeta(o) {
    const id = String(o?.id || "").toUpperCase();
    const type = String(o?.type || inferTypeFromDir(o?.dirName || o?.dir) || "").toLowerCase();
    const kind = (type && OBJECT_TYPE_LABELS[type]) || type || "Document";
    return /^FT-\d+$/.test(id) ? `${id} · ${kind}` : kind;
  }

  function yamlIds(v) {
    if (Array.isArray(v)) return v.map((s) => String(s).trim()).filter(Boolean);
    const s = String(v || "").trim();
    const m = s.match(/^\[(.*)\]$/);
    if (m) {
      return m[1]
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean);
    }
    return s ? [s] : [];
  }

  function foldName(s) {
    return String(s || "")
      .toLowerCase()
      .replace(/[“”"']/g, "")
      .replace(/\bn[ée]e\b/g, "")
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function nameInTitle(person, title) {
    if (!person) return false;
    const t = foldName(title);
    const names = [person.name, ...(person.aka || [])];
    return names.some((n) => {
      const parts = foldName(n)
        .split(" ")
        .filter((w) => w.length > 1);
      if (!parts.length) return false;
      if (parts.length === 1) return t.includes(parts[0]);
      return t.includes(parts[0]) && t.includes(parts[parts.length - 1]);
    });
  }

  function obituarySubjectIds(obj, people) {
    if (String(obj?.type || "").toLowerCase() !== "obituary") return [];
    const declared = yamlIds(obj.subjectIds || obj.subject_id || obj.subjectId || "");
    if (declared.length) return declared;
    const ids = yamlIds(obj.personIds || obj.person_ids || "");
    const title = String(obj.title || "");
    const hits = ids.filter((id) => nameInTitle(people[id], title));
    if (hits.length) return hits;
    return ids[0] ? [ids[0]] : [];
  }

  function parentRole(subject, people) {
    const sex = people[subject]?.sex;
    if (sex === "f") return "mother";
    if (sex === "m") return "father";
    return "parent";
  }

  function childRole(subject, people) {
    const sex = people[subject]?.sex;
    if (sex === "f") return "daughter";
    if (sex === "m") return "son";
    return "child";
  }

  function givenName(person) {
    return String(person?.name || "").split(/\s+/)[0] || "Family";
  }

  function subjectObituaryName(obj, subjectId, people) {
    if (people[subjectId]?.name) return people[subjectId].name;
    const title = String(obj.title || "");
    const parts = title.split(/[—–]/);
    if (parts.length > 1) {
      return parts
        .slice(1)
        .join("—")
        .replace(/\s*\([^)]*\)\s*$/, "")
        .trim();
    }
    return "Family";
  }

  /** When an obit hangs on a relative: "George E. Rudd's Obituary — Marcy's father" */
  function obituaryConnectionLabel(obj, viewer, people) {
    const subjects = obituarySubjectIds(obj, people);
    const subjectId = subjects.find((id) => (viewer.parents || []).includes(id)) || subjects[0] || "";
    const who = subjectObituaryName(obj, subjectId, people);
    const first = givenName(viewer);
    if (subjectId && (viewer.parents || []).includes(subjectId)) {
      return `${who}'s Obituary — ${first}'s ${parentRole(subjectId, people)}`;
    }
    if (subjectId && (viewer.children || []).includes(subjectId)) {
      return `${who}'s Obituary — ${first}'s ${childRole(subjectId, people)}`;
    }
    if (subjectId && (viewer.spouses || []).includes(subjectId)) {
      return `${who}'s Obituary — ${first}'s spouse`;
    }
    for (const sid of viewer.spouses || []) {
      const spouse = people[sid];
      if (!spouse || !subjectId) continue;
      if ((spouse.parents || []).includes(subjectId)) {
        return `${who}'s Obituary — ${givenName(spouse)}'s ${parentRole(subjectId, people)}`;
      }
    }
    return `${who}'s Obituary`;
  }

  /**
   * Obituaries belong to the deceased when they have a node on this tree.
   * Named survivors do not get the clipping. If the deceased is not on this
   * tree, hang it on mentioned kin with a connection label.
   */
  function hangObituaryOnPerson(obj, personId, people) {
    if (String(obj?.type || "").toLowerCase() !== "obituary") return true;
    const subjects = obituarySubjectIds(obj, people);
    if (!subjects.length) return true;
    const onTree = subjects.filter((id) => people[id]);
    if (onTree.length) return onTree.includes(personId);
    return true;
  }

  function objectPanelLabel(obj, person, people) {
    if (String(obj?.type || "").toLowerCase() !== "obituary") {
      return objectAccessionLabel(obj);
    }
    const subjects = obituarySubjectIds(obj, people);
    if (subjects.includes(person.id)) return objectAccessionLabel(obj);
    return obituaryConnectionLabel(obj, person, people);
  }

  {
    const full = {
      george_rudd: {
        id: "george_rudd",
        name: "George E. Rudd",
        sex: "m",
        parents: [],
        spouses: [],
        children: ["marcy_parsons"],
      },
      marcy_parsons: {
        id: "marcy_parsons",
        name: "Marcy Parsons",
        parents: ["george_rudd"],
        spouses: ["bill_parsons"],
        children: [],
      },
      bill_parsons: {
        id: "bill_parsons",
        name: "Bill Parsons",
        parents: [],
        spouses: ["marcy_parsons"],
        children: [],
      },
    };
    const obit = {
      type: "obituary",
      id: "FT-0008",
      title: "Press-Enterprise — George E. Rudd",
      personIds: ["george_rudd", "marcy_parsons", "bill_parsons"],
    };
    console.assert(hangObituaryOnPerson(obit, "george_rudd", full), "obit hangs on deceased");
    console.assert(!hangObituaryOnPerson(obit, "bill_parsons", full), "obit must not hang on survivor");
    const pruned = { marcy_parsons: full.marcy_parsons, bill_parsons: full.bill_parsons };
    console.assert(
      hangObituaryOnPerson(obit, "marcy_parsons", pruned),
      "obit hangs on kin when deceased has no node"
    );
    console.assert(
      /father|mother|parent/i.test(objectPanelLabel(obit, pruned.marcy_parsons, pruned)),
      "off-tree obit names the connection"
    );
  }

  /** Infer gallery category from kind + filename (index often stores paths only). */
  function inferGalleryKey(name, kind) {
    const k = String(kind || "").toLowerCase();
    const n = String(name || "").toLowerCase();
    if (k === "headstone" || /headstone|grave|tomb|memorial|olivewood|cemetery|fag-201|stone-detail|dual-stone/.test(n)) {
      return "headstones";
    }
    if (k === "portrait" || /^portrait/.test(n)) return "portraits";
    if (/topps|kellogg|opc|card|picture-pack|jewel/.test(n)) return "baseball-cards";
    if (/career-photo|sabr|brewerfanatic|autograph-disc|throwback/.test(n)) return "career-photos";
    if (k === "census-image" || /census/.test(n)) return "census";
    if (k === "document" || /newspaper|clip|wedding|nursing|obit|notice/.test(n)) return "clippings";
    return "photos";
  }

  function galleryLabel(key) {
    return GALLERY_LABELS[key] || key.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }

  /** Group media items into ordered galleries (one artifact row each). */
  function groupIntoGalleries(items) {
    const order = ["portraits", "baseball-cards", "career-photos", "headstones", "census", "clippings", "photos"];
    const buckets = new Map();
    for (const item of items || []) {
      const key = item.gallery || "photos";
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key).push(item);
    }
    const keys = [...buckets.keys()].sort((a, b) => {
      const ia = order.indexOf(a);
      const ib = order.indexOf(b);
      return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || a.localeCompare(b);
    });
    return keys.map((key) => ({
      id: key,
      category: key,
      label: galleryLabel(key),
      items: buckets.get(key),
    }));
  }

  function resolveFocusId(index) {
    let fromQuery = "";
    try {
      const params = new URLSearchParams(global.location.search || "");
      fromQuery = params.get("primary") || params.get("focus") || "";
    } catch (_) {
      /* ignore */
    }
    const fromWindow =
      typeof global.__TREE_PRIMARY__ === "string" ? global.__TREE_PRIMARY__.trim() : "";
    const candidate = fromQuery || fromWindow || index.focus_id || "alexander";
    if (index.people && index.people[candidate]) return candidate;
    return index.focus_id || "alexander";
  }

  function hydrate(index) {
    focusId = resolveFocusId(index);
    people = {};
    for (const [id, raw] of Object.entries(index.people || {})) {
      const slug = raw.slug || null;
      const photoUrl = pickCardPhoto(slug, raw);
      people[id] = {
        id,
        slug,
        name: raw.name || id,
        aka: asAkaList(raw.aka),
        maiden: maidenFrom(raw.aka),
        years: raw.years || "",
        birth: raw.birth ? String(raw.birth) : "",
        death: raw.death ? String(raw.death) : "",
        birthPlace: raw.birth_place ? String(raw.birth_place) : "",
        deathPlace: raw.death_place ? String(raw.death_place) : "",
        burial: raw.burial ? String(raw.burial) : "",
        confidence: normalizeConfidence(raw.confidence || "Unknown"),
        verified: raw.verified === true,
        status: raw.status || "",
        note: raw.note || "",
        summary: "",
        blocker: raw.blocker ? String(raw.blocker).trim() : "",
        parents: [...(raw.parents || [])],
        spouses: [...(raw.spouses || [])],
        children: [...(raw.children || [])],
        parentLinks: linkMap(raw.parent_links),
        spouseLinks: linkMap(raw.spouse_links),
        // Keep objects when present; index often has path strings only.
        media: (raw.media || [])
          .map((m) => {
            if (m == null) return null;
            if (typeof m === "string") return { file: m.replace(/^\//, "") };
            const rel = mediaPath(m);
            return rel ? { ...m, file: rel } : null;
          })
          .filter(Boolean),
        photo: photoUrl,
        objectIds: [...(raw.object_ids || [])],
        sources: Array.isArray(raw.sources) ? raw.sources : [],
        generation: 0,
        sex: raw.sex === "m" || raw.sex === "f" ? raw.sex : "",
      };
    }
    closeKinship(people);
    assignSex(people);
    {
      let open = 0;
      for (const p of Object.values(people)) {
        for (const pid of p.parents) {
          if (people[pid] && !people[pid].children.includes(p.id)) open += 1;
        }
      }
      console.assert(open === 0, `${open} parent→child edges still one-way`);
    }
    assignGenerations(people, focusId);
    return { focusId, people, updated: index.updated };
  }

  /** Parent/spouse lists are one-way in person.md; layout and DNA need both directions. */
  function closeKinship(map) {
    for (const p of Object.values(map)) {
      if (!p.children) p.children = [];
      if (!p.spouses) p.spouses = [];
      if (!p.parents) p.parents = [];
    }
    for (const p of Object.values(map)) {
      for (const pid of p.parents) {
        const par = map[pid];
        if (!par) continue;
        if (!par.children.includes(p.id)) par.children.push(p.id);
      }
      for (const sid of p.spouses) {
        const s = map[sid];
        if (!s) continue;
        if (!s.spouses.includes(p.id)) s.spouses.push(p.id);
      }
    }
  }

  async function loadPeopleIndex() {
    // Prefer live index over http; file:// uses people-data.js snapshot
    if (global.location.protocol !== "file:") {
      try {
        const res = await fetch(new URL(`index.json?t=${Date.now()}`, PEOPLE_ROOT).href, {
          cache: "no-store",
        });
        if (res.ok) return hydrate(await res.json());
      } catch (_) {
        /* fall through to snapshot */
      }
    }
    const snap = global.__PEOPLE_INDEX__ || global.PEOPLE_DATA;
    if (snap) return hydrate(snap);
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

  /**
   * Share graph: each root’s blood ancestors + descendants, both blood parents
   * of everyone visible, and each root’s spouse. No adoptive/step branches,
   * no prior spouses without a blood child on this tree.
   * `opts.roots` unions several primaries (Alexander + Morganne).
   */
  function defaultVisible(map, primaryId, opts = {}) {
    const includeSiblings = opts.includeSiblings === true;
    const roots = (opts.roots?.length ? opts.roots : [primaryId || focusId]).filter((id) => map[id]);
    const vis = new Set();
    if (!roots.length) return vis;

    for (const root of roots) {
      const up = [root];
      while (up.length) {
        const id = up.pop();
        if (!map[id] || vis.has(id)) continue;
        vis.add(id);
        for (const p of bloodParentsOf(map[id])) {
          if (map[p]) up.push(p);
        }
      }
      const down = [root];
      const seenDown = new Set([root]);
      while (down.length) {
        const id = down.pop();
        for (const c of map[id]?.children || []) {
          if (!map[c] || seenDown.has(c)) continue;
          if (!isBloodParent(map[c], id)) continue;
          seenDown.add(c);
          vis.add(c);
          down.push(c);
        }
      }
    }

    if (includeSiblings) {
      const blood = new Set(vis);
      for (const id of [...blood]) {
        for (const pid of bloodParentsOf(map[id])) {
          for (const sib of map[pid]?.children || []) {
            if (map[sib] && isBloodParent(map[sib], pid)) vis.add(sib);
          }
        }
      }
    }

    for (const id of [...vis]) {
      for (const pid of bloodParentsOf(map[id])) {
        if (map[pid]) vis.add(pid);
      }
    }
    for (const root of roots) {
      for (const s of map[root]?.spouses || []) {
        if (map[s]) vis.add(s);
      }
    }
    return vis;
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
        for (const p of bloodParentsOf(map[id])) {
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

  /** Adoptive/step parent of primary or of someone on primary’s blood spine. */
  function isNonBloodKin(id, primaryId, map) {
    if (!map[id] || !map[primaryId]) return false;
    const blood = new Set();
    const up = [primaryId];
    while (up.length) {
      const cur = up.pop();
      if (!map[cur] || blood.has(cur)) continue;
      blood.add(cur);
      for (const p of bloodParentsOf(map[cur])) up.push(p);
    }
    const down = [primaryId];
    const seen = new Set([primaryId]);
    while (down.length) {
      const cur = down.pop();
      for (const c of map[cur]?.children || []) {
        if (!map[c] || seen.has(c)) continue;
        seen.add(c);
        blood.add(c);
        down.push(c);
      }
    }
    for (const bid of blood) {
      if ((map[bid]?.parents || []).includes(id) && !isBloodParent(map[bid], id)) return true;
    }
    return false;
  }

  /** Focus + ancestors + descendants (spine). Siblings/cousins are off-line. */
  function directLineIds(focusId, map, extraRoots) {
    const line = new Set();
    const roots = [focusId, ...(extraRoots || [])].filter((id, i, arr) => map[id] && arr.indexOf(id) === i);
    for (const root of roots) {
      const up = [root];
      while (up.length) {
        const id = up.pop();
        if (!map[id] || line.has(id)) continue;
        line.add(id);
        for (const p of bloodParentsOf(map[id])) up.push(p);
      }
      const down = [root];
      const seen = new Set([root]);
      while (down.length) {
        const id = down.pop();
        for (const c of map[id]?.children || []) {
          if (!map[c] || seen.has(c)) continue;
          if (!isBloodParent(map[c], id)) continue;
          seen.add(c);
          line.add(c);
          down.push(c);
        }
      }
    }
    return line;
  }

  const FEMALE_FIRST = new Set(
    "ann anna anne annabelle barbara belle betty caroline carolina catharine catherine charlotte clara della effie elizabeth emma esther eunice eva florence gertrude glendora gloria hannah harriet heidi helen hulda ida ina jane joanna kathleen kate lena louise lucretia mamie marcy margaret marie marion martha mary may mayme mehitable minnie morganne phoebe phebe rachel rebecca rose rosannah sarah sophia sophie virginia wilma".split(" ")
  );
  const MALE_FIRST = new Set(
    "abraham alexander andrew arthur augustus bill boaz carl caspar charles clause daniel david don dorland duncan earl edmund frederick george gerald gottfried heinrich henry herman isaac irvin james job joel johann john jonathan leo monroe nathan otho philip richard robert samuel william".split(" ")
  );

  function assignSex(map) {
    for (const p of Object.values(map)) {
      if (p.sex === "m" || p.sex === "f") continue;
      const name = String(p.name || "");
      if (/\b(Jr\.?|III|II|Sr\.?)\b/.test(name)) {
        p.sex = "m";
        continue;
      }
      const first = name.split(/[\s-]+/)[0].toLowerCase();
      if (FEMALE_FIRST.has(first)) {
        p.sex = "f";
        continue;
      }
      if (MALE_FIRST.has(first)) {
        p.sex = "m";
        continue;
      }
      for (const cid of p.children || []) {
        const pars = map[cid]?.parents || [];
        if (pars[0] === p.id && pars[1] && pars[1] !== p.id) {
          p.sex = "m";
          break;
        }
        if (pars[1] === p.id && pars[0] && pars[0] !== p.id) {
          p.sex = "f";
          break;
        }
      }
    }
    for (const p of Object.values(map)) {
      if (p.sex) continue;
      for (const sid of p.spouses || []) {
        const s = map[sid]?.sex;
        if (s === "m") p.sex = "f";
        else if (s === "f") p.sex = "m";
        if (p.sex) break;
      }
    }
  }

  const STALL_TYPES = [
    { id: "adoption", label: "Adoption", short: "adopt", color: "#7a5a2e", re: /adopt/i },
    { id: "immigration", label: "Immigration", short: "immig.", color: "#3d6b8a", re: /immigra|emigra|passenger|naturaliz|ellis|voyage|sweden|england parent/i },
    { id: "maiden", label: "Maiden name", short: "maiden", color: "#8b5a7a", re: /maiden/i },
    { id: "death", label: "Death / burial", short: "death", color: "#5c5346", re: /\b(death|burial|died|grave)\b/i },
    { id: "marriage", label: "Marriage", short: "married", color: "#6b8f71", re: /marriage|wife name|spouse name/i },
    { id: "parents", label: "Parents unknown", short: "parents", color: "#a65d2e", re: /parent/i },
    { id: "records", label: "Records blocked", short: "records", color: "#b56b5a", re: /./ },
  ];

  function stallInfo(blocker) {
    const text = String(blocker || "").trim();
    if (!text) return null;
    return STALL_TYPES.find((t) => t.re.test(text)) || STALL_TYPES[STALL_TYPES.length - 1];
  }
  console.assert(stallInfo("adoptive parents unknown")?.id === "adoption", "stall adoption");
  console.assert(stallInfo("Sweden emigration unlock")?.id === "immigration", "stall immigration");
  console.assert(stallInfo("Parents blocked — need cert")?.id === "parents", "stall parents");
  console.assert(cardPhotoScore({ kind: "portrait", file: "media/portrait.jpg" }) > cardPhotoScore({ kind: "headstone", file: "media/headstone.jpg" }), "portrait beats headstone");
  console.assert(cardPhotoScore({ kind: "headstone", file: "media/headstone.jpg" }) > cardPhotoScore({ file: "media/clip.jpg" }), "headstone beats clip");
  console.assert(cardPhotoScore({ file: "media/scan.pdf" }) === 0, "skip pdf");

  function silhouetteUrl(sex, bg) {
    const body =
      sex === "f"
        ? `<path d="M32 38c0-14 8-24 18-24s18 10 18 24c2 8 8 12 10 20h-8c-2-10-6-16-20-16s-18 6-20 16h-8c2-8 8-12 10-20z" fill="#6a5348"/><circle cx="50" cy="36" r="11" fill="#8a7a70"/><path d="M24 108 L50 54 L76 108 Z" fill="#6a5348"/>`
        : sex === "m"
          ? `<circle cx="50" cy="32" r="12" fill="#6e6a64"/><rect x="46" y="43" width="8" height="8" fill="#6e6a64"/><path d="M28 108 V62 c0-6 8-10 22-10s22 4 22 10 v46z" fill="#4f5558"/>`
          : `<circle cx="50" cy="38" r="13" fill="#6a6560"/><ellipse cx="50" cy="100" rx="24" ry="16" fill="#6a6560"/>`;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 112"><rect width="100" height="112" fill="#${bg}"/>${body}</svg>`;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }

  function portraitUrl(person) {
    if (person.photo) return person.photo;
    const bg = (GEN_COLORS[person.generation] || GEN_COLORS[2]).avatarBg;
    return silhouetteUrl(person.sex, bg);
  }

  function neighborIds(person) {
    return new Set([...(person.parents || []), ...(person.children || []), ...(person.spouses || [])]);
  }

  /** Works on http (HEAD) and file:// images (Image onload). */
  function mediaExists(url) {
    if (/\.(webm|mp4|mp3|ogg|wav|m4a)(\?|$)/i.test(url)) {
      return fetch(url, { method: "HEAD" })
        .then((r) => r.ok)
        .catch(() => false);
    }
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

  async function ensureObjectsIndex() {
    if (objectsIndex) return objectsIndex;
    if (global.OBJECTS_INDEX && typeof global.OBJECTS_INDEX === "object") {
      objectsIndex = global.OBJECTS_INDEX;
      return objectsIndex;
    }
    if (!objectsIndexPromise) {
      objectsIndexPromise = (async () => {
        try {
          const url = new URL(`index.json?t=${Date.now()}`, OBJECTS_ROOT).href;
          const res = await fetch(url, { cache: "no-store" });
          if (res.ok) {
            const data = await res.json();
            objectsIndex = data.objects || data || {};
            return objectsIndex;
          }
        } catch (_) {
          /* fall through */
        }
        objectsIndex = global.OBJECTS_INDEX || {};
        return objectsIndex;
      })();
    }
    return objectsIndexPromise;
  }

  async function resolveObjectBase(objectId) {
    const idx = await ensureObjectsIndex();
    const row = idx[objectId];
    if (row?.dir) return `${OBJECTS_ROOT}${row.dir}/`;
    // Legacy bare folder (pre-slug) or mint in progress
    return `${OBJECTS_ROOT}${objectId}/`;
  }

  async function loadObjectArtifact(objectId) {
    const idx = await ensureObjectsIndex();
    const row = idx[objectId];
    const base = await resolveObjectBase(objectId);
    const entryUrl = `${base}entry.md`;
    const body = await fetchText(entryUrl);
    if (!body && !(row?.photos?.length)) return null;

    const meta = body ? parseFrontmatter(body) : {};
    const photos = (row?.photos || []).map((rel) => `${base}${rel}`);
    const dirName = row?.dir || objectId;
    const type = String(
      meta.type ||
        row?.type ||
        inferTypeFromDir(dirName) ||
        inferTypeFromDir((row?.photos || []).join(" ")) ||
        "document"
    ).toLowerCase();

    const audioCandidate = `${base}narration.webm`;
    const audio = (await mediaExists(audioCandidate)) ? audioCandidate : null;
    const videos = [];
    for (const v of [`${base}videos/01.mp4`, `${base}videos/01.webm`]) {
      if (await mediaExists(v)) videos.push(v);
    }

    if (!body && !photos.length && !audio && !videos.length) return null;

    const rawTitle = String(meta.title || row?.title || "").trim();
    const title = rawTitle && !isAccessionId(rawTitle) ? rawTitle : humanizeObjectDir(dirName) || objectId;
    const personIds = yamlIds(meta.person_ids || row?.person_ids);
    const subjectId = String(meta.subject_id || meta.owner || row?.subject_id || "").trim();

    return {
      id: objectId,
      dirName,
      title,
      type,
      personIds,
      subjectId,
      subject_id: subjectId,
      sourceUrl: meta.source_url || "",
      bodyPath: entryUrl,
      bodyText: body || "",
      photos,
      audio,
      videos,
    };
  }

  async function loadTranscriptForSrc(src, entry) {
    if (typeof entry === "object") {
      const inline = entry.transcript || entry.transcription || entry.text;
      if (inline && String(inline).trim()) return String(inline).trim();
    }
    // Sidecar next to image: foo.jpg → foo.txt (works with path-only index.json)
    const base = String(src || "").replace(/\?.*$/, "");
    const candidates = [
      base.replace(/\.[^.\/]+$/, ".txt"),
      `${base}.txt`,
    ];
    for (const url of candidates) {
      if (url === base) continue;
      const text = await fetchText(url);
      if (text && text.trim()) return text.trim();
    }
    return null;
  }

  async function personMediaArtifacts(person) {
    const hero = portraitUrl(person);
    const items = (person.media || [])
      .map((entry, i) => {
        const src = peopleMediaUrl(person.slug, entry);
        if (!src) return null;
        // Hero portrait already shown in panel — skip duplicate in galleries.
        if (hero && src === hero) return null;
        const rel = peopleMediaRel(person.slug, entry) || "";
        const name = rel.split("/").pop() || `photo-${i + 1}`;
        const kind =
          typeof entry === "object" && entry.kind
            ? String(entry.kind)
            : name.startsWith("portrait")
              ? "portrait"
              : "photo";
        const gallery =
          typeof entry === "object" && entry.gallery
            ? String(entry.gallery)
            : inferGalleryKey(name, kind);
        return {
          id: `media:${person.id}:${i}`,
          title: (typeof entry === "object" && entry.title) || name,
          type: "photo",
          kind,
          gallery,
          src,
          entry,
          caption:
            (typeof entry === "object" && (entry.note || entry.source)) || name,
        };
      })
      .filter(Boolean);

    await Promise.all(
      items.map(async (item) => {
        item.transcript = await loadTranscriptForSrc(item.src, item.entry);
        delete item.entry;
      })
    );
    return items;
  }

  function flattenObjectsIndex(idx) {
    return Object.entries(idx || {}).map(([id, row]) => ({
      id,
      dir: row.dir || id,
      dirName: row.dir || id,
      title: String(row.title || "").trim() || humanizeObjectDir(row.dir || id),
      type: String(row.type || inferTypeFromDir(row.dir || id) || "document").toLowerCase(),
      person_ids: yamlIds(row.person_ids || row.personIds || []),
      photos: row.photos || [],
    }));
  }

  function searchObjects(query, idx, map) {
    const rows = flattenObjectsIndex(idx);
    const q = String(query || "")
      .trim()
      .toLowerCase();
    if (!q) return rows;
    return rows.filter((row) => {
      const peopleNames = (row.person_ids || []).map((pid) => map[pid]?.name || pid).join(" ");
      const hay = [row.id, row.title, row.type, row.dir, peopleNames].join(" ").toLowerCase();
      return hay.includes(q);
    });
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
    parentLinkKind,
    isBloodParent,
    hasNonBloodParent,
    isNonBloodKin,
    portraitUrl,
    silhouetteUrl,
    stallInfo,
    STALL_TYPES,
    neighborIds,
    spouseConfidence,
    childConfidence,
    edgeClass,
    loadObjectArtifact,
    ensureObjectsIndex,
    flattenObjectsIndex,
    searchObjects,
    objectGalleryLabel,
    objectAccessionLabel,
    objectListTitle,
    objectListMeta,
    hangObituaryOnPerson,
    objectPanelLabel,
    maidenFrom,
    personMediaArtifacts,
    inferGalleryKey,
    galleryLabel,
    groupIntoGalleries,
  };
})(window);
