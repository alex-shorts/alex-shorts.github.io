# Living tree (Share view)

Interactive family graph + museum panel.

## Open (no server)

1. Keep this folder next to `../../collection/` (normal repo layout).
2. Double-click a tree file:
   - `alexander.html` — primary **Alexander Martin Shorts**
   - `morganne.html` — primary **Morganne Elizabeth Shorts**
   - `index.html` — default primary from `collection/people/index.json` (`focus_id`)

Uses `people-data.js` (snapshot of the people index). Photos/audio load from `collection/` via relative paths.

Or open `./?primary=alexander` / `./?primary=morganne` (trailing slash on the folder URL matters for relative scripts under `npm run prototype:tree`).

## Refresh people data after person edits

From repo root:

```powershell
node scripts/db.mjs
```

Rebuilds `collection/people/index.json` and this folder’s `people-data.js` from `person.md` files.

## Optional local server

```powershell
npm run prototype:tree
# http://localhost:5176/prototype/living-tree/alexander
# http://localhost:5176/prototype/living-tree/morganne
# (or ./?primary=alexander / ./?primary=morganne — keep the trailing slash)
```

Over http the app prefers live `collection/people/index.json` instead of the snapshot.

**Primary** sets which blood tree is drawn: all blood ancestors and descendants, plus the primary’s spouse. Adoptive/step branches and extra spouses with no blood child on this tree stay off the diagram. Couples read by spacing (no marriage dashes).

## Files (designers start here)

Cards are HTML in a layer beside the SVG (not inside `foreignObject`). One camera: SVG `transform` on edges (stays sharp), CSS `zoom` on `#cards` (HTML re-rasterizes — `transform: scale()` on HTML stays blurry).

| File | What to edit |
| --- | --- |
| `cards.css` | Tile, photo, badges, stall, +/− buttons. Sizes are CSS vars set at mount. |
| `cards.js` → `cardHTML()` | Card markup. Keep class names `.card-stack`, `.person-card`, `.expand-one`, `.expand-all`, `.expand-kids`. |
| `cards.js` → `METRICS` | `CARD_W` / `CARD_H` / `STALL_BAND` — layout reads the same numbers. |
| `layout.js` | Pedigree packing (units, layers, step-back, sprawl). |
| `styles.css` | Page chrome, panel, edge strokes. Not cards. |
| `app.js` | Camera, expand/collapse, physics overlay, museum panel. |

Do not put card look in `app.js`. Do not change `METRICS` without checking packing (`FAMILY_GAP` in `layout.js`).
