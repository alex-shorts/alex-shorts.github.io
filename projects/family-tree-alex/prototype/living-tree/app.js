/**
 * Share view — physics living tree + museum panel from collection/.
 * Cards: cards.js + cards.css (TreeCards). Layout: layout.js (TreeLayout).
 * This file is graph, camera, panel. Camera: SVG transform on edges; CSS zoom on #cards.
 * Classic script (no modules) so file:// double-click works.
 */
(function () {
  const {
    GEN_COLORS,
    childConfidence,
    defaultVisible,
    directLineIds,
    edgeClass,
    expectedDnaShares,
    formatDnaShare,
    getFocusId,
    hasNonBloodParent,
    isBloodParent,
    isNonBloodKin,
    parentLinkKind,
    setFocusId,
    getPeople,
    groupIntoGalleries,
    loadObjectArtifact,
    objectGalleryLabel,
    loadPeopleIndex,
    neighborIds,
    personMediaArtifacts,
    portraitUrl,
    silhouetteUrl,
    stallInfo,
    STALL_TYPES,
    spouseConfidence,
  } = window.ShareData;
  const { METRICS } = window.TreeCards;
  const {
    childLinks: layoutChildLinks,
    childPath,
    childAnchor,
    countChildEdgeCrossings,
    layoutTree,
    unionGap: layoutUnionGap,
  } = window.TreeLayout;
  const CARD_W = METRICS.CARD_W;
  const CARD_H = METRICS.CARD_H;
  const STALL_BAND = METRICS.STALL_BAND;
  const layoutMetrics = { CARD_W, CARD_H, STEP_BACK_SCALE: METRICS.STEP_BACK_SCALE };
  const unionGap = (a, b, people) => layoutUnionGap(a, b, people, layoutMetrics);
  const MIN_X_GAP = CARD_W + 20;
  const MIN_Y_GAP = CARD_H + STALL_BAND + 72;

const zoomSurface = d3.select("#zoom-surface");
const zoomSlider = document.getElementById("zoom-slider");
const cardsPanEl = document.getElementById("cards-pan");
const cardsEl = document.getElementById("cards");
const svg = d3.select("#graph");
const gRoot = svg.append("g").attr("class", "edges");
const gLinks = gRoot.append("g").attr("class", "links");
window.TreeCards.mount(cardsEl);

const supportsCssZoom = typeof CSS !== "undefined" && CSS.supports?.("zoom", "1");

/** Project world → screen. SVG transform stays vector; CSS zoom re-paints HTML. */
function applyCamera({ x, y, k }) {
  gRoot.attr("transform", `translate(${x},${y}) scale(${k})`);
  cardsPanEl.style.transform = `translate(${x}px, ${y}px)`;
  if (supportsCssZoom) {
    cardsEl.style.zoom = String(k);
    cardsEl.style.transform = "";
  } else {
    cardsEl.style.zoom = "";
    cardsEl.style.transform = `scale(${k})`;
  }
  if (zoomSlider && document.activeElement !== zoomSlider) {
    const pct = Math.round(k * 100);
    if (Number(zoomSlider.value) !== pct) zoomSlider.value = String(pct);
  }
}

const panel = document.getElementById("panel");
const panelBody = document.getElementById("panel-body");
const legend = document.getElementById("legend");

let visible = new Set();
let showSiblings = false;
const COMBINED_ROOTS = ["alexander", "morganne"];
let combinedMode = false;
let bootCombined = false;

function queryParam(name) {
  try {
    return new URLSearchParams(location.search || "").get(name) || "";
  } catch (_) {
    return "";
  }
}

function detectCombinedMode(people) {
  const p = (queryParam("primary") || queryParam("focus")).toLowerCase();
  const c = queryParam("combined").toLowerCase();
  if (c === "0" || c === "false") return false;
  if (c === "1" || c === "true" || p === "both" || p === "combined") return true;
  if (typeof window.__TREE_PRIMARY__ === "string" && window.__TREE_PRIMARY__.trim()) return false;
  if (p) return false;
  return Boolean(people?.alexander && people?.morganne);
}

function visibleRoots(people, focusId) {
  const p = people || getPeople();
  if (combinedMode) return COMBINED_ROOTS.filter((id) => p[id]);
  const focus = focusId || getFocusId();
  return p[focus] ? [focus] : [];
}

function baselineVisible(people, focusId) {
  const p = people || getPeople();
  const focus = focusId || getFocusId();
  return defaultVisible(p, focus, {
    includeSiblings: showSiblings,
    roots: visibleRoots(p, focus),
  });
}
let selectedId = null;
let defaultFocusId = null;
let width = 0;
let height = 0;
let physicsOn = false;
let nodeByIdTick = new Map();
const nodePos = new Map();
/** Reused node objects so HTML cards are not recast on every expand. */
const liveNodes = new Map();
const objectCache = new Map();
/** primaryId → Map(personId → expected DNA %) */
let dnaByPrimary = null;
let dnaPrimaryId = null;
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const zoom = d3
  .zoom()
  .scaleExtent([0.2, 3.2])
  .filter((event) => {
    if (event.type === "wheel") return true;
    if (event.button) return false;
    return !event.target.closest(".card-stack, .expand-btn");
  })
  .on("zoom", (event) => applyCamera(event.transform));
zoomSurface.call(zoom);
applyCamera(d3.zoomIdentity);

/** Pedigree packing is the rest pose; these just make it jiggle. */
const PHYSICS = {
  xLine: 0.32,
  xOther: 0.16,
  y: 0.88,
  spouseLink: 0.95,
  velocityDecay: 0.4,
  wake: 0.35,
  dragHeat: 0.22,
};

let childPathSel = gLinks.selectAll("path.child");
let collideRows = [];
let lineCouples = [];

const simulation = d3
  .forceSimulation()
  .velocityDecay(PHYSICS.velocityDecay)
  .alphaDecay(0.04)
  .alphaMin(0.012)
  .force(
    "link",
    d3
      .forceLink()
      .id((d) => d.id)
      .distance((d) => d.gap ?? MIN_X_GAP)
      .strength(PHYSICS.spouseLink)
  )
  .force("collide", forceCardCollide)
  .force(
    "x",
    d3
      .forceX()
      .x((d) => d.targetX ?? width / 2)
      .strength((d) => (d.stepBack || d.sprawled ? 0.7 : d.onDirectLine ? PHYSICS.xLine : PHYSICS.xOther))
  )
  .force(
    "y",
    d3
      .forceY()
      .y((d) => d.targetY ?? genY(d.generation))
      .strength((d) => (d.stepBack || d.sprawled ? 0.85 : PHYSICS.y))
  )
  .force("lineParents", forceLineParents)
  .on("tick", ticked)
  .stop();

/** Rebuild once per graph, not every physics tick. */
function bindPhysicsCaches(nodes) {
  const people = getPeople();
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const byGen = new Map();
  for (const n of nodes) {
    if (n.stackCollapsed || n.stepBack) continue;
    let row = byGen.get(n.generation);
    if (!row) byGen.set(n.generation, (row = []));
    row.push(n);
  }
  collideRows = [...byGen.values()];
  lineCouples = [];
  for (const child of nodes) {
    if (!child.onDirectLine) continue;
    const parents = (people[child.id]?.parents || []).map((pid) => byId.get(pid)).filter(Boolean);
    if (parents.length < 2) continue;
    lineCouples.push({
      child,
      a: parents[0],
      b: parents[1],
      want: unionGap(parents[0].id, parents[1].id, people),
    });
  }
}

/** Same-row collide — scan each generation left→right, stop once cards are far enough. */
function forceCardCollide(alpha) {
  const people = getPeople();
  const heat = Math.max(alpha, 0.4);
  for (const row of collideRows) {
    row.sort((a, b) => a.x - b.x);
    for (let i = 0; i < row.length; i++) {
      const a = row[i];
      for (let j = i + 1; j < row.length; j++) {
        const b = row[j];
        const dx = b.x - a.x;
        if (dx >= MIN_X_GAP) break;
        const want = unionGap(a.id, b.id, people);
        if (dx >= want) continue;
        const push = ((want - Math.max(dx, 1e-6)) / 2) * heat;
        a.vx -= push;
        b.vx += push;
      }
    }
  }
}

/** Keep mom/dad midpoint over the direct-line child only (not sibling group). */
function forceLineParents(alpha) {
  for (const pair of lineCouples) {
    const left = pair.a.x <= pair.b.x ? pair.a : pair.b;
    const right = left === pair.a ? pair.b : pair.a;
    const pull = (pair.child.x - (left.x + right.x) / 2) * 0.55 * alpha;
    left.vx += pull;
    right.vx += pull;
    const fix = (pair.want - (right.x - left.x)) * 0.45 * alpha;
    left.vx -= fix / 2;
    right.vx += fix / 2;
  }
}

function genY(gen) {
  const row = Math.max(height * 0.12, MIN_Y_GAP);
  return height * 0.1 + gen * row;
}

function coupleKey(a, b) {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

function shortName(name) {
  const parts = String(name).split(/\s+/);
  if (parts.length === 1) return parts[0];
  if (name.includes("Jr.") || name.includes("III")) return parts.slice(0, 2).join(" ");
  if (parts[0].length + parts[parts.length - 1].length > 16) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1]}`;
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/** Ancestors of `id` (not including `id`), up to `maxDepth` generations. */
function collectAncestors(id, people, maxDepth) {
  const out = [];
  const seen = new Set([id]);
  let frontier = [id];
  for (let depth = 0; depth < maxDepth && frontier.length; depth++) {
    const next = [];
    for (const cur of frontier) {
      for (const p of people[cur]?.parents || []) {
        if (!people[p] || seen.has(p)) continue;
        if (!isBloodParent(people[cur], p)) continue;
        seen.add(p);
        out.push(p);
        next.push(p);
      }
    }
    frontier = next;
  }
  return out;
}

function collectChildren(id, people) {
  return (people[id]?.children || []).filter((c) => people[c] && isBloodParent(people[c], id));
}

function hiddenUpOne(id) {
  return collectAncestors(id, getPeople(), 1).filter((pid) => !visible.has(pid));
}

function hiddenUpDeep(id) {
  const people = getPeople();
  const parents = new Set(collectAncestors(id, people, 1));
  return collectAncestors(id, people, Infinity).filter(
    (pid) => !parents.has(pid) && !visible.has(pid)
  );
}

function hiddenDown(id) {
  return collectChildren(id, getPeople()).filter((cid) => !visible.has(cid));
}

function collapsibleUp(id) {
  return collectAncestors(id, getPeople(), Infinity).some((pid) => visible.has(pid));
}

/** Keep this card, its descendants, and their spouses when folding ascent. */
function collapseKeepSet(id) {
  const people = getPeople();
  const keep = new Set([id]);
  const q = [id];
  while (q.length) {
    const cur = q.pop();
    for (const c of people[cur]?.children || []) {
      if (!people[c] || keep.has(c) || !isBloodParent(people[c], cur)) continue;
      keep.add(c);
      q.push(c);
    }
  }
  return keep;
}

function collapsibleDown(id) {
  const people = getPeople();
  const base = baselineVisible(people);
  return (people[id]?.children || []).some((cid) => visible.has(cid) && !base.has(cid));
}

function revealIds(ids) {
  let added = 0;
  for (const nid of ids) {
    if (!visible.has(nid)) {
      visible.add(nid);
      added += 1;
    }
  }
  return added;
}

function expandUp(id, { all = false } = {}) {
  const people = getPeople();
  const depth = all ? Infinity : 1;
  if (!revealIds(collectAncestors(id, people, depth))) return;
  render();
  selectPerson(id);
}

function expandDown(id) {
  const people = getPeople();
  if (!revealIds(collectChildren(id, people))) return;
  render();
  selectPerson(id);
}

/**
 * Hide people seeded by `seeds`, plus the hanging component.
 * `keep` (default: primary baseline) is never removed.
 */
function collapseFromSeeds(id, seeds, keep) {
  const people = getPeople();
  const protectedIds = keep || baselineVisible(people);
  const remove = new Set();
  const queue = [];
  for (const nid of seeds) {
    if (visible.has(nid) && !protectedIds.has(nid) && nid !== id) {
      remove.add(nid);
      queue.push(nid);
    }
  }
  if (!remove.size) return false;

  while (queue.length) {
    const cur = queue.shift();
    for (const nid of neighborIds(people[cur] || {})) {
      if (!visible.has(nid) || protectedIds.has(nid) || remove.has(nid) || nid === id) continue;
      remove.add(nid);
      queue.push(nid);
    }
  }

  for (const rid of remove) visible.delete(rid);
  if (selectedId && remove.has(selectedId)) selectedId = id;
  return true;
}

function collapseUp(id) {
  if (!collapseFromSeeds(id, collectAncestors(id, getPeople(), Infinity), collapseKeepSet(id))) {
    return;
  }
  render();
  selectPerson(id);
}

function collapseDown(id) {
  if (!collapseFromSeeds(id, getPeople()[id]?.children || [])) return;
  render();
  selectPerson(id);
}

function attachCardUi(d) {
  const c = GEN_COLORS[d.generation] || GEN_COLORS[2];
  const upOpen = collapsibleUp(d.id);
  const downHidden = hiddenDown(d.id).length > 0;
  const stall = stallInfo(d.blocker);
  d.collateral = !d.lineRelevant;
  d.ui = {
    photo: portraitUrl(d),
    fallback: silhouetteUrl(d.sex, (GEN_COLORS[d.generation] || GEN_COLORS[2]).avatarBg),
    short: shortName(d.name),
    years: d.years || d.confidence || "",
    dna: d.id === getFocusId() ? "100%" : formatDnaShare(dnaShareFor(d.id)),
    artifacts: artifactCount(d),
    stalled: Boolean(stall),
    stallKind: stall?.id || "",
    stallLabel: stall?.label || "",
    stallShort: stall?.short || "",
    stallColor: stall?.color || "",
    adopted: hasNonBloodParent(d),
    why: d.blocker ? String(d.blocker) : "",
    primary: combinedMode ? COMBINED_ROOTS.includes(d.id) : d.id === getFocusId(),
    unknown: d.confidence === "Unknown" || d.id === "anderson_grandma",
    fill: c.fill,
    soft: c.soft,
    upOpen,
    showOne: upOpen || hiddenUpOne(d.id).length > 0,
    showAll: !upOpen && hiddenUpDeep(d.id).length > 0,
    downHidden,
    downOpen: collapsibleDown(d.id),
  };
}

function cardLayerHooks() {
  return {
    onSelect: selectPerson,
    onExpandOne: (id) => {
      if (collapsibleUp(id)) collapseUp(id);
      else expandUp(id, { all: false });
    },
    onExpandAll: (id) => expandUp(id, { all: true }),
    onExpandKids: (id) => {
      if (hiddenDown(id).length) expandDown(id);
      else collapseDown(id);
    },
    onDragStart: (event, id) => {
      const d = liveNodes.get(id);
      if (!d) return;
      if (!event.active && physicsOn) simulation.alphaTarget(PHYSICS.dragHeat).restart();
      const p = d3.zoomTransform(zoomSurface.node()).invert([event.x, event.y]);
      d.fx = p[0];
      d.fy = p[1];
    },
    onDrag: (event, id) => {
      const d = liveNodes.get(id);
      if (!d) return;
      const p = d3.zoomTransform(zoomSurface.node()).invert([event.x, event.y]);
      d.fx = p[0];
      d.fy = p[1];
    },
    onDragEnd: (event, id) => {
      const d = liveNodes.get(id);
      if (!d) return;
      if (!event.active && physicsOn) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    },
    dragSubject: (id) => liveNodes.get(id),
  };
}

function resolveNode(ref, map) {
  return typeof ref === "object" ? ref : map.get(ref);
}

function buildGraph() {
  const people = getPeople();
  const nodes = [];
  const keep = new Set();
  for (const id of visible) {
    const p = people[id];
    if (!p) continue;
    keep.add(id);
    let n = liveNodes.get(id);
    if (!n) {
      n = { id };
      liveNodes.set(id, n);
    }
    n.name = p.name;
    n.years = p.years;
    n.confidence = p.confidence;
    n.blocker = p.blocker;
    n.generation = p.generation;
    n.parents = p.parents;
    n.spouses = p.spouses;
    n.children = p.children;
    n.objectIds = p.objectIds;
    n.media = p.media;
    n.photo = p.photo;
    const prev = nodePos.get(id);
    if (n.x == null) {
      n.x = prev?.x ?? width / 2 + (Math.random() - 0.5) * 120;
      n.y = prev?.y ?? genY(p.generation) + (Math.random() - 0.5) * 40;
      n.vx = prev?.vx ?? 0;
      n.vy = prev?.vy ?? 0;
    }
    nodes.push(n);
  }
  for (const id of [...liveNodes.keys()]) {
    if (!keep.has(id)) liveNodes.delete(id);
  }

  const links = [];
  const seenSpouse = new Set();
  const idSet = new Set(nodes.map((n) => n.id));

  for (const node of nodes) {
    for (const sid of node.spouses || []) {
      if (!idSet.has(sid)) continue;
      const key = coupleKey(node.id, sid);
      if (seenSpouse.has(key)) continue;
      seenSpouse.add(key);
      const other = people[sid];
      links.push({
        source: node.id,
        target: sid,
        kind: "spouse",
        couple: key,
        gap: unionGap(node.id, sid, people),
        confidence: spouseConfidence(node, other),
      });
    }
  }

  for (const link of layoutChildLinks(nodes, people)) {
    const pars = link.union || [link.source];
    const child = people[link.target];
    if (pars.some((pid) => child && !isBloodParent(child, pid))) continue;
    links.push({
      ...link,
      confidence: childConfidence(child, pars),
      relation: "blood",
    });
  }

  return { nodes, links };
}

function ticked() {
  const nodes = simulation.nodes();
  childPathSel.attr("d", (d) => {
    const a = childAnchor(d, nodeByIdTick, layoutMetrics);
    if (!a) return "";
    return childPath(a.x, a.y, a.tx, a.ty);
  });
  window.TreeCards.move(nodes);
  for (const d of nodes) {
    nodePos.set(d.id, { x: d.x, y: d.y, vx: d.vx, vy: d.vy });
  }
}

function dnaShareFor(id) {
  const primary = getFocusId();
  if (!dnaByPrimary || dnaPrimaryId !== primary) {
    dnaByPrimary = expectedDnaShares(primary, getPeople());
    dnaPrimaryId = primary;
  }
  return dnaByPrimary.get(id) ?? 0;
}

function artifactCount(d) {
  return (d.objectIds?.length || 0) + (d.media?.length || 0);
}

function render() {
  const graph = buildGraph();
  const hard = !physicsOn || graph.nodes.every((n) => !nodePos.has(n.id));
  layoutAligned(graph.nodes, { hard });
  simulation.nodes(graph.nodes);
  simulation.force("link").links(graph.links.filter((d) => d.kind === "spouse"));
  simulation.force("y").y((d) => d.targetY ?? genY(d.generation));
  simulation.force("x").x((d) => d.targetX ?? width / 2);

  const childLinks = graph.links.filter((d) => d.kind === "child");
  const linkKey = (d) => {
    const t = typeof d.target === "object" ? d.target.id : d.target;
    if (d.union) return `union:${d.union.slice().sort().join("|")}->${t}`;
    const s = typeof d.source === "object" ? d.source.id : d.source;
    return `${s}->${t}`;
  };
  const linkSel = gLinks.selectAll("path.child").data(childLinks, linkKey);
  linkSel.exit().remove();
  const linkEnter = linkSel.enter().append("path").attr("class", "link child");
  const relevantIds = new Set(graph.nodes.filter((n) => n.lineRelevant).map((n) => n.id));
  const nodeById = new Map(graph.nodes.map((n) => [n.id, n]));
  nodeByIdTick = nodeById;
  bindPhysicsCaches(graph.nodes);
  childPathSel = linkEnter.merge(linkSel);
  childPathSel.attr("class", (d) => {
      const tid = typeof d.target === "object" ? d.target.id : d.target;
      const tnode = nodeById.get(tid);
      const parents = (d.union || [
        typeof d.source === "object" ? d.source.id : d.source,
      ]).map((id) => nodeById.get(id));
      const collateral = !relevantIds.has(tid);
      const hidden =
        tnode?.stackCollapsed ||
        tnode?.stackHost ||
        parents.some((p) => p?.stackCollapsed || p?.stackHost)
          ? " stack-hidden"
          : "";
      return `link child ${edgeClass(d.confidence)}${d.relation === "adoptive" ? " adoptive" : ""}${collateral ? " collateral" : ""}${hidden}`;
    });
  // ponytail: child paths must carry class on enter or selectAll("path.child") skips them
  console.assert(childLinks.length > 0, "expected parent→child links");
  console.assert(
    simulation.force("link").links().every((d) => d.kind === "spouse"),
    "physics springs are spouse-only"
  );

  for (const n of graph.nodes) attachCardUi(n);
  window.TreeCards.sync(graph.nodes, cardLayerHooks());
  applyHighlight();

  cardsEl.classList.toggle("is-physics", physicsOn);
  if (physicsOn) simulation.alpha(Math.max(simulation.alpha(), PHYSICS.wake)).restart();
  else {
    simulation.stop();
    ticked();
  }
}

/**
 * Pedigree packing via TreeLayout. Soft physics keeps prior spine x.
 */
function layoutAligned(nodes, { hard = true } = {}) {
  const people = getPeople();
  const focusId = getFocusId();
  const roots = visibleRoots(people, focusId);
  layoutTree(nodes, people, focusId, {
    genY,
    line: directLineIds(focusId, people, roots),
    foci: roots,
    metrics: layoutMetrics,
  });

  const focusNode = nodes.find((n) => n.id === focusId);
  const shift = width / 2 - (focusNode?.x ?? 0);
  for (const n of nodes) {
    n.x += shift;
    n.targetX = n.x;
    n.targetY = n.y;
    const pinned = n.stackHost || n.stepBackHost || n.stepBack;
    if (hard || pinned || !nodePos.has(n.id)) {
      n.vx = 0;
      n.vy = 0;
      nodePos.set(n.id, { x: n.x, y: n.y, vx: 0, vy: 0 });
    } else {
      const prev = nodePos.get(n.id);
      n.x = prev.x;
      n.y = prev.y ?? n.y;
      n.vx = prev.vx ?? 0;
      n.vy = prev.vy ?? 0;
    }
  }

  const crosses = countChildEdgeCrossings(nodes, people);
  console.assert(crosses === 0, `${crosses} parent→child edge crossings`);
}

function applyHighlight() {
  const people = getPeople();
  const hot = new Set();
  if (selectedId && people[selectedId]) {
    hot.add(selectedId);
    for (const id of neighborIds(people[selectedId])) if (visible.has(id)) hot.add(id);
  }
  window.TreeCards.highlight(selectedId, hot);
  gLinks.selectAll("path.child").classed("dim", (d) => {
    if (!selectedId) return false;
    const t = typeof d.target === "object" ? d.target.id : d.target;
    const parents = d.union || [
      typeof d.source === "object" ? d.source.id : d.source,
    ];
    return !(hot.has(t) || parents.some((p) => hot.has(p)));
  });
}

function selectPerson(id) {
  selectedId = id;
  applyHighlight();
  openPanel(id);
}

function stripMarkdownLite(md) {
  return String(md)
    .replace(/^---[\s\S]*?---\n*/, "")
    .replace(/^#.+\n+/gm, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .trim();
}

/** Prefer ## Full text from an object entry.md for lightbox transcript. */
function extractObjectTranscript(md) {
  const raw = String(md || "");
  const body = raw.replace(/^---[\s\S]*?---\n*/, "");
  const m = body.match(/^##\s+Full text\s*\n+([\s\S]*?)(?=^##\s+|\s*$)/m);
  if (m) return m[1].trim();
  return stripMarkdownLite(raw);
}


let lightboxItems = [];
let lightboxIndex = 0;
/** panel gallery id → { label, items:[{src,caption,transcript}] } */
let panelGalleries = new Map();

let lightboxZoom = 1;
let lightboxPanX = 0;
let lightboxPanY = 0;
let lightboxDragging = false;
let lightboxDragOrigin = null;

function applyLightboxZoom() {
  const layer = document.getElementById("lightbox-zoom-layer");
  const resetBtn = document.getElementById("lightbox-zoom-reset");
  if (!layer) return;
  layer.style.transform = `translate(${lightboxPanX}px, ${lightboxPanY}px) scale(${lightboxZoom})`;
  if (resetBtn) resetBtn.textContent = `${Math.round(lightboxZoom * 100)}%`;
  const stage = document.getElementById("lightbox-stage");
  if (stage) stage.classList.toggle("is-zoomed", lightboxZoom > 1.01);
}

function resetLightboxZoom() {
  lightboxZoom = 1;
  lightboxPanX = 0;
  lightboxPanY = 0;
  applyLightboxZoom();
}

function setLightboxZoom(next) {
  lightboxZoom = Math.min(5, Math.max(1, next));
  if (lightboxZoom <= 1.01) {
    lightboxZoom = 1;
    lightboxPanX = 0;
    lightboxPanY = 0;
  }
  applyLightboxZoom();
}

function showLightboxSlide() {
  const item = lightboxItems[lightboxIndex];
  if (!item) {
    closeLightbox();
    return;
  }
  resetLightboxZoom();
  const img = document.getElementById("lightbox-img");
  const caption = document.getElementById("lightbox-caption");
  const count = document.getElementById("lightbox-count");
  const prev = document.getElementById("lightbox-prev");
  const next = document.getElementById("lightbox-next");
  const transcriptHost = document.getElementById("lightbox-transcript");
  const transcriptBody = document.getElementById("lightbox-transcript-body");
  img.src = item.src;
  img.alt = item.caption || "";
  caption.textContent = item.caption || "";
  const multi = lightboxItems.length > 1;
  count.hidden = !multi;
  count.textContent = multi ? `${lightboxIndex + 1} / ${lightboxItems.length}` : "";
  prev.hidden = !multi;
  next.hidden = !multi;
  const transcript = (item.transcript || "").trim();
  if (transcript) {
    transcriptBody.textContent = transcript;
    transcriptHost.hidden = false;
    document.getElementById("lightbox").classList.add("has-transcript");
  } else {
    transcriptBody.textContent = "";
    transcriptHost.hidden = true;
    document.getElementById("lightbox").classList.remove("has-transcript");
  }
  document.getElementById("lightbox").hidden = false;
}

function openLightboxGallery(items, startIndex = 0) {
  if (!items?.length) return;
  lightboxItems = items;
  lightboxIndex = Math.max(0, Math.min(startIndex, items.length - 1));
  showLightboxSlide();
}

function openLightbox(src, caption, transcript) {
  if (!src) return;
  openLightboxGallery([{ src, caption: caption || "", transcript: transcript || "" }], 0);
}

function stepLightbox(delta) {
  if (lightboxItems.length < 2) return;
  lightboxIndex = (lightboxIndex + delta + lightboxItems.length) % lightboxItems.length;
  showLightboxSlide();
}

function closeLightbox() {
  document.getElementById("lightbox").hidden = true;
  document.getElementById("lightbox").classList.remove("has-transcript");
  document.getElementById("lightbox-img").removeAttribute("src");
  document.getElementById("lightbox-transcript-body").textContent = "";
  document.getElementById("lightbox-transcript").hidden = true;
  lightboxItems = [];
  lightboxIndex = 0;
  resetLightboxZoom();
}

async function openPanel(id) {
  const people = getPeople();
  const p = people[id];
  if (!p) return;
  const c = GEN_COLORS[p.generation] || GEN_COLORS[2];
  const primary = people[getFocusId()];
  const isPrimary = id === getFocusId();
  const dnaPct = dnaShareFor(id);
  const dnaLabel = isPrimary ? "100% (primary)" : formatDnaShare(dnaPct);
  const kin = [
    ...(p.parents || []).map((k) => {
      const kind = parentLinkKind(p, k);
      const rel = kind === "adoptive" ? "Adoptive parent" : kind === "step" ? "Step-parent" : "Parent";
      return { id: k, rel };
    }),
    ...(p.spouses || []).map((k) => ({ id: k, rel: "Spouse" })),
    ...(p.children || []).map((k) => ({ id: k, rel: "Child" })),
  ];

  panel.hidden = false;
  panelBody.innerHTML = `
    <div class="panel-hero">
      <img class="zoomable" src="${portraitUrl(p)}" alt="${escapeHtml(p.name)}" data-src="${escapeHtml(
        portraitUrl(p)
      )}" data-caption="${escapeHtml(p.name)}" />
      <div>
        <p class="eyebrow" style="color:${c.fill}">${c.label}</p>
        <h2>${escapeHtml(p.name)}</h2>
        <p class="meta">${escapeHtml(p.years || "dates TBD")}${p.status ? ` · ${escapeHtml(p.status)}` : ""}</p>
        <p class="confidence">${escapeHtml(p.confidence)}${p.aka ? ` · ${escapeHtml(p.aka)}` : ""}</p>
        ${
          p.blocker
            ? `<p class="blocker-line"><strong>Stalled</strong> — ${escapeHtml(p.blocker)}</p>`
            : ""
        }
        <p class="dna-line">${
          dnaLabel
            ? `<strong>${escapeHtml(dnaLabel)}</strong> expected shared DNA with ${escapeHtml(
                primary?.name || "primary"
              )}`
            : isNonBloodKin(id, getFocusId(), people)
              ? `Adoptive / legal kin — not a blood path to ${escapeHtml(primary?.name || "primary")}`
              : `No blood path to ${escapeHtml(primary?.name || "primary")} (marriage / in-law)`
        }</p>
        ${
          isPrimary
            ? `<p class="dna-note">Primary for tree + DNA%</p>`
            : `<button type="button" class="tool primary-btn" id="btn-make-primary">Set as primary</button>`
        }
      </div>
    </div>
    <p class="summary">${escapeHtml(p.summary)}</p>
    <h3>Family</h3>
    ${
      kin.length
        ? `<table class="kin-table"><tbody>${kin
            .map((k) => {
              const shown = visible.has(k.id);
              const offLine = shown && !baselineVisible(people).has(k.id);
              const mark = !shown ? " ⊕" : offLine ? " ⊖" : "";
              return `<tr><th>${escapeHtml(k.rel)}</th><td><button type="button" class="kin-link${
                offLine ? " can-collapse" : ""
              }" data-id="${k.id}" data-action="${
                !shown ? "expand" : offLine ? "collapse" : "select"
              }">${escapeHtml(people[k.id]?.name || k.id)}${mark}</button></td></tr>`;
            })
            .join("")}</tbody></table>`
        : `<p class="empty">No kin links.</p>`
    }
    <h3>Gallery</h3>
    <div id="artifacts" class="artifacts"><p class="empty">Loading…</p></div>
  `;

  wirePanelChrome();
  const makePrimary = document.getElementById("btn-make-primary");
  if (makePrimary) {
    makePrimary.addEventListener("click", (e) => {
      e.stopPropagation();
      setPrimaryPerson(id);
    });
  }
  await fillArtifacts(p);
}

