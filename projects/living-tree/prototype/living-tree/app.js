/**
 * Living-tree — physics graph from collection/people/index.json
 * Soft generation bands + curved spline links (no hard elbows).
 */
import {
  GEN_COLORS,
  defaultVisible,
  getFocusId,
  getPeople,
  loadPeopleIndex,
  neighborIds,
  objects,
  portraitUrl,
} from "./data.js";

const CARD_W = 88;
const CARD_H = 112;
const CARD_RX = 12;

const svg = d3.select("#graph");
const gRoot = svg.append("g").attr("class", "viewport");
const gLinks = gRoot.append("g").attr("class", "links");
const gUnions = gRoot.append("g").attr("class", "unions");
const gNodes = gRoot.append("g").attr("class", "nodes");

const panel = document.getElementById("panel");
const panelBody = document.getElementById("panel-body");
const legend = document.getElementById("legend");

let visible = new Set();
let selectedId = null;
let width = 0;
let height = 0;
let physicsOn = true;
const nodePos = new Map();

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
      .distance((d) => (d.kind === "spouse" ? CARD_W + 28 : 120))
      .strength((d) => (d.kind === "spouse" ? 0.9 : 0.28))
  )
  .force("charge", d3.forceManyBody().strength(-480))
  .force(
    "collide",
    d3.forceCollide().radius(() => Math.hypot(CARD_W, CARD_H) / 2 + 8)
  )
  .force("x", d3.forceX().strength(0.04))
  .force(
    "y",
    d3
      .forceY()
      .y((d) => genY(d.generation))
      .strength(0.22)
  )
  .on("tick", ticked);

function genY(gen) {
  const band = height * 0.13;
  const top = height * 0.2;
  return top + gen * band;
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
  const people = getPeople();
  const p = people[id];
  if (!p) return 0;
  let n = 0;
  for (const nid of neighborIds(p)) {
    if (!visible.has(nid)) n += 1;
  }
  return n;
}

function resolveNode(ref, map) {
  if (typeof ref === "object") return ref;
  return map.get(ref);
}

function coupleMid(a, b) {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

/** Smooth cubic parent → child */
function splineChild(ox, oy, tx, ty) {
  const dy = Math.max(32, Math.abs(ty - oy) * 0.5);
  return `M${ox},${oy} C${ox},${oy + dy} ${tx},${ty - dy} ${tx},${ty}`;
}

/** Soft arc between spouses */
function splineSpouse(ax, ay, bx, by) {
  const mx = (ax + bx) / 2;
  const my = (ay + by) / 2;
  const spread = Math.abs(bx - ax);
  const bow = Math.min(26, 10 + spread * 0.07);
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
      links.push({ source: node.id, target: sid, kind: "spouse", couple: key });
    }
  }

  for (const node of nodes) {
    const parents = (node.parents || []).filter((pid) => idSet.has(pid));
    if (!parents.length) continue;
    if (parents.length >= 2) {
      const key = `child:${coupleKey(parents[0], parents[1])}->${node.id}`;
      if (seenChild.has(key)) continue;
      seenChild.add(key);
      links.push({
        source: parents[0],
        target: node.id,
        kind: "child",
        parents,
        couple: coupleKey(parents[0], parents[1]),
      });
      const skey = coupleKey(parents[0], parents[1]);
      if (!seenSpouse.has(skey)) {
        seenSpouse.add(skey);
        links.push({ source: parents[0], target: parents[1], kind: "spouse", couple: skey });
      }
    } else {
      const key = `child:${parents[0]}->${node.id}`;
      if (seenChild.has(key)) continue;
      seenChild.add(key);
      links.push({ source: parents[0], target: node.id, kind: "child", parents });
    }
  }

  return { nodes, links };
}

