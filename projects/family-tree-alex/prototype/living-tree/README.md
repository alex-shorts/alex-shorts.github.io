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

**Primary** controls which ascent is drawn: blood ancestors + descendants of the primary, plus spouse cards (spouse’s own parents stay hidden until you switch Primary or expand ⊕ in the panel).
