/**
 * Share view — physics living tree + museum panel from collection/.
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
    setFocusId,
    getPeople,
    groupIntoGalleries,
    loadObjectArtifact,
    loadPeopleIndex,
    neighborIds,
    personMediaArtifacts,
    portraitUrl,
    spouseConfidence,
  } = window.ShareData;

  const CARD_W = 88;
  const CARD_H = 112;
  /** Band above the card for the stall tag (outside the card chrome). */
  const STALL_BAND = 16;
  const CARD_RX = 12;
  /** Married (ongoing): slight card overlap to read as a union. */
  const SPOUSE_OVERLAP = 14;
  const SPOUSE_GAP = CARD_W - SPOUSE_OVERLAP;
  /** Non-spouses: center-to-center minimum — cards never overlap. */
  const MIN_X_GAP = CARD_W + 20;
  /** Divorced blood co-parents: grouped, no card overlap. */
  const ENDED_SPOUSE_GAP = MIN_X_GAP;
  /** Prior spouse (remarriage): offset beside the current union. */
  const PRIOR_SPOUSE_GAP = CARD_W + 52;
  /** Perspective: prior partners (+ their parents) sit further back. */
  const STEP_BACK_DY = 56;
  const STEP_BACK_SCALE = 0.78;
  /** Extra air between distinct family units so parent→child edges can stay uncrossed. */
  const FAMILY_GAP = CARD_W + 56;
  const SIB_GAP = FAMILY_GAP;
  const MIN_Y_GAP = CARD_H + STALL_BAND + 72;

const svg = d3.select("#graph");
const gRoot = svg.append("g").attr("class", "viewport");
const gLinks = gRoot.append("g").attr("class", "links");
const gUnions = gRoot.append("g").attr("class", "unions");
const gNodes = gRoot.append("g").attr("class", "nodes");

const panel = document.getElementById("panel");
const panelBody = document.getElementById("panel-body");
const legend = document.getElementById("legend");

let visible = new Set();
let showSiblings = false;

function baselineVisible(people, focusId) {
  return defaultVisible(people || getPeople(), focusId || getFocusId(), {
    includeSiblings: showSiblings,
  });
}
let selectedId = null;
let defaultFocusId = null;
let width = 0;
let height = 0;
let physicsOn = false;
const nodePos = new Map();
const objectCache = new Map();
/** primaryId → Map(personId → expected DNA %) */
let dnaByPrimary = null;
let dnaPrimaryId = null;
/** Collateral siblings fan beside their line sibling (not in the spine packing). */
const SPRAWL_GAP = CARD_W + 18;

const zoom = d3
  .zoom()
  .scaleExtent([0.2, 3.2])
  .on("zoom", (event) => {
    gRoot.attr("transform", event.transform);
  });
svg.call(zoom);

const simulation = d3
  .forceSimulation()
  .force(
    "link",
    d3
      .forceLink()
      .id((d) => d.id)
      .distance((d) => {
        if (d.kind !== "spouse") return 130;
        const a = typeof d.source === "object" ? d.source.id : d.source;
        const b = typeof d.target === "object" ? d.target.id : d.target;
        return unionGap(a, b, getPeople());
      })
      .strength((d) => (d.kind === "spouse" ? 0.95 : 0.12))
  )
  .force("charge", d3.forceManyBody().strength(-280))
  .force("collide", forceCardCollide)
  .force(
    "x",
    d3
      .forceX()
      .x((d) => d.targetX ?? width / 2)
      .strength((d) => (d.onDirectLine ? 0.55 : 0.22))
  )
  .force(
    "y",
    d3
      .forceY()
      .y((d) => genY(d.generation))
      .strength(0.35)
  )
  .force("lineParents", forceLineParents)
  .on("tick", ticked);

function areSpouses(aId, bId, people) {
  return (
    (people[aId]?.spouses || []).includes(bId) || (people[bId]?.spouses || []).includes(aId)
  );
}

function shareChildren(aId, bId, people) {
  const kids = new Set(people[aId]?.children || []);
  return (people[bId]?.children || []).some((c) => kids.has(c));
}

function spouseLinkEnded(aId, bId, people) {
  const a = people[aId];
  const b = people[bId];
  const fromA = (a?.spouseLinks || []).find((l) => l.id === bId);
  const fromB = (b?.spouseLinks || []).find((l) => l.id === aId);
  if (fromA?.ended || fromB?.ended) return true;
  // Remarriage with no shared children ⇒ prior union (e.g. Earl × Mayme)
  const multi =
    (a?.spouses || []).length > 1 || (b?.spouses || []).length > 1;
  return multi && !shareChildren(aId, bId, people);
}

/** Ongoing marriage ⇒ overlap; divorced co-parents ⇒ side-by-side; prior spouse ⇒ tucked close. */
function unionGap(aId, bId, people) {
  if (!areSpouses(aId, bId, people)) return MIN_X_GAP;
  if (!spouseLinkEnded(aId, bId, people)) return SPOUSE_GAP;
  return shareChildren(aId, bId, people) ? ENDED_SPOUSE_GAP : PRIOR_SPOUSE_GAP;
}

function isPriorSpouse(aId, bId, people) {
  return (
    areSpouses(aId, bId, people) &&
    spouseLinkEnded(aId, bId, people) &&
    !shareChildren(aId, bId, people)
  );
}

function isOverlapUnion(aId, bId, people) {
  return areSpouses(aId, bId, people) && !spouseLinkEnded(aId, bId, people);
}

/** Blood co-parents or an ongoing marriage — keep as one layout unit. */
function isCoupleUnit(aId, bId, people) {
  if (!areSpouses(aId, bId, people)) return false;
  return shareChildren(aId, bId, people) || isOverlapUnion(aId, bId, people);
}

function pickSpousePartner(personId, candidateIds, people) {
  const score = (sid) => {
    const shared = shareChildren(personId, sid, people);
    const overlap = isOverlapUnion(personId, sid, people);
    if (shared && overlap) return 4;
    if (shared) return 3; // divorced blood parents still group
    if (overlap) return 2;
    return 0;
  };
  return candidateIds
    .slice()
    .sort((a, b) => score(b) - score(a) || a.localeCompare(b))
    .find((sid) => score(sid) > 0);
}