function ticked() {
  const map = new Map(simulation.nodes().map((n) => [n.id, n]));

  gLinks.selectAll("path.child").attr("d", (d) => {
    const child = resolveNode(d.target, map);
    if (!child) return "";
    let ox;
    let oy;
    if (d.parents?.length === 2) {
      const a = map.get(d.parents[0]);
      const b = map.get(d.parents[1]);
      if (!a || !b) return "";
      const mid = coupleMid(a, b);
      ox = mid.x;
      oy = mid.y + CARD_H * 0.35;
    } else {
      const parent = resolveNode(d.source, map);
      if (!parent) return "";
      ox = parent.x;
      oy = parent.y + CARD_H / 2;
    }
    return splineChild(ox, oy, child.x, child.y - CARD_H / 2);
  });

  const spouseLinks = simulation.force("link").links().filter((d) => d.kind === "spouse");
  const unionSel = gUnions.selectAll("g.union").data(spouseLinks, (d) => d.couple);
  unionSel.exit().remove();
  const uEnter = unionSel.enter().append("g").attr("class", "union");
  uEnter.append("path").attr("class", "spouse-link");
  uEnter.append("circle").attr("class", "union-dot").attr("r", 4);

  gUnions.selectAll("g.union").each(function (d) {
    const a = resolveNode(d.source, map);
    const b = resolveNode(d.target, map);
    if (!a || !b) return;
    const mid = coupleMid(a, b);
    d3.select(this).select(".spouse-link").attr("d", splineSpouse(a.x, a.y, b.x, b.y));
    d3.select(this)
      .select(".union-dot")
      .attr("cx", mid.x)
      .attr("cy", mid.y + CARD_H * 0.35);
  });

  gNodes.selectAll("g.node").attr("transform", (d) => `translate(${d.x},${d.y})`);

  for (const d of simulation.nodes()) {
    nodePos.set(d.id, { x: d.x, y: d.y, vx: d.vx, vy: d.vy });
  }
}

function cardHtml(d) {
  const c = GEN_COLORS[d.generation] || GEN_COLORS[2];
  const heritage = d.objectIds?.length || 0;
  const img = portraitUrl(d);
  const unknown = d.confidence === "Unknown" || d.id === "anderson_grandma";
  return `
    <div xmlns="http://www.w3.org/1999/xhtml" class="person-card${unknown ? " unknown" : ""}${
      d.id === getFocusId() ? " focus" : ""
    }" style="--fill:${c.fill};--soft:${c.soft}">
      <div class="photo-wrap">
        <img src="${img}" alt="" loading="lazy" />
        ${heritage ? `<span class="obj-badge">${heritage}</span>` : ""}
      </div>
      <div class="card-meta">
        <div class="card-name">${escapeHtml(shortName(d.name))}</div>
        <div class="card-years">${escapeHtml(d.years || d.confidence || "")}</div>
      </div>
    </div>
  `;
}

function render() {
  const graph = buildGraph();

  simulation.nodes(graph.nodes);
  simulation.force("link").links(graph.links);
  simulation.force("y").y((d) => genY(d.generation));
  simulation.force("x").x(width / 2);

  const childLinks = graph.links.filter((d) => d.kind === "child");
  const linkSel = gLinks.selectAll("path.child").data(childLinks, (d) => {
    const t = typeof d.target === "object" ? d.target.id : d.target;
    return `${d.couple || d.parents?.[0]}->${t}`;
  });
  linkSel.exit().transition().duration(180).attr("opacity", 0).remove();
  linkSel
    .enter()
    .append("path")
    .attr("class", "link child")
    .attr("opacity", 0)
    .transition()
    .duration(280)
    .attr("opacity", null);

  const nodeSel = gNodes.selectAll("g.node").data(graph.nodes, (d) => d.id);
  nodeSel.exit().transition().duration(180).attr("opacity", 0).remove();

  const enter = nodeSel
    .enter()
    .append("g")
    .attr("class", "node")
    .attr("opacity", 0)
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
    .attr("y", -CARD_H / 2)
    .attr("width", CARD_W)
    .attr("height", CARD_H)
    .append("xhtml:div")
    .attr("class", "fo-root");

  enter
    .append("g")
    .attr("class", "expand-btn")
    .attr("transform", `translate(${CARD_W / 2 - 2},${-CARD_H / 2 + 2})`)
    .on("click", (event, d) => {
      event.stopPropagation();
      expandNode(d.id);
    })
    .each(function () {
      d3.select(this).append("circle").attr("r", 10);
      d3.select(this).append("text").text("+");
    });

  enter.transition().duration(280).attr("opacity", 1);
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
  merged
    .select(".expand-btn")
    .attr("display", (d) => (hiddenNeighborCount(d.id) > 0 ? null : "none"));
  merged.classed("selected", (d) => d.id === selectedId);

  applyHighlight();

  if (physicsOn) {
    simulation.alpha(0.75).restart();
  } else {
    simulation.stop();
    layoutStatic(graph.nodes);
    ticked();
  }
}