function wirePanelChrome() {
  panelBody.querySelectorAll(".kin-link").forEach((btn) => {
    btn.addEventListener("click", () => {
      const kid = btn.getAttribute("data-id");
      const action = btn.getAttribute("data-action") || "select";
      if (action === "expand" && !visible.has(kid)) {
        visible.add(kid);
        render();
        selectPerson(kid);
        centerOn(kid);
        return;
      }
      if (action === "collapse") {
        // Collapse from this chip’s person: hide them + hanging off-line branch
        const people = getPeople();
        const base = baselineVisible(people);
        if (!base.has(kid) && visible.has(kid)) {
          // Temporarily treat as collapsing from a parent/spouse that links them
          const host = selectedId;
          const remove = new Set([kid]);
          const queue = [kid];
          while (queue.length) {
            const cur = queue.shift();
            for (const nid of neighborIds(people[cur] || {})) {
              if (!visible.has(nid) || base.has(nid) || remove.has(nid) || nid === host) continue;
              remove.add(nid);
              queue.push(nid);
            }
          }
          for (const rid of remove) visible.delete(rid);
          render();
          if (host && people[host]) selectPerson(host);
          return;
        }
      }
      selectPerson(kid);
      centerOn(kid);
    });
  });
  panelBody.querySelectorAll(".zoomable").forEach((el) => {
    el.addEventListener("click", (e) => {
      e.stopPropagation();
      openLightbox(
        el.getAttribute("data-src") || el.src,
        el.getAttribute("data-caption") || "",
        el.getAttribute("data-transcript") || ""
      );
    });
  });
  panelBody.querySelectorAll("[data-gallery]").forEach((el) => {
    el.addEventListener("click", (e) => {
      e.stopPropagation();
      const gid = el.getAttribute("data-gallery");
      const g = panelGalleries.get(gid);
      if (!g?.items?.length) return;
      const start = Number(el.getAttribute("data-gallery-index") || 0);
      openLightboxGallery(g.items, start);
    });
  });
}

