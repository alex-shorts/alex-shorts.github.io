"""Pack Giga Wrecker strips into large cells (boss, not Ash-sized)."""
from pathlib import Path

import _pack_ninja as p

p.CELL = (192, 176)
p.BODY_H = 158
p.MAX_H = 160
p.DST = Path(r"C:\Users\Alex\Dual-Credit\resources\game-library\assets\vendor\ansimuz-sof\wrecker")
p.IDLE_SCALE = None

jobs = [
    ("wrecker-idle-full.png", 6, "wrecker-idle.png", "idle", True),
    ("wrecker-walk-full.png", 6, "wrecker-walk.png", "walk", False),
    ("wrecker-punch-full.png", 5, "wrecker-punch.png", "punch", False),
    ("wrecker-break-full.png", 6, "wrecker-break.png", "break", False),
]
if __name__ == "__main__":
    for src, n, dest, kind, bob in jobs:
        p.pack(src, n, dest, kind, bob=bob)
    print("wrecker pack done")
