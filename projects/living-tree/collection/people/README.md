# People database



Filesystem store for **Person** nodes that feed the living family-tree / Share view. Parallel to `collection/objects/` (memorabilia + narrative sources). Not a SQL DB — Markdown + media folders are the source of truth.



## Layout



```text

collection/people/

  README.md

  index.json                 # graph index (ids, edges, media paths, sources, object_ids)

  <slug>/

    person.md                # vitals, assertions, sources, media manifest

    media/

      portrait.jpg           # preferred face/portrait when available

      headstone-*.jpg        # stone / memorial photos

      …

    obituary.md              # optional pointer to a catalog obituary object

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

| `parents` / `spouses` / `children` | Lists of person `id`s (graph topology) |

| `parent_links` | Optional `[{ id, confidence }]` — per-parent edge confidence for the living-tree map. Prefer this when a Confirmed child has Probable parents (or mixed). |

| `spouse_links` | Optional `[{ id, confidence }]` — per-spouse edge confidence |

| `object_ids` | Linked Accession IDs (`FT-####`) — obituaries, memorabilia |

| `confidence` | Overall identity confidence (Confirmed / Probable / Possible / Speculative) — evidence strength, not acceptance |

| `verified` | `true` \| `false` — Alex (or equivalent) has accepted this person into the tree. Separate from confidence. Default **false** on newly ingested Probable people; set **true** when a confirmation-pack Y locks the claim that establishes them (and for already-locked Confirmed / living-private known family). |

| `status` | `researching` \| `cataloged` \| `living-private` |

| `media` | List of local `{ file, kind, … }` and/or shared `{ ref, kind, … }` entries (see Media rules) |



Body sections: **Summary**, **Assertions** (with confidence **and sources**), **Sources** (required), **Open questions**, **Notes**.



## Sources (required)



Every person folder must have a **Sources** section. Connections without a paper trail mean little.



- Prefer a clickable URL (Find A Grave, funeral-home obituary, newspaper, FamilySearch, …).

- When no public URL exists (family knowledge, private docs), write a clear citation: who said what, when, and where it lives.

- Mirror a compact `sources: [{ label, url }]` list into `index.json` so the living-tree panel can show links (url may be empty for citation-only rows).

- Unverified / newly ingested Probable people especially need Sources — do not promote without at least one trail to follow.

- `verified: true` still means Alex acceptance; sources make that acceptance meaningful. Prefer not to Y-lock identity without a URL or clear citation on the pack claim.



## Assertions (claim-level sources)



Use this table shape (extend existing rows when editing; do not invent sources):



| Claim | Confidence | Source | Source URL | Notes |

| --- | --- | --- | --- | --- |

| … | Confirmed | Ventura County Star 28 Oct 2009 | https://… | Family C12c |



- **Source** — short citation (publication, memorial id, “Family pack C12”).

- **Source URL** — public link when available; leave blank for family-only / citation-only.

- **Notes** — pack ids, caveats, OCR notes — not a substitute for Source.



Person-level **Sources** stays the bibliography; assertion rows point at the specific material for that claim.



## Obituary / narrative objects



When an obituary (or similar) text is available, **do not leave it as a footnote URL only**:



1. Create `collection/objects/FT-####/` with `type: obituary` and full text (or substantial excerpt) — see [objects/README.md](../objects/README.md).

2. Add the Accession id to this person’s `object_ids` (and any other people named as primary subjects).

3. Cite the object + URL under **Sources**.



Legacy `obituary.md` under a person folder should point at the canonical object when one exists.



## Media rules



1. **Capture images** found during gap-fill (Find A Grave stone/portrait, funeral-home obituary photo, newspaper cutouts, census sheets, family group shots) into a person’s `media/`.

2. Prefer **stone photos** and **funeral-home portraits** over random web scrapes. Record `source` + `source_url` for every file.

3. Treat memorial **bio text** as Speculative/Possible; treat **stone inscription** (from photo) as Possible→Probable for inscribed facts.

4. Living persons: no public scrapes; family-provided photos only; prefer `status: living-private`.

5. **One binary on disk** for any multi-person image. Deduplicate identical bytes; cite multiple URLs on the owner entry when the same image appears in two places. Never copy the same JPEG into three `media/` folders.

6. Do not commit Find A Grave HTML dumps — extract facts + image URLs, then discard HTML.



### Shared / multi-person media



Any image or scan that covers more than one person — census household pages, family pictures, group photos, dual memorials, plot markers, obituary clips naming many people — lives **once** under a canonical owner slug. Linked people get a `ref:` entry (no second copy).



**Owner (canonical file):** prefer the household head / patriarch–matriarch for household records and family group shots; otherwise the person who “owns” the album or memorial context.



Kinds (same set for owned and linked entries): `portrait` | `photo` | `headstone` | `document` | `census-image` | `other`.