function fillPrimarySelect() {
  const sel = document.getElementById("primary-select");
  if (!sel) return;
  const people = getPeople();
  const focus = getFocusId();
  const rows = Object.values(people)
    .slice()
    .sort((a, b) => String(a.name || a.id || "").localeCompare(String(b.name || b.id || "")));
  const both =
    people.alexander && people.morganne
      ? `<option value="both"${combinedMode ? " selected" : ""}>Both · Alexander + Morganne</option>`
      : "";
  sel.innerHTML =
    both +
    rows
      .map(
        (p) =>
          `<option value="${p.id}"${!combinedMode && p.id === focus ? " selected" : ""}>${escapeHtml(p.name)}${
            p.years ? ` · ${escapeHtml(p.years)}` : ""
          }</option>`
      )
      .join("");
}

function updatePrimaryLede() {
  const people = getPeople();
  const p = people[getFocusId()];
  const el = document.querySelector(".lede");
  if (!el || !p) return;
  const n = visible.size;
  if (combinedMode) {
    el.textContent = `Alexander + Morganne combined (${n} people${
      showSiblings ? ", siblings on" : ""
    }) · DNA% vs ${p.name}`;
    return;
  }
  el.textContent = `Primary ${p.name} line (+ spouses${
    showSiblings ? ", siblings" : ""
  }) · DNA% vs primary · switch Primary to change ascent`;
}

