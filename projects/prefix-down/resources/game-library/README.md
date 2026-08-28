# Game library

Phaser **4.2.1** (CDN) kits for Dual-Credit 2D games. Retro SNES / N64-2D / modern. Not Nintendo or Lego IP — genre patterns only.

## Start

```bash
npx --yes serve . -p 5173
```

Open `/games/library-studio/`. Hub keys `1–8` (first eight kits) or click a door.

```js
import { gameConfig, SCENES } from "./resources/game-library/index.js";
new Phaser.Game(gameConfig(SCENES, "snes"));
```

## Layout

| Path | What |
|---|---|
| `catalog.js` | Genre + pack IDs |
| `index.js` | Public API + scene list |
| `look/` | Palettes, type |
| `phaser/` | Config, preload, runtime UI kit |
| `input/` `motion/` `audio/` `layouts/` | Controls, FX, SFX, HUD |
| `mechanics/` | Genre sandboxes |
| `assets/vendor/` | Kenney CC0 |
| `assets/fonts/` | OFL pixel/UI fonts |
| `content/demo-deck.json` | Sample recall items |

## Scoring rule

Loot, XP, and studs pay **only** on successful retrieval (`openRecall`). Walking around is flavor.

## Shell Squad brawler

Original IP (not TMNT). Beat-em-up kit: **punch** opens a compact MCQ; correct **lands**, miss **whiffs**. Open `/games/library-studio/` and pick **Brawler**.