/** Same-row collide: ongoing spouses share SPOUSE_GAP; ended spouses use ENDED_SPOUSE_GAP. */
function forceCardCollide(alpha) {
  const people = getPeople();
  const nodes = simulation.nodes();
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i];
      const b = nodes[j];
      if (a.generation !== b.generation) continue;
      // Stacked siblings / perspective step-backs don't shove the spine
      if (a.stackCollapsed || b.stackCollapsed) continue;
      if (a.stepBack || b.stepBack) continue;
      const dx = b.x - a.x;
      const gap = Math.abs(dx);
      if (gap < 1e-6) {
        b.x += MIN_X_GAP;
        continue;
      }
      const want = areSpouses(a.id, b.id, people)
        ? unionGap(a.id, b.id, people)
        : MIN_X_GAP;
      if (gap >= want) continue;
      const push = ((want - gap) / 2) * alpha;
      const s = dx < 0 ? -1 : 1;
      a.vx -= push * s;
      b.vx += push * s;
    }
  }
}

/** Keep mom/dad midpoint over the direct-line child only (not sibling group). */
function forceLineParents(alpha) {
  const people = getPeople();
  const focusId = getFocusId();
  const line = directLineIds(focusId, people);
  const map = new Map(simulation.nodes().map((n) => [n.id, n]));
  for (const id of line) {
    const child = map.get(id);
    if (!child) continue;
    const parents = (people[id]?.parents || []).map((pid) => map.get(pid)).filter(Boolean);
    if (parents.length < 2) continue;
    const left = parents[0].x <= parents[1].x ? parents[0] : parents[1];
    const right = left === parents[0] ? parents[1] : parents[0];
    const mid = (left.x + right.x) / 2;
    const pull = (child.x - mid) * 0.55 * alpha;
    left.vx += pull;
    right.vx += pull;
    const curSep = right.x - left.x;
    const want = areSpouses(left.id, right.id, people)
      ? unionGap(left.id, right.id, people)
      : ENDED_SPOUSE_GAP;
    const fix = (want - curSep) * 0.45 * alpha;
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

function hiddenNeighborCount(id) {
  const p = getPeople()[id];
  if (!p) return 0;
  let n = 0;
  for (const nid of neighborIds(p)) if (!visible.has(nid)) n += 1;
  return n;
}

/** Off-primary-line neighbors currently shown (can be collapsed). */
function collapsibleNeighborCount(id) {
  const base = baselineVisible();
  const p = getPeople()[id];
  if (!p) return 0;
  let n = 0;
  for (const nid of neighborIds(p)) {
    if (visible.has(nid) && !base.has(nid)) n += 1;
  }
  return n;
}

/**
 * Hide neighbors of `id` that are outside the primary baseline, plus the
 * connected component of other off-baseline people hanging off them.
 * Never removes the primary line or `id` itself.
 */
function collapseNode(id) {
  const people = getPeople();
  const p = people[id];
  if (!p) return;
  const base = baselineVisible(people);
  const remove = new Set();
  const queue = [];

  for (const nid of neighborIds(p)) {
    if (visible.has(nid) && !base.has(nid)) {
      remove.add(nid);
      queue.push(nid);
    }
  }
  if (!remove.size) return;

  while (queue.length) {
    const cur = queue.shift();
    for (const nid of neighborIds(people[cur] || {})) {
      if (!visible.has(nid) || base.has(nid) || remove.has(nid) || nid === id) continue;
      remove.add(nid);
      queue.push(nid);
    }
  }

  for (const rid of remove) visible.delete(rid);
  if (selectedId && remove.has(selectedId)) selectedId = id;
  render();
  selectPerson(id);
}

function toggleExpandCollapse(id) {
  if (hiddenNeighborCount(id) > 0) expandNode(id);
  else if (collapsibleNeighborCount(id) > 0) collapseNode(id);
}

function resolveNode(ref, map) {
  return typeof ref === "object" ? ref : map.get(ref);
}

function coupleMid(a, b) {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

function splineChild(ox, oy, tx, ty) {
  const gap = Math.max(24, ty - oy);
  const dy = Math.max(40, gap * 0.55);
  return `M${ox},${oy} C${ox},${oy + dy} ${tx},${ty - dy} ${tx},${ty}`;
}

function splineSpouse(ax, ay, bx, by, { distant = false } = {}) {
  const mx = (ax + bx) / 2;
  const my = (ay + by) / 2;
  const span = Math.hypot(bx - ax, by - ay);
  const bow = distant
    ? Math.min(72, 28 + span * 0.22)
    : Math.min(26, 10 + Math.abs(bx - ax) * 0.07);
  return `M${ax},${ay} Q${mx},${my + bow} ${bx},${by}`;
}

function buildGraph() {
  const people = getPeople();
  const nodes = [...visible]
    .filter((id) => people[id])
    .map((id) => {
      const p = people[id];
      const prev = nodePos.get(id);
      return {
        ...p,
        x: prev?.x ?? width / 2 + (Math.random() - 0.5) * 120,
        y: prev?.y ?? genY(p.generation) + (Math.random() - 0.5) * 40,
        vx: prev?.vx ?? 0,
        vy: prev?.vy ?? 0,
      };
    });

  const links = [];
  const seenSpouse = new Set();
  const seenChild = new Set();
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
        confidence: spouseConfidence(node, other),
      });
    }
  }

  // One spline per parent → child (father and mother both draw, any confidence)
  for (const node of nodes) {
    for (const pid of node.parents || []) {
      if (!idSet.has(pid)) continue;
      const key = `child:${pid}->${node.id}`;
      if (seenChild.has(key)) continue;
      seenChild.add(key);
      links.push({
        source: pid,
        target: node.id,
        kind: "child",
        confidence: childConfidence(node, [pid]),
      });
    }
  }

  return { nodes, links };
}