function setPrimaryPerson(id) {
  const people = getPeople();
  if (id === "both" || id === "combined") {
    combinedMode = Boolean(people.alexander && people.morganne);
    id = people.alexander ? "alexander" : "morganne";
  } else {
    combinedMode = false;
  }
  if (!people[id]) return;
  setFocusId(id);
  dnaByPrimary = null;
  dnaPrimaryId = null;
  nodePos.clear();
  visible = baselineVisible();
  fillPrimarySelect();
  updatePrimaryLede();
  if (combinedMode) {
    document.title = "Alexander + Morganne — Living tree";
    selectedId = null;
    render();
  } else {
    if (people[id]?.name) document.title = `${people[id].name} — Living tree`;
    selectedId = id;
    render();
    openPanel(id);
  }
  setTimeout(fitView, 400);
}

async function fillArtifacts(person) {
  const host = document.getElementById("artifacts");
  if (!host) return;

  const media = await personMediaArtifacts(person);
  const objects = [];
  for (const oid of person.objectIds || []) {
    if (!objectCache.has(oid)) objectCache.set(oid, await loadObjectArtifact(oid));
    const obj = objectCache.get(oid);
    if (obj && (obj.bodyText || obj.photos?.length || obj.audio || obj.videos?.length)) {
      objects.push(obj);
    }
  }

  panelGalleries = new Map();
  const groups = { gallery: [], document: [], audio: [], video: [] };
  const DOCUMENT_TYPES = new Set([
    "obituary",
    "newspaper",
    "vital",
    "census",
    "deed",
    "military",
    "church",
    "place",
    "book",
    "genealogy",
    "document",
  ]);

  const galleries = groupIntoGalleries(media);
  for (const g of galleries) {
    const gid = `person:${g.id}`;
    const slides = g.items.map((m) => ({
      src: m.src,
      caption: m.caption || m.title || g.label,
      transcript: m.transcript || "",
    }));
    panelGalleries.set(gid, { label: g.label, items: slides });
    const cover = slides[0];
    groups.gallery.push(`
      <button type="button" class="gallery-tile" data-gallery="${escapeHtml(gid)}" data-gallery-index="0" aria-label="Open ${escapeHtml(g.label)}">
        <img src="${escapeHtml(cover.src)}" alt="" loading="lazy" />
        ${slides.length > 1 ? `<span class="gallery-badge">${slides.length}</span>` : ""}
        <span class="gallery-tile-label">${escapeHtml(g.label)}</span>
      </button>`);
  }

  for (const o of objects) {
    const kind = objectGalleryLabel(o);
    if (o.photos?.length) {
      const gid = `object:${o.id}:photos`;
      const transcript = extractObjectTranscript(o.bodyText);
      const slides = o.photos.map((src) => ({
        src,
        caption: o.title,
        transcript,
      }));
      panelGalleries.set(gid, { label: kind, items: slides });
      groups.gallery.push(`
        <button type="button" class="gallery-tile" data-gallery="${escapeHtml(gid)}" data-gallery-index="0" aria-label="Open ${escapeHtml(kind)}">
          <img src="${escapeHtml(slides[0].src)}" alt="" loading="lazy" onerror="this.closest('.gallery-tile').remove()" />
          ${slides.length > 1 ? `<span class="gallery-badge">${slides.length}</span>` : ""}
          <span class="gallery-tile-label">${escapeHtml(kind)}</span>
        </button>`);
    }
    if (o.audio) {
      groups.audio.push(`
        <li class="artifact">
          <div>
            <span class="atitle">${escapeHtml(kind)}</span>
            <audio controls preload="none" src="${escapeHtml(
              o.audio
            )}" onerror="this.closest('li').remove()"></audio>
          </div>
        </li>`);
    }
    for (const src of o.videos || []) {
      groups.video.push(`
        <li class="artifact">
          <div>
            <span class="atitle">${escapeHtml(kind)}</span>
            <video controls preload="none" src="${escapeHtml(
              src
            )}" onerror="this.closest('li').remove()"></video>
          </div>
        </li>`);
    }
    // Text research objects — skip empty / stub bodies (broken paths looked like empty cards).
    const plain = stripMarkdownLite(o.bodyText || "").trim();
    if (DOCUMENT_TYPES.has(o.type) && plain.length > 40) {
      groups.document.push(`
        <li class="artifact artifact-doc-row">
          <details class="artifact-doc">
            <summary>
              <span class="atype">${escapeHtml(kind)}</span>
              <span class="atitle">${escapeHtml(o.title)}</span>
            </summary>
            <pre class="artifact-body">${escapeHtml(plain)}</pre>
            ${
              o.sourceUrl
                ? `<a class="asource" href="${escapeHtml(o.sourceUrl)}" target="_blank" rel="noopener">Source</a>`
                : ""
            }
          </details>
        </li>`);
    }
  }

  const chunks = [];
  if (groups.gallery.length) chunks.push(`<div class="gallery-tiles">${groups.gallery.join("")}</div>`);
  if (groups.document.length) chunks.push(`<h4>Documents</h4><ul class="artifact-list">${groups.document.join("")}</ul>`);
  if (groups.audio.length) chunks.push(`<h4>Audio</h4><ul class="artifact-list">${groups.audio.join("")}</ul>`);
  if (groups.video.length) chunks.push(`<h4>Video</h4><ul class="artifact-list">${groups.video.join("")}</ul>`);
  host.innerHTML = chunks.join("") || `<p class="empty">Nothing in the gallery yet.</p>`;
  wirePanelChrome();
}

