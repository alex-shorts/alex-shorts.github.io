# Far Ledge (new)

Typing is the run. Mario Teaches Typing controls, Prince-of-Persia jumps. Multiplication 1–12.

This is a **new browser build**. The Phaser prototype (`../far-ledge/`) and the broken Godot scaffold (`../far-ledge-godot/`) are not this game — palace plates are reused as backgrounds only.

Public copy: [alex-shorts.github.io/projects/far-ledge/](https://alex-shorts.github.io/projects/far-ledge/)

## Open

Double-click `index.html`, or from the school-games root:

```bash
npx --yes serve . -p 5173
```

Then open `/far-ledge-run/`.

## Play

| Input | What happens |
|---|---|
| **0–9** | Each *correct* digit is a step toward the gap |
| Last digit of the product | Committed leap (not Mario bounce) |
| Wrong digit | No step. Three wrongs → fall, flash the product, wipe, rewind |
| **R** | New run |

XP / combo only move on a successful landing. Same gap comes back from memory after a miss.

## Feel

- Body idle until you type. No WASD.
- Slow/short products walk; longer products run into a running jump.
- Hang + auto pull if a leap is short.
- Stem is painted on the far ledge.