function layoutStatic(nodes) {
  for (const d of nodes) {
    d.y = genY(d.generation);
    d.vy = 0;
  }
  const byGen = d3.group(nodes, (d) => d.generation);
  for (const [, group] of byGen) {
    const placed = new Set();
    const units = [];
    for (const person of group) {
      if (placed.has(person.id)) continue;
      const spouseIds = (person.spouses || []).filter((sid) => group.some((g) => g.id === sid));
      if (spouseIds.length) {
        const partners = [person, ...spouseIds.map((sid) => group.find((g) => g.id === sid)).filter(Boolean)];
        partners.forEach((p) => placed.add(p.id));
        units.push(partners);
      } else {
        placed.add(person.id);
        units.push([person]);
      }
    }
    const gap = 22;
    const unitWidths = units.map((u) => u.length * CARD_W + (u.length - 1) * 16);
    const total = unitWidths.reduce((a, b) => a + b, 0) + gap * Math.max(0, units.length - 1);
    let x = width / 2 - total / 2;
    units.forEach((unit, ui) => {
      unit.forEach((p, i) => {
        p.x = x + CARD_W / 2 + i * (CARD_W + 16);
        p.vx = 0;
      });
      x += unitWidths[ui] + gap;
    });
  }
}

function applyHighlight() {
  const people = getPeople();
  const hot = new Set();
  if (selectedId && people[selectedId]) {
    hot.add(selectedId);
    for (const id of neighborIds(people[selectedId])) {
      if (visible.has(id)) hot.add(id);
    }
  }
  gNodes.selectAll("g.node").classed("dim", (d) => selectedId && !hot.has(d.id));
  gNodes.selectAll("g.node").classed("selected", (d) => d.id === selectedId);
  gLinks.selectAll("path.child").classed("hot", (d) => {
    if (!selectedId) return false;
    const t = typeof d.target === "object" ? d.target.id : d.target;
    return hot.has(t) || (d.parents || []).some((p) => hot.has(p));
  });
  gLinks.selectAll("path.child").classed("dim", (d) => {
    if (!selectedId) return false;
    const t = typeof d.target === "object" ? d.target.id : d.target;
    return !(hot.has(t) || (d.parents || []).some((p) => hot.has(p)));
  });
  gUnions.selectAll("g.union").classed("hot", (d) => {
    const s = typeof d.source === "object" ? d.source.id : d.source;
    const t = typeof d.target === "object" ? d.target.id : d.target;
    return selectedId && hot.has(s) && hot.has(t);
  });
  gUnions.selectAll("g.union").classed("dim", (d) => {
    if (!selectedId) return false;
    const s = typeof d.source === "object" ? d.source.id : d.source;
    const t = typeof d.target === "object" ? d.target.id : d.target;
    return !(hot.has(s) && hot.has(t));
  });
}

function expandNode(id) {
  const people = getPeople();
  const p = people[id];
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
  gNodes.selectAll("g.node").classed("selected", (d) => d.id === id);
}