function ticked() {
  const map = new Map(simulation.nodes().map((n) => [n.id, n]));

  gLinks.selectAll("path.child").attr("d", (d) => {
    const parent = resolveNode(d.source, map);
    const child = resolveNode(d.target, map);
    if (!parent || !child) return "";
    return splineChild(parent.x, parent.y + CARD_H / 2, child.x, child.y - CARD_H / 2);
  });

  const spouseLinks = simulation.force("link").links().filter((d) => d.kind === "spouse");
  const unionSel = gUnions.selectAll("g.union").data(spouseLinks, (d) => d.couple);
  unionSel.exit().remove();
  const uEnter = unionSel.enter().append("g").attr("class", "union");
  uEnter.append("path").attr("class", "spouse-link");
  uEnter.append("circle").attr("class", "union-dot").attr("r", 4);

  gUnions.selectAll("g.union").each(function (d) {
    const people = getPeople();
    const a = resolveNode(d.source, map);
    const b = resolveNode(d.target, map);
    if (!a || !b) return;
    const mid = coupleMid(a, b);
    const cls = edgeClass(d.confidence);
    const collateral = !(a.lineRelevant || b.lineRelevant);
    const ended = spouseLinkEnded(a.id, b.id, people);
    const distant = ended || a.stepBack || b.stepBack;
    d3.select(this)
      .attr(
        "class",
        `union ${cls}${collateral ? " collateral" : ""}${ended ? " ended" : ""}${
          distant ? " distant" : ""
        }`
      )
      .select(".spouse-link")
      .attr("class", `spouse-link ${cls}${ended ? " ended" : ""}${distant ? " distant" : ""}`)
      .attr("d", splineSpouse(a.x, a.y, b.x, b.y, { distant }));
    d3.select(this)
      .select(".union-dot")
      .attr("cx", mid.x)
      .attr("cy", mid.y + (distant ? CARD_H * 0.55 : CARD_H * 0.35))
      .attr("r", distant ? 2.5 : 4);
  });

  gNodes.selectAll("g.node").attr("transform", nodeTransform);
  for (const d of simulation.nodes()) {
    nodePos.set(d.id, { x: d.x, y: d.y, vx: d.vx, vy: d.vy });
  }
}

