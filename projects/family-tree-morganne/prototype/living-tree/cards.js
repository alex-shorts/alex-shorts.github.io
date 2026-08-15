/**
 * Person cards + expand +/− (HTML layer beside the SVG).
 *
 * Designer: edit `cardHTML()` below and `cards.css`.
 * METRICS must stay in sync with CSS variables set on `#cards` at mount
 * (layout.js reads TreeCards.METRICS).
 *
 * Classic script (no modules) so file:// double-click works.
 */
(function (global) {
  const METRICS = {
    CARD_W: 88,
    CARD_H: 112,
    STALL_BAND: 16,
    EXPAND_HIT: 19,
    CARD_RX: 12,
    STEP_BACK_SCALE: 0.78,
  };

  const lastCardSig = new Map();
  const lastExpandSig = new Map();
  const hostById = new Map();
  let layer = null;
  let hooks = {};

  function escapeHtml(s) {
    return String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  function cardSig(ui) {
    return [
      ui.photo,
      ui.fallback || "",
      ui.short,
      ui.years,
      ui.dna || "",
      ui.artifacts,
      ui.stalled ? "1" : "0",
      ui.stallKind || "",
      ui.adopted ? "1" : "0",
      ui.primary ? "1" : "0",
      ui.unknown ? "1" : "0",
      ui.fill,
      ui.why || "",
    ].join("|");
  }

  function expandSig(ui) {
    return [
      ui.upOpen ? "1" : "0",
      ui.showOne ? "1" : "0",
      ui.showAll ? "1" : "0",
      ui.downHidden ? "1" : "0",
      ui.downOpen ? "1" : "0",
    ].join("|");
  }

  /**
   * Markup for one person. Classes `.card-stack`, `.person-card`, `.expand-btn`,
   * `.expand-one`, `.expand-all`, `.expand-kids` are wired in JS — keep those names.
   */
  function cardHTML(ui) {
    return `
      <div class="card-stack${ui.stalled ? " is-stalled" : ""}">
        <div class="stall-slot">
          ${
            ui.stalled
              ? `<span class="stall-badge" data-stall="${escapeHtml(ui.stallKind || "records")}" style="--stall:${escapeHtml(
                  ui.stallColor || "#a65d2e"
                )}" title="${escapeHtml(ui.why)}">stall</span>`
              : ""
          }
        </div>
        <article class="person-card${ui.unknown ? " unknown" : ""}${
          ui.primary ? " focus" : ""
        }"${ui.stalled ? ` title="Stalled: ${escapeHtml(ui.why)}"` : ""}>
          <div class="photo-wrap">
            <img src="${escapeHtml(ui.photo)}" alt="" loading="lazy" draggable="false" data-fallback="${escapeHtml(
              ui.fallback || ui.photo
            )}" onerror="if(this.dataset.fallback&&this.src!==this.dataset.fallback)this.src=this.dataset.fallback" />
            ${
              ui.dna
                ? `<span class="dna-badge" title="Expected shared DNA with primary">${escapeHtml(
                    ui.dna
                  )}</span>`
                : ""
            }
            ${
              ui.adopted
                ? `<span class="adopted-badge" title="Adoptive or step parent link — not blood">adopted</span>`
                : ""
            }
          </div>
          <div class="card-meta">
            <div class="card-name">${escapeHtml(ui.short)}</div>
            <div class="card-years">${escapeHtml(ui.years)}</div>
          </div>
        </article>
      </div>
      <div class="expand-row expand-row-top">
        <button type="button" class="expand-btn expand-one" hidden>
          <span class="expand-glyph expand-plus" aria-hidden="true">+</span>
          <span class="expand-glyph expand-minus" aria-hidden="true">−</span>
        </button>
        <button type="button" class="expand-btn expand-all" hidden aria-label="Expand all ancestors" title="Expand all ancestors">
          <span class="expand-double" aria-hidden="true"><span>+</span><span>+</span></span>
        </button>
      </div>
      <button type="button" class="expand-btn expand-kids" hidden>
        <span class="expand-glyph expand-plus" aria-hidden="true">+</span>
        <span class="expand-glyph expand-minus" aria-hidden="true">−</span>
      </button>
    `;
  }

  function hostTransform(d) {
    const s = d.stepBack ? METRICS.STEP_BACK_SCALE : 1;
    const x = Math.round(d.x * 2) / 2;
    const y = Math.round(d.y * 2) / 2;
    return `translate(${x}px, ${y}px) scale(${s})`;
  }

  function paintExpand(host, ui) {
    const one = host.querySelector(".expand-one");
    const all = host.querySelector(".expand-all");
    const kids = host.querySelector(".expand-kids");
    if (one) {
      one.hidden = !ui.showOne;
      one.classList.toggle("is-collapse", ui.upOpen);
      if (ui.upOpen) {
        one.setAttribute("aria-label", "Collapse ancestors");
        one.title = "Collapse ancestors";
      } else {
        one.setAttribute("aria-label", "Expand parents");
        one.title = "Expand one generation up";
      }
    }
    if (all) all.hidden = !ui.showAll;
    if (kids) {
      kids.hidden = !(ui.downHidden || ui.downOpen);
      kids.classList.toggle("is-collapse", !ui.downHidden && ui.downOpen);
      if (ui.downHidden) {
        kids.setAttribute("aria-label", "Expand children");
        kids.title = "Expand children";
      } else if (ui.downOpen) {
        kids.setAttribute("aria-label", "Collapse children");
        kids.title = "Collapse children";
      }
    }
  }

  function zoomNode() {
    return document.getElementById("zoom-surface");
  }

  function bindHost(host, id) {
    host.addEventListener("click", (event) => {
      event.stopPropagation();
      if (event.target.closest(".expand-one")) hooks.onExpandOne?.(id);
      else if (event.target.closest(".expand-all")) hooks.onExpandAll?.(id);
      else if (event.target.closest(".expand-kids")) hooks.onExpandKids?.(id);
      else if (!event.target.closest(".expand-btn")) hooks.onSelect?.(id);
    });
    if (!global.d3) return;
    global.d3.select(host).call(
      global.d3
        .drag()
        .container(zoomNode)
        .filter((event) => !event.target.closest(".expand-btn"))
        .subject(() => {
          const d = hooks.dragSubject?.(id);
          if (!d || !Number.isFinite(d.x)) return { x: 0, y: 0 };
          const t = global.d3.zoomTransform(zoomNode());
          return { x: d.x * t.k + t.x, y: d.y * t.k + t.y };
        })
        .on("start", (event) => hooks.onDragStart?.(event, id))
        .on("drag", (event) => hooks.onDrag?.(event, id))
        .on("end", (event) => hooks.onDragEnd?.(event, id))
    );
  }

  function mount(el) {
    layer = el;
    layer.style.setProperty("--card-w", `${METRICS.CARD_W}px`);
    layer.style.setProperty("--card-h", `${METRICS.CARD_H}px`);
    layer.style.setProperty("--stall-band", `${METRICS.STALL_BAND}px`);
    layer.style.setProperty("--expand-hit", `${METRICS.EXPAND_HIT}px`);
  }

  function styleHost(host, d) {
    const ui = d.ui;
    host.style.setProperty("--fill", ui.fill);
    host.style.setProperty("--soft", ui.soft);
    if (ui.stallColor) host.style.setProperty("--stall", ui.stallColor);
    host.classList.toggle("has-artifacts", ui.artifacts > 0);
    host.classList.toggle("is-collateral", !!d.collateral);
    host.classList.toggle("is-step-back", !!d.stepBack);
    host.classList.toggle("is-sprawled", !!d.sprawled);
    host.classList.toggle("is-stack-collapsed", !!d.stackCollapsed);
    host.style.transform = hostTransform(d);
    host.dataset.tf = host.style.transform;
    host.style.zIndex = d.stepBack || d.stackCollapsed ? "0" : d.sprawled ? "1" : "2";
  }

  function sync(nodes, nextHooks) {
    if (!layer) return;
    hooks = nextHooks || hooks;
    const seen = new Set();
    for (const d of nodes) {
      seen.add(d.id);
      const ui = d.ui;
      let host = hostById.get(d.id);
      if (!host) {
        host = document.createElement("div");
        host.className = "card-host";
        host.dataset.id = d.id;
        layer.appendChild(host);
        bindHost(host, d.id);
        hostById.set(d.id, host);
      }
      const nextCard = cardSig(ui);
      const nextExpand = expandSig(ui);
      if (lastCardSig.get(d.id) !== nextCard) {
        host.innerHTML = cardHTML(ui);
        lastCardSig.set(d.id, nextCard);
        paintExpand(host, ui);
        lastExpandSig.set(d.id, nextExpand);
      } else if (lastExpandSig.get(d.id) !== nextExpand) {
        paintExpand(host, ui);
        lastExpandSig.set(d.id, nextExpand);
      }
      styleHost(host, d);
    }
    for (const [id, host] of hostById) {
      if (seen.has(id)) continue;
      host.remove();
      hostById.delete(id);
      lastCardSig.delete(id);
      lastExpandSig.delete(id);
    }
  }

  function move(nodes) {
    for (const d of nodes) {
      const host = hostById.get(d.id);
      if (!host) continue;
      const t = hostTransform(d);
      if (host.dataset.tf === t) continue;
      host.dataset.tf = t;
      host.style.transform = t;
    }
  }

  function highlight(selectedId, hot) {
    for (const [id, host] of hostById) {
      host.classList.toggle("is-selected", id === selectedId);
      host.classList.toggle("is-dim", Boolean(selectedId) && !hot.has(id));
      if (id === selectedId) host.style.zIndex = "4";
    }
  }

  {
    const sample = {
      photo: "a",
      short: "Ann",
      years: "1900",
      dna: "50%",
      artifacts: 1,
      stalled: false,
      primary: false,
      unknown: false,
      fill: "#000",
      why: "",
      upOpen: true,
      showOne: true,
      showAll: false,
      downHidden: false,
      downOpen: false,
    };
    console.assert(cardSig(sample) === cardSig({ ...sample }), "cardSig stable");
    console.assert(expandSig(sample) === expandSig({ ...sample }), "expandSig stable");
  }

  global.TreeCards = {
    METRICS,
    mount,
    sync,
    move,
    highlight,
  };
})(window);
