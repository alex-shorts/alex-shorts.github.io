/**
 * Pedigree layout — one system, not stacked heuristics.
 *
 * 1. Tag: ahnentafel, extra spouses step back, collateral siblings sprawl.
 * 2. Units: parents of a visible child are one unit (married or not);
 *    leftover spouses pair next; leftover people are singles.
 * 3. Sugiyama x: pack the focus row, then barycenter each other row on
 *    the adjacent row (line children/parents first). Unknowns interpolate.
 *    Never seed a binary fan and never park leftovers at maxX.
 * 4. Child edges: cubic from the nearest point on the parent couple bar.
 *
 * Classic script + CommonJS so file:// and `node check-branch-sides.mjs` work.
 */
(function (root) {
  function resolveMetrics(m = {}) {
    const CARD_W = m.CARD_W ?? 88;
    const CARD_H = m.CARD_H ?? 112;
    const SPOUSE_GAP = CARD_W - 6;
    const MIN_X_GAP = CARD_W + 20;
    return {
      CARD_W,
      CARD_H,
      SPOUSE_GAP,
      MIN_X_GAP,
      ENDED_SPOUSE_GAP: MIN_X_GAP,
      PRIOR_SPOUSE_GAP: CARD_W + 52,
      STEP_BACK_DY: 56,
      STEP_BACK_SCALE: m.STEP_BACK_SCALE ?? 0.78,
      FAMILY_GAP: CARD_W + 56,
      SPRAWL_GAP: CARD_W + 18,
    };
  }

  function median(xs) {
    if (!xs.length) return NaN;
    const s = xs.slice().sort((a, b) => a - b);
    const mid = Math.floor(s.length / 2);
    return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
  }

  function mean(xs) {
    return xs.reduce((a, b) => a + b, 0) / xs.length;
  }

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
    const multi = (a?.spouses || []).length > 1 || (b?.spouses || []).length > 1;
    return multi && !shareChildren(aId, bId, people);
  }

  function unionGap(aId, bId, people, metrics) {
    const M = resolveMetrics(metrics);
    if (!areSpouses(aId, bId, people)) {
      return shareChildren(aId, bId, people) ? M.ENDED_SPOUSE_GAP : M.MIN_X_GAP;
    }
    if (!spouseLinkEnded(aId, bId, people)) return M.SPOUSE_GAP;
    return shareChildren(aId, bId, people) ? M.ENDED_SPOUSE_GAP : M.PRIOR_SPOUSE_GAP;
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

  function pickSpousePartner(personId, candidateIds, people) {
    const score = (sid) => {
      const shared = shareChildren(personId, sid, people);
      const overlap = isOverlapUnion(personId, sid, people);
      if (shared && overlap) return 4;
      if (shared) return 3;
      if (overlap) return 2;
      return 0;
    };
    return candidateIds
      .slice()
      .sort((a, b) => score(b) - score(a) || a.localeCompare(b))
      .find((sid) => score(sid) > 0);
  }

  /** Visible co-parent of a visible child displaces other spouses into step-back. */
  function isExtraSpouse(hostId, spouseId, people, visible) {
    if (isPriorSpouse(hostId, spouseId, people)) return true;
    for (const cid of people[hostId]?.children || []) {
      if (!visible.has(cid)) continue;
      const other = (people[cid]?.parents || []).find((p) => p !== hostId);
      if (other && other !== spouseId && visible.has(other)) return true;
    }
    return false;
  }

  function pedigreeSide(key) {
    let k = Math.floor(key);
    if (!k || k === 1) return 0;
    while (k > 3) k = Math.floor(k / 2);
    if (k === 2) return -1;
    if (k === 3) return 1;
    return 0;
  }

  function pedigreeOrderMap(focusId, people, idSet) {
    const order = new Map();
    const foci = Array.isArray(focusId) ? focusId : [focusId];
    let seed = 1;
    for (const fid of foci) {
      if (!idSet.has(fid) || order.has(fid)) continue;
      order.set(fid, seed);
      const queue = [fid];
      while (queue.length) {
        const id = queue.shift();
        const o = order.get(id);
        const pars = people[id]?.parents || [];
        if (pars[0] && idSet.has(pars[0]) && !order.has(pars[0])) {
          order.set(pars[0], o * 2);
          queue.push(pars[0]);
        }
        if (pars[1] && idSet.has(pars[1]) && !order.has(pars[1])) {
          order.set(pars[1], o * 2 + 1);
          queue.push(pars[1]);
        }
      }
      const max = Math.max(0, ...order.values());
      seed = 2 ** Math.ceil(Math.log2(max + 1));
    }
    let guard = idSet.size;
    while (guard-- > 0) {
      let added = false;
      for (const id of idSet.keys()) {
        if (order.has(id)) continue;
        for (const sid of people[id]?.spouses || []) {
          if (!order.has(sid)) continue;
          order.set(id, order.get(sid) + 0.25);
          added = true;
          break;
        }
      }
      if (!added) break;
    }
    return order;
  }

  function unitPedigreeKey(u) {
    const a = u.left.pedigreeOrder;
    const b = u.couple ? u.right.pedigreeOrder : a;
    return Math.min(a, b);
  }

  function unitBranchSide(u) {
    const sides = [u.left.branchSide];
    if (u.couple) sides.push(u.right.branchSide);
    if (sides.every((s) => s < 0)) return -1;
    if (sides.every((s) => s > 0)) return 1;
    return 0;
  }

  function unitHalf(u, M) {
    return u.couple ? (u.gap || M.SPOUSE_GAP) / 2 : 0;
  }

  function seatCouple(a, b, people, line, M) {
    const oa = a.pedigreeOrder ?? Number.POSITIVE_INFINITY;
    const ob = b.pedigreeOrder ?? Number.POSITIVE_INFINITY;
    let left;
    let right;
    if (oa !== ob && Number.isFinite(oa) && Number.isFinite(ob)) {
      left = oa <= ob ? a : b;
      right = left === a ? b : a;
    } else if (line.has(a.id) && !line.has(b.id)) {
      left = a;
      right = b;
    } else if (line.has(b.id) && !line.has(a.id)) {
      left = b;
      right = a;
    } else {
      left = a.id < b.id ? a : b;
      right = left === a ? b : a;
    }
    const gap = unionGap(left.id, right.id, people, M);
    return { left, right, couple: true, gap, overlap: gap < M.MIN_X_GAP };
  }

  /** Parent pair of a visible child first; leftover spouses; then singles. */
  function coupleUnits(group, people, line, M) {
    const used = new Set();
    const units = [];
    const inGen = new Map(group.map((n) => [n.id, n]));

    const pairs = [];
    for (const n of group) {
      for (const cid of people[n.id]?.children || []) {
        const pars = (people[cid]?.parents || []).filter((p) => inGen.has(p));
        if (pars.length < 2) continue;
        pairs.push({
          a: pars[0],
          b: pars[1],
          line: line.has(cid),
          child: cid,
        });
      }
    }
    pairs.sort(
      (a, b) =>
        Number(b.line) - Number(a.line) || String(a.child).localeCompare(b.child)
    );
    for (const pair of pairs) {
      if (used.has(pair.a) || used.has(pair.b)) continue;
      units.push(seatCouple(inGen.get(pair.a), inGen.get(pair.b), people, line, M));
      used.add(pair.a);
      used.add(pair.b);
    }

    for (const n of group) {
      if (used.has(n.id)) continue;
      const candidates = (people[n.id]?.spouses || []).filter(
        (s) => inGen.has(s) && !used.has(s)
      );
      const spouseId = pickSpousePartner(n.id, candidates, people);
      if (spouseId) {
        units.push(seatCouple(n, inGen.get(spouseId), people, line, M));
        used.add(n.id);
        used.add(spouseId);
      } else {
        used.add(n.id);
        units.push({ left: n, right: n, couple: false, gap: 0, overlap: false });
      }
    }

    units.sort(
      (a, b) =>
        unitBranchSide(a) - unitBranchSide(b) ||
        unitPedigreeKey(a) - unitPedigreeKey(b) ||
        a.left.id.localeCompare(b.left.id)
    );
    units.forEach((u, i) => (u.order = i));
    return units;
  }

  function placeUnitsToIdeals(units, M, gap) {
    if (!units?.length) return;
    const sepGap = gap ?? M.FAMILY_GAP;
    const mids = units.map((u) => {
      const fall = (u.left.x + u.right.x) / 2;
      return Number.isFinite(u.ideal) ? u.ideal : fall;
    });
    const minSep = (a, b) => unitHalf(a, M) + sepGap + unitHalf(b, M);
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
        const coupleGap = u.gap || M.SPOUSE_GAP;
        u.left.x = mids[i] - coupleGap / 2;
        u.right.x = mids[i] + coupleGap / 2;
      } else {
        u.left.x = mids[i];
      }
    });
  }

  function recenterUnitsOnIdeals(units) {
    const anchored = units.filter((u) => Number.isFinite(u.ideal));
    if (!anchored.length) return;
    const cur = mean(anchored.map((u) => (u.left.x + u.right.x) / 2));
    const want = mean(anchored.map((u) => u.ideal));
    const shift = want - cur;
    if (!Number.isFinite(shift) || Math.abs(shift) < 1) return;
    for (const u of units) {
      u.left.x += shift;
      if (u.couple) u.right.x += shift;
    }
  }

  function layoutLayers(nodes, people, line, focusId, M) {
    for (const n of nodes) n.x = 0;

    const byGen = new Map();
    for (const n of nodes) {
      if (!byGen.has(n.generation)) byGen.set(n.generation, []);
      byGen.get(n.generation).push(n);
    }
    const gens = [...byGen.keys()].sort((a, b) => a - b);
    if (!gens.length) return;

    const unitsByGen = new Map();
    const unitOf = new Map();
    for (const g of gens) {
      const units = coupleUnits(byGen.get(g), people, line, M);
      units.forEach((u) => {
        unitOf.set(u.left.id, u);
        if (u.couple) unitOf.set(u.right.id, u);
      });
      unitsByGen.set(g, units);
    }

    function personX(id) {
      const u = unitOf.get(id);
      if (!u) return 0;
      return u.left.id === id ? u.left.x : u.right.x;
    }

    function relatedXs(unit, field) {
      const all = [];
      const spine = [];
      for (const member of unit.couple ? [unit.left, unit.right] : [unit.left]) {
        for (const id of people[member.id]?.[field] || []) {
          if (!unitOf.has(id)) continue;
          const x = personX(id);
          all.push(x);
          if (line.has(id)) spine.push(x);
        }
      }
      return spine.length ? spine : all;
    }

    function fillIdeals(units) {
      for (let i = 0; i < units.length; i++) {
        if (Number.isFinite(units[i].ideal)) continue;
        let L = i - 1;
        while (L >= 0 && !Number.isFinite(units[L].ideal)) L -= 1;
        let R = i + 1;
        while (R < units.length && !Number.isFinite(units[R].ideal)) R += 1;
        if (L >= 0 && R < units.length) {
          units[i].ideal =
            units[L].ideal + ((i - L) / (R - L)) * (units[R].ideal - units[L].ideal);
        } else if (L >= 0) units[i].ideal = units[L].ideal;
        else if (R < units.length) units[i].ideal = units[R].ideal;
        else units[i].ideal = 0;
      }
    }

    function orderCrossings(band, field) {
      const edges = [];
      band.forEach((u, i) => {
        for (const x of relatedXs(u, field)) edges.push([i, x]);
      });
      let n = 0;
      for (let i = 0; i < edges.length; i++) {
        for (let j = i + 1; j < edges.length; j++) {
          if ((edges[i][0] - edges[j][0]) * (edges[i][1] - edges[j][1]) < 0) n += 1;
        }
      }
      return n;
    }

    function reduceCrossings(band, field) {
      let improved = true;
      while (improved) {
        improved = false;
        for (let i = 0; i < band.length - 1; i++) {
          const before = orderCrossings(band, field);
          const tmp = band[i];
          band[i] = band[i + 1];
          band[i + 1] = tmp;
          if (orderCrossings(band, field) < before) improved = true;
          else {
            band[i + 1] = band[i];
            band[i] = tmp;
          }
        }
      }
    }

    function relatedUnitKey(unit, field) {
      let fallback = null;
      for (const member of unit.couple ? [unit.left, unit.right] : [unit.left]) {
        for (const id of people[member.id]?.[field] || []) {
          const tu = unitOf.get(id);
          if (!tu) continue;
          const key = tu.couple
            ? [tu.left.id, tu.right.id].sort().join("|")
            : tu.left.id;
          if (line.has(id)) return key;
          if (!fallback) fallback = key;
        }
      }
      return fallback;
    }

    /** Pack units that share a child-couple over that couple; other families stay their own blocks. */
    function placeClusters(units, field) {
      const buckets = new Map();
      const order = [];
      units.forEach((u, i) => {
        const key = relatedUnitKey(u, field) || `#${i}:${u.left.id}`;
        if (!buckets.has(key)) {
          buckets.set(key, []);
          order.push(key);
        }
        buckets.get(key).push(u);
      });
      const clusters = order.map((key) => {
        const group = buckets.get(key);
        placeUnitsToIdeals(group, M, M.MIN_X_GAP);
        recenterUnitsOnIdeals(group);
        const mids = group.map((u) => (u.left.x + u.right.x) / 2);
        const have = mean(mids);
        const wants = group.map((u) => u.ideal).filter(Number.isFinite);
        const want = wants.length ? mean(wants) : have;
        const span = Math.max(...mids) - Math.min(...mids);
        return {
          group,
          have,
          want,
          leftHalf: unitHalf(group[0], M) + span / 2,
          rightHalf: unitHalf(group[group.length - 1], M) + span / 2,
        };
      });
      clusters.sort((a, b) => a.want - b.want || a.group[0].left.id.localeCompare(b.group[0].left.id));
      const smids = clusters.map((c) => c.want);
      for (let i = 1; i < clusters.length; i++) {
        const sep = clusters[i - 1].rightHalf + M.FAMILY_GAP + clusters[i].leftHalf;
        if (smids[i] < smids[i - 1] + sep) smids[i] = smids[i - 1] + sep;
      }
      for (let i = clusters.length - 2; i >= 0; i--) {
        const sep = clusters[i].rightHalf + M.FAMILY_GAP + clusters[i + 1].leftHalf;
        if (smids[i] > smids[i + 1] - sep) smids[i] = smids[i + 1] - sep;
      }
      const wantMean = mean(clusters.map((c) => c.want));
      const haveMean = mean(smids);
      const shift = wantMean - haveMean;
      clusters.forEach((c, i) => {
        const dx = smids[i] + shift - c.have;
        for (const u of c.group) {
          u.left.x += dx;
          if (u.couple) u.right.x += dx;
        }
      });
      const flat = clusters.flatMap((c) => c.group);
      units.length = 0;
      units.push(...flat);
      units.forEach((u, i) => (u.order = i));
    }

    function packRow(units, field) {
      if (!units?.length) return;
      for (const u of units) {
        const xs = relatedXs(u, field);
        u.ideal = xs.length ? median(xs) : NaN;
      }
      units.sort((a, b) => {
        const ia = Number.isFinite(a.ideal);
        const ib = Number.isFinite(b.ideal);
        if (ia && ib && a.ideal !== b.ideal) return a.ideal - b.ideal;
        return (
          unitBranchSide(a) - unitBranchSide(b) ||
          unitPedigreeKey(a) - unitPedigreeKey(b) ||
          a.left.id.localeCompare(b.left.id)
        );
      });
      fillIdeals(units);
      reduceCrossings(units, field);
      fillIdeals(units);
      units.forEach((u, i) => (u.order = i));
      placeClusters(units, field);
    }

    function packFocus(units, id) {
      if (!units?.length) return;
      units.sort(
        (a, b) =>
          unitBranchSide(a) - unitBranchSide(b) ||
          unitPedigreeKey(a) - unitPedigreeKey(b) ||
          a.left.id.localeCompare(b.left.id)
      );
      let cursor = 0;
      for (const u of units) {
        u.ideal = cursor + unitHalf(u, M);
        cursor += unitHalf(u, M) * 2 + M.FAMILY_GAP;
      }
      placeUnitsToIdeals(units, M, M.FAMILY_GAP);
      const fu = units.find((u) => u.left.id === id || (u.couple && u.right.id === id));
      const fx = fu ? (fu.left.id === id ? fu.left.x : fu.right.x) : 0;
      for (const u of units) {
        u.left.x -= fx;
        if (u.couple) u.right.x -= fx;
      }
    }

    const focusGen =
      nodes.find((n) => n.id === focusId)?.generation ?? gens[gens.length - 1];
    const focusIdx = gens.indexOf(focusGen);
    packFocus(unitsByGen.get(focusGen) || [], focusId);

    for (let pass = 0; pass < 4; pass++) {
      for (let gi = focusIdx - 1; gi >= 0; gi--) {
        packRow(unitsByGen.get(gens[gi]), "children");
      }
      for (let gi = focusIdx + 1; gi < gens.length; gi++) {
        packRow(unitsByGen.get(gens[gi]), "parents");
      }
    }
  }

  /** Closest x on the parent couple bar to the child — never a detour outside the couple. */
  function hangX(parents, childX) {
    if (!parents.length) return childX;
    if (parents.length === 1) return parents[0].x;
    const lo = Math.min(parents[0].x, parents[1].x);
    const hi = Math.max(parents[0].x, parents[1].x);
    if (childX < lo) return lo;
    if (childX > hi) return hi;
    return (lo + hi) / 2;
  }

  /** Smooth cubic; hangX already picks the nearest point on the couple bar. */
  function childPath(ox, oy, tx, ty) {
    const gap = Math.max(24, ty - oy);
    const dy = Math.max(40, gap * 0.55);
    return `M${ox},${oy} C${ox},${oy + dy} ${tx},${ty - dy} ${tx},${ty}`;
  }

  function childAnchor(link, byId, metrics) {
    const M = resolveMetrics(metrics);
    const child = byId.get(typeof link.target === "object" ? link.target.id : link.target);
    if (!child) return null;
    const ty = child.y - M.CARD_H / 2;
    if (link.union) {
      const a = byId.get(link.union[0]);
      const b = byId.get(link.union[1]);
      if (!a || !b) return null;
      return {
        x: hangX([a, b], child.x),
        y: (a.y + b.y) / 2 + M.CARD_H / 2,
        tx: child.x,
        ty,
      };
    }
    const parent = byId.get(typeof link.source === "object" ? link.source.id : link.source);
    if (!parent) return null;
    return { x: parent.x, y: parent.y + M.CARD_H / 2, tx: child.x, ty };
  }

  function childLinks(nodes, people) {
    const idSet = new Set(nodes.map((n) => n.id));
    const links = [];
    const seen = new Set();
    for (const node of nodes) {
      const pars = (people[node.id]?.parents || []).filter((p) => idSet.has(p));
      if (pars.length >= 2 && (areSpouses(pars[0], pars[1], people) || shareChildren(pars[0], pars[1], people))) {
        const key = `child:${[pars[0], pars[1]].sort().join("|")}->${node.id}`;
        if (seen.has(key)) continue;
        seen.add(key);
        links.push({
          source: pars[0],
          target: node.id,
          kind: "child",
          union: [pars[0], pars[1]],
        });
        continue;
      }
      for (const pid of pars) {
        const key = `child:${pid}->${node.id}`;
        if (seen.has(key)) continue;
        seen.add(key);
        links.push({ source: pid, target: node.id, kind: "child", union: null });
      }
    }
    return links;
  }

  function countChildEdgeCrossings(nodes, people) {
    const byId = new Map(nodes.map((n) => [n.id, n]));
    const edges = [];
    for (const link of childLinks(nodes, people)) {
      const child = byId.get(link.target);
      if (!child || child.stepBack || child.stackHost) continue;
      let x0;
      let g0;
      if (link.union) {
        const a = byId.get(link.union[0]);
        const b = byId.get(link.union[1]);
        if (!a || !b) continue;
        if (a.stepBack || b.stepBack || a.stackHost || b.stackHost) continue;
        x0 = hangX([a, b], child.x);
        g0 = (a.generation + b.generation) / 2;
      } else {
        const p = byId.get(link.source);
        if (!p || p.stepBack || p.stackHost) continue;
        x0 = p.x;
        g0 = p.generation;
      }
      if (g0 === child.generation) continue;
      edges.push({ x0, x1: child.x, g0, g1: child.generation });
    }
    let crosses = 0;
    for (let i = 0; i < edges.length; i++) {
      for (let j = i + 1; j < edges.length; j++) {
        const a = edges[i];
        const b = edges[j];
        const aMin = Math.min(a.g0, a.g1);
        const aMax = Math.max(a.g0, a.g1);
        const bMin = Math.min(b.g0, b.g1);
        const bMax = Math.max(b.g0, b.g1);
        if (aMax <= bMin || bMax <= aMin) continue;
        if ((a.x0 - b.x0) * (a.x1 - b.x1) < 0) crosses += 1;
      }
    }
    return crosses;
  }

  /**
   * Mutates nodes: x/y, targetX/Y, pedigree flags, stepBack, stackHost.
   * Focus sits at x=0; caller shifts to the viewport.
   */
  function layoutTree(nodes, people, focusId, opts = {}) {
    const M = resolveMetrics(opts.metrics);
    const genY = opts.genY || ((g) => g * (M.CARD_H + 72));
    const line = opts.line || new Set();
    const byId = new Map(nodes.map((n) => [n.id, n]));
    const visible = new Set(byId.keys());
    const pedOrder = pedigreeOrderMap(opts.foci?.length ? opts.foci : focusId, people, byId);

    for (const n of nodes) {
      n.y = genY(n.generation);
      n.vy = 0;
      n.vx = 0;
      n.onDirectLine = line.has(n.id);
      n.lineRelevant =
        line.has(n.id) || (people[n.id]?.spouses || []).some((sid) => line.has(sid));
      n.pedigreeOrder = pedOrder.get(n.id) ?? Number.POSITIVE_INFINITY;
      n.branchSide = pedOrder.has(n.id) ? pedigreeSide(pedOrder.get(n.id)) : 0;
      n.stackHost = null;
      n.stackIndex = 0;
      n.stackCount = 0;
      n.stackCollapsed = false;
      n.sprawled = false;
      n.stepBackHost = null;
      n.stepBackIndex = 0;
      n.stepBack = false;
    }

    // Only blood-line people host extra spouses. A remarried line parent
    // (Kate × William) must not tuck *herself* beside the later husband.
    for (const n of nodes) {
      if (!line.has(n.id)) continue;
      const visibleSpouses = (people[n.id]?.spouses || []).filter((sid) => byId.has(sid));
      let idx = 0;
      for (const sid of visibleSpouses) {
        const s = byId.get(sid);
        if (!s || s.stepBackHost || line.has(sid)) continue;
        if (!isExtraSpouse(n.id, sid, people, visible)) continue;
        s.stepBackHost = n.id;
        s.stepBackIndex = ++idx;
      }
    }

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

    layoutLayers(
      nodes.filter((n) => !n.stackHost && !n.stepBackHost),
      people,
      line,
      focusId,
      M
    );

    for (const n of nodes) {
      if (n.stackHost || n.stepBackHost) continue;
      n.y = genY(n.generation);
      n.targetX = n.x;
      n.targetY = n.y;
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

    const parentNudgeGens = new Set();
    for (const n of nodes) {
      if (!n.stepBackHost) continue;
      const host = byId.get(n.stepBackHost);
      if (!host) continue;
      const dir = sideAwayFromPrimary(host);
      n.x = host.x + dir * M.PRIOR_SPOUSE_GAP * n.stepBackIndex;
      n.y = genY(n.generation) + M.STEP_BACK_DY;
      n.stepBack = true;
      n.targetX = n.x;
      n.targetY = n.y;
      n.vx = 0;
      n.vy = 0;

      const pars = (people[n.id]?.parents || []).map((id) => byId.get(id)).filter(Boolean);
      if (!pars.length) continue;
      const parkParent = (p, x) => {
        p.x = x;
        p.y = genY(p.generation) + M.STEP_BACK_DY * 0.45;
        p.stepBack = true;
        p.targetX = p.x;
        p.targetY = p.y;
        p.vx = 0;
        p.vy = 0;
        parentNudgeGens.add(p.generation);
      };
      if (pars.length >= 2) {
        const gap = unionGap(pars[0].id, pars[1].id, people, M);
        const visualGap = gap * M.STEP_BACK_SCALE;
        const left = pars[0].x <= pars[1].x ? pars[0] : pars[1];
        const right = left === pars[0] ? pars[1] : pars[0];
        parkParent(left, n.x - visualGap / 2);
        parkParent(right, n.x + visualGap / 2);
      } else {
        parkParent(pars[0], n.x);
      }
    }

    for (const g of parentNudgeGens) {
      const group = nodes.filter(
        (n) => n.generation === g && !n.stackHost && !n.stepBackHost && !n.stepBack
      );
      if (group.length < 2) continue;
      const units = coupleUnits(group, people, line, M);
      for (const u of units) u.ideal = (u.left.x + u.right.x) / 2;
      placeUnitsToIdeals(units, M);
      for (const u of units) {
        for (const p of u.couple ? [u.left, u.right] : [u.left]) {
          p.y = genY(p.generation);
          p.targetX = p.x;
          p.targetY = p.y;
        }
      }
    }

    for (const n of nodes) {
      if (!n.stackHost) continue;
      const host = byId.get(n.stackHost);
      if (!host) continue;
      n.sprawled = true;
      n.stackCollapsed = false;
      const dir = sideAwayFromPrimary(host);
      const priorCount = nodes.filter((p) => p.stepBackHost === host.id).length;
      n.x = host.x + dir * (M.PRIOR_SPOUSE_GAP * priorCount + M.SPRAWL_GAP * n.stackIndex);
      n.y = host.y;
      n.targetX = n.x;
      n.targetY = n.y;
      n.vx = 0;
      n.vy = 0;
    }

    for (const n of nodes) {
      if (line.has(n.id) && n.stepBackHost) {
        console.assert(false, `${n.id} is on the blood line but stepped back beside ${n.stepBackHost}`);
      }
    }

    return M;
  }

  const TreeLayout = {
    resolveMetrics,
    areSpouses,
    shareChildren,
    spouseLinkEnded,
    unionGap,
    isPriorSpouse,
    isOverlapUnion,
    isExtraSpouse,
    pickSpousePartner,
    pedigreeSide,
    pedigreeOrderMap,
    layoutTree,
    childLinks,
    childPath,
    childAnchor,
    hangX,
    countChildEdgeCrossings,
  };

  if (typeof module !== "undefined" && module.exports) module.exports = TreeLayout;
  root.TreeLayout = TreeLayout;
})(typeof globalThis !== "undefined" ? globalThis : this);
