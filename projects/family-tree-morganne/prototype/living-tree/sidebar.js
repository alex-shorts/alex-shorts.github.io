/**
 * Left museum sidebar — artifact search + line articles index.
 * Depends on ShareData + TreeApp (selectPerson, openLightboxGallery, loadObjectArtifact).
 */
(function (global) {
  const PACKS_ROOT = new URL("../../docs/research/people/packs/", global.location.href).href;

  function esc(s) {
    return String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function editionLabel(edition) {
    if (edition === "article") return "Line article";
    return "Article";
  }

  async function loadLineArticles() {
    try {
      const url = new URL("articles-index.json?t=" + Date.now(), PACKS_ROOT).href;
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) return [];
      const data = await res.json();
      return (data.articles || []).filter((a) => a.edition === "article");
    } catch {
      return [];
    }
  }

  function objectThumb(row) {
    const SD = global.ShareData;
    if (!row?.dir || !row.photos?.length) return null;
    return `${SD.OBJECTS_ROOT}${row.dir}/${row.photos[0]}`;
  }

  function renderMuseumList(host, rows, people) {
    const SD = global.ShareData;
    if (!rows.length) {
      host.innerHTML = `<li class="sidebar-empty">No artifacts match.</li>`;
      return;
    }
    host.innerHTML = rows
      .map((row) => {
        const title = SD.objectListTitle(row);
        const meta = SD.objectListMeta(row);
        const thumb = objectThumb(row);
        const names = (row.person_ids || [])
          .map((id) => people[id]?.name)
          .filter(Boolean)
          .slice(0, 2)
          .join(" · ");
        const metaLine = names ? `${meta} · ${names}` : meta;
        return `<li>
  <button type="button" class="sidebar-item" data-object-id="${esc(row.id)}">
    ${thumb ? `<img class="sidebar-thumb" src="${esc(thumb)}" alt="" loading="lazy" />` : `<span class="sidebar-thumb sidebar-thumb-empty">${esc(String(row.type || "doc").slice(0, 3))}</span>`}
    <span class="sidebar-item-text">
      <span class="sidebar-item-title">${esc(title)}</span>
      <span class="sidebar-item-meta">${esc(metaLine)}</span>
    </span>
  </button>
</li>`;
      })
      .join("");
  }

  function renderArticlesList(host, articles) {
    if (!articles.length) {
      host.innerHTML = `<li class="sidebar-empty">No line articles yet.</li>`;
      return;
    }
    host.innerHTML = articles
      .map((a) => {
        const href = new URL("../../" + String(a.href || "").replace(/^\//, ""), global.location.href).href;
        return `<li>
  <a class="sidebar-item sidebar-link" href="${esc(href)}" target="_blank" rel="noopener">
    <span class="sidebar-item-text">
      <span class="sidebar-item-eyebrow">${esc(editionLabel(a.edition))}</span>
      <span class="sidebar-item-title">${esc(a.title)}</span>
      ${a.compiled ? `<span class="sidebar-item-meta">${esc(a.compiled)}${a.kicker ? " · " + esc(a.kicker) : ""}</span>` : ""}
    </span>
  </a>
</li>`;
      })
      .join("");
  }

  async function onObjectClick(objectId) {
    const app = global.TreeApp;
    const SD = global.ShareData;
    if (!app?.loadObjectArtifact) return;
    const obj = await app.loadObjectArtifact(objectId);
    if (!obj) return;
    const people = SD.getPeople();
    const pid = (obj.personIds || []).find((id) => people[id]);
    if (pid && app.selectPerson) app.selectPerson(pid);
    if (obj.photos?.length && app.openLightboxGallery) {
      const kind = SD.objectGalleryLabel(obj);
      const transcript = (obj.bodyText || "").replace(/^---[\s\S]*?---\n*/, "").trim().slice(0, 8000);
      app.openLightboxGallery(
        obj.photos.map((src) => ({ src, caption: obj.title || kind, transcript: transcript || "" })),
        0
      );
    }
  }

  async function init() {
    const SD = global.ShareData;
    const sidebar = document.getElementById("museum-sidebar");
    if (!sidebar || !SD) return;

    const searchInput = document.getElementById("sidebar-search");
    const museumList = document.getElementById("museum-list");
    const museumCount = document.getElementById("museum-count");
    const articlesList = document.getElementById("articles-list");
    const panelMuseum = document.getElementById("sidebar-panel-museum");
    const panelArticles = document.getElementById("sidebar-panel-articles");
    const tabBtns = sidebar.querySelectorAll("[data-sidebar-tab]");

    const idx = (await SD.ensureObjectsIndex()) || {};
    const people = SD.getPeople();
    const allRows = SD.flattenObjectsIndex(idx).sort((a, b) => String(b.id).localeCompare(String(a.id)));

    function runSearch() {
      const q = searchInput?.value || "";
      let hits = SD.searchObjects(q, idx, people);
      if (!q.trim()) hits = hits.slice(0, 120);
      else hits = hits.slice(0, 100);
      if (museumCount) {
        museumCount.textContent = q.trim()
          ? `${hits.length} match${hits.length === 1 ? "" : "es"} · ${allRows.length} total`
          : `Showing ${hits.length} of ${allRows.length}`;
      }
      renderMuseumList(museumList, hits, people);
    }

    runSearch();
    searchInput?.addEventListener("input", runSearch);

    museumList?.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-object-id]");
      if (!btn) return;
      onObjectClick(btn.getAttribute("data-object-id"));
    });

    const articles = await loadLineArticles();
    renderArticlesList(articlesList, articles);

    tabBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const tab = btn.getAttribute("data-sidebar-tab");
        tabBtns.forEach((b) => b.classList.toggle("is-active", b === btn));
        const museum = tab === "museum";
        panelMuseum.hidden = !museum;
        panelArticles.hidden = museum;
        searchInput.hidden = !museum;
        sidebar.querySelector(".sidebar-search-wrap").hidden = !museum;
        if (museum) searchInput?.focus();
      });
    });

    function setSidebarCollapsed(collapsed) {
      document.body.classList.toggle("sidebar-collapsed", collapsed);
      const toggle = document.getElementById("sidebar-toggle");
      const aside = document.getElementById("museum-sidebar");
      if (toggle) {
        toggle.setAttribute("aria-expanded", collapsed ? "false" : "true");
        toggle.setAttribute("aria-label", collapsed ? "Open museum sidebar" : "Collapse museum sidebar");
        if (collapsed) {
          const label = toggle.querySelector(".sidebar-toggle-label");
          if (label) label.textContent = "Museum";
        }
      }
      if (aside) aside.setAttribute("aria-hidden", collapsed ? "true" : "false");
    }

    document.getElementById("sidebar-toggle")?.addEventListener("click", () => {
      setSidebarCollapsed(!document.body.classList.contains("sidebar-collapsed"));
    });
    document.getElementById("sidebar-close")?.addEventListener("click", () => {
      setSidebarCollapsed(true);
    });

    setSidebarCollapsed(document.body.classList.contains("sidebar-collapsed"));
  }

  global.TreeSidebar = { init };
})(window);