function zoomMs(base) {
  return reduceMotion ? 0 : base;
}

function centerOn(id) {
  const d = simulation.nodes().find((n) => n.id === id);
  if (!d) return;
  const scale = d3.zoomTransform(zoomSurface.node()).k;
  zoomSurface
    .transition()
    .duration(zoomMs(450))
    .call(
      zoom.transform,
      d3.zoomIdentity
        .translate(width / 2, height / 2)
        .scale(scale)
        .translate(-d.x, -d.y)
    );
}

function fitView() {
  const nodes = simulation.nodes();
  if (!nodes.length) return;
  const pad = 70;
  const minX = d3.min(nodes, (d) => d.x) - CARD_W / 2 - pad;
  const maxX = d3.max(nodes, (d) => d.x) + CARD_W / 2 + pad;
  const minY = d3.min(nodes, (d) => d.y) - CARD_H / 2 - pad;
  const maxY = d3.max(nodes, (d) => d.y) + CARD_H / 2 + pad;
  const bw = maxX - minX || 1;
  const bh = maxY - minY || 1;
  const scale = Math.min(1.9, 0.92 / Math.max(bw / width, bh / height));
  zoomSurface
    .transition()
    .duration(zoomMs(500))
    .call(
      zoom.transform,
      d3.zoomIdentity
        .translate(width / 2, height / 2)
        .scale(scale)
        .translate(-(minX + maxX) / 2, -(minY + maxY) / 2)
    );
}

