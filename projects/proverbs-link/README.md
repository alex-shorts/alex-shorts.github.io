# Proverbs Link

Thematic Proverbs study site — hinge, climb, foundation, verses, Miro theme columns, and local Bible libraries.

**Site entry:** [The Way of Life](index.html) — load centered on the hinge (Proverbs 1:7). Scroll **up** for the climb (10–31), **down** for the foundation (1–9).

The climb and foundation remain independent surfaces so each can develop on its own.

## Open locally

```bash
python scripts/serve_site.py
```

Then visit [http://127.0.0.1:3000](http://127.0.0.1:3000) (Theme Board: [/themes.html](http://127.0.0.1:3000/themes.html)). This server can **Save** `data/themes.json` from the board and rebuild climb/verses packs.

On the Theme Board: drag a verse to refile it; hold **Alt** (or switch to **Tag**) to keep it in both lists. Undo with Ctrl+Z.

Static preview (no Save endpoint):

```bash
npx --yes serve .
```

## Publish on GitHub Pages

1. Push this repo to GitHub.
2. Settings → Pages → Deploy from branch → `main` / root (site root, not `/docs`).
3. `.nojekyll` is included so folders like `data/` publish cleanly.

Share URL is the repo Pages root — it opens **The Way of Life**.

## Pages

| Page | Role |
|------|------|
| [`index.html`](index.html) | **The Way of Life** — hinge hub (entry) |
| [`climb.html`](climb.html) | A Man’s Climb — Proverbs 10–31 |
| [`order.html`](order.html) | The Order — submission climb (family → throne) |
| [`build.html`](build.html) | The House — court plan after Order (same five courts, many names) |
| [`proverbs-1-9.html`](proverbs-1-9.html) | A Firm Foundation — Proverbs 1–9 (still evolving) |
| [`way-of-life.html`](way-of-life.html) | Redirect → site entry |
| [`verses.html`](verses.html) | Verses for a climb category (`#diligence`) |
| [`themes.html`](themes.html) | Theme Board — drag verses between columns (10–31) |
| [`matrices.html`](matrices.html) | Speech / Shema / Frame matrices |
| [`bibles.html`](bibles.html) | Local CJB / ESV / KJV / NKJV / CSB |
| [`proposals.html`](proposals.html) | Proposal review tools |
| [`reports/`](reports/) | Printable Speech reports |

## Rebuild climb ↔ verse map

After changing ontology climb bands or theme layers:

```bash
python proposals/theme-ontology/_build_hierarchy_map_data.py
python scripts/build_category_verse_map.py
```

## Data

- `data/themes.json` — Miro theme columns + CJB passages (source of truth for most verse lists)
- `data/matrices/speech-lips-words.json` — Speech sub-columns
- `data/category-verse-map.json` — climb category id → verse source(s)
- `data/proverbs-1-9/` — foundation board (Categories + master story)
- `proposals/theme-ontology/` — ontology docs & climb data

## Themes (Miro columns)

The Wise/Righteous · The Fool / Wicked · Ruler / King · Human Nature · Humility & Pride · Anger · Man and Woman Family and Friends · Way of Death · Way of Life · Wisdom, Knowledge & Discipline · Discipline · Diligent & Lazy · Wealth · Speech · Justice

Translation note: CJB is the wording source of truth for study extracts. Other versions are for local comparison.
