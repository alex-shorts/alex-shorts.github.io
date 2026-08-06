# People database

Filesystem store for **Person** nodes that feed the living family-tree / Share view. Parallel to `collection/objects/` (memorabilia). Not a SQL DB — Markdown + media folders are the source of truth.

## Layout

```text
collection/people/
  README.md
  index.json                 # graph index (ids, edges, media paths)
  <slug>/
    person.md                # vitals, assertions, sources, media manifest
    media/
      portrait.jpg           # preferred face/portrait when available
      headstone-*.jpg        # stone / memorial photos
      …
```

**Slug:** lowercase kebab of full name as known at death (or current legal name), e.g. `gloria-martha-gatz-shorts`.

**Short `id`:** stable graph key used in `index.json` and the tree prototype (`gloria`, `richard`, …). Do not rename once linked.

## `person.md` frontmatter

| Field | Purpose |
| --- | --- |
| `id` | Short graph id |
| `slug` | Folder name |
| `name` | Display name |
| `aka` | Maiden / nicknames |
| `birth` / `death` | ISO date or year; empty if unknown |
| `birth_place` / `death_place` / `burial` | Places |
| `parents` / `spouses` / `children` | Lists of person `id`s |
| `object_ids` | Linked Accession IDs (`FT-####`) when known |
| `confidence` | Overall identity confidence (Confirmed / Probable / Possible / Speculative) |
| `status` | `researching` \| `cataloged` \| `living-private` |
| `media` | List of `{ file, kind, source, source_url, captured_at }` |

Body sections: **Summary**, **Assertions** (with confidence), **Sources**, **Open questions**, **Notes**.

## Media rules

1. **Capture images** found during gap-fill (Find A Grave stone/portrait, funeral-home obituary photo, newspaper cutouts) into that person’s `media/`.
2. Prefer **stone photos** and **funeral-home portraits** over random web scrapes. Record `source` + `source_url` for every file.
3. Treat memorial **bio text** as Speculative/Possible; treat **stone inscription** (from photo) as Possible→Probable for inscribed facts.
4. Living persons: no public scrapes; family-provided photos only; prefer `status: living-private`.
5. Deduplicate identical bytes; cite multiple URLs on one file when the same image appears in two places.
6. Do not commit Find A Grave HTML dumps — extract facts + image URLs, then discard HTML.

## Relationship to research logs

Narrative research stays in `docs/research/people/`. Durable tree data + media live here. After a confirmation round locks assertions, **promote** into `person.md` + `index.json`.

## Capture helper

```powershell
.\scripts\capture-person-media.ps1 -Slug gloria-martha-gatz-shorts -Url "https://…" -File portrait.jpg -Kind portrait
```