function resetFocus() {
  setPrimaryPerson(bootCombined ? "both" : defaultFocusId || getFocusId());
}

function buildLegend() {
  const gens = [...new Set(simulation.nodes().map((n) => n.generation))].sort((a, b) => a - b);
  const lines = [
    `<span><i class="swatch line line-confirmed"></i>Confirmed</span>`,
    `<span><i class="swatch line line-probable"></i>Probable</span>`,
    `<span><i class="swatch line line-possible"></i>Possible / unknown</span>`,
  ];
  const stalls = STALL_TYPES.map(
    (t) => `<span><i class="swatch stall" style="--c:${t.color}"></i>${escapeHtml(t.label)}</span>`
  );
  legend.innerHTML =
    `<span class="legend-group">${gens
      .map((g) => {
        const c = GEN_COLORS[g] || GEN_COLORS[0];
        return `<span><i class="swatch" style="--c:${c.fill}"></i>${escapeHtml(c.label)}</span>`;
      })
      .join("")}</span>` +
    `<span class="legend-group">${lines.join("")}</span>` +
    `<span class="legend-group">${stalls.join("")}</span>`;
}

function resize() {
  const rect = zoomSurface.node().getBoundingClientRect();
  width = rect.width;
  height = rect.height;
  svg.attr("viewBox", `0 0 ${width} ${height}`);
  if (visible.size) {
    nodePos.clear();
    render();
    buildLegend();
  }
}