function openPanel(id) {
  const people = getPeople();
  const p = people[id];
  if (!p) return;
  const c = GEN_COLORS[p.generation] || GEN_COLORS[2];
  const objs = (p.objectIds || []).map((oid) => objects[oid]).filter(Boolean);
  const img = portraitUrl(p);
  const kin = [
    ...(p.parents || []).map((k) => ({ id: k, rel: "Parent" })),
    ...(p.spouses || []).map((k) => ({ id: k, rel: "Spouse" })),
    ...(p.children || []).map((k) => ({ id: k, rel: "Child" })),
  ];

  panel.hidden = false;
  panelBody.innerHTML = `
    <div class="panel-hero">
      <img class="zoomable" src="${img}" alt="${escapeHtml(p.name)}" data-lightbox-src="${escapeHtml(
        img
      )}" data-lightbox-caption="${escapeHtml(p.name)}" />
      <div>
        <p class="eyebrow" style="color:${c.fill}">${c.label}</p>
        <h2>${escapeHtml(p.name)}</h2>
        <p class="meta">${escapeHtml(p.years || "dates TBD")}${p.status ? ` · ${escapeHtml(p.status)}` : ""}</p>
        <p class="confidence conf-${escapeHtml((p.confidence || "Unknown").toLowerCase())}">${escapeHtml(
          p.confidence || "Unknown"
        )}${p.aka ? ` · ${escapeHtml(p.aka)}` : ""}</p>
      </div>
    </div>
    <p class="summary">${escapeHtml(p.summary)}</p>
    <h3>Family</h3>
    <div class="kin-row">
      ${
        kin
          .map(
            (k) =>
              `<button type="button" class="kin-chip" data-id="${k.id}">${k.rel}: ${escapeHtml(
                people[k.id]?.name || k.id
              )}${visible.has(k.id) ? "" : " ⊕"}</button>`
          )
          .join("") || `<p class="empty-objects">No kin links.</p>`
      }
    </div>
    <h3>Heritage objects</h3>
    ${
      objs.length
        ? `<ul class="object-list">${objs.map((o) => renderObjectItem(o)).join("")}</ul>`
        : `<p class="empty-objects">No objects linked yet.</p>`
    }
  `;
  wirePanelInteractions();
}

function wirePanelInteractions() {
  panelBody.querySelectorAll(".kin-chip").forEach((btn) => {
    btn.addEventListener("click", () => {
      const kid = btn.getAttribute("data-id");
      if (!visible.has(kid)) {
        visible.add(kid);
        render();
      }
      selectPerson(kid);
      centerOn(kid);
    });
  });

  panelBody.querySelectorAll(".zoomable, .object-unfold-media").forEach((el) => {
    el.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      openLightbox(
        el.getAttribute("data-lightbox-src") || el.getAttribute("src"),
        el.getAttribute("data-lightbox-caption") || el.getAttribute("alt") || ""
      );
    });
  });

  panelBody.querySelectorAll("details.object-card").forEach((det) => {
    det.addEventListener("toggle", async () => {
      if (!det.open) return;
      const bodyEl = det.querySelector(".object-body[data-body-path]");
      if (!bodyEl || bodyEl.dataset.loaded === "1") return;
      bodyEl.textContent = "Loading…";
      try {
        const res = await fetch(bodyEl.getAttribute("data-body-path"));
        bodyEl.textContent = stripMarkdownLite(await res.text());
        bodyEl.dataset.loaded = "1";
      } catch {
        bodyEl.textContent = "Could not load contents.";
      }
    });
  });
}

