---
id: FT-0416
type: vital
title: "NYC Open Data marriage index — Mamlock sisters × Aronsohn / Geiger / Michaels"
people:
  - Franciska Mamlock
  - Leo P. Aronsohn
  - Esther Mamlock
  - Charles Geiger
  - Emma Mamlock
  - Aloe Michaels
person_ids: [franciska_mamlock, leo_p_aronsohn, esther_mamlock, charles_geiger, emma_mamlock, aloe_michaels]
owner: mamie_mamlock
publication: NYC Historical Vital Records — Index to Digitized Marriage Certificates (Open Data j62e-7maa)
date_or_era: 1886-09-19 · 1894-03-06 · 1898-12-06
place: Manhattan, New York, New York
source_url: https://data.cityofnewyork.us/City-Government/NYC-Historical-Vital-Records-Index-to-Digitized-Ma/j62e-7maa
provenance: >-
  Soft-mint 2026-08-12 gather-artifacts / create-family-tree collateral.
  Same certificate number returns bride + groom rows in Open Data; pairs three
  named Mamlock sisters already soft on the tree. Index only — HVR PDFs still
  blocked (Akamai) this wave.
captured_at: 2026-08-12
status: cataloged
uncategorized: false
related_object_ids: [FT-0022, FT-0260, FT-0305]
---

## Catalog note

**Marriage-index artifact** (not the certificate images). Unlocks **spouse names** for three Mamlock sisters of **Mamie** so the collateral graph can soft-ingest in-laws without inventing surnames.

## Index pairs (Manhattan)

| Bride | Groom | Date | Cert |
| --- | --- | --- | --- |
| **Franciska Mamlock** | **Leo P Aronsohn** | 19 Sep 1886 | **61529** |
| **Esther Mamlock** | **Charles Geiger** | 6 Mar 1894 | **2970** |
| **Emma Mamlock** | **Aloe Michaels** | 6 Dec 1898 | **18992** |

Query shape: Open Data `j62e-7maa` filtered by `year` + `number` + `county=MANHATTAN` returns **two** rows (bride + groom) sharing the certificate number.

## FAN logged, not soft-wired

| Bride | Groom | Date | Cert | Why parked |
| --- | --- | --- | --- | --- |
| Rosalie Mamlock | Moritz Braniss | 7 May 1902 | 8635 | Not on Mayer/Rochelle children list |
| David Mamlock | Valeria Hirschfeld | 1 Oct 1882 | 16843 | Male Mamlock FAN; parents unknown |

## Supports

- Supports: Spouse names for Franciska / Esther / Emma; marriage dates + Manhattan cert numbers
- Does not support: Parents of the grooms; that Rosalie/David are Mayer’s children; certificate parent fields (need HVR PDF)

## Sources

- [NYC Open Data — Index to Digitized Marriage Certificates](https://data.cityofnewyork.us/City-Government/NYC-Historical-Vital-Records-Index-to-Digitized-Ma/j62e-7maa)
- Example queries: Franciska [61529/1886](https://data.cityofnewyork.us/resource/j62e-7maa.json?$where=year=%271886%27%20AND%20number=%2761529%27%20AND%20county=%27MANHATTAN%27) · Esther [2970/1894](https://data.cityofnewyork.us/resource/j62e-7maa.json?$where=year=%271894%27%20AND%20number=%272970%27%20AND%20county=%27MANHATTAN%27) · Emma [18992/1898](https://data.cityofnewyork.us/resource/j62e-7maa.json?$where=year=%271898%27%20AND%20number=%2718992%27%20AND%20county=%27MANHATTAN%27)