zoomSurface.on("click", (event) => {
  if (event.target.closest(".card-host")) return;
  selectedId = null;
  applyHighlight();
  panel.hidden = true;
  closeLightbox();
});

document.getElementById("panel-close").addEventListener("click", () => {
  panel.hidden = true;
  selectedId = null;
  applyHighlight();
});
document.getElementById("lightbox-close").addEventListener("click", (e) => {
  e.stopPropagation();
  closeLightbox();
});
document.getElementById("lightbox-prev").addEventListener("click", (e) => {
  e.stopPropagation();
  stepLightbox(-1);
});
document.getElementById("lightbox-next").addEventListener("click", (e) => {
  e.stopPropagation();
  stepLightbox(1);
});
document.getElementById("lightbox-zoom-in").addEventListener("click", (e) => {
  e.stopPropagation();
  setLightboxZoom(lightboxZoom + 0.25);
});
document.getElementById("lightbox-zoom-out").addEventListener("click", (e) => {
  e.stopPropagation();
  setLightboxZoom(lightboxZoom - 0.25);
});
document.getElementById("lightbox-zoom-reset").addEventListener("click", (e) => {
  e.stopPropagation();
  resetLightboxZoom();
});
{
  const stage = document.getElementById("lightbox-stage");
  stage.addEventListener(
    "wheel",
    (e) => {
      if (document.getElementById("lightbox").hidden) return;
      e.preventDefault();
      e.stopPropagation();
      const delta = e.deltaY > 0 ? -0.15 : 0.15;
      setLightboxZoom(lightboxZoom + delta);
    },
    { passive: false }
  );
  stage.addEventListener("pointerdown", (e) => {
    if (lightboxZoom <= 1.01) return;
    lightboxDragging = true;
    stage.classList.add("is-panning");
    lightboxDragOrigin = { x: e.clientX - lightboxPanX, y: e.clientY - lightboxPanY };
    stage.setPointerCapture?.(e.pointerId);
  });
  stage.addEventListener("pointermove", (e) => {
    if (!lightboxDragging || !lightboxDragOrigin) return;
    lightboxPanX = e.clientX - lightboxDragOrigin.x;
    lightboxPanY = e.clientY - lightboxDragOrigin.y;
    applyLightboxZoom();
  });
  const endPan = (e) => {
    lightboxDragging = false;
    lightboxDragOrigin = null;
    stage.classList.remove("is-panning");
    try {
      stage.releasePointerCapture?.(e.pointerId);
    } catch (_) {
      /* ignore */
    }
  };
  stage.addEventListener("pointerup", endPan);
  stage.addEventListener("pointercancel", endPan);
}
document.getElementById("lightbox").addEventListener("click", (e) => {
  if (e.target.id === "lightbox" || e.target.id === "lightbox-caption" || e.target.id === "lightbox-count") {
    closeLightbox();
  }
});
document.addEventListener("keydown", (e) => {
  const open = !document.getElementById("lightbox").hidden;
  if (!open) return;
  if (e.key === "Escape") closeLightbox();
  if (e.key === "+" || e.key === "=") setLightboxZoom(lightboxZoom + 0.25);
  if (e.key === "-" || e.key === "_") setLightboxZoom(lightboxZoom - 0.25);
  if (e.key === "0") resetLightboxZoom();
  if (e.key === "ArrowLeft") stepLightbox(-1);
  if (e.key === "ArrowRight") stepLightbox(1);
});
document.getElementById("btn-reset").addEventListener("click", resetFocus);
document.getElementById("btn-fit").addEventListener("click", fitView);
if (zoomSlider) {
  zoomSlider.addEventListener("input", () => {
    zoom.scaleTo(zoomSurface, Number(zoomSlider.value) / 100);
  });
}
document.getElementById("zoom-in")?.addEventListener("click", () => {
  zoom.scaleBy(zoomSurface, 1.2);
});
document.getElementById("zoom-out")?.addEventListener("click", () => {
  zoom.scaleBy(zoomSurface, 1 / 1.2);
});
document.getElementById("toggle-physics").addEventListener("change", (e) => {
  physicsOn = e.target.checked;
  if (!physicsOn) nodePos.clear(); // hard snap to aligned layout
  render();
});
document.getElementById("toggle-siblings").addEventListener("change", (e) => {
  showSiblings = e.target.checked;
  nodePos.clear();
  visible = baselineVisible();
  if (selectedId && !visible.has(selectedId)) selectedId = getFocusId();
  updatePrimaryLede();
  render();
  setTimeout(fitView, 200);
});
document.getElementById("primary-select").addEventListener("change", (e) => {
  setPrimaryPerson(e.target.value);
});