function renderObjectItem(o) {
  const thumb = o.thumb
    ? `<img class="object-thumb" src="${escapeHtml(o.thumb)}" alt="" />`
    : `<div class="object-thumb" style="display:grid;place-items:center;font-size:0.65rem;font-weight:800;opacity:0.45">${escapeHtml(
        (o.type || "?").slice(0, 8)
      )}</div>`;
  const source = o.sourceUrl
    ? `<a class="object-source" href="${escapeHtml(o.sourceUrl)}" target="_blank" rel="noopener">Source</a>`
    : "";
  const unfoldMedia = o.thumb
    ? `<img class="object-unfold-media" src="${escapeHtml(o.thumb)}" alt="${escapeHtml(
        o.title
      )}" data-lightbox-src="${escapeHtml(o.thumb)}" data-lightbox-caption="${escapeHtml(o.title)}" />`
    : "";
  const unfoldText = o.bodyPath
    ? `<pre class="object-body" data-body-path="${escapeHtml(o.bodyPath)}"></pre>`
    : `<p class="oblurb">${escapeHtml(o.blurb || "No further contents captured yet.")}</p>`;

  return `<li>
    <details class="object-card">
      <summary>
        <div class="object-head">
          ${thumb}
          <div>
            <span class="oid">${escapeHtml(o.id)} · ${escapeHtml(o.type)}</span>
            <span class="otitle">${escapeHtml(o.title)}</span>
            <p class="oblurb">${escapeHtml(o.blurb || "")}</p>
            <p class="object-hint">Click to unfold</p>
          </div>
        </div>
      </summary>
      <div class="object-unfold">
        ${unfoldMedia}
        ${unfoldText}
        ${source}
      </div>
    </details>
  </li>`;
}

function stripMarkdownLite(md) {
  return String(md)
    .replace(/^#.+\n+/gm, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^---\n+/gm, "")
    .trim();
}

function openLightbox(src, caption) {
  if (!src) return;
  document.getElementById("lightbox-img").src = src;
  document.getElementById("lightbox-caption").textContent = caption || "";
  document.getElementById("lightbox").hidden = false;
}

function closeLightbox() {
  document.getElementById("lightbox").hidden = true;
  document.getElementById("lightbox-img").removeAttribute("src");
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
  const people = getPeople();
  visible = defaultVisible(people, getFocusId());
  nodePos.clear();
  selectedId = getFocusId();
  render();
  selectPerson(getFocusId());
  setTimeout(fitView, 450);
}

function buildLegend() {
  const gens = [...new Set(simulation.nodes().map((n) => n.generation))].sort((a, b) => a - b);
  legend.innerHTML =
    gens
      .map((g) => {
        const c = GEN_COLORS[g] || GEN_COLORS[0];
        return `<span><i class="swatch" style="--c:${c.fill}"></i>${escapeHtml(c.label)}</span>`;
      })
      .join("") + `<span><i class="swatch ring"></i>Curved · marriage / descent</span>`;
}

function resize() {
  const rect = svg.node().getBoundingClientRect();
  width = rect.width;
  height = rect.height;
  svg.attr("viewBox", `0 0 ${width} ${height}`);
  if (visible.size) {
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
document.getElementById("lightbox").addEventListener("click", (e) => {
  if (e.target.id === "lightbox" || e.target.id === "lightbox-caption") closeLightbox();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeLightbox();
});

document.getElementById("btn-reset").addEventListener("click", resetFocus);
document.getElementById("btn-fit").addEventListener("click", fitView);

const physicsEl = document.getElementById("toggle-physics");
if (physicsEl) {
  physicsEl.addEventListener("change", (e) => {
    physicsOn = e.target.checked;
    render();
  });
}

async function boot() {
  try {
    await loadPeopleIndex();
    const people = getPeople();
    visible = defaultVisible(people, getFocusId());
    document.querySelector(".lede").textContent =
      `Shorts / Anderson · physics graph · collection/people · focus ${
        people[getFocusId()]?.name || getFocusId()
      }`;
    resize();
    selectPerson(getFocusId());
    setTimeout(fitView, 550);
  } catch (err) {
    console.error(err);
    panel.hidden = false;
    panelBody.innerHTML = `<p class="summary">Could not load people index. Use <code>npm run prototype:tree</code> from repo root.</p><pre class="object-body">${escapeHtml(
      String(err)
    )}</pre>`;
  }
}

window.addEventListener("resize", resize);
boot();
