# Reports

Printable thematic documents for Proverbs Link — **not** slide decks.

## Open

```bash
npx --yes serve .
```

Visit [`/reports/`](../reports/index.html). Site entry: [`The Way of Life`](../index.html). Local Bibles: [`/bibles.html`](../bibles.html).

## Series

| Series | Reports | Source |
|--------|---------|--------|
| [Speech, Lips & Words](speech-lips-words/) | Overview + 4 column reports | Miro Lips matrix |

## Conventions

- One **series folder** per matrix / major document
- One **HTML report per column** (plus series overview)
- Shared print styles in [`_shared/report.css`](_shared/report.css)
- Prefer **CJB** text from `data/cjb/`
- Connect **themes / typology** only where warranted (dual columns, path language, life-stage scaling)
- Rebuild Speech: `python scripts/build_speech_reports.py`

## Print

Use **Print / Save PDF** in the browser (or Ctrl/Cmd+P). Styles hide navigation and paginate the cover.