**Owner frontmatter** (`file:` + `shared: true`):

```yaml
media:
  - file: media/census-1900-jackson-mcpherson.jpg
    kind: census-image
    shared: true
    tags: [household-1900, charles_c_gatz, minnie_kruse, irvin]
    appears: [charles_c_gatz, minnie_kruse, irvin]
    source: "1900 US Census ED 133 Jackson Twp McPherson KS"
    source_url: https://www.familysearch.org/ark:/61903/3:1:S3HY-DHFW-26L
    captured_at: 2026-08-06
  - file: media/family-picnic-1952.jpg
    kind: photo
    shared: true
    tags: [family-picnic-1952]
    appears: [irvin, martha, gloria]
    source: Family album scan
    source_url: ""
    captured_at: 2026-08-06
```



**Linked person** (`ref:` — path relative to `collection/people/`):

```yaml
media:
  - ref: charles-c-gatz/media/census-1900-jackson-mcpherson.jpg
    kind: census-image
    role: son   # optional
    tags: [household-1900]
    source: "1900 US Census ED 133 Jackson Twp McPherson KS"
    source_url: https://www.familysearch.org/ark:/61903/3:1:S3HY-DHFW-26L
    captured_at: 2026-08-06
  - ref: irvin-carl-gatz/media/family-picnic-1952.jpg
    kind: photo
    role: daughter
    tags: [family-picnic-1952]
    source: Family album scan
    source_url: ""
    captured_at: 2026-08-06
```



**`index.json`:** list the **canonical** path for every linked person (same string as the owner), e.g. `"charles-c-gatz/media/census-1900-jackson-mcpherson.jpg"` on Charles, Minnie, and Irvin. Living-tree resolves that path under `collection/people/` — no duplicate binaries.



Capture once to the owner slug; tag others:

```powershell
.\scripts\capture-person-media.ps1 `
  -Slug charles-c-gatz `
  -Url "https://…" `
  -File census-1900-jackson-mcpherson.jpg `
  -Kind census-image `
  -Source "1900 US Census …" `
  -AlsoLink charles_c_gatz,minnie_kruse,irvin `
  -AlsoTag household-1900
```

(`-AlsoLink` = person `id`s that should get the canonical path in `index.json` + suggested `ref:` stubs; `-AlsoTag` = tags echoed in the suggested frontmatter.)



## `index.json` fields (per person)



Beyond graph edges / media paths, prefer:



| Field | Purpose |

| --- | --- |

| `object_ids` | Accession ids shown as expandable heritage objects in the tree |

| `sources` | `[{ "label": "…", "url": "https://…" }]` for the panel Sources list |

| `parent_links` | `[{ "id": "<person_id>", "confidence": "Confirmed\|Probable\|Possible\|Speculative" }]` — relationship confidence for parent edges |

| `spouse_links` | Same shape for spouse edges |



### Living-tree visual map (confidence + verification)



The prototype (`npm run prototype:tree`) encodes database fields as:



| Signal | Visual | Source |

| --- | --- | --- |

| Relationship confidence | **Line darkness / dash** | `parent_links` / `spouse_links`, else derived (below) |

| Person verification | **Node opacity** (+ dashed border / `?` secondary) | `verified: true\|false` |



**Edge confidence resolution**

1. Explicit `parent_links` / `spouse_links` confidence wins.
2. Else `weaker(endpointA.confidence, endpointB.confidence)` (min of Confirmed > Probable > Possible > Speculative).
3. If either endpoint is `verified: false` and the result would be Confirmed → **Probable** (unverified links cannot look fully locked).
4. For a couple→child path with two parents, use the weaker of the two parent-link confidences.



| Confidence | Edge style |

| --- | --- |

| Confirmed | Near-black solid, full weight |

| Probable (~50%) | Mid grey solid |

| Possible | Light grey dashed |

| Speculative / Unknown | Very light dotted |



| `verified` | Node style |

| --- | --- |

| `true` | Full opacity |

| `false` | ~72% opacity; dashed border + `?` badge as secondary cues |



Promote overrides into `parent_links` when notes say “Probable parents pending Y” even if person-level confidence differs.



## Relationship to research logs



Narrative research stays in `docs/research/people/`. Durable tree data + media live here. After a confirmation round locks assertions, **promote** into `person.md` + `index.json` **with sources attached**.



## Capture helper



```powershell

.\scripts\capture-person-media.ps1 -Slug gloria-martha-gatz-shorts -Url "https://…" -File portrait.jpg -Kind portrait

# Multi-person (census, family photo, dual memorial, …): one download + links
.\scripts\capture-person-media.ps1 -Slug charles-c-gatz -Url "https://…" -File census-1900-jackson-mcpherson.jpg -Kind census-image -AlsoLink minnie_kruse,irvin -AlsoTag household-1900

```