async function boot() {
  try {
    const { people, focusId } = await loadPeopleIndex();
    // ponytail: one load self-check
    console.assert(Object.keys(people).length > 0, "people index empty");
    console.assert(people[focusId], `focus ${focusId} missing from index`);
    // ponytail: gallery grouping self-check
    {
      const { inferGalleryKey, groupIntoGalleries } = window.ShareData;
      console.assert(inferGalleryKey("1972-topps-281.jpg") === "baseball-cards", "card gallery key");
      console.assert(inferGalleryKey("headstone-olivewood-2015.jpg", "headstone") === "headstones", "stone gallery key");
      const g = groupIntoGalleries([
        { gallery: "baseball-cards", src: "a" },
        { gallery: "baseball-cards", src: "b" },
        { gallery: "headstones", src: "c" },
      ]);
      console.assert(g.length === 2 && g[0].items.length === 2, "gallery group sizes");
    }
    if (!Object.keys(people).length || !people[focusId]) {
      throw new Error("People index failed self-check (empty or missing focus).");
    }
    const shares = expectedDnaShares(focusId, people);
    const parentId = (people[focusId].parents || [])[0];
    if (parentId) {
      console.assert(
        Math.abs((shares.get(parentId) || 0) - 50) < 0.2,
        "parent of primary should be ~50% DNA"
      );
    }
    // ponytail: media paths must include person slug (not people/media/…)
    {
      const bill = people.bill_parsons;
      if (bill?.photo) {
        console.assert(
          /\/bill-parsons\/media\//.test(bill.photo),
          "bill portrait path should be under bill-parsons/"
        );
      }
    }

    defaultFocusId = focusId;
    combinedMode = detectCombinedMode(people);
    bootCombined = combinedMode;
    const sibToggle = document.getElementById("toggle-siblings");
    showSiblings = false;
    if (sibToggle) sibToggle.checked = false;
    if (combinedMode) document.title = "Alexander + Morganne — Living tree";
    else if (people[focusId]?.name) document.title = `${people[focusId].name} — Living tree`;
    {
      const withSib = defaultVisible(people, focusId, { includeSiblings: true });
      const noSib = defaultVisible(people, focusId, { includeSiblings: false });
      console.assert(withSib.size >= noSib.size, "siblings toggle should not shrink blood+spouse set");
    }
    // ponytail: known adoption is off the diagram entirely
    {
      const toy = {
        grand: {
          parents: ["kid"],
          parentLinks: [{ id: "kid", kind: "biological" }],
          children: [],
          spouses: [],
        },
        kid: {
          parents: ["bio", "adopt"],
          parentLinks: [
            { id: "bio", kind: "biological" },
            { id: "adopt", kind: "adoptive" },
          ],
          children: ["grand"],
          spouses: [],
        },
        bio: { parents: ["ggp"], parentLinks: [], children: ["kid"], spouses: [] },
        adopt: { parents: ["legal_ggp"], parentLinks: [], children: ["kid"], spouses: [] },
        ggp: { parents: [], children: ["bio"], spouses: [] },
        legal_ggp: { parents: [], children: ["adopt"], spouses: [] },
      };
      const fromKid = defaultVisible(toy, "kid", { includeSiblings: false });
      console.assert(fromKid.has("bio") && !fromKid.has("adopt"), "adoptive parents stay off the diagram");
      console.assert(fromKid.has("ggp") && !fromKid.has("legal_ggp"), "do not climb adoptive parents");
      const fromGrand = defaultVisible(toy, "grand", { includeSiblings: false });
      console.assert(fromGrand.has("kid") && fromGrand.has("bio") && fromGrand.has("ggp"), "blood path stays");
      console.assert(!fromGrand.has("adopt") && !fromGrand.has("legal_ggp"), "adoption cuts the line for descendants");
      const shares = expectedDnaShares("grand", toy);
      console.assert((shares.get("adopt") || 0) === 0, "adoptive parent is 0% DNA");
      console.assert(Math.abs((shares.get("bio") || 0) - 25) < 0.2, "bio grandparent ~25%");
    }
    if (people.elizabeth_allen && people.raymond_philip_allen) {
      console.assert(
        parentLinkKind(people.elizabeth_allen, "raymond_philip_allen") === "adoptive",
        "Betty ← Raymond must be tagged adoptive"
      );
      if (people.morganne) {
        const vis = defaultVisible(people, "morganne", { includeSiblings: false });
        if (vis.has("elizabeth_allen")) {
          console.assert(
            !vis.has("raymond_philip_allen") && !vis.has("ina_louise_squier_allen"),
            "Morganne tree must cut Betty’s adoptive line"
          );
          console.assert(
            !vis.has("carl_addison_allen") && !vis.has("edwin_lorenzo_squier"),
            "Morganne tree must not climb Allen/Squier as blood"
          );
        }
        const shares = expectedDnaShares("morganne", people);
        console.assert(
          (shares.get("raymond_philip_allen") || 0) === 0,
          "Raymond shares 0% with Morganne (adoptive)"
        );
      }
    }
    if (people.charlotte_bowerman_aylesworth && people.david_bowerman) {
      console.assert(
        parentLinkKind(people.charlotte_bowerman_aylesworth, "david_bowerman") === "adoptive",
        "Charlotte ← David must be tagged adoptive (adoption known, no blood proof)"
      );
      if (people.alexander) {
        const vis = defaultVisible(people, "alexander", { includeSiblings: false });
        if (vis.has("charlotte_bowerman_aylesworth")) {
          console.assert(
            !vis.has("david_bowerman") && !vis.has("catherine_bartlett_bowerman"),
            "Alexander tree must cut Charlotte’s adoptive Bowerman line"
          );
        }
        if (people.mayme) {
          console.assert(!vis.has("mayme"), "Mayme has no blood path to Alexander");
        }
        if (people.william_parsons_ff) {
          console.assert(!vis.has("william_parsons_ff"), "Kate’s later husband has no blood path");
        }
      }
    }
    if (people.alexander && people.morganne) {
      const aOnly = defaultVisible(people, "alexander", { includeSiblings: true });
      const mOnly = defaultVisible(people, "morganne", { includeSiblings: true });
      const both = defaultVisible(people, "alexander", {
        includeSiblings: true,
        roots: ["alexander", "morganne"],
      });
      console.assert(both.size >= aOnly.size && both.size >= mOnly.size, "combined covers each solo tree");
      console.assert([...aOnly].every((id) => both.has(id)), "combined includes Alexander tree");
      console.assert([...mOnly].every((id) => both.has(id)), "combined includes Morganne tree");
    }
    // ponytail: card expand helpers — one generation vs full ascent vs children
    {
      const toy = {
        a: { parents: ["b"], children: ["d"], spouses: [] },
        b: { parents: ["c"], children: ["a"], spouses: ["b2"] },
        b2: { parents: [], children: [], spouses: ["b"] },
        c: { parents: [], children: ["b"], spouses: [] },
        d: { parents: ["a"], children: [], spouses: ["d2"] },
        d2: { parents: [], children: [], spouses: ["d"] },
      };
      const one = collectAncestors("a", toy, 1);
      console.assert(one.length === 1 && one[0] === "b", "one-level up is parents only");
      const all = collectAncestors("a", toy, Infinity);
      console.assert(all.includes("b") && all.includes("c") && !all.includes("a") && !all.includes("b2"), "full blood ascent, no extra spouses");
      const kids = collectChildren("a", toy);
      console.assert(kids.includes("d") && !kids.includes("d2"), "children expand is blood kids only");
    }
    visible = baselineVisible(people, focusId);
    if ((people[focusId]?.parents || []).some((p) => people[p] && visible.has(p))) {
      console.assert(collapsibleUp(focusId), "default ascent should show collapse on focus");
    }
    fillPrimarySelect();
    updatePrimaryLede();
    resize();
    // Show full graph undimmed first — selection dims most parent→child edges
    selectedId = null;
    setTimeout(fitView, 550);
  } catch (err) {
    console.error(err);
    panel.hidden = false;
    panelBody.innerHTML = `<p class="summary">Could not load people data. Keep <code>people-data.js</code> beside this page, or run <code>npm run prototype:tree</code>.</p><pre class="artifact-body">${escapeHtml(
      String(err)
    )}</pre>`;
  }
}

window.addEventListener("resize", resize);
boot();
})();
