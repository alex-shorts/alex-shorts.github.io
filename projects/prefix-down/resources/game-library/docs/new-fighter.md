# New fighter (2D brawler)

How to add a playable character to Prefix Down / any Streets-of-Fight kit **without** the Kai sizing loop (torso-only idle, attacks that grow, title cropped to a chest).

Ash is the ruler. Match her packed idle, then stop.

## Why characters “grow”

Phaser draws a **96×63 cell** at **scale 6**, origin **(0.5, 1)** (feet on the floor). The sprite’s on-screen box never changes. What you see as “bigger” is **more opaque pixels inside the cell**.

A waist-up close-up packed to the same cell height as a full body makes a chest as tall as Ash’s whole figure. Mixing that with a full-body idle is a size pop on every punch, kick, or jump.

`setDisplaySize` on play also pops scale. Use `setScale` only (`lockFighterSize`).

Width **may** grow when a limb extends. Height of the **standing body** must not.

## Target (packed cell)

| | Pixels in 96×63 |
|---|---|
| Standing body | **~24–26 × 46–48** (Ash idle) |
| Cap | **46px** before outline (~48 after) |
| Feet | Bottom of cell (`y = 62`) |
| Game scale | **6** (same as Ash) |

If a packed attack frame’s bbox height is **> 48**, it will look bigger than idle. Reject it.

## Do this in order — do not skip

### 1. Idle only

Generate **one** idle strip. Do not generate attacks yet.

- Full body, head-to-boots, every frame.
- Side view, facing **right**.
- Lots of black padding. The figure is **small** in the 16:9 gen, not a bust filling the frame.
- Same silhouette height as packed Ash: `assets/vendor/ansimuz-sof/girl-idle.png`.
- Pass that PNG as a **reference image** on the gen.

**Reject the gen** if any frame is waist-up, or if the figure is a close-up. Do not pack a bad idle “to fix later.”

Pack idle into 96×63 (see packer below). Confirm bbox ~26×46–48 and feet on the cell floor. Compare next to `girl-idle.png`. Only then continue.

### 2. Every other sheet against that idle

Generate walk, jump, jab, punch, smash, kick, jumpkick, divekick, hurt **after** packed idle exists.

Each gen:

- Attach **two** refs: packed idle for this character **and** Ash’s sheet for that move (`girl-walk.png`, `girl-jab.png`, …).
- Same prompt rules: full body, same height as the idle ref, lots of black, no bust, no close-up, one row, equal cell widths, facing right.
- Ask for the **frame counts** in the table below.

**Inspect every frame before packing.** If a strip mixes full-body and waist-up, regenerate that strip. The packer can drop some busts; it cannot invent missing legs.

Do not reuse leftover close-up gens from an earlier try. One mixed sheet will pop on that move.

### 3. Pack at one body height

Use `assets/vendor/ansimuz-sof/_pack_ninja.py` (copy jobs/paths for the new folder). Rules the packer already encodes:

- Cell **96×63**, `BODY_H = 46`, `MAX_H = 46`.
- Pack **idle first** so standing height is locked.
- Other sheets: scale so **typical full-body frames** hit 46px (gens are not the same source resolution). Do not apply idle’s source-pixel ratio blindly — Kick drawn smaller than idle would pack tiny; a close-up would pack huge.
- Drop waist-up frames (crop bottom as wide as the chest).
- Paste feet at the bottom of the cell. Jump **arc is Phaser `y`**, not pixels floating inside the cell.
- Idle may bob a couple of pixels. Attacks must not exceed idle height.

After pack, print bbox height per frame. **max height must equal idle (48),** except crouch/tuck (shorter is OK).

### 4. Register, then playtest size before polish

In `motion/fighter-anims.js`:

- Add `FIGHTERS.<id>` with `scale: 6`, same `body` as Ash unless the silhouette is truly different.
- `files.*` paths under `vendor/ansimuz-sof/<folder>/`.
- `frames` counts **must match** packed frame counts.
- If there is no smash sheet, omit `files.smash` and smash can reuse jump frames 0–1 (Ash). If smash exists, every smash frame must be full-body too — third punch is where Kai still popped.

Title / select:

- `setOrigin(0.5, 1)` on the floor.
- Title street: `paintRoad(this, W, { props: false })` so a bush does not cover the legs and leave a “torso.”
- Stand the preview where props will not overlap (`TitleScene` uses `W * 0.22` / `W * 0.4`).

Brawler:

- `lockFighterSize` = `setScale` only.
- Do not restart a finished one-shot anim every frame.
- Grounded smash/uppercut: no hop that freezes in the air and blocks punches.

Cache: `paths.js` `asset()` appends `?v=` from the page query. Hard-refresh with a new `?v=` after packing or you will still see old sheets.

Playtest URL:

```
http://127.0.0.1:5173/games/metric-brawler/?fighter=<id>&start=BrawlerScene&practice=1&v=<unique>
```

Check **idle → jab → punch → smash → kick → jump** on the same spot. Body height should hold. Then title select.

## Sheet list (Kai template)

| Act | Frames | Packed file |
|---|---|---|
| idle | 6 | `*-idle.png` |
| walk / run | 8 | `*-walk.png` |
| jump (also fall / djump) | 6 | `*-jump.png` |
| jab | 5 | `*-jab.png` |
| punch | 5 | `*-punch.png` |
| smash (3rd punch) | 5 | `*-smash.png` |
| kick | 8 | `*-kick.png` |
| jumpkick | 5 | `*-jumpkick.png` |
| divekick | 6 | `*-divekick.png` |
| hurt | 2 | `*-hurt.png` |

Gens live in the Cursor assets folder (`kai-*-full.png` pattern). Only **packed** 96×63 strips ship in `resources/game-library/assets/`.

## Gen prompt (copy)

```
16-bit arcade PIXEL ART. Pure black #000000 background. N equally spaced
<MOVE> frames in ONE row, same cell width each. Every frame is FULL BODY
head-to-boots on one baseline. Same character HEIGHT as the packed idle
reference — small figure, lots of black padding. NEVER a waist-up close-up,
NEVER a bust, NEVER crop the legs. Side view FACING RIGHT.
<costume, one line>
Head size identical in all frames. Chunky SNES pixels. No text.
```

Attach: packed idle + Ash’s sheet for that move.

## Verify (numbers, not vibes)

Packed bbox heights vs idle, then in-game opaque height × scale (~276–288px at scale 6). Punch/kick **width** can jump; **height** must not.

## What we will not do next time

- Generate attacks before idle is packed and size-checked.
- Pack old close-ups “just for now.”
- Scale each frame independently to cell height (turns a bust into a giant torso).
- `setDisplaySize` on the fighter sprite.
- Title preview over street bushes without `props: false`.
- Assume `?fighter=` cache-busts PNG URLs (it does not unless `asset()` adds `v=`).
