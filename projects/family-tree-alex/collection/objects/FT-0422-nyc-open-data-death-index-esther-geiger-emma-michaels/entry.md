---
id: FT-0422
type: vital
title: "NYC Open Data death index — Esther Geiger Manh 1197/1944 · Emma Michaels Manh 6504/1942"
people:
  - Esther Mamlock
  - Esther Geiger
  - Emma Mamlock
  - Emma Michaels
person_ids: [esther_mamlock, emma_mamlock]
owner: esther_mamlock
publication: NYC Historical Vital Records — death index (Open Data 797j-9xvg)
date_or_era: 1944-01-10 · 1942-03-22
place: Manhattan, New York, New York
source_url: https://data.cityofnewyork.us/City-Government/NYC-Historical-Vital-Records-Deaths/797j-9xvg
provenance: >-
  Soft-mint 2026-08-12 gather-artifacts (Evidence lane). Open Data death-index
  candidates already noted on esther_mamlock / emma_mamlock person cards (packs
  C1894 / C1895). HVR PDFs still blocked (Akamai) — index-only mint; do not
  lock person death: fields from this Accession alone.
captured_at: 2026-08-12
status: cataloged
uncategorized: false
related_object_ids: [FT-0416, FT-0260]
---

## Catalog note

**Death-index artifact** (not certificate images) for two **Mamlock** sister married names already on the tree. Candidates only — ages fit ship / marriage eras but HVR PDF / FAG paste still required before setting `death:` on the person cards.

## Index rows (Manhattan)

| Name (index) | Graph person | Date | Cert | Age |
| --- | --- | --- | --- | --- |
| **Esther Geiger** | `esther_mamlock` (aka Esther Geiger) | **10 Jan 1944** | **1197** | **75 y** (~1869) |
| **Emma Michaels** | `emma_mamlock` (aka Emma Michaels) | **22 Mar 1942** | **6504** | **76 y** (~1866; ship age 3 in 1867 ≈ b.1864) |

Query shape: Open Data `797j-9xvg` filtered by `last_name` + `first_name` + `number` (county = manhattan on both rows).

## Supports

- Supports: Index death dates + Manhattan cert numbers + ages for Esther Geiger / Emma Michaels candidates already logged on person Open questions
- Does not support: Parents / spouses on the death certificates; burial; locking `death:` without HVR PDF or independent FAG paste; that every Geiger/Michaels death row is these sisters

## Sources

- [Esther Geiger 1197/1944](https://data.cityofnewyork.us/resource/797j-9xvg.json?$where=last_name%20=%27Geiger%27%20AND%20first_name%20=%27Esther%27%20AND%20number%20=%271197%27)
- [Emma Michaels 6504/1942](https://data.cityofnewyork.us/resource/797j-9xvg.json?$where=last_name%20=%27Michaels%27%20AND%20first_name%20=%27Emma%27%20AND%20number%20=%276504%27)
