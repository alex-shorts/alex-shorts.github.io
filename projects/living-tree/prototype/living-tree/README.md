# Living tree (Share view)

Interactive family graph + museum panel.

## Open (no server)

1. Keep this folder next to `../../collection/` (normal repo layout).
2. Double-click `index.html`.

Uses `people-data.js` (snapshot of the people index). Photos/audio load from `collection/` via relative paths.

## Refresh people data after index edits

From repo root (PowerShell):

```powershell
$j = Get-Content collection/people/index.json -Raw
@"
window.__PEOPLE_INDEX__ = $j;
"@ | Set-Content prototype/living-tree/people-data.js -Encoding utf8
```

## Optional local server

```powershell
npm run prototype:tree
# http://localhost:5176/prototype/living-tree/
```

Over http the app prefers live `collection/people/index.json` instead of the snapshot.
