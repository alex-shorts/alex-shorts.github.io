"""Pack generated sheets into 96x63 cells with edge flood-fill (keeps dark armor/fur)."""
from collections import deque
from PIL import Image
from pathlib import Path

SRC = Path(r"C:\Users\Alex\.cursor\projects\c-Users-Alex-Dual-Credit\assets")
DST = Path(r"C:\Users\Alex\Dual-Credit\resources\game-library\assets\vendor\ansimuz-sof")
CELL = (96, 63)
TARGET_H = 50
ROCKET_CELL = (48, 24)
ROCKET_H = 14


def flood_clear(im, thresh=16):
    im = im.convert("RGBA")
    w, h = im.size
    px = im.load()

    def bg(x, y):
        r, g, b, a = px[x, y]
        return r < thresh and g < thresh and b < thresh

    seen = [bytearray(w) for _ in range(h)]
    q = deque()
    for x in range(w):
        q.append((x, 0))
        q.append((x, h - 1))
    for y in range(h):
        q.append((0, y))
        q.append((w - 1, y))
    while q:
        x, y = q.popleft()
        if x < 0 or y < 0 or x >= w or y >= h or seen[y][x]:
            continue
        seen[y][x] = 1
        if not bg(x, y):
            continue
        px[x, y] = (0, 0, 0, 0)
        q.append((x + 1, y))
        q.append((x - 1, y))
        q.append((x, y + 1))
        q.append((x, y - 1))
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a > 48:
                px[x, y] = (r, g, b, 255)
            elif a > 0:
                px[x, y] = (0, 0, 0, 0)
    return im


def column_runs(im, min_w=16):
    w, h = im.size
    px = im.load()
    on = []
    for x in range(w):
        hit = False
        for y in range(h):
            if px[x, y][3] > 24:
                hit = True
                break
        on.append(hit)
    runs = []
    start = None
    for i, v in enumerate(on):
        if v and start is None:
            start = i
        elif not v and start is not None:
            if i - start >= min_w:
                runs.append((start, i))
            start = None
    if start is not None and w - start >= min_w:
        runs.append((start, w))
    merged = []
    for a, b in runs:
        if merged and a - merged[-1][1] < 28:
            merged[-1] = (merged[-1][0], b)
        else:
            merged.append((a, b))
    return merged


def split_frames(im, n):
    w, h = im.size
    runs = column_runs(im)
    if len(runs) == n:
        return [im.crop((a, 0, b, h)) for a, b in runs]
    box = im.getbbox() or (0, 0, w, h)
    x0, y0, x1, y1 = box
    cw = (x1 - x0) / n
    return [im.crop((int(x0 + i * cw), y0, int(x0 + (i + 1) * cw), y1)) for i in range(n)]


def fit_cell(crop, cell, target_h):
    out = Image.new("RGBA", cell, (0, 0, 0, 0))
    box = crop.getbbox()
    if not box:
        return out
    part = crop.crop(box)
    pw, ph = part.size
    scale = target_h / max(ph, 1)
    nw = min(cell[0] - 2, max(1, round(pw * scale)))
    nh = min(cell[1] - 2, max(1, round(ph * scale)))
    part = part.resize((nw, nh), Image.Resampling.BOX)
    x = (cell[0] - nw) // 2
    y = cell[1] - nh - 1
    out.paste(part, (x, y), part)
    px = out.load()
    w, h = out.size
    for yy in range(h):
        for xx in range(w):
            r, g, b, a = px[xx, yy]
            if a > 48:
                px[xx, yy] = (r, g, b, 255)
            elif a > 0:
                px[xx, yy] = (0, 0, 0, 0)
    return out


def pack(name, n, dest, cell=CELL, target_h=TARGET_H, scrub_rocket=False):
    im = flood_clear(Image.open(SRC / name))
    frames = [fit_cell(f, cell, target_h) for f in split_frames(im, n)]
    if scrub_rocket and len(frames) >= 3:
        fr = frames[2]
        px = fr.load()
        w, h = fr.size
        for y in range(h):
            for x in range(int(w * 0.62), w):
                px[x, y] = (0, 0, 0, 0)
    sheet = Image.new("RGBA", (cell[0] * n, cell[1]), (0, 0, 0, 0))
    for i, fr in enumerate(frames):
        sheet.paste(fr, (i * cell[0], 0), fr)
    out = DST / dest
    sheet.save(out)
    print("wrote", out.name, sheet.size, "n", n)


jobs = [
    ("wolf-walk-8.png", 8, "wolf-walk.png", False),
    ("bot-walk-8.png", 8, "bot-walk.png", False),
    ("wolf-idle-6.png", 6, "wolf-idle.png", False),
    ("bot-idle-6.png", 6, "bot-idle.png", False),
    ("wolf-punch-5.png", 5, "wolf-punch.png", False),
    ("bot-shoot-5.png", 5, "bot-punch.png", True),
]
for src, n, dest, scrub in jobs:
    pack(src, n, dest, scrub_rocket=scrub)

pack("rocket-fly-4.png", 4, "rocket-fly.png", cell=ROCKET_CELL, target_h=ROCKET_H)
print("done")
