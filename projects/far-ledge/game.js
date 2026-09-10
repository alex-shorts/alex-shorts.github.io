/* Far Ledge — Mario Teaches Typing controls, Prince-weight jumps. Brand-new browser build. */
(() => {
  const VIEW = { w: 1280, h: 720 };
  const FLOOR = 384;
  const ROOM_N = 8;
  const WORLD_W = VIEW.w * ROOM_N;
  const JOIN = 96;
  const HI = 252;
  const MID = 384;
  const LOW = 520;
  const SPIKE_Y = 668;
  const ROOM_FLOOR_NATIVE = [535, 573, 548, 573, 597, 516, 570, 545];
  const ROOM_FLOOR_TARGET = [384, 384, 384, 384, 416, 384, 384, 384];
  const ROOM_DY = ROOM_FLOOR_NATIVE.map((fy, i) =>
    Math.round(ROOM_FLOOR_TARGET[i] - fy * (VIEW.h / 1024))
  );
  const BODY = {
    w: 52,
    h: 156,
    walk: 210,
    run: 340,
    sprint: 420,
    gravity: 1850,
    maxFall: 1050,
    stand: { vx: 230, vy: -560 },
    runJ: { vx: 500, vy: -740 },
    sprintJ: { vx: 580, vy: -800 },
    coyote: 0.12,
    air: 0.72,
    hangMs: 560,
    lip: 46,
  };
  const KIND = {
    leap: { label: "Leap", verb: "Leap!", coach: "Last digit leaps the pit." },
    climb: { label: "Climb", verb: "Climb!", coach: "Digits climb. Last digit pulls up." },
    crawl: { label: "Crawl", verb: "Crawl!", coach: "Stay low. Last digit stands on the far side." },
    slide: { label: "Slide", verb: "Slide!", coach: "Last digit slides down." },
    swing: { label: "Swing", verb: "Swing!", coach: "Last digit grabs the bar and swings." },
  };

  // Palace run: traced from the painted halls. Leaps only.
  const LEDGE_SRC = [
    [0, 0, 364, 346], [0, 424, 382, 67], [0, 568, 382, 141], [0, 879, 367, 401],
    [1, 0, 363, 228], [1, 283, 383, 89], [1, 438, 383, 81], [1, 592, 383, 75], [1, 741, 383, 78], [1, 889, 383, 86], [1, 1035, 363, 245],
    [2, 0, 370, 285], [2, 367, 369, 98], [2, 560, 384, 222], [2, 936, 383, 344],
    [3, 0, 379, 291], [3, 387, 381, 107], [3, 585, 381, 99], [3, 783, 381, 106], [3, 987, 379, 293],
    [4, 31, 408, 185], [4, 292, 394, 115], [4, 550, 394, 48], [4, 769, 394, 58], [4, 1096, 394, 171],
    [5, 0, 369, 220], [5, 277, 380, 84], [5, 441, 380, 80], [5, 602, 380, 78], [5, 760, 380, 80], [5, 920, 380, 84], [5, 1055, 365, 225],
    [6, 0, 384, 480], [6, 800, 384, 480],
    [7, 0, 363, 389], [7, 451, 377, 193], [7, 807, 363, 473],
  ];

  const ledges0 = LEDGE_SRC.map(([room, x, y, w]) => {
    const left = room * VIEW.w + x;
    return { room, x: left, y, w, left, right: left + w, top: y };
  });
  function offsetLedge(l, off) {
    return { ...l, x: l.x + off, left: l.left + off, right: l.right + off };
  }
  function ledgesNear(wx) {
    const lap0 = Math.floor(wx / WORLD_W);
    const out = [];
    for (let L = Math.max(0, lap0 - 1); L <= lap0 + 1; L++) {
      const off = L * WORLD_W;
      for (const l of ledges0) out.push(offsetLedge(l, off));
    }
    return out;
  }

  function walkableLedge(x, y) {
    let best = null;
    for (const l of ledgesNear(x)) {
      if (x < l.left - 4 || x > l.right + 4) continue;
      if (Math.abs(y - l.y) > 56) continue;
      if (!best || l.w < best.w) best = l;
    }
    return best;
  }

  function clampOnLedge(x, y, toLip) {
    const l = walkableLedge(x, y) || walkableLedge(p.x, y);
    if (!l) return x;
    return clamp(x, l.left + 10, l.right - (toLip ? 6 : 14));
  }

  const traps = [];
  function alongPath(path, u) {
    if (!path || path.length < 1) return { x: 0, y: MID };
    if (path.length === 1) return { x: path[0].x, y: path[0].y };
    u = clamp(u, 0, 1);
    let total = 0;
    const segs = [];
    for (let i = 1; i < path.length; i++) {
      const d = Math.hypot(path[i].x - path[i - 1].x, path[i].y - path[i - 1].y);
      segs.push(d);
      total += d;
    }
    if (total < 1) return { x: path[path.length - 1].x, y: path[path.length - 1].y };
    let dist = u * total;
    for (let i = 1; i < path.length; i++) {
      const d = segs[i - 1];
      if (dist <= d || i === path.length - 1) {
        const uu = d < 1e-4 ? 1 : clamp(dist / d, 0, 1);
        return {
          x: lerp(path[i - 1].x, path[i].x, uu),
          y: lerp(path[i - 1].y, path[i].y, uu),
        };
      }
      dist -= d;
    }
    return { x: path[path.length - 1].x, y: path[path.length - 1].y };
  }
  function landPoint(a, b) {
    return { x: b.left + clamp(b.w * 0.4, 18, Math.max(20, b.w - 12)), y: b.y };
  }
  function addMove(kind, ai, bi, extra) {
    extra = extra || {};
    const a = ledges0[ai];
    const b = ledges0[bi];
    const takeoffX = extra.ropeX != null ? extra.ropeX : Math.max(a.left + 16, a.right - 64);
    const runupX = Math.max(a.left + 16, Math.min(takeoffX, takeoffX - Math.min(180, Math.max(24, a.w * 0.4))));
    const land = landPoint(a, b);
    let path;
    if (kind === "climb") {
      path = [
        { x: runupX, y: a.y },
        { x: extra.ropeX, y: a.y },
        { x: extra.ropeX, y: b.y + 8 },
      ];
    } else if (kind === "crawl") {
      path = [
        { x: runupX, y: a.y },
        { x: a.right - 10, y: a.y },
        { x: b.left + 16, y: b.y },
      ];
    } else {
      path = [
        { x: runupX, y: a.y },
        { x: takeoffX, y: a.y },
      ];
    }
    traps.push({
      id: `t${traps.length}`,
      kind,
      style: extra.style || "leap",
      from: a,
      to: b,
      gapLeft: a.right,
      gapRight: b.left,
      gapW: b.left - a.right,
      takeoffX,
      runupX,
      takeoffY: a.y,
      ropeX: extra.ropeX,
      barX: extra.barX,
      barY: extra.barY,
      barLen: extra.barLen || BODY.h * 0.95,
      beamY: extra.beamY,
      path,
      land,
      cleared: false,
    });
  }
  for (let i = 0; i < ledges0.length - 1; i++) {
    const a = ledges0[i];
    const b = ledges0[i + 1];
    if (b.left - a.right >= 36) addMove("leap", i, i + 1);
  }

  const EASY = new Set([2, 5, 10]);
  const FAM_MID = new Set([3, 4, 6]);
  function makeFacts() {
    const items = [];
    for (let a = 1; a <= 12; a++) {
      for (let b = 1; b <= 12; b++) {
        items.push({ id: `${a}x${b}`, a, b, product: a * b, family: a, stem: `${a} × ${b}` });
      }
    }
    return items;
  }
  const ALL = makeFacts();
  const KNOW_KEY = "far-ledge-know-v1";
  function emptyKnow() {
    return { seen: {}, misses: {}, due: {}, typed: {} };
  }
  function loadKnow() {
    try {
      const raw = JSON.parse(localStorage.getItem(KNOW_KEY) || "{}");
      const b = emptyKnow();
      return {
        seen: { ...b.seen, ...raw.seen },
        misses: { ...b.misses, ...raw.misses },
        due: { ...b.due, ...raw.due },
        typed: { ...b.typed, ...raw.typed },
      };
    } catch {
      return emptyKnow();
    }
  }
  function writeKnow(k) {
    localStorage.setItem(KNOW_KEY, JSON.stringify(k));
    return k;
  }
  function typedN(s, id) {
    const v = s.typed[id];
    if (v === true) return 1;
    return Number(v) || 0;
  }
  function itemMastery(id) {
    const s = loadKnow();
    if (s.due[id]) return Math.max(0.12, 0.38 - 0.06 * Math.min(4, s.misses[id] || 1));
    const n = typedN(s, id);
    if (n >= 2) return 1;
    if (n === 1) return 0.62;
    if (s.seen[id]) return 0.4;
    if (s.misses[id]) return 0.22;
    return 0;
  }
  function markSeen(id) {
    const s = loadKnow();
    s.seen[id] = true;
    writeKnow(s);
  }
  function markTyped(id) {
    const s = loadKnow();
    s.typed[id] = typedN(s, id) + 1;
    s.seen[id] = true;
    delete s.due[id];
    s.misses[id] = 0;
    writeKnow(s);
  }
  function bumpMiss(id) {
    const s = loadKnow();
    s.misses[id] = (s.misses[id] || 0) + 1;
    s.due[id] = true;
    writeKnow(s);
  }
  function lerpKnow(t) {
    const u = Math.max(0, Math.min(1, t));
    const blue = [36, 92, 220];
    const green = [28, 176, 72];
    return `rgb(${blue.map((b, i) => Math.round(b + (green[i] - b) * u)).join(",")})`;
  }
  function inkKnow(t) {
    return t > 0.55 ? "#06140a" : "#fff6dc";
  }
  function bandKnow(t) {
    if (t >= 0.95) return "mastered";
    if (t >= 0.5) return "warm";
    if (t > 0.08) return "learning";
    return "unknown";
  }

  const due = [];
  const seen = new Set();
  let stage = 0;
  function stageOk(f) {
    if (stage === 0) return EASY.has(f.a) || EASY.has(f.b);
    if (stage === 1) return FAM_MID.has(f.a) || FAM_MID.has(f.b) || EASY.has(f.a);
    return true;
  }
  function nextFact() {
    const k = loadKnow();
    const dueId = Object.keys(k.due)[0];
    if (dueId) {
      const f = ALL.find((x) => x.id === dueId);
      if (f) {
        seen.add(f.id);
        return f;
      }
    }
    if (due.length) return due.shift();
    const pool = ALL.filter((f) => stageOk(f));
    const unseen = pool.filter((f) => typedN(k, f.id) === 0 && !k.seen[f.id]);
    const pickFrom = (unseen.length ? unseen : pool).slice();
    pickFrom.sort((a, b) => itemMastery(a.id) - itemMastery(b.id) + (Math.random() - 0.5) * 0.08);
    const pick = pickFrom[0] || ALL[Math.floor(Math.random() * ALL.length)];
    seen.add(pick.id);
    if (seen.size > 18) stage = Math.max(stage, 1);
    if (seen.size > 40) stage = 2;
    return pick;
  }

  const canvas = document.getElementById("view");
  const ctx = canvas.getContext("2d");
  const rooms = [];
  for (let i = 1; i <= 8; i++) {
    const img = new Image();
    img.src = `./assets/pits/pits-0${i}.png`;
    rooms.push(img);
  }
  const SKY = new Image();
  SKY.src = "./assets/halls/sky.png?v=look8";
  const SPR = {};
  const SPR_KEYS = ["idle", "rest", "gather", "start", "plant", "pass", "run2", "run0", "jump", "hang", "pull", "crouch"];
  for (const k of SPR_KEYS) {
    const img = new Image();
    img.src = "./assets/frames/" + k + ".png?v=look13";
    SPR[k] = img;
  }
  // One planted cycle per typed stride. gather is the small first step.
  const SPR_RUN = ["gather", "start", "plant", "pass", "run2"];

  function sprReady(img) {
    return img && img.complete && img.naturalWidth > 8;
  }

  function runCycleKeys() {
    return SPR_RUN.filter((k) => sprReady(SPR[k]));
  }

  function restSprite() {
    return sprReady(SPR.rest) ? SPR.rest : (sprReady(SPR.idle) ? SPR.idle : null);
  }

  function gaitPair() {
    const keys = runCycleKeys();
    if (!keys.length) return { a: restSprite(), b: null, k: 0 };
    const n = keys.length;
    const u = p.strideU < 1 ? smoother(p.strideU) : 1;
    const x = u * (n - 1);
    const i0 = Math.min(n - 1, Math.floor(x));
    const i1 = Math.min(n - 1, i0 + 1);
    return { a: SPR[keys[i0]], b: SPR[keys[i1]], k: x - i0 };
  }

  function posePair(st) {
    if (st === "run" || st === "sprint" || st === "walk") {
      const pair = gaitPair();
      if (p.strideFromIdle && p.strideU < 0.3) {
        const rest = restSprite();
        if (rest) return { a: rest, b: pair.a, k: smoother(p.strideU / 0.3) };
      }
      return pair;
    }
    if (st === "jump" || st === "fall") {
      const air = sprReady(SPR.jump) ? SPR.jump : SPR.run0;
      const crouch = sprReady(SPR.crouch) ? SPR.crouch : null;
      if (leapTime < 0.12 && crouch) return { a: crouch, b: air, k: clamp(leapTime / 0.12, 0, 1) };
      if (p.vy > 220 && crouch) return { a: air, b: crouch, k: clamp((p.vy - 220) / 520, 0, 0.75) };
      return { a: air, b: null, k: 0 };
    }
    if (st === "slide") {
      const low = sprReady(SPR.crouch) ? SPR.crouch : SPR.jump;
      return { a: low, b: sprReady(SPR.jump) ? SPR.jump : null, k: 0.35 };
    }
    if (st === "hang" || st === "swing") return { a: SPR.hang, b: null, k: 0 };
    if (st === "climb") {
      const hang = SPR.hang;
      const pull = SPR.pull;
      const k = p.featU < 1 ? clamp((p.featU - 0.35) / 0.5, 0, 1) : 1;
      return { a: hang, b: pull, k };
    }
    if (st === "pull") return { a: SPR.pull, b: SPR.hang, k: 0.15 };
    if (st === "crawl") return { a: SPR.crouch, b: null, k: 0 };
    if (st === "crouch" || st === "land" || st === "hitch") {
      const crouch = sprReady(SPR.crouch) ? SPR.crouch : restSprite();
      const rest = restSprite();
      if (st === "land" && p.landT < 0.18 && rest) return { a: crouch, b: rest, k: 1 - clamp(p.landT / 0.18, 0, 1) };
      return { a: crouch, b: null, k: 0 };
    }
    return { a: restSprite(), b: null, k: 0 };
  }

  function pickSprite(st, ph) {
    const pair = posePair(st);
    return pair.k > 0.5 && pair.b ? pair.b : pair.a;
  }

  function drawSprite(c, img, squash, facing, tilt, alpha) {
    if (!img || !sprReady(img)) return;
    const aMul = alpha == null ? 1 : alpha;
    if (aMul <= 0.02) return;
    const sc = BODY.h / img.naturalHeight;
    const w = img.naturalWidth * sc;
    const h = img.naturalHeight * sc;
    const sq = 1 + (squash - 1) * 0.18;
    const a = bodyAnchor(img);
    const hang = p.state === "hang" || p.state === "pull" || p.state === "climb" || p.state === "swing";
    const fx = hang && a.hx != null ? a.hx : a.fx;
    c.save();
    c.globalAlpha *= aMul;
    if (tilt) c.rotate(tilt);
    c.scale(facing, sq);
    c.drawImage(img, -fx * w, -a.fy * h, w, h);
    c.restore();
  }

  function drawSpriteBlend(c, pair, squash, facing, tilt) {
    if (!pair || !pair.a) return;
    const k = pair.b && sprReady(pair.b) ? clamp(pair.k, 0, 1) : 0;
    if (k < 0.08) {
      drawSprite(c, pair.a, squash, facing, tilt, 1);
      return;
    }
    if (k > 0.92) {
      drawSprite(c, pair.b, squash, facing, tilt, 1);
      return;
    }
    drawSprite(c, pair.a, squash, facing, tilt, 1 - k);
    drawSprite(c, pair.b, squash, facing, tilt, k);
  }

  function bodyAnchor(img) {
    if (img._anchor) return img._anchor;
    if (!sprReady(img)) return { fx: 0.5, fy: 0.98 };
    const cv = bodyAnchor.cv || (bodyAnchor.cv = document.createElement("canvas"));
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    cv.width = w;
    cv.height = h;
    const g = cv.getContext("2d", { willReadFrequently: true });
    g.clearRect(0, 0, w, h);
    g.drawImage(img, 0, 0);
    const data = g.getImageData(0, 0, w, h).data;
    let redX = 0, redN = 0, hipX = 0, hipN = 0, y1 = 0, yBoot = 0;
    let handX = 0, handN = 0;
    const yLo = Math.floor(h * 0.42);
    const yHi = Math.floor(h * 0.72);
    const yHandHi = Math.floor(h * 0.16);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        if (data[i + 3] < 48) continue;
        if (y > y1) y1 = y;
        const r = data[i], gb = data[i + 1], b = data[i + 2];
        const sash = r > gb + 35 && r > b + 35 && r > 90;
        if (!sash && y > yBoot) yBoot = y;
        if (y <= yHandHi) {
          handX += x;
          handN++;
        }
        if (y >= yLo && y <= yHi) {
          hipX += x;
          hipN++;
          if (sash) {
            redX += x;
            redN++;
          }
        }
      }
    }
    const fx = redN > 12 ? redX / redN / w : hipN ? hipX / hipN / w : 0.5;
    const fy = (yBoot > h * 0.55 ? yBoot : y1) / h;
    img._anchor = {
      fx,
      fy: fy > 0.4 ? fy : 0.98,
      hx: handN > 8 ? handX / handN / w : fx,
    };
    return img._anchor;
  }

  const COL = {
    skin: "#db9f6e",
    skinD: "#b87a4f",
    hair: "#140a08",
    vest: "#6b1e1a",
    vestL: "#9a3328",
    pants: "#f4eee0",
    pantsD: "#c9bfab",
    sash: "#b80d1a",
    sashL: "#e53a32",
    out: "#120805",
    slip: "#1e120c",
  };

  function lerp(a, b, u) { return a + (b - a) * u; }
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  function smoother(u) {
    u = clamp(u, 0, 1);
    return u * u * u * (u * (u * 6 - 15) + 10);
  }

  function heirPose(st, ph) {
    const t = ph * Math.PI * 2;
    const s = Math.sin(t);
    const c = Math.cos(t);
    if (st === "sprint" || st === "run") {
      const sp = st === "sprint";
      return {
        lean: (sp ? 0.55 : 0.38) + s * 0.07, bob: Math.abs(Math.sin(t * 2)) * (sp ? 11 : 8),
        head: -8 + s * 3.2,
        armF: -1.05 + c * 1.35, armB: 1.05 - c * 1.35,
        elbF: 0.62 + Math.max(0, -c) * 0.75, elbB: 0.62 + Math.max(0, c) * 0.75,
        legF: 0.48 + s * 0.92, legB: -0.42 - s * 0.88,
        kneeF: 0.7 + Math.max(0, -s) * 1.05, kneeB: 0.65 + Math.max(0, s) * 1.0,
        sash: 0.6 + Math.sin(t * 2) * 0.4, ribbon: 0.75 + s * 0.3, smile: 0.4,
      };
    }
    if (st === "walk") {
      return {
        lean: 0.12 + s * 0.04, bob: Math.abs(Math.sin(t * 2)) * 5, head: -2 + s * 1.6,
        armF: -0.42 + c * 0.78, armB: 0.42 - c * 0.78, elbF: 0.48, elbB: 0.48,
        legF: 0.28 + s * 0.62, legB: -0.24 - s * 0.58,
        kneeF: 0.42 + Math.max(0, -s) * 0.62, kneeB: 0.4 + Math.max(0, s) * 0.58,
        sash: 0.16 + Math.sin(t * 2) * 0.14, ribbon: 0.22 + s * 0.14, smile: 0.55,
      };
    }
    if (st === "jump") {
      const u = clamp(ph, 0, 1);
      return {
        lean: lerp(0.22, 0.08, u), bob: lerp(6, -18, u), head: lerp(2, -10, u),
        armF: lerp(0.55, -2.05, u), armB: lerp(-0.15, 0.7, u), elbF: lerp(0.85, 0.2, u), elbB: 0.38,
        legF: lerp(1.05, -0.55, u), legB: lerp(0.85, 0.15, u),
        kneeF: lerp(1.45, 0.28, u), kneeB: lerp(1.15, 0.45, u),
        sash: lerp(0.12, 0.7, u), ribbon: lerp(0.2, 1.05, u), smile: 0.85,
      };
    }
    if (st === "fall") {
      return {
        lean: 0.04, bob: 10, head: 8, armF: -1.25, armB: 1.35, elbF: 0.35, elbB: 0.4,
        legF: 0.45, legB: 0.7, kneeF: 0.7, kneeB: 0.85, sash: 0.5, ribbon: 0.9, smile: 0,
      };
    }
    if (st === "hang") {
      const sw = Math.sin(t);
      return {
        lean: sw * 0.04, bob: sw * 5, head: 8 + sw * 2,
        armF: -3.22, armB: -3.32, elbF: 0.12, elbB: 0.08,
        legF: 0.55 + sw * 0.12, legB: 0.4 - sw * 0.1, kneeF: 0.95, kneeB: 0.8,
        sash: 0.25 + sw * 0.12, ribbon: 0.35, smile: 0.25,
      };
    }
    if (st === "pull") {
      const u = clamp(ph, 0, 1);
      return {
        lean: lerp(-0.12, 0.14, u), bob: lerp(-8, 4, u), head: lerp(-8, 2, u),
        armF: lerp(-2.85, -0.9, u), armB: lerp(-2.95, -0.7, u),
        elbF: lerp(0.15, 0.7, u), elbB: lerp(0.12, 0.65, u),
        legF: lerp(0.85, 1.15, u), legB: lerp(0.45, 0.7, u),
        kneeF: lerp(1.35, 1.5, u), kneeB: lerp(0.7, 1.05, u),
        sash: 0.18, ribbon: 0.25, smile: 0.9,
      };
    }
    if (st === "land" || st === "crouch") {
      const crouch = st === "crouch";
      const u = crouch ? 0 : clamp(ph, 0, 1);
      return {
        lean: lerp(0.28, 0.12, u), bob: lerp(crouch ? 18 : 16, 4, u), head: lerp(6, 1, u),
        armF: lerp(0.85, 0.3, u), armB: lerp(-0.5, -0.2, u), elbF: 0.9, elbB: 0.7,
        legF: lerp(1.25, 0.25, u), legB: lerp(0.95, 0.12, u),
        kneeF: lerp(1.55, 0.3, u), kneeB: lerp(1.25, 0.22, u),
        sash: 0.2, ribbon: 0.3, smile: 0.5,
      };
    }
    if (st === "hitch") {
      return {
        lean: -0.08, bob: 6, head: 4, armF: 0.6, armB: -0.4, elbF: 0.8, elbB: 0.6,
        legF: 0.5, legB: 0.2, kneeF: 0.9, kneeB: 0.4, sash: 0.15, ribbon: 0.2, smile: 0.05,
      };
    }
    const br = Math.sin(t * 0.9);
    return {
      lean: 0.06, bob: br * 3.5, head: br * 2.2,
      armF: 0.22 + br * 0.08, armB: -0.18, elbF: 0.35, elbB: 0.3,
      legF: 0.28, legB: -0.12, kneeF: 0.22, kneeB: 0.18,
      sash: 0.08 + br * 0.06, ribbon: 0.12 + br * 0.08, smile: 0.65,
    };
  }

  function joint(from, ang, len) {
    return { x: from.x + Math.sin(ang) * len, y: from.y + Math.cos(ang) * len };
  }

  function strokeLimb(c, a, b, r, fill) {
    c.lineCap = "round";
    c.strokeStyle = COL.out;
    c.lineWidth = r * 2 + 5;
    c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke();
    c.strokeStyle = fill;
    c.lineWidth = r * 2;
    c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke();
  }

  function disc(c, x, y, r, fill) {
    c.beginPath();
    c.arc(x, y, r + 1.6, 0, Math.PI * 2);
    c.fillStyle = COL.out;
    c.fill();
    c.beginPath();
    c.arc(x, y, r, 0, Math.PI * 2);
    c.fillStyle = fill;
    c.fill();
  }

  function drawPuppet(c, st, ph, squash, facing) {
    const po = heirPose(st, ph);
    c.save();
    c.scale(facing, squash);
    const hip = { x: -6, y: -78 + po.bob };
    const sh = { x: hip.x + Math.sin(po.lean) * 8, y: hip.y - 46 };
    const head = { x: sh.x + 6 + Math.sin(po.lean) * 4, y: sh.y - 38 + po.head };
    const lk = joint({ x: hip.x - 4, y: hip.y + 2 }, po.legB, 40);
    const la = joint(lk, po.legB + po.kneeB, 36);
    const rk = joint({ x: hip.x + 4, y: hip.y + 2 }, po.legF, 40);
    const ra = joint(rk, po.legF + po.kneeF, 36);
    const le = joint({ x: sh.x - 8, y: sh.y + 4 }, po.armB, 28);
    const lh = joint(le, po.armB + po.elbB, 26);
    const re = joint({ x: sh.x + 8, y: sh.y + 2 }, po.armF, 28);
    const rh = joint(re, po.armF + po.elbF, 26);

    c.lineCap = "round";
    c.lineJoin = "round";
    // ribbon
    c.strokeStyle = COL.out; c.lineWidth = 7;
    c.beginPath();
    c.moveTo(head.x - 16, head.y - 10);
    c.lineTo(head.x - 38 - po.ribbon * 10 - p.cloth * 14, head.y + 8 + p.cloth * 8);
    c.lineTo(head.x - 58 - po.ribbon * 16 - p.cloth * 22, head.y + 24 + p.cloth * 12);
    c.stroke();
    c.strokeStyle = COL.sash; c.lineWidth = 4.5;
    c.stroke();
    // sash tail
    c.strokeStyle = COL.out; c.lineWidth = 11;
    c.beginPath();
    c.moveTo(hip.x - 10, hip.y + 4);
    c.lineTo(hip.x - 26 - po.sash * 10 - p.cloth * 10, hip.y + 22 + p.cloth * 6);
    c.lineTo(hip.x - 34 - po.sash * 16 - p.cloth * 16, hip.y + 48 + p.cloth * 10);
    c.stroke();
    c.strokeStyle = COL.sash; c.lineWidth = 7.5;
    c.stroke();

    strokeLimb(c, { x: hip.x - 3, y: hip.y + 2 }, lk, 12, COL.pantsD);
    strokeLimb(c, lk, la, 7.5, COL.pantsD);
    disc(c, la.x - 6, la.y + 3, 6, COL.slip);
    strokeLimb(c, { x: sh.x - 8, y: sh.y + 4 }, le, 7, COL.skinD);
    strokeLimb(c, le, lh, 6, COL.skinD);
    disc(c, lh.x, lh.y, 7.5, COL.skinD);

    strokeLimb(c, sh, hip, 15, COL.vest);
    disc(c, sh.x, sh.y, 14, COL.vestL);
    disc(c, hip.x, hip.y, 12, COL.vest);
    strokeLimb(c, { x: sh.x + 2, y: sh.y + 2 }, { x: hip.x + 8, y: hip.y - 6 }, 6, COL.skin);

    strokeLimb(c, { x: hip.x + 4, y: hip.y + 2 }, rk, 13, COL.pants);
    strokeLimb(c, rk, ra, 8, COL.pants);
    disc(c, ra.x + 8, ra.y + 4, 6.5, COL.slip);
    strokeLimb(c, { x: sh.x + 8, y: sh.y + 2 }, re, 8, COL.skin);
    strokeLimb(c, re, rh, 7, COL.skin);
    disc(c, rh.x, rh.y, 8, COL.skin);

    c.strokeStyle = COL.out; c.lineWidth = 16;
    c.beginPath(); c.moveTo(hip.x - 16, hip.y - 4); c.lineTo(hip.x + 16, hip.y - 2); c.stroke();
    c.strokeStyle = COL.sash; c.lineWidth = 12;
    c.stroke();

    disc(c, head.x, head.y, 19.5, COL.skin);
    disc(c, head.x - 6, head.y - 16, 12, COL.hair);
    disc(c, head.x + 4, head.y - 18, 11, COL.hair);
    c.strokeStyle = COL.out; c.lineWidth = 10;
    c.beginPath(); c.moveTo(head.x - 16, head.y - 8); c.lineTo(head.x + 16, head.y - 9); c.stroke();
    c.strokeStyle = COL.sash; c.lineWidth = 7;
    c.stroke();
    disc(c, head.x + 11, head.y - 1, 6.2, "#faf5ea");
    disc(c, head.x + 13, head.y, 3.1, COL.out);
    c.strokeStyle = COL.out; c.lineWidth = 2.2;
    c.beginPath();
    c.arc(head.x + 12, head.y + 10, 7 + po.smile * 2, 0.25, Math.PI - 0.35);
    c.stroke();
    c.restore();
  }

  const el = {
    stem: document.getElementById("stem"),
    slots: document.getElementById("slots"),
    coach: document.getElementById("coach"),
    time: document.getElementById("time"),
    combo: document.getElementById("combo"),
    acc: document.getElementById("acc"),
    pb: document.getElementById("pb"),
    zone: document.getElementById("zone"),
    pad: document.getElementById("pad"),
  };
  for (let d = 0; d <= 9; d++) {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = String(d);
    b.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      typeDigit(d);
    });
    el.pad.appendChild(b);
  }

  let ac;
  function beep(freq, dur, type = "sine", gain = 0.05) {
    try {
      ac = ac || new AudioContext();
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.type = type;
      o.frequency.value = freq;
      g.gain.value = gain;
      o.connect(g);
      g.connect(ac.destination);
      o.start();
      g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + dur);
      o.stop(ac.currentTime + dur);
    } catch (_) { /* ignore */ }
  }

  const p = {
    x: traps[0].runupX,
    y: traps[0].takeoffY,
    vx: 0,
    vy: 0,
    onGround: true,
    facing: 1,
    loco: "rest",
    locoT: 0,
    state: "idle",
    hangT: 0,
    dust: 0,
    squash: 1,
    stepPulse: 0,
    anim: 0,
    runCycle: 0,
    landT: 0,
    strideT: 0,
    crouchT: 0,
    hitchT: 0,
    pullT: 0,
    hangLip: null,
    cycle: 0,
    strideU: 1,
    strideFrom: 0,
    strideTo: 0,
    strideY0: MID,
    strideToY: MID,
    strideDur: 0.24,
    featU: 1,
    featKind: "leap",
    featDur: 0.6,
    featFrom: { x: 0, y: MID },
    featTo: { x: 0, y: MID },
    cloth: 0,
    ghosts: [],
    plantT: 0,
    gaitI: 0,
    gaitCycle: 0,
    tilt: 0,
    strideFromIdle: false,
  };
  const cam = { x: 0 };
  window.FL = { p, cam, step, get lap() { return lap; }, get trapI() { return trapI; }, get trapsN() { return traps.length; } };
  const fx = { shake: 0, flash: 0, gold: 0, bits: [] };

  let trapI = 0;
  let lap = 0;
  function trapWorld(i, L) {
    const t = traps[i];
    if (!t) return null;
    const off = L * WORLD_W;
    return {
      id: t.id,
      kind: t.kind,
      style: t.style,
      from: offsetLedge(t.from, off),
      to: offsetLedge(t.to, off),
      gapLeft: t.gapLeft + off,
      gapRight: t.gapRight + off,
      gapW: t.gapW,
      takeoffX: t.takeoffX + off,
      runupX: t.runupX + off,
      takeoffY: t.takeoffY,
      ropeX: t.ropeX != null ? t.ropeX + off : null,
      barX: t.barX != null ? t.barX + off : null,
      barY: t.barY,
      barLen: t.barLen,
      beamY: t.beamY,
      path: (t.path || []).map((pt) => ({ x: pt.x + off, y: pt.y })),
      land: t.land ? { x: t.land.x + off, y: t.land.y } : null,
      cleared: t.cleared,
      lap: L,
    };
  }
  function activeTrap() {
    return trapWorld(trapI, lap);
  }
  let fact = nextFact();
  let typed = "";
  let wrongs = 0;
  let phase = "chart";
  let started = false;
  let reveal = "";
  let phaseT = 0;
  let pendingLeap = false;
  let leapTime = 0;
  let leapDur = 0.62;
  let hallShown = -1;
  let lastZone = 1;
  let lastKind = "leap";
  let zoneBanner = 0;
  let zoneBannerText = "LEAP";
  let leapFrom = { x: 0, y: 0 };
  let leapTo = { x: 0, y: 0 };
  let combo = 0;
  let hits = 0;
  let misses = 0;
  let startAt = performance.now();
  let keysOk = 0;
  let keysBad = 0;
  const PB_KEY = "far-ledge-run-pb";
  let pb = Number(localStorage.getItem(PB_KEY) || 0) || 0;
  el.pb.textContent = pb ? pb.toFixed(0) + "s" : "—";

  function productStr() {
    return String(fact.product);
  }
  function slotStr() {
    if (reveal) return reveal;
    const need = productStr();
    return [...need].map((ch, i) => (i < typed.length ? typed[i] : "_")).join(" ");
  }
  function coach(text, kind) {
    el.coach.textContent = text;
    el.coach.className = kind || "";
  }
  function pulseSlots(kind) {
    el.slots.classList.remove("ok", "bad");
    void el.slots.offsetWidth;
    el.slots.classList.add(kind);
    setTimeout(() => el.slots.classList.remove(kind), 120);
  }
  function refreshHud() {
    el.stem.textContent = fact.stem;
    el.slots.textContent = slotStr();
    el.combo.textContent = String(combo);
    const tot = keysOk + keysBad;
    el.acc.textContent = tot ? Math.round((100 * keysOk) / tot) + "%" : "—";
    if (el.zone) {
      const t = activeTrap();
      const k = t && KIND[t.kind] ? KIND[t.kind] : KIND.leap;
      el.zone.textContent = k.label;
    }
  }
  refreshHud();
  coach("Type " + fact.stem + ". Last digit leaps.");

  function bindTrap(i, snap) {
    let wrapped = false;
    if (i >= traps.length) {
      lap += 1;
      i = 0;
      wrapped = true;
      for (const tr of traps) tr.cleared = false;
    }
    trapI = i;
    const t = activeTrap();
    if (!t) return;
    pendingLeap = false;
    typed = "";
    wrongs = 0;
    reveal = "";
    const hall = t.from.room;
    const hallKey = lap * ROOM_N + hall;
    if (snap) {
      p.x = t.runupX;
      p.y = t.takeoffY;
      p.vx = 0;
      p.vy = 0;
      p.onGround = true;
      p.state = "idle";
      p.facing = 1;
      p.loco = "rest";
      p.locoT = 0;
      p.strideU = 1;
      p.ghosts = [];
      p.cloth = 0;
    }
    refreshHud();
    coach("Type " + fact.stem + ". Last digit leaps.");
    markSeen(fact.id);
    paintKnow();
    lastZone = 1;
    if (wrapped && started) {
      hallShown = hallKey;
      openChart("LAP " + (lap + 1) + " · FILLED TABLE · review, then run");
      return;
    }
    hallShown = hallKey;
    phase = "play";
  }

  function destForTyped() {
    const t = activeTrap();
    if (!t) return { x: p.x, y: p.y };
    const n = Math.max(1, productStr().length);
    const u = Math.min(1, typed.length / n);
    const path = approachPath(t);
    let dest = path && path.length
      ? alongPath(path, u)
      : { x: Math.min(t.runupX + (t.takeoffX - t.runupX) * u, t.from.right - 8), y: t.takeoffY };
    if (dest.x < p.x) dest = { x: p.x, y: dest.y };
    return dest;
  }

  function approachPath(t) {
    if (t.kind === "climb" && t.ropeX != null) {
      return [
        { x: t.runupX, y: t.takeoffY },
        { x: t.ropeX, y: t.takeoffY },
      ];
    }
    if (t.kind === "crawl") {
      return [
        { x: t.runupX, y: t.takeoffY },
        { x: t.from.right - 10, y: t.takeoffY },
      ];
    }
    if (t.path && t.path.length) return t.path;
    return [
      { x: t.runupX, y: t.takeoffY },
      { x: t.takeoffX, y: t.takeoffY },
    ];
  }

  function gaitSpeed() {
    const n = productStr().length;
    if (n >= 3) return BODY.sprint;
    if (n === 2) return BODY.run;
    return BODY.walk;
  }
  function strideSeconds(dx, dy) {
    const dist = Math.hypot(dx, dy);
    const spd = Math.max(120, gaitSpeed() * 0.62);
    return clamp(dist / spd, 0.42, 1.15);
  }

  function startStride() {
    const t = activeTrap();
    const dest = destForTyped();
    const dx = dest.x - p.x;
    const dy = dest.y - p.y;
    if (dx < 4 && Math.abs(dy) < 8) return false;
    if (dx < 0) return false;
    p.strideFromIdle = p.state === "idle" || p.loco === "rest";
    p.strideFrom = p.x;
    p.strideTo = dest.x;
    p.strideY0 = p.y;
    p.strideToY = dest.y;
    p.strideU = 0;
    p.strideDur = strideSeconds(dx, dy);
    p.strideT = p.strideDur;
    p.dust = 0.18;
    p.loco = "start";
    p.locoT = 0.08;
    p.state = poseForDest(t, dest);
    p.squash = t && t.kind === "crawl" ? 0.78 : 1.04;
    return true;
  }

  function resumeAfterStride() {
    const t = activeTrap();
    p.vx = 0;
    p.vy = 0;
    p.loco = "plant";
    p.locoT = 0.12;
    const dest = destForTyped();
    if (Math.hypot(dest.x - p.x, dest.y - p.y) > 10) {
      startStride();
      return;
    }
    if (pendingLeap && t) {
      if (t.kind && t.kind !== "leap") {
        p.crouchT = 0.08;
      } else {
        p.state = "crouch";
        p.crouchT = 0.16;
        p.squash = 0.66;
      }
    }
  }
  function poseForDest(t, dest) {
    if (!t) return gaitSpeed() >= BODY.run ? "run" : "walk";
    const dy = dest.y - p.y;
    const dx = dest.x - p.x;
    if (t.kind === "crawl") return pendingLeap ? "crawl" : (gaitSpeed() >= BODY.run ? "run" : "walk");
    if (t.kind === "climb" && dy < -18) return "climb";
    if (t.kind === "climb" && Math.abs(dy) <= 18) return gaitSpeed() >= BODY.run ? "run" : "walk";
    return gaitSpeed() >= BODY.run ? "run" : "walk";
  }

  function typeDigit(d) {
    if (phase !== "play" || pendingLeap) return;
    const t = activeTrap();
    if (!t || t.cleared) return;
    const need = productStr();
    if (typed.length >= need.length) return;
    const expect = need[typed.length];
    if (String(d) === expect) {
      typed += String(d);
      keysOk++;
      hits++;
      if (p.strideU >= 1) startStride();
      beep(660 + typed.length * 80, 0.07, "triangle", 0.04);
      fx.bits.push({ x: p.x, y: p.y - 160, vy: -80, life: 0.45, text: String(d), gold: true });
      pulseSlots("ok");
      if (typed.length >= need.length) {
        pendingLeap = true;
        combo++;
        fx.gold = 0.35;
        beep(880, 0.12, "square", 0.05);
        coach((KIND[t.kind] || KIND.leap).verb, "ok");
      } else {
        coach("Keep going — " + (need.length - typed.length) + " left.");
      }
      refreshHud();
    } else {
      wrongs++;
      keysBad++;
      p.hitchT = 0.2;
      p.squash = 1.14;
      p.vx *= 0.15;
      fx.shake = 8;
      beep(140, 0.12, "sawtooth", 0.04);
      fx.bits.push({ x: p.x, y: p.y - 150, vy: -40, life: 0.35, text: "×", gold: false });
      pulseSlots("bad");
      coach("Not " + d + " — try the next digit.", "bad");
      refreshHud();
      if (wrongs >= 3) startMiss("wrong");
    }
  }

  function startMiss(_why) {
    if (phase === "reveal" || phase === "rewind") return;
    combo = 0;
    misses++;
    if (!due.length || due[due.length - 1].id !== fact.id) due.push(fact);
    bumpMiss(fact.id);
    reveal = productStr();
    phase = "reveal";
    phaseT = 0.75;
    fx.shake = 16;
    p.vy = 80;
    p.onGround = false;
    p.state = "fall";
    beep(90, 0.25, "square", 0.06);
    refreshHud();
    coach("The product was " + reveal + " — then it disappears.", "bad");
  }

  function jumpKind() {
    const n = productStr().length;
    if (n <= 1) return BODY.stand;
    if (n >= 3) return BODY.sprintJ;
    return BODY.runJ;
  }

  function commitLeap() {
    commitMove();
  }

  function commitMove() {
    const t = activeTrap();
    if (!t) return;
    phase = "leap";
    pendingLeap = false;
    leapTime = 0;
    p.featU = 0;
    p.featKind = t.kind || "leap";
    p.featFrom = { x: p.x, y: p.y };
    p.featTo = t.land || landPoint(t.from, t.to);
    p.landT = 0;
    p.crouchT = 0;
    p.strideU = 1;
    p.ghosts = [];
    p.dust = 0.4;
    p.facing = 1;
    if (t.kind === "leap" || !t.kind) {
      p.onGround = false;
      p.state = "jump";
      p.loco = "run";
      const landX = p.featTo.x;
      const span = clamp(t.gapW, 36, 480);
      const j = jumpKind();
      const vy = span < 90 ? -500 : span < 150 ? -600 : span < 240 ? j.vy * 0.9 : j.vy;
      p.vy = vy;
      const a = 0.5 * BODY.gravity;
      const b = vy;
      const c0 = p.y - t.to.y;
      const disc = b * b - 4 * a * c0;
      let tAir = (2 * Math.abs(vy)) / BODY.gravity;
      if (disc >= 0) {
        const r = Math.sqrt(disc);
        tAir = Math.max((-b + r) / (2 * a), (-b - r) / (2 * a));
      }
      tAir = clamp(tAir, 0.2, 1.1);
      p.vx = (landX - p.x) / tAir;
      p.squash = 1.22;
      beep(520, 0.08, "sine", 0.04);
      return;
    }
    p.onGround = false;
    p.vx = 0;
    p.vy = 0;
    p.state = t.kind;
    const span = Math.hypot(p.featTo.x - p.x, p.featTo.y - p.y);
    p.featDur = t.kind === "swing"
      ? clamp((t.barLen * 2.8) / 220, 0.85, 1.45)
      : t.kind === "climb"
        ? clamp(span / 170, 0.75, 1.65)
        : clamp(span / 200, 0.55, 1.5);
    p.squash = t.kind === "crawl" ? 0.7 : 1.06;
    p.tilt = 0;
    beep(520, 0.08, "sine", 0.04);
  }

  function landOk() {
    const t = activeTrap();
    if (!t) return;
    t.cleared = true;
    traps[trapI].cleared = true;
    markTyped(fact.id);
    paintKnow();
    fact = nextFact();
    if (trapI + 1 < traps.length) {
      const nxt = traps[trapI + 1];
      const localP = p.x - lap * WORLD_W;
      nxt.runupX = Math.min(Math.max(localP, nxt.from.left + 16), nxt.takeoffX);
    } else {
      const nxt = traps[0];
      const localP = p.x - (lap + 1) * WORLD_W;
      nxt.runupX = Math.min(Math.max(localP, nxt.from.left + 16), nxt.takeoffX);
    }
    bindTrap(trapI + 1, false);
    p.state = "land";
    p.facing = 1;
    p.loco = "plant";
    p.locoT = 0.16;
    p.landT = 0.42;
    p.squash = 0.86;
    p.dust = 0.35;
    p.strideU = 1;
    p.tilt = 0;
    fx.gold = 0.15;
    coach("Yes. Next: " + fact.stem, "ok");
    refreshHud();
  }

  window.addEventListener("keydown", (e) => {
    if (e.repeat) return;
    if (phase === "chart") {
      if (e.key === "Enter") {
        e.preventDefault();
        beginRun();
      } else if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        localStorage.removeItem(KNOW_KEY);
        paintKnow();
      }
      return;
    }
    if (e.key === "t" || e.key === "T") {
      e.preventDefault();
      openChart();
      return;
    }
    if (e.key === "r" || e.key === "R") {
      location.reload();
      return;
    }
    if (e.key >= "0" && e.key <= "9") {
      e.preventDefault();
      typeDigit(Number(e.key));
    }
  });

  function collideLedges(prevY) {
    if (p.vy < 0) return;
    for (const l of ledgesNear(p.x)) {
      if (p.x < l.left + 10 || p.x > l.right - 10) continue;
      if (prevY <= l.y + 4 && p.y >= l.y) {
        p.y = l.y;
        p.vy = 0;
        if (!p.onGround) {
          p.squash = 0.86;
          p.dust = 0.25;
        }
        p.onGround = true;
        if (p.state === "jump" || p.state === "fall") p.state = "land";
        return true;
      }
    }
    return false;
  }

  function tryHang() {
    if (p.onGround || p.vy < 40 || p.state === "hang" || p.state === "pull") return;
    const t = activeTrap();
    // Aimed leaps should plant on the destination top. Hang is for an undershoot.
    if (t && p.x >= t.to.left + 16 && p.x <= t.to.right - 6) return;
    const lips = [];
    if (t) lips.push({ x: t.gapRight, y: t.to.y });
    for (const l of ledgesNear(p.x)) lips.push({ x: l.left, y: l.y });
    for (const lip of lips) {
      if (p.x > lip.x - 6 && p.x < lip.x + 28 && p.y > lip.y + 18 && p.y < lip.y + BODY.h * 0.85) {
        p.hangLip = lip;
        p.x = lip.x + 8;
        p.y = lip.y + BODY.h * 1.02;
        p.vx = 0;
        p.vy = 0;
        p.onGround = false;
        p.state = "hang";
        p.hangT = 0.36;
        return true;
      }
    }
    return false;
  }

  function step(dt) {
    if (window.FL && window.FL.pause) return;
    const t = activeTrap();
    p.facing = 1;
    p.anim += dt;
    if (p.landT > 0) p.landT -= dt;
    if (p.stepPulse > 0) p.stepPulse -= dt;
    if (p.strideT > 0) p.strideT -= dt;
    if (p.crouchT > 0) p.crouchT -= dt;
    if (p.hitchT > 0) p.hitchT -= dt;
    if (p.locoT > 0) p.locoT -= dt;
    if (p.dust > 0) p.dust -= dt;
    if (p.plantT > 0) p.plantT -= dt;
    if (p.state === "crouch") {
      p.squash = 0.68;
    } else if (p.state === "jump") {
      p.squash = 1.18;
    } else if (p.state === "fall") {
      p.squash = 1.05;
    } else if (p.state === "idle" && p.landT <= 0 && p.loco === "rest") {
      p.squash = 1 + Math.sin(p.anim * 2.4) * 0.028;
    } else {
      p.squash += (1 - p.squash) * Math.min(1, dt * 9);
    }
    fx.shake *= Math.max(0, 1 - dt * 8);
    fx.gold = Math.max(0, fx.gold - dt);
    fx.flash = Math.max(0, fx.flash - dt);
    if (zoneBanner > 0) zoneBanner = Math.max(0, zoneBanner - dt);
    for (const b of fx.bits) {
      b.y += b.vy * dt;
      b.life -= dt;
    }
    fx.bits = fx.bits.filter((b) => b.life > 0);

    const wantCloth = clamp(p.vx / 260, -0.2, 1.4)
      + (p.state === "jump" ? 0.4 : 0)
      + (p.state === "fall" ? 0.85 : 0)
      + (p.state === "run" ? 0.22 : 0);
    p.cloth += (wantCloth - p.cloth) * Math.min(1, dt * 6.5);
    if (p.ghosts && p.ghosts.length) {
      for (const g of p.ghosts) g.life -= dt;
      p.ghosts = p.ghosts.filter((g) => g.life > 0);
    }

    if (phase === "leap" && p.state !== "hang" && p.state !== "pull") {
      const lastG = p.ghosts[p.ghosts.length - 1];
      if (!lastG || Math.abs(p.x - lastG.x) > 18) {
        p.ghosts.push({ x: p.x, y: p.y, st: animName(), ph: animPhase(), sq: p.squash, life: 0.18 });
        if (p.ghosts.length > 7) p.ghosts.shift();
      }
    }

    const elapsed = started ? (performance.now() - startAt) / 1000 : 0;
    const m = Math.floor(elapsed / 60);
    const s = Math.floor(elapsed % 60);
    el.time.textContent = m + ":" + String(s).padStart(2, "0");

    if (phase === "chart") return;

    if (phase === "win") {
      p.vx *= 0.9;
      return;
    }

    if (phase === "reveal") {
      phaseT -= dt;
      p.vy = Math.min(BODY.maxFall, p.vy + BODY.gravity * dt);
      p.y += p.vy * dt;
      if (phaseT <= 0) {
        reveal = "";
        refreshHud();
        phase = "rewind";
        phaseT = 0.28;
        coach("Gone. Type it from memory.");
      }
      return;
    }

    if (phase === "rewind") {
      phaseT -= dt;
      if (phaseT <= 0 && t) {
        p.x = t.runupX;
        p.y = t.takeoffY;
        p.vx = 0;
        p.vy = 0;
        p.onGround = true;
        p.state = "idle";
        p.facing = 1;
        p.loco = "rest";
        p.locoT = 0;
        typed = "";
        wrongs = 0;
        pendingLeap = false;
        p.strideU = 1;
        phase = "play";
        refreshHud();
        coach("Same obstacle. " + fact.stem + " — from memory.");
      }
      return;
    }

    const prevY = p.y;
    const feating = p.state === "climb" || p.state === "crawl" || p.state === "slide" || p.state === "swing";
    const locked = p.state === "hang" || p.state === "pull" || feating && phase === "leap";

    if (phase === "leap" && p.state !== "hang" && p.state !== "pull" && p.state !== "crouch" && !feating) {
      leapTime += dt;
      if (!p.onGround) p.state = p.vy > 140 ? "fall" : "jump";
    }

    if (phase === "leap" && feating) {
      p.featU = clamp(p.featU + dt / Math.max(0.12, p.featDur || 0.55), 0, 1);
      const e = smoother(p.featU);
      if (p.state === "swing" && t && t.barX != null) {
        const ang = lerp(-1.05, 1.12, e);
        p.x = t.barX + Math.sin(ang) * t.barLen;
        p.y = t.barY + Math.cos(ang) * t.barLen;
        p.vx = 0;
        p.vy = 0;
        p.onGround = false;
        p.tilt = ang * 0.55;
      } else if (p.state === "slide") {
        const u = e * e;
        p.x = lerp(p.featFrom.x, p.featTo.x, u);
        p.y = lerp(p.featFrom.y, p.featTo.y, u);
        p.vx = 0;
        p.vy = 0;
        p.onGround = false;
        p.tilt = Math.atan2(p.featTo.y - p.featFrom.y, p.featTo.x - p.featFrom.x) * 0.72;
      } else {
        p.x = lerp(p.featFrom.x, p.featTo.x, e);
        p.y = lerp(p.featFrom.y, p.featTo.y, e);
        p.vx = 0;
        p.vy = 0;
        p.onGround = p.state === "crawl";
        p.tilt += (0 - p.tilt) * Math.min(1, dt * 6);
      }
      if (p.featU >= 1) {
        p.x = p.featTo.x;
        p.y = p.featTo.y;
        p.onGround = true;
        p.vx = 0;
        p.vy = 0;
        landOk();
      }
    } else if (p.onGround && p.state !== "hang" && p.state !== "pull" && (phase === "play" || pendingLeap)) {
      if (p.strideU < 1) {
        const prevU = p.strideU;
        p.strideU = clamp(p.strideU + dt / Math.max(0.12, p.strideDur), 0, 1);
        const e = smoother(p.strideU);
        let nx = lerp(p.strideFrom, p.strideTo, e);
        let ny = lerp(p.strideY0 || p.y, p.strideToY || p.y, e);
        if (!t || t.kind === "leap") {
          nx = Math.max(p.x, nx);
          const lip = clampOnLedge(nx, ny, pendingLeap);
          if (lip >= p.x) nx = Math.min(nx, lip);
        }
        const stepDist = Math.hypot(nx - p.x, ny - p.y);
        p.gaitCycle += stepDist / 40;
        p.vx = (nx - p.x) / Math.max(dt, 1e-4);
        p.vy = (ny - p.y) / Math.max(dt, 1e-4);
        p.x = nx;
        p.y = ny;
        p.state = poseForDest(t, { x: nx, y: ny });
        p.loco = "run";
        p.tilt += (0 - p.tilt) * Math.min(1, dt * 8);
        if (prevU < 0.5 && p.strideU >= 0.5) {
          p.squash = 0.92;
          p.dust = 0.22;
          p.plantT = 0.09;
        }
        if (p.strideU >= 1) {
          p.x = p.strideTo;
          p.y = p.strideToY;
          resumeAfterStride();
        }
      } else if (pendingLeap && t) {
        if (t.kind && t.kind !== "leap") {
          p.vx = 0;
          p.vy = 0;
          if (p.crouchT <= 0) commitMove();
        } else {
          const lipX = t.from.right - 8;
          const takeoff = Math.min(Math.max(p.x, t.takeoffX), lipX);
          const dx = takeoff - p.x;
          if (dx > 6) {
            p.strideFromIdle = false;
            p.strideFrom = p.x;
            p.strideTo = takeoff;
            p.strideY0 = p.y;
            p.strideToY = p.y;
            p.strideU = 0;
            p.strideDur = strideSeconds(dx, 0);
            p.state = "run";
          } else {
            p.x = Math.min(Math.max(p.x, t.from.left + 10), lipX);
            p.vx = 0;
            if (p.state !== "crouch") {
              p.crouchT = 0.18;
              p.squash = 0.66;
            }
            p.state = "crouch";
            if (p.crouchT <= 0) commitLeap();
          }
        }
      } else if (phase === "play") {
        p.vx *= Math.max(0, 1 - dt * 14);
        p.vy = 0;
        if (Math.abs(p.vx) < 12) {
          p.vx = 0;
          if (p.landT <= 0 && p.hitchT <= 0 && p.state !== "climb" && p.state !== "crawl") {
            p.state = "idle";
            p.loco = "rest";
          }
        }
      }
    }

    if (!p.onGround && p.state !== "hang" && p.state !== "pull" && !feating) {
      p.vy = Math.min(BODY.maxFall, p.vy + BODY.gravity * dt);
    }

    if (p.state === "hang" && p.hangLip) {
      p.hangT -= dt;
      p.vx = 0;
      p.vy = 0;
      p.x = p.hangLip.x + 10 + Math.sin(p.anim * 5) * 3;
      p.y = p.hangLip.y + BODY.h * 1.02;
      if (p.hangT <= 0) {
        p.state = "pull";
        p.pullT = 0;
        p.pullFrom = { x: p.x, y: p.y };
        p.pullTo = { x: p.hangLip.x + 40, y: p.hangLip.y };
      }
    } else if (p.state === "pull" && p.pullFrom && p.pullTo) {
      p.pullT += dt;
      const u = clamp(p.pullT / 0.55, 0, 1);
      const e = 1 - Math.pow(1 - u, 3);
      p.x = lerp(p.pullFrom.x, p.pullTo.x, e);
      p.y = lerp(p.pullFrom.y, p.pullTo.y, e);
      p.vx = 0;
      p.vy = 0;
      if (u >= 1) {
        p.x = p.pullTo.x;
        p.y = p.pullTo.y;
        p.onGround = true;
        p.state = "land";
        p.landT = 0.32;
        p.squash = 0.74;
        p.dust = 0.4;
        p.hangLip = null;
        if (phase === "leap") landOk();
      }
    }

    if (p.state !== "hang" && p.state !== "pull" && !(feating && phase === "leap") && p.strideU >= 1) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
    if (p.onGround && phase === "play" && (!t || t.kind === "leap" || t.kind === "slide" || t.kind === "swing")) {
      p.x = clampOnLedge(p.x, p.y, pendingLeap);
    }

    if (p.state !== "hang" && p.state !== "pull" && !(feating && phase === "leap")) {
      const landed = collideLedges(prevY);
      if (landed && phase === "leap") {
        if (t && p.x >= t.to.left - 12 && p.x <= t.to.right + 16) landOk();
        else if (t && p.x < t.gapLeft + 12) {
          p.onGround = false;
        } else {
          startMiss("short");
        }
      } else if (!p.onGround) {
        tryHang();
        if (p.y > VIEW.h + 40) startMiss("fell");
      }
    }

    if (p.onGround && Math.abs(p.vx) < 8 && p.state === "land" && p.landT <= 0) p.state = "idle";
  }

  function animName() {
    if (p.hitchT > 0) return "hitch";
    if (p.state === "hang") return "hang";
    if (p.state === "pull") return "pull";
    if (p.state === "climb") return "climb";
    if (p.state === "swing") return "swing";
    if (p.state === "slide") return "slide";
    if (p.state === "crawl") return "crawl";
    if (p.state === "fall") return "fall";
    if (p.state === "jump") return "jump";
    if (p.state === "crouch" || p.crouchT > 0) return "crouch";
    if (p.landT > 0.12 || p.state === "land") return "land";
    if (p.strideU < 1 || p.state === "walk" || p.state === "run" || p.loco === "run" || p.loco === "start") {
      if (gaitSpeed() >= BODY.sprint) return "sprint";
      if (gaitSpeed() >= BODY.run || pendingLeap) return "run";
      return "walk";
    }
    return "idle";
  }

  function animPhase() {
    const st = animName();
    if (st === "jump") return clamp(0.52 - p.vy / 1500, 0, 1);
    if (st === "pull") return clamp(p.pullT / 0.55, 0, 1);
    if (st === "land") return 1 - clamp(p.landT / 0.42, 0, 1);
    if (st === "run" || st === "sprint" || st === "walk") return (p.gaitCycle % 1 + 1) % 1;
    return p.anim;
  }

  function drawHeirAt(c, x, y, st, ph, squash, alpha) {
    c.save();
    c.globalAlpha = alpha;
    c.translate(x - cam.x, y);
    const pair = posePair(st);
    if (pair.a) {
      drawSpriteBlend(c, pair, squash, p.facing, 0);
    } else {
      c.scale(1.22, 1.22);
      drawPuppet(c, st, ph, squash, p.facing);
    }
    c.restore();
  }

  function drawHeir() {
    const c = ctx;
    const hang = p.state === "hang" || p.state === "pull" || p.state === "climb" || p.state === "swing";
    const st = animName();
    const ph = animPhase();
    for (const g of p.ghosts) {
      drawHeirAt(c, g.x, g.y, g.st, g.ph, g.sq, Math.max(0, g.life / 0.18) * 0.32);
    }
    const bob = p.strideU < 1
      ? Math.sin(p.strideU * Math.PI) * 6
      : ((p.loco === "rest" && p.state === "idle") ? Math.sin(p.anim * 2.4) * 2.2 : 0);
    c.save();
    c.translate(p.x - cam.x, p.y + bob);
    c.fillStyle = "rgba(0,0,0," + (p.onGround ? 0.4 : hang ? 0.12 : 0.18) + ")";
    c.beginPath();
    c.ellipse(4, 6, 28, p.onGround ? 7 : 4, 0, 0, Math.PI * 2);
    c.fill();
    const pair = posePair(st);
    if (pair.a) {
      drawSpriteBlend(c, pair, p.squash, p.facing, p.tilt || 0);
    } else {
      c.scale(1.22, 1.22);
      drawPuppet(c, st, ph, p.squash, p.facing);
    }
    if (p.dust > 0 || p.plantT > 0) {
      const d = Math.max(p.dust, p.plantT * 2);
      c.fillStyle = "rgba(190,155,100," + (d * 2.2) + ")";
      for (let i = 0; i < 7; i++) {
        const a = d * 40 + i * 9;
        c.fillRect(-18 + (i * 7) % 28, -a * 0.35, 4, 4);
      }
    }
    c.restore();
  }

  function drawSky() {
    const img = SKY;
    if (!img || !img.complete || img.naturalWidth < 8) {
      const g = ctx.createLinearGradient(0, 0, 0, VIEW.h);
      g.addColorStop(0, "#0a1624");
      g.addColorStop(0.5, "#122a3c");
      g.addColorStop(1, "#070b10");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, VIEW.w, VIEW.h);
      return;
    }
    const par = cam.x * 0.08;
    const scale = VIEW.h / img.naturalHeight;
    const w = img.naturalWidth * scale;
    let x = -(((par % w) + w) % w);
    while (x < VIEW.w) {
      ctx.drawImage(img, x, 0, w, VIEW.h);
      x += w - 1;
    }
  }

  function drawHalls() {
    const first = Math.floor(cam.x / VIEW.w) - 1;
    const last = first + 3;
    for (let i = first; i <= last; i++) {
      if (i < 0) continue;
      const imgI = ((i % ROOM_N) + ROOM_N) % ROOM_N;
      const img = rooms[imgI];
      const dx = i * VIEW.w - cam.x;
      const dy = ROOM_DY[imgI] || 0;
      if (img && img.complete && img.naturalWidth) {
        drawPlate(img, dx, dy, i > 0 ? JOIN : 0);
      }
    }
    ctx.globalAlpha = 1;
  }

  function drawMotes() {
    ctx.save();
    const z2 = lastZone === 2;
    ctx.fillStyle = z2 ? "rgba(186,214,255,0.55)" : "rgba(255,210,140,0.35)";
    for (let i = 0; i < 22; i++) {
      const x = ((i * 137.3 + cam.x * (z2 ? 0.32 : 0.22)) % (VIEW.w + 50)) - 20;
      const y = 70 + ((i * 89 + cam.x * 0.05 + p.anim * 12) % 420);
      ctx.globalAlpha = 0.08 + (i % 4) * 0.025;
      ctx.beginPath();
      ctx.arc(x, y, 1.1 + (i % 3) * 0.6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawHaze() {
    ctx.save();
    const g = ctx.createLinearGradient(0, 180, 0, VIEW.h);
    if (lastZone === 2) {
      g.addColorStop(0, "rgba(18,40,70,0)");
      g.addColorStop(0.55, "rgba(20,50,80,0.14)");
      g.addColorStop(1, "rgba(6,12,22,0.38)");
    } else {
      g.addColorStop(0, "rgba(10,14,18,0)");
      g.addColorStop(0.6, "rgba(12,10,8,0.08)");
      g.addColorStop(1, "rgba(6,8,10,0.28)");
    }
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, VIEW.w, VIEW.h);
    ctx.restore();
  }

  function drawCourse() {}
  function drawClimb(tr) {
    const x = tr.ropeX - cam.x;
    const yTop = Math.min(tr.from.y, tr.to.y);
    const yBot = Math.max(tr.from.y, tr.to.y) + 10;
    if (tr.style === "ladder") {
      ctx.strokeStyle = "#2a1c10";
      ctx.lineWidth = 6;
      ctx.beginPath(); ctx.moveTo(x - 12, yTop); ctx.lineTo(x - 12, yBot); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x + 12, yTop); ctx.lineTo(x + 12, yBot); ctx.stroke();
      ctx.strokeStyle = "#c4a06a";
      ctx.lineWidth = 3;
      for (let y = yTop + 10; y < yBot; y += 16) {
        ctx.beginPath();
        ctx.moveTo(x - 14, y);
        ctx.lineTo(x + 14, y);
        ctx.stroke();
      }
    } else {
      ctx.strokeStyle = "#4a2814";
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(x, yTop);
      ctx.lineTo(x + Math.sin(p.anim * 2.2) * 3, yBot);
      ctx.stroke();
      ctx.strokeStyle = "#d2a56a";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, yTop);
      ctx.lineTo(x + Math.sin(p.anim * 2.2) * 3, yBot);
      ctx.stroke();
    }
  }
  function drawBar(tr) {
    const x = tr.barX - cam.x;
    ctx.fillStyle = "#1a100c";
    ctx.fillRect(x - 42, tr.barY - 8, 84, 12);
    ctx.fillStyle = "#6a4630";
    ctx.fillRect(x - 38, tr.barY - 5, 76, 6);
    ctx.strokeStyle = "rgba(20,10,8,0.45)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, tr.barY, tr.barLen, 0.15, Math.PI - 0.15);
    ctx.stroke();
  }
  function drawLintel(tr) {
    const x0 = tr.from.right - cam.x;
    const x1 = tr.to.left - cam.x;
    const yb = tr.beamY || tr.from.y - 52;
    const w = Math.max(12, x1 - x0);
    ctx.fillStyle = "#2c1c14";
    ctx.fillRect(x0, yb - 78, 16, 82);
    ctx.fillRect(x1 - 16, yb - 78, 16, 82);
    const g = ctx.createLinearGradient(0, yb - 22, 0, yb + 14);
    g.addColorStop(0, "#6a4630");
    g.addColorStop(1, "#2a1810");
    ctx.fillStyle = g;
    ctx.fillRect(x0, yb - 18, w, 28);
    ctx.fillStyle = "#d2b080";
    ctx.fillRect(x0, yb + 6, w, 4);
  }
  function drawSlide(tr) {
    const x0 = tr.from.right - cam.x;
    const x1 = tr.to.left - cam.x;
    ctx.fillStyle = "#4a3224";
    ctx.beginPath();
    ctx.moveTo(x0, tr.from.y);
    ctx.lineTo(x1, tr.to.y);
    ctx.lineTo(x1, tr.to.y + 32);
    ctx.lineTo(x0, tr.from.y + 36);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#c9a06a";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x0, tr.from.y + 2);
    ctx.lineTo(x1, tr.to.y + 2);
    ctx.stroke();
  }
  function drawSpikes() {
    for (let x = Math.floor((cam.x - 20) / 20) * 20; x < cam.x + VIEW.w + 24; x += 20) {
      let covered = false;
      for (const l of ledgesNear(x + 8)) {
        if (x + 8 >= l.left && x <= l.right && l.y > 300) { covered = true; break; }
      }
      if (covered) continue;
      const sx = x - cam.x;
      const g = ctx.createLinearGradient(sx, SPIKE_Y - 30, sx, SPIKE_Y);
      g.addColorStop(0, "#d8dde4");
      g.addColorStop(0.45, "#8a9098");
      g.addColorStop(1, "#3a3430");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(sx + 1, SPIKE_Y);
      ctx.lineTo(sx + 10, SPIKE_Y - 26);
      ctx.lineTo(sx + 18, SPIKE_Y);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.22)";
      ctx.beginPath();
      ctx.moveTo(sx + 8, SPIKE_Y - 8);
      ctx.lineTo(sx + 10, SPIKE_Y - 24);
      ctx.lineTo(sx + 12, SPIKE_Y - 8);
      ctx.fill();
    }
  }

  function drawPlateColumn(img, sx, sy, sw, sh, dx, dy, dw, dh, alpha) {
    if (alpha <= 0.02) return;
    ctx.globalAlpha = alpha;
    ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
  }

  function drawPlate(img, dx, dy, fadeLeft) {
    const nw = img.naturalWidth;
    const nh = img.naturalHeight;
    const fade = fadeLeft > 0 ? JOIN : 0;
    if (fade > 0) {
        const step = 2;
        for (let x = 0; x < fade; x += step) {
          const a = Math.min(1, (x / fade) * (x / fade) * (3 - 2 * (x / fade)));
        const sx = (x / VIEW.w) * nw;
        const sw = (step / VIEW.w) * nw;
        drawPlateColumn(img, sx, 0, sw, nh, dx + x, dy, step, VIEW.h, a);
      }
      ctx.globalAlpha = 1;
      const srcX = (fade / VIEW.w) * nw;
      ctx.drawImage(img, srcX, 0, nw - srcX, nh, dx + fade, dy, VIEW.w - fade, VIEW.h);
    } else {
      ctx.globalAlpha = 1;
      ctx.drawImage(img, dx, dy, VIEW.w, VIEW.h);
    }
  }

  function drawStoneLedge(l) {
    const x = l.left - cam.x;
    if (x > VIEW.w + 50 || x + l.w < -50) return;
    const y = l.y;
    const w = l.w;
    const h = Math.min(VIEW.h - l.y - 8, 188);
    ctx.fillStyle = "rgba(0,0,0,0.38)";
    ctx.fillRect(x + 6, y + 8, w, Math.min(h, 40));
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, "#d4c4a0");
    g.addColorStop(0.03, "#6e5844");
    g.addColorStop(0.1, "#3a3228");
    g.addColorStop(0.42, "#221a16");
    g.addColorStop(1, "#0c0a0a");
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = "#e6d2a8";
    ctx.fillRect(x, y, w, 4);
    ctx.fillStyle = "#3a2418";
    ctx.fillRect(x, y + 4, w, 3);
    ctx.fillStyle = "rgba(210, 170, 110, 0.14)";
    ctx.fillRect(x + 2, y + 8, Math.max(4, w - 4), 12);
    ctx.strokeStyle = "rgba(18,10,8,0.45)";
    ctx.lineWidth = 1;
    const rowH = 18;
    for (let row = 0, yy = y + 10; yy < y + Math.min(h, 96); row++, yy += rowH) {
      const off = (row % 2) * 16;
      for (let i = off; i < w - 4; i += 32) {
        ctx.strokeRect(x + i + 0.5, yy, Math.min(30, w - i - 2), rowH - 2);
      }
    }
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fillRect(x, y + 7, 3, Math.min(h - 7, 80));
    ctx.fillStyle = "rgba(230, 200, 140, 0.12)";
    ctx.fillRect(x + w - 5, y + 7, 3, Math.min(h - 7, 70));
  }

  function drawWorld() {
    ctx.save();
    if (fx.shake > 0.4) {
      ctx.translate((Math.random() - 0.5) * fx.shake, (Math.random() - 0.5) * fx.shake);
    }
    ctx.fillStyle = "#070b10";
    ctx.fillRect(0, 0, VIEW.w, VIEW.h);
    drawHalls();

    const t = activeTrap();
    if (t && !t.cleared) {
      ctx.fillStyle = "rgba(230, 195, 92, 0.18)";
      ctx.fillRect(t.to.left - cam.x, t.to.y - 8, Math.min(t.to.w, 280), 10);
      ctx.fillStyle = "#f2e1a0";
      ctx.font = "700 22px Segoe UI, sans-serif";
      ctx.fillText(fact.stem, t.to.left + 16 - cam.x, t.to.y - 18);
      ctx.font = "800 28px Segoe UI, sans-serif";
      ctx.fillStyle = reveal ? "#e07a6a" : "#e6c35c";
      ctx.fillText(slotStr().replace(/ /g, ""), t.to.left + 16 - cam.x, t.to.y - 46);
    }

    ctx.globalAlpha = 1;
    drawHeir();

    if (zoneBanner > 0) {
      const a = Math.min(1, zoneBanner / 0.4, (2.6 - zoneBanner) / 0.45);
      ctx.save();
      ctx.globalAlpha = Math.max(0, a) * 0.92;
      ctx.fillStyle = "rgba(6,10,16,0.45)";
      ctx.fillRect(0, VIEW.h * 0.38, VIEW.w, 72);
      ctx.fillStyle = lastZone === 2 ? "#dce9ff" : "#f2e1a0";
      ctx.font = "800 28px Segoe UI, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(zoneBannerText, VIEW.w / 2, VIEW.h * 0.38 + 46);
      ctx.restore();
    }

    for (const b of fx.bits) {
      ctx.globalAlpha = Math.max(0, b.life * 2);
      ctx.fillStyle = b.gold ? "#e6c35c" : "#e07a6a";
      ctx.font = "800 22px Segoe UI, sans-serif";
      ctx.fillText(b.text, b.x - cam.x, b.y);
      ctx.globalAlpha = 1;
    }

    if (fx.gold > 0) {
      ctx.fillStyle = `rgba(230,195,92,${fx.gold * 0.25})`;
      ctx.fillRect(0, 0, VIEW.w, VIEW.h);
    }
    ctx.restore();
  }

  function factId(a, b) {
    return a + "x" + b;
  }

  function beginRun() {
    document.getElementById("know").classList.add("hidden");
    document.getElementById("mini").classList.remove("hidden");
    phase = "play";
    if (!started) {
      started = true;
      startAt = performance.now();
      hallShown = lap * ROOM_N + (activeTrap() ? activeTrap().from.room : 0);
      markSeen(fact.id);
    }
    paintKnow();
  }

  function openChart(title) {
    const h = document.getElementById("know-title");
    if (h) h.textContent = title || "FILLED TABLE · review, then run";
    document.getElementById("know").classList.remove("hidden");
    document.getElementById("mini").classList.add("hidden");
    phase = "chart";
    paintKnow();
  }

  function paintKnow() {
    const nowId = fact && fact.id;
    const counts = { unknown: 0, learning: 0, warm: 0, mastered: 0 };
    const table = document.getElementById("know-table");
    if (table && !table.dataset.built) {
      const thead = document.createElement("tr");
      thead.appendChild(document.createElement("th"));
      for (let b = 1; b <= 12; b++) {
        const th = document.createElement("th");
        th.textContent = String(b);
        thead.appendChild(th);
      }
      table.appendChild(thead);
      for (let a = 1; a <= 12; a++) {
        const tr = document.createElement("tr");
        const rh = document.createElement("th");
        rh.textContent = String(a);
        tr.appendChild(rh);
        for (let b = 1; b <= 12; b++) {
          const td = document.createElement("td");
          td.dataset.id = factId(a, b);
          td.textContent = String(a * b);
          tr.appendChild(td);
        }
        table.appendChild(tr);
      }
      table.dataset.built = "1";
      const legend = document.getElementById("know-legend");
      [
        [0, "unknown"],
        [0.35, "learning"],
        [0.62, "retrieved"],
        [1, "mastered"],
      ].forEach(([t, lab]) => {
        const chip = document.createElement("span");
        chip.className = "know-swatch";
        chip.style.background = lerpKnow(t);
        chip.style.color = inkKnow(t);
        chip.textContent = lab;
        legend.appendChild(chip);
      });
      const need = document.createElement("span");
      need.className = "know-swatch";
      need.style.background = "#121018";
      need.style.boxShadow = "inset 0 0 0 3px #e07a6a";
      need.style.color = "#e07a6a";
      need.textContent = "due / needed";
      legend.appendChild(need);
      const tally = document.createElement("span");
      tally.className = "know-tally";
      tally.id = "know-tally";
      legend.appendChild(tally);
    }
    const k = loadKnow();
    table.querySelectorAll("td[data-id]").forEach((td) => {
      const id = td.dataset.id;
      const t = itemMastery(id);
      td.style.background = lerpKnow(t);
      td.style.color = inkKnow(t);
      td.title = Math.round(t * 100) + "%" + (k.due[id] ? " · due" : "");
      td.classList.toggle("now", id === nowId);
      td.classList.toggle("needed", !!k.due[id]);
      counts[bandKnow(t)] += 1;
    });
    const tally = document.getElementById("know-tally");
    if (tally) {
      tally.textContent = `${counts.unknown} unknown   ${counts.learning} learning   ${counts.warm} retrieved   ${counts.mastered} mastered`;
    }
    const dueN = Object.keys(k.due).length;
    const foot = document.getElementById("know-foot");
    if (foot) {
      if (counts.mastered === 0 && counts.warm === 0 && counts.learning === 0) {
        foot.textContent = "Nothing mastered yet · whole table is unknown blue";
      } else if (dueN) {
        foot.textContent = dueN + " due (needed) · type those from memory · " + counts.unknown + " still unseen";
      } else {
        foot.textContent = counts.unknown + " unseen · green is landed twice · gold outline is this gap";
      }
    }
    const mini = document.getElementById("mini");
    if (mini && !mini.dataset.built) {
      mini.innerHTML = "";
      for (let r = 0; r < 13; r++) {
        for (let c = 0; c < 13; c++) {
          const i = document.createElement("i");
          if (r === 0 && c === 0) {
            i.className = "lab";
          } else if (r === 0) {
            i.className = "lab";
            i.textContent = String(c);
          } else if (c === 0) {
            i.className = "lab";
            i.textContent = String(r);
          } else {
            i.dataset.id = factId(r, c);
          }
          mini.appendChild(i);
        }
      }
      mini.dataset.built = "1";
    }
    if (mini) {
      mini.querySelectorAll("i[data-id]").forEach((i) => {
        const t = itemMastery(i.dataset.id);
        i.style.background = lerpKnow(t);
        i.classList.toggle("now", i.dataset.id === nowId);
        i.classList.toggle("needed", !!k.due[i.dataset.id]);
      });
    }
  }

  window.FL.pause = false;
  window.FL.tick = function (n) {
    const hold = window.FL.pause;
    window.FL.pause = false;
    for (let i = 0; i < (n || 1); i++) step(1 / 60);
    window.FL.pause = hold;
    drawWorld();
  };
  window.FL.type = typeDigit;

  document.getElementById("know-go").addEventListener("click", beginRun);
  document.getElementById("know-reset").addEventListener("click", () => {
    localStorage.removeItem(KNOW_KEY);
    paintKnow();
  });
  document.getElementById("mini").classList.add("hidden");
  paintKnow();
  if (/[?&]play=1(?:&|$)/.test(location.search)) beginRun();

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.033, (now - last) / 1000);
    last = now;
    step(dt);
    let look = p.x + 90;
    if (p.strideU < 1) look = lerp(p.x, p.strideTo, 0.28) + 70;
    else if (phase === "leap") look = p.x + 150;
    cam.x += (look - VIEW.w * 0.38 - cam.x) * (1 - Math.exp(-dt * 3.4));
    cam.x = Math.max(0, cam.x);
    if (window.FL && window.FL.holdCam != null) cam.x = window.FL.holdCam;
    drawWorld();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