function nodeTransform(d) {
  const s = d.stepBack ? STEP_BACK_SCALE : 1;
  return `translate(${d.x},${d.y}) scale(${s})`;
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

function cardHtml(d) {
  const c = GEN_COLORS[d.generation] || GEN_COLORS[2];
  const n = artifactCount(d);
  const unknown = d.confidence === "Unknown" || d.id === "anderson_grandma";
  const stalled = Boolean(d.blocker);
  const isPrimary = d.id === getFocusId();
  const dnaLabel = isPrimary ? "100%" : formatDnaShare(dnaShareFor(d.id));
  const why = stalled ? String(d.blocker) : "";
  return `
    <div xmlns="http://www.w3.org/1999/xhtml" class="node-stack${
      stalled ? " is-stalled" : ""
    }" style="--fill:${c.fill};--soft:${c.soft}">
      <div class="stall-slot">
        ${
          stalled
            ? `<span class="stall-badge" title="${escapeHtml(why)}">stall</span>`
            : ""
        }
      </div>
      <div class="person-card${unknown ? " unknown" : ""}${
        isPrimary ? " focus" : ""
      }"${stalled ? ` title="Stalled: ${escapeHtml(why)}"` : ""}>
        <div class="photo-wrap">
          <img src="${portraitUrl(d)}" alt="" loading="lazy" />
          ${n ? `<span class="obj-badge" title="Linked accessions">${n}</span>` : ""}
          ${
            dnaLabel
              ? `<span class="dna-badge" title="Expected shared DNA with primary">${escapeHtml(
                  dnaLabel
                )}</span>`
              : ""
          }
        </div>
        <div class="card-meta">
          <div class="card-name">${escapeHtml(shortName(d.name))}</div>
          <div class="card-years">${escapeHtml(d.years || d.confidence || "")}</div>
        </div>
      </div>
    </div>
  `;
}

function render() {
  const graph = buildGraph();
  const hard = !physicsOn || graph.nodes.every((n) => !nodePos.has(n.id));
  layoutAligned(graph.nodes, { hard });
  simulation.nodes(graph.nodes);
  simulation.force("link").links(graph.links);
  simulation.force("y").y((d) => genY(d.generation));
  simulation.force("x").x((d) => d.targetX ?? width / 2);

  const childLinks = graph.links.filter((d) => d.kind === "child");
  const linkKey = (d) => {
    const s = typeof d.source === "object" ? d.source.id : d.source;
    const t = typeof d.target === "object" ? d.target.id : d.target;
    return `${s}->${t}`;
  };
  const linkSel = gLinks.selectAll("path.child").data(childLinks, linkKey);
  linkSel.exit().remove();
  const linkEnter = linkSel.enter().append("path").attr("class", "link child");
  const relevantIds = new Set(graph.nodes.filter((n) => n.lineRelevant).map((n) => n.id));
  const nodeById = new Map(graph.nodes.map((n) => [n.id, n]));
  linkEnter
    .merge(linkSel)
    .attr("class", (d) => {
      const sid = typeof d.source === "object" ? d.source.id : d.source;
      const tid = typeof d.target === "object" ? d.target.id : d.target;
      const tnode = nodeById.get(tid);
      const snode = nodeById.get(sid);
      const collateral = !relevantIds.has(tid);
      const hidden = tnode?.stackCollapsed || snode?.stackCollapsed ? " stack-hidden" : "";
      return `link child ${edgeClass(d.confidence)}${collateral ? " collateral" : ""}${hidden}`;
    });
  // ponytail: child paths must carry class on enter or selectAll("path.child") skips them
  console.assert(childLinks.length > 0, "expected parent→child links");

  const nodeSel = gNodes.selectAll("g.node").data(graph.nodes, (d) => d.id);
  nodeSel.exit().remove();

  const enter = nodeSel
    .enter()
    .append("g")
    .attr("class", "node")
    .call(
      d3
        .drag()
        .on("start", (event, d) => {
          if (!event.active && physicsOn) simulation.alphaTarget(0.22).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on("drag", (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on("end", (event, d) => {
          if (!event.active && physicsOn) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        })
    );

  // One quiet sheet peek — not a fan of rotated pages
  enter
    .append("g")
    .attr("class", "artifact-cue")
    .attr("aria-hidden", "true")
    .append("rect")
    .attr("class", "artifact-sheet")
    .attr("x", -CARD_W / 2 + 5)
    .attr("y", -CARD_H / 2 - STALL_BAND + 2)
    .attr("width", CARD_W - 6)
    .attr("height", CARD_H - 4)
    .attr("rx", CARD_RX - 2);

  enter
    .append("rect")
    .attr("class", "card-shadow")
    .attr("x", -CARD_W / 2 + 2)
    .attr("y", -CARD_H / 2 + 4)
    .attr("width", CARD_W)
    .attr("height", CARD_H)
    .attr("rx", CARD_RX);

  enter
    .append("foreignObject")
    .attr("class", "card-fo")
    .attr("x", -CARD_W / 2)
    .attr("y", -CARD_H / 2 - STALL_BAND)
    .attr("width", CARD_W)
    .attr("height", CARD_H + STALL_BAND)
    .append("xhtml:div")
    .attr("class", "fo-root");

  enter
    .append("g")
    .attr("class", "expand-btn")
    .attr("transform", `translate(${CARD_W / 2 - 2},${-CARD_H / 2 - STALL_BAND + 2})`)
    .on("click", (event, d) => {
      event.stopPropagation();
      toggleExpandCollapse(d.id);
    })
    .each(function () {
      d3.select(this).append("circle").attr("r", 10);
      d3.select(this).append("text").attr("class", "expand-glyph").text("+");
    });

  enter.on("click", (event, d) => {
    event.stopPropagation();
    selectPerson(d.id);
  });

  const merged = enter.merge(nodeSel);
  merged.each(function (d) {
    const c = GEN_COLORS[d.generation] || GEN_COLORS[2];
    this.style.setProperty("--fill", c.fill);
    this.style.setProperty("--soft", c.soft);
    d3.select(this).select(".fo-root").html(cardHtml(d));
  });
  merged.select(".expand-btn").attr("display", (d) => {
    if (hiddenNeighborCount(d.id) > 0 || collapsibleNeighborCount(d.id) > 0) return null;
    return "none";
  });
  merged.select(".expand-btn").classed("is-collapse", (d) => hiddenNeighborCount(d.id) === 0 && collapsibleNeighborCount(d.id) > 0);
  merged.select(".expand-glyph").text((d) => (hiddenNeighborCount(d.id) > 0 ? "+" : "−"));
  merged.select(".expand-btn").attr("aria-label", (d) =>
    hiddenNeighborCount(d.id) > 0 ? "Expand relatives" : "Collapse expanded relatives"
  );
  merged.classed("selected", (d) => d.id === selectedId);
  merged.classed("has-artifacts", (d) => artifactCount(d) > 0);
  merged.select(".artifact-cue").attr("display", (d) => (artifactCount(d) > 0 ? null : "none"));
  merged.classed("collateral", (d) => !d.lineRelevant);
  merged.classed("step-back", (d) => !!d.stepBack);
  merged.classed("stack-host", (d) => (d.stackCount || 0) > 0);
  merged.classed("stack-collapsed", (d) => !!d.stackCollapsed);
  merged.classed("sprawled", (d) => !!d.sprawled);
  // Step-back / stacks behind; spine couples on top
  merged.sort((a, b) => {
    const za = a.stepBack || a.stackCollapsed ? 0 : a.sprawled ? 1 : 2;
    const zb = b.stepBack || b.stackCollapsed ? 0 : b.sprawled ? 1 : 2;
    if (za !== zb) return za - zb;
    return a.x - b.x || a.id.localeCompare(b.id);
  });
  applyHighlight();

  if (physicsOn) simulation.alpha(0.75).restart();
  else {
    simulation.stop();
    ticked();
  }
}

/**
 * Pedigree layout for the direct line (+ spouses). Collateral siblings sprawl
 * beside their line sibling so they don't stretch the spine packing.
 */
function layoutAligned(nodes, { hard = true } = {}) {
  const people = getPeople();
  const focusId = getFocusId();
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const line = directLineIds(focusId, people);
  const xOf = new Map();

  for (const n of nodes) {
    n.y = genY(n.generation);
    n.vy = 0;
    n.vx = 0;
    n.onDirectLine = line.has(n.id);
    n.lineRelevant =
      line.has(n.id) || (people[n.id]?.spouses || []).some((sid) => line.has(sid));
    n.stackHost = null;
    n.stackIndex = 0;
    n.stackCount = 0;
    n.stackCollapsed = false;
    n.sprawled = false;
    n.stepBackHost = null;
    n.stepBackIndex = 0;
    n.stepBack = false;
  }

  // Prior spouses (ended, not blood co-parent) tuck beside the line partner
  for (const n of nodes) {
    if (!line.has(n.id)) continue;
    let idx = 0;
    for (const sid of people[n.id]?.spouses || []) {
      const s = byId.get(sid);
      if (!s || s.stepBackHost) continue;
      if (!isPriorSpouse(n.id, sid, people)) continue;
      s.stepBackHost = n.id;
      s.stepBackIndex = ++idx;
    }
  }

  // Collateral siblings sprawl beside their line sibling
  const buckets = new Map();
  for (const n of nodes) {
    const key = (people[n.id]?.parents || []).slice().sort().join("|");
    if (!key) continue;
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(n);
  }
  for (const [, sibs] of buckets) {
    if (sibs.length < 2) continue;
    const host = sibs.find((s) => line.has(s.id)) || sibs.find((s) => s.lineRelevant);
    if (!host) continue;
    const others = sibs
      .filter((s) => s.id !== host.id && !s.lineRelevant && !s.stepBackHost)
      .sort(
        (a, b) =>
          String(people[a.id]?.years || "").localeCompare(String(people[b.id]?.years || "")) ||
          a.id.localeCompare(b.id)
      );
    if (!others.length) continue;
    host.stackCount = others.length;
    others.forEach((s, i) => {
      s.stackHost = host.id;
      s.stackIndex = i + 1;
    });
  }

  function visibleOf(list) {
    return (list || []).filter((id) => byId.has(id));
  }
  function parentsOf(id) {
    return visibleOf(people[id]?.parents);
  }
  function childrenOf(id) {
    return visibleOf(people[id]?.children);
  }
  function spousesOf(id) {
    // Current / blood co-parent only — prior spouses seat as step-back satellites
    return visibleOf(people[id]?.spouses).filter((sid) => {
      const n = byId.get(sid);
      return n?.lineRelevant && !n.stepBackHost && !n.stackHost;
    });
  }
  function setX(id, x, { force = true } = {}) {
    if (!byId.has(id) || byId.get(id).stackHost || byId.get(id).stepBackHost) return;
    if (!force && xOf.has(id)) return;
    xOf.set(id, x);
  }
  function placeSpouses(id, { inLaws = true } = {}) {
    const base = xOf.get(id);
    if (base == null) return;
    const sps = spousesOf(id).filter((s) => !xOf.has(s));
    sps.sort((a, b) => {
      const rank = (sid) =>
        (shareChildren(id, sid, people) ? 2 : 0) + (isOverlapUnion(id, sid, people) ? 1 : 0);
      return rank(b) - rank(a) || a.localeCompare(b);
    });
    let cursor = base;
    for (const sid of sps) {
      cursor += unionGap(id, sid, people);
      setX(sid, cursor);
      if (inLaws) placeParentsAbove(sid, { soft: true });
    }
    // Seed prior spouses on the opposite side so their parents layout above them
    const priors = visibleOf(people[id]?.spouses)
      .filter((sid) => byId.get(sid)?.stepBackHost === id)
      .sort((a, b) => byId.get(a).stepBackIndex - byId.get(b).stepBackIndex);
    for (const sid of priors) {
      xOf.set(sid, base - PRIOR_SPOUSE_GAP * byId.get(sid).stepBackIndex);
      if (inLaws) placeParentsAbove(sid, { soft: true });
    }
  }
  function placeCouple(p0, p1, cx, opts) {
    const gap = unionGap(p0, p1, people);
    setX(p0, cx - gap / 2, opts);
    setX(p1, cx + gap / 2, opts);
  }

  const spanMemo = new Map();
  function ancestorSpan(id, stack = new Set()) {
    if (spanMemo.has(id)) return spanMemo.get(id);
    if (stack.has(id)) return FAMILY_GAP;
    stack.add(id);
    const self =
      FAMILY_GAP +
      spousesOf(id).reduce((sum, sid) => sum + unionGap(id, sid, people), 0);
    const pars = parentsOf(id);
    let w = self;
    if (pars.length === 1) w = Math.max(self, ancestorSpan(pars[0], stack));
    else if (pars.length >= 2) {
      w = Math.max(
        self,
        ancestorSpan(pars[0], new Set(stack)) + FAMILY_GAP + ancestorSpan(pars[1], new Set(stack))
      );
    }
    stack.delete(id);
    spanMemo.set(id, w);
    return w;
  }

  function placeParentsAbove(id, { soft = false } = {}) {
    const cx = xOf.get(id);
    if (cx == null) return;
    if (!soft && !line.has(id)) return;
    const pars = parentsOf(id);
    if (!pars.length) return;
    const opts = soft ? { force: false } : { force: true };
    if (pars.length === 1) {
      setX(pars[0], cx, opts);
      placeSpouses(pars[0], { inLaws: !soft });
      placeParentsAbove(pars[0], { soft });
      return;
    }
    // Fan parental branches left/right first (non-crossing order), then snap the
    // married pair together on the child — grandparents keep the wide seats.
    const w0 = ancestorSpan(pars[0]);
    const w1 = ancestorSpan(pars[1]);
    const total = w0 + FAMILY_GAP + w1;
    const leftCx = cx - total / 2 + w0 / 2;
    const rightCx = cx + total / 2 - w1 / 2;
    setX(pars[0], leftCx, { force: true });
    setX(pars[1], rightCx, { force: true });
    placeParentsAbove(pars[0], { soft });
    placeParentsAbove(pars[1], { soft });
    if (areSpouses(pars[0], pars[1], people)) {
      placeCouple(pars[0], pars[1], cx, { force: true });
    } else {
      placeSpouses(pars[0], { inLaws: !soft });
      placeSpouses(pars[1], { inLaws: !soft });
    }
  }

  function placeDescendants(id) {
    const kids = childrenOf(id).filter((c) => {
      const n = byId.get(c);
      return n && n.lineRelevant && !n.stackHost;
    });
    if (!kids.length) return;
    const sps = spousesOf(id).filter((s) => xOf.has(s));
    const mid = sps.length ? (xOf.get(id) + xOf.get(sps[0])) / 2 : xOf.get(id);
    const lineKids = kids.filter((c) => line.has(c));
    const spine = lineKids.length ? lineKids : kids.slice(0, 1);
    if (spine.length === 1) {
      if (!xOf.has(spine[0])) {
        setX(spine[0], mid);
        placeSpouses(spine[0]);
      }
      placeDescendants(spine[0]);
      return;
    }
    const start = mid - ((spine.length - 1) * SIB_GAP) / 2;
    spine.forEach((kid, i) => {
      if (!xOf.has(kid)) setX(kid, start + i * SIB_GAP);
      placeSpouses(kid);
      placeDescendants(kid);
    });
  }

  setX(focusId, 0);
  placeSpouses(focusId);
  placeParentsAbove(focusId);
  placeDescendants(focusId);

  const byGen = d3.group(
    nodes.filter((n) => !xOf.has(n.id) && !n.stackHost && !n.stepBackHost),
    (d) => d.generation
  );
  for (const [, group] of byGen) {
    const placed = nodes.filter(
      (n) =>
        n.generation === group[0].generation &&
        xOf.has(n.id) &&
        !n.stepBackHost &&
        !n.stackHost
    );
    let x = placed.length ? Math.max(...placed.map((n) => xOf.get(n.id))) + SIB_GAP * 2 : 0;
    for (const person of group) {
      if (xOf.has(person.id) || person.stackHost || person.stepBackHost) continue;
      setX(person.id, x);
      placeSpouses(person.id);
      x +=
        SIB_GAP +
        spousesOf(person.id).reduce((sum, sid) => sum + unionGap(person.id, sid, people), 0);
    }
  }

  for (const n of nodes) {
    if (n.stackHost || n.stepBackHost) continue;
    n.x = xOf.has(n.id) ? xOf.get(n.id) : 0;
    n.y = genY(n.generation);
  }
  // Keep seeded prior-spouse x for parent barycenters during untangle
  for (const n of nodes) {
    if (!n.stepBackHost || !xOf.has(n.id)) continue;
    n.x = xOf.get(n.id);
    n.y = genY(n.generation);
  }

  untangleGenerations(
    nodes.filter((n) => !n.stackHost && !n.stepBackHost),
    people,
    line
  );

  const focusNode = byId.get(focusId);
  const shift = width / 2 - (focusNode?.x ?? 0);
  for (const n of nodes) {
    if (n.stackHost || n.stepBackHost) continue;
    n.x += shift;
    n.y = genY(n.generation);
    n.targetX = n.x;
    if (hard || !nodePos.has(n.id)) {
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

  function primarySpouseOf(host) {
    return (people[host.id]?.spouses || [])
      .map((id) => byId.get(id))
      .find((s) => s && !s.stepBackHost && !s.stackHost);
  }
  function sideAwayFromPrimary(host) {
    const primary = primarySpouseOf(host);
    if (!primary) return -1;
    return primary.x >= host.x ? -1 : 1;
  }

  // Tuck prior spouses close beside the current union, a step back in perspective
  const parentNudgeGens = new Set();
  for (const n of nodes) {
    if (!n.stepBackHost) continue;
    const host = byId.get(n.stepBackHost);
    if (!host) continue;
    const dir = sideAwayFromPrimary(host);
    n.x = host.x + dir * PRIOR_SPOUSE_GAP * n.stepBackIndex;
    n.y = genY(n.generation) + STEP_BACK_DY;
    n.stepBack = true;
    n.targetX = n.x;
    n.vx = 0;
    n.vy = 0;
    nodePos.set(n.id, { x: n.x, y: n.y, vx: 0, vy: 0 });

    const pars = (people[n.id]?.parents || []).map((id) => byId.get(id)).filter(Boolean);
    if (!pars.length) continue;
    // In-law parents of a prior spouse match her step-back scale
    const parkParent = (p, x) => {
      p.x = x;
      p.y = genY(p.generation) + STEP_BACK_DY * 0.45;
      p.stepBack = true;
      p.targetX = p.x;
      p.vx = 0;
      p.vy = 0;
      nodePos.set(p.id, { x: p.x, y: p.y, vx: 0, vy: 0 });
      parentNudgeGens.add(p.generation);
    };
    if (pars.length >= 2) {
      const gap = areSpouses(pars[0].id, pars[1].id, people)
        ? unionGap(pars[0].id, pars[1].id, people)
        : ENDED_SPOUSE_GAP;
      // Scale gap with card shrink so the couple still reads as a pair
      const visualGap = gap * STEP_BACK_SCALE;
      const left = pars[0].x <= pars[1].x ? pars[0] : pars[1];
      const right = left === pars[0] ? pars[1] : pars[0];
      parkParent(left, n.x - visualGap / 2);
      parkParent(right, n.x + visualGap / 2);
    } else {
      parkParent(pars[0], n.x);
    }
  }

  // Expand the rest of those rows around the shrunk in-law parents
  for (const g of parentNudgeGens) {
    const group = nodes.filter(
      (n) => n.generation === g && !n.stackHost && !n.stepBackHost && !n.stepBack
    );
    if (group.length < 2) continue;
    const units = coupleUnits(group, people, line);
    for (const u of units) u.ideal = (u.left.x + u.right.x) / 2;
    placeUnitsToIdeals(units);
    for (const u of units) {
      for (const p of u.couple ? [u.left, u.right] : [u.left]) {
        p.y = genY(p.generation);
        p.targetX = p.x;
        nodePos.set(p.id, { x: p.x, y: p.y, vx: 0, vy: 0 });
      }
    }
  }

  // Sprawl collateral siblings past prior spouses on the open side
  for (const n of nodes) {
    if (!n.stackHost) continue;
    const host = byId.get(n.stackHost);
    if (!host) continue;
    n.sprawled = true;
    n.stackCollapsed = false;
    const dir = sideAwayFromPrimary(host);
    const priorCount = nodes.filter((p) => p.stepBackHost === host.id).length;
    n.x = host.x + dir * (PRIOR_SPOUSE_GAP * priorCount + SPRAWL_GAP * n.stackIndex);
    n.y = host.y;
    n.targetX = n.x;
    n.vx = 0;
    n.vy = 0;
    nodePos.set(n.id, { x: n.x, y: n.y, vx: 0, vy: 0 });
  }
}

/**
 * Layered crossing reduction: keep couple units, order each generation by the
 * barycenter of connected people in the adjacent generation, then pack with
 * FAMILY_GAP and pull toward those people without reordering.
 */
function untangleGenerations(nodes, people, line) {
  const byGen = d3.group(nodes, (d) => d.generation);
  const gens = [...byGen.keys()].sort((a, b) => a - b);
  if (!gens.length) return;
  if (gens.length < 2) {
    packUnitsInOrder(coupleUnits(byGen.get(gens[0]) || [], people, line), 0);
    return;
  }

  const unitsByGen = new Map();
  const unitOf = new Map();
  for (const g of gens) {
    const units = coupleUnits(byGen.get(g), people, line);
    units.forEach((u, i) => {
      u.order = i;
      u.key = u.left.id;
      unitOf.set(u.left.id, u);
      if (u.couple) unitOf.set(u.right.id, u);
    });
    unitsByGen.set(g, units);
  }

  /** Person slot inside a couple unit — keeps in-law parents on the matching spouse side. */
  function personOrder(id) {
    const u = unitOf.get(id);
    if (!u) return 0;
    if (!u.couple || u.left.id === id) return u.order;
    return u.order + 0.45;
  }

  function neighborPersonIds(unit, via) {
    const ids = [];
    for (const member of unit.couple ? [unit.left, unit.right] : [unit.left]) {
      let list = [];
      if (via === "parents") list = people[member.id]?.parents || [];
      else if (via === "children") list = people[member.id]?.children || [];
      else if (via === "spouses") list = people[member.id]?.spouses || [];
      for (const id of list) if (unitOf.has(id)) ids.push(id);
    }
    return ids;
  }

  function personX(id) {
    const u = unitOf.get(id);
    if (!u) return 0;
    return u.left.id === id ? u.left.x : u.right.x;
  }

  function blendSpouseBary(u) {
    const sps = neighborPersonIds(u, "spouses");
    if (!sps.length) return;
    const spouseBary = d3.mean(sps, personOrder);
    if (!Number.isFinite(u.bary)) u.bary = spouseBary;
    else u.bary = u.bary * 0.8 + spouseBary * 0.2;
  }

  for (let iter = 0; iter < 12; iter++) {
    // Down: children follow average parent person-slot
    for (let gi = 1; gi < gens.length; gi++) {
      const units = unitsByGen.get(gens[gi]);
      for (const u of units) {
        const pars = neighborPersonIds(u, "parents");
        u.bary = pars.length ? d3.mean(pars, personOrder) : u.order;
        blendSpouseBary(u);
      }
      units.sort((a, b) => a.bary - b.bary || a.key.localeCompare(b.key));
      units.forEach((u, i) => (u.order = i));
    }
    // Up: parents follow the specific child spouse they connect to
    for (let gi = gens.length - 2; gi >= 0; gi--) {
      const units = unitsByGen.get(gens[gi]);
      for (const u of units) {
        const kids = neighborPersonIds(u, "children");
        u.bary = kids.length ? d3.mean(kids, personOrder) : u.order;
        blendSpouseBary(u);
      }
      units.sort((a, b) => a.bary - b.bary || a.key.localeCompare(b.key));
      units.forEach((u, i) => (u.order = i));
    }
  }

  // Seed X from order with generous family gaps
  for (const g of gens) packUnitsInOrder(unitsByGen.get(g), 0);

  // Pull toward the actual people on the other end (not couple midpoints)
  for (let pass = 0; pass < 8; pass++) {
    for (let gi = gens.length - 2; gi >= 0; gi--) {
      const units = unitsByGen.get(gens[gi]);
      for (const u of units) {
        const kids = neighborPersonIds(u, "children");
        if (!kids.length) continue;
        u.ideal = d3.mean(kids, personX);
      }
      placeUnitsToIdeals(units);
    }
    for (let gi = 1; gi < gens.length; gi++) {
      const units = unitsByGen.get(gens[gi]);
      for (const u of units) {
        const pars = neighborPersonIds(u, "parents");
        if (!pars.length) continue;
        u.ideal = d3.mean(pars, personX);
      }
      placeUnitsToIdeals(units);
    }
  }
}

function coupleUnits(group, people, line = new Set()) {
  const used = new Set();
  const units = [];
  const inGen = new Map(group.map((n) => [n.id, n]));
  for (const n of group) {
    if (used.has(n.id)) continue;
    const candidates = (people[n.id]?.spouses || []).filter((s) => inGen.has(s) && !used.has(s));
    const spouseId = pickSpousePartner(n.id, candidates, people);
    if (spouseId && isCoupleUnit(n.id, spouseId, people)) {
      const a = n;
      const b = inGen.get(spouseId);
      // Bloodline spouse on the left so in-law parents seat on the matching side
      let left;
      let right;
      if (line.has(a.id) && !line.has(b.id)) {
        left = a;
        right = b;
      } else if (line.has(b.id) && !line.has(a.id)) {
        left = b;
        right = a;
      } else {
        left = a.x <= b.x ? a : b;
        right = left === a ? b : a;
      }
      used.add(left.id);
      used.add(right.id);
      const gap = unionGap(left.id, right.id, people);
      units.push({ left, right, couple: true, gap, overlap: gap < MIN_X_GAP });
    } else {
      used.add(n.id);
      units.push({ left: n, right: n, couple: false, gap: 0, overlap: false });
    }
  }
  units.sort(
    (u, v) =>
      (u.left.x + u.right.x) / 2 - (v.left.x + v.right.x) / 2 || u.left.id.localeCompare(v.left.id)
  );
  return units;
}

function packUnitsInOrder(units, startX) {
  let cursor = startX;
  for (const u of units) {
    if (u.couple) {
      const gap = u.gap || SPOUSE_GAP;
      u.left.x = cursor;
      u.right.x = cursor + gap;
      cursor = u.right.x + FAMILY_GAP;
    } else {
      u.left.x = cursor;
      cursor = cursor + FAMILY_GAP;
    }
    u.ideal = (u.left.x + u.right.x) / 2;
  }
}

/** Move units toward ideal midpoints without changing their order. */
function placeUnitsToIdeals(units) {
  if (!units?.length) return;
  const mids = units.map((u) => {
    const fall = (u.left.x + u.right.x) / 2;
    return Number.isFinite(u.ideal) ? u.ideal : fall;
  });
  const half = (u) => (u.couple ? (u.gap || SPOUSE_GAP) / 2 : 0);
  const minSep = (a, b) => half(a) + FAMILY_GAP + half(b);
  for (let i = 1; i < units.length; i++) {
    const sep = minSep(units[i - 1], units[i]);
    if (mids[i] < mids[i - 1] + sep) mids[i] = mids[i - 1] + sep;
  }
  for (let i = units.length - 2; i >= 0; i--) {
    const sep = minSep(units[i], units[i + 1]);
    if (mids[i] > mids[i + 1] - sep) mids[i] = mids[i + 1] - sep;
  }
  units.forEach((u, i) => {
    if (u.couple) {
      const gap = u.gap || SPOUSE_GAP;
      u.left.x = mids[i] - gap / 2;
      u.right.x = mids[i] + gap / 2;
    } else {
      u.left.x = mids[i];
    }
  });
}


function applyHighlight() {
  const people = getPeople();
  const hot = new Set();
  if (selectedId && people[selectedId]) {
    hot.add(selectedId);
    for (const id of neighborIds(people[selectedId])) if (visible.has(id)) hot.add(id);
  }
  gNodes.selectAll("g.node").classed("dim", (d) => selectedId && !hot.has(d.id));
  gNodes.selectAll("g.node").classed("selected", (d) => d.id === selectedId);
  gLinks.selectAll("path.child").classed("dim", (d) => {
    if (!selectedId) return false;
    const s = typeof d.source === "object" ? d.source.id : d.source;
    const t = typeof d.target === "object" ? d.target.id : d.target;
    return !(hot.has(s) || hot.has(t));
  });
  gUnions.selectAll("g.union").classed("dim", (d) => {
    if (!selectedId) return false;
    const s = typeof d.source === "object" ? d.source.id : d.source;
    const t = typeof d.target === "object" ? d.target.id : d.target;
    return !(hot.has(s) && hot.has(t));
  });
}

function expandNode(id) {
  const p = getPeople()[id];
  let added = 0;
  for (const nid of neighborIds(p)) {
    if (!visible.has(nid)) {
      visible.add(nid);
      added += 1;
    }
  }
  if (!added) return;
  render();
  selectPerson(id);
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
    ...(p.parents || []).map((k) => ({ id: k, rel: "Parent" })),
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
    <div class="kin-row">
      ${
        kin
          .map((k) => {
            const shown = visible.has(k.id);
            const offLine = shown && !baselineVisible(people).has(k.id);
            const mark = !shown ? " ⊕" : offLine ? " ⊖" : "";
            return `<button type="button" class="kin-chip${offLine ? " can-collapse" : ""}" data-id="${k.id}" data-action="${
              !shown ? "expand" : offLine ? "collapse" : "select"
            }">${k.rel}: ${escapeHtml(people[k.id]?.name || k.id)}${mark}</button>`;
          })
          .join("") || `<p class="empty">No kin links.</p>`
      }
    </div>
    <h3>Artifacts</h3>
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
  panelBody.querySelectorAll(".kin-chip").forEach((btn) => {
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
  sel.innerHTML = rows
    .map(
      (p) =>
        `<option value="${p.id}"${p.id === focus ? " selected" : ""}>${escapeHtml(p.name)}${
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
  el.textContent = `Primary ${p.name} line (+ spouses${
    showSiblings ? ", siblings" : ""
  }) · DNA% vs primary · switch Primary to change ascent`;
}

function setPrimaryPerson(id) {
  if (!getPeople()[id]) return;
  const changed = setFocusId(id);
  dnaByPrimary = null;
  dnaPrimaryId = null;
  if (changed) {
    nodePos.clear();
    visible = baselineVisible();
  }
  fillPrimarySelect();
  updatePrimaryLede();
  selectedId = id;
  render();
  openPanel(id);
  if (changed) setTimeout(fitView, 400);
  else centerOn(id);
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
    const withText = slides.filter((s) => s.transcript).length;
    groups.gallery.push(`
      <li class="artifact artifact-gallery">
        <button type="button" class="artifact-thumb gallery-thumb" data-gallery="${escapeHtml(gid)}" data-gallery-index="0" aria-label="Open ${escapeHtml(g.label)} gallery">
          <img src="${escapeHtml(cover.src)}" alt="" loading="lazy" />
          <span class="gallery-badge">${slides.length}</span>
        </button>
        <div>
          <span class="atype">gallery · ${escapeHtml(g.category.replace(/-/g, " "))}</span>
          <span class="atitle">${escapeHtml(g.label)}</span>
          <span class="ameta">${slides.length} image${slides.length === 1 ? "" : "s"}${
            withText ? ` · ${withText} with text` : ""
          } · click to browse · zoom in view</span>
        </div>
      </li>`);
  }

  for (const o of objects) {
    if (o.photos?.length) {
      const gid = `object:${o.id}:photos`;
      const transcript = extractObjectTranscript(o.bodyText);
      const slides = o.photos.map((src) => ({
        src,
        caption: o.title,
        transcript,
      }));
      panelGalleries.set(gid, { label: o.title, items: slides });
      groups.gallery.push(`
        <li class="artifact artifact-gallery">
          <button type="button" class="artifact-thumb gallery-thumb" data-gallery="${escapeHtml(gid)}" data-gallery-index="0" aria-label="Open ${escapeHtml(o.title)} gallery">
            <img src="${escapeHtml(slides[0].src)}" alt="" loading="lazy" onerror="this.closest('li').remove()" />
            <span class="gallery-badge">${slides.length}</span>
          </button>
          <div>
            <span class="atype">${escapeHtml(o.type || "photos")}</span>
            <span class="atitle">${escapeHtml(o.title)}</span>
            <span class="ameta">${slides.length} image${slides.length === 1 ? "" : "s"}${
              transcript ? " · text in view" : ""
            }</span>
          </div>
        </li>`);
    }
    if (o.audio) {
      groups.audio.push(`
        <li class="artifact">
          <div>
            <span class="atype">audio · ${escapeHtml(o.id)}</span>
            <span class="atitle">${escapeHtml(o.title)}</span>
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
            <span class="atype">video · ${escapeHtml(o.id)}</span>
            <span class="atitle">${escapeHtml(o.title)}</span>
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
              <span class="atype">${escapeHtml(o.type)}</span>
              <span class="atitle">${escapeHtml(o.title)}</span>
              <span class="aid">${escapeHtml(o.id)}</span>
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

  const order = [
    ["gallery", "Galleries"],
    ["document", "Documents"],
    ["audio", "Audio"],
    ["video", "Video"],
  ];
  const html = order
    .filter(([key]) => groups[key].length)
    .map(([key, label]) => `<h4>${label}</h4><ul class="artifact-list">${groups[key].join("")}</ul>`)
    .join("");

  host.innerHTML = html || `<p class="empty">No artifacts linked yet.</p>`;
  wirePanelChrome();
}

function centerOn(id) {
  const d = simulation.nodes().find((n) => n.id === id);
  if (!d) return;
  const scale = d3.zoomTransform(svg.node()).k;
  svg
    .transition()
    .duration(450)
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
  svg
    .transition()
    .duration(500)
    .call(
      zoom.transform,
      d3.zoomIdentity
        .translate(width / 2, height / 2)
        .scale(scale)
        .translate(-(minX + maxX) / 2, -(minY + maxY) / 2)
    );
}

function resetFocus() {
  setPrimaryPerson(defaultFocusId || getFocusId());
}

function buildLegend() {
  const gens = [...new Set(simulation.nodes().map((n) => n.generation))].sort((a, b) => a - b);
  legend.innerHTML =
    gens
      .map((g) => {
        const c = GEN_COLORS[g] || GEN_COLORS[0];
        return `<span><i class="swatch" style="--c:${c.fill}"></i>${escapeHtml(c.label)}</span>`;
      })
      .join("") +
    `<span><i class="swatch ring"></i>Curved · marriage / descent</span>` +
    `<span><i class="swatch stall"></i>Stall · dig blocked (hover card for why)</span>`;
}

function resize() {
  const rect = svg.node().getBoundingClientRect();
  width = rect.width;
  height = rect.height;
  svg.attr("viewBox", `0 0 ${width} ${height}`);
  if (visible.size) {
    nodePos.clear();
    render();
    buildLegend();
  }
}

svg.on("click", () => {
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
    const primary = people[focusId];
    if (primary?.name) document.title = `${primary.name} — Living tree`;
    const sibToggle = document.getElementById("toggle-siblings");
    if (sibToggle) showSiblings = sibToggle.checked;
    {
      const withSib = defaultVisible(people, focusId, { includeSiblings: true });
      const noSib = defaultVisible(people, focusId, { includeSiblings: false });
      console.assert(withSib.size >= noSib.size, "siblings toggle should not shrink blood+spouse set");
    }
    // ponytail: Foss/Bunker ascent past Harriet stays collapsed until ⊕
    if (people.harriet_b_foss_parsons && people.ambrose_foss) {
      const base = defaultVisible(people, focusId, { includeSiblings: false });
      if (base.has("harriet_b_foss_parsons")) {
        console.assert(
          !base.has("ambrose_foss") && !base.has("sarah_knight_foss"),
          "default view must collapse past Harriet B. Foss Parsons"
        );
      }
    }
    visible = baselineVisible(people, focusId);
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
