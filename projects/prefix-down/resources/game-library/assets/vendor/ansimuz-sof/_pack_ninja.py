"""Pack Kai strips into 96x63 cells at a stable body scale."""
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image

SRC = Path(r"C:\Users\Alex\.cursor\projects\c-Users-Alex-Dual-Credit\assets")
DST = Path(r"C:\Users\Alex\Dual-Credit\resources\game-library\assets\vendor\ansimuz-sof\ninja")
CELL = (96, 63)
BODY_H = 46
MAX_H = 46


def chroma_clear(im):
    im = im.convert("RGBA")
    w0, h0 = im.size
    if w0 > 1400:
        im = im.resize((1200, round(h0 * 1200 / w0)), Image.Resampling.NEAREST)
    arr = np.array(im)
    rgb = arr[:, :, :3].astype(np.int16)
    bg_mask = rgb.max(axis=2) < 22
    h, w = bg_mask.shape
    kill = np.zeros((h, w), dtype=bool)
    kill[0] = bg_mask[0]
    kill[-1] = bg_mask[-1]
    kill[:, 0] = bg_mask[:, 0]
    kill[:, -1] = bg_mask[:, -1]
    for _ in range(max(h, w)):
        grow = kill.copy()
        grow[1:] |= kill[:-1]
        grow[:-1] |= kill[1:]
        grow[:, 1:] |= kill[:, :-1]
        grow[:, :-1] |= kill[:, 1:]
        nxt = grow & bg_mask
        if nxt.sum() == kill.sum():
            break
        kill = nxt
    arr[kill, 3] = 0
    opaque = arr[:, :, 3] > 48
    arr[opaque, 3] = 255
    arr[~opaque] = (0, 0, 0, 0)
    return Image.fromarray(arr)


def keep_largest(im):
    arr = np.array(im)
    solid = arr[:, :, 3] > 48
    h, w = solid.shape
    labels = np.zeros((h, w), dtype=np.int32)
    sizes = {}
    lid = 0
    for y in range(h):
        for x in range(w):
            if not solid[y, x] or labels[y, x]:
                continue
            lid += 1
            q = deque([(x, y)])
            labels[y, x] = lid
            n = 0
            while q:
                cx, cy = q.popleft()
                n += 1
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    nx, ny = cx + dx, cy + dy
                    if 0 <= nx < w and 0 <= ny < h and solid[ny, nx] and labels[ny, nx] == 0:
                        labels[ny, nx] = lid
                        q.append((nx, ny))
            sizes[lid] = n
    if not sizes:
        return im
    best = max(sizes, key=sizes.get)
    arr[labels != best] = (0, 0, 0, 0)
    return Image.fromarray(arr)


def bbox_h(im):
    box = im.getbbox()
    return (box[3] - box[1]) if box else 1


def equal_split(im, n):
    box = im.getbbox() or (0, 0, im.size[0], im.size[1])
    x0, y0, x1, y1 = box
    cw = (x1 - x0) / n
    return [keep_largest(im.crop((int(x0 + i * cw), y0, int(x0 + (i + 1) * cw), y1))) for i in range(n)]


def fit_count(frames, n):
    if not frames:
        return frames
    if len(frames) == n:
        return frames
    if len(frames) > n:
        last = max(1, len(frames) - 1)
        return [frames[round(i * last / (n - 1))] for i in range(n)]
    ping = frames + frames[-2:0:-1]
    out = []
    while len(out) < n:
        out.extend(ping or frames)
    return out[:n]


def outline_cell(im):
    arr = np.array(im)
    solid = arr[:, :, 3] > 128
    if not solid.any():
        return im
    grow = solid.copy()
    grow[1:] |= solid[:-1]
    grow[:-1] |= solid[1:]
    grow[:, 1:] |= solid[:, :-1]
    grow[:, :-1] |= solid[:, 1:]
    edge = grow & ~solid
    arr[edge] = (16, 12, 24, 255)
    rgb = arr[:, :, :3].astype(np.float32)
    rgb[solid] = np.clip(rgb[solid] * 1.22 + 14, 0, 255)
    arr[:, :, :3] = rgb.astype(np.uint8)
    return Image.fromarray(arr)


def fit_cell(crop, scale):
    out = Image.new("RGBA", CELL, (0, 0, 0, 0))
    box = crop.getbbox()
    if not box:
        return out
    part = crop.crop(box)
    pw, ph = part.size
    nw = max(1, round(pw * scale))
    nh = max(1, round(ph * scale))
    part = part.resize((nw, nh), Image.Resampling.NEAREST)
    if nw > CELL[0] - 2 or nh > MAX_H:
        s = min(1, (CELL[0] - 2) / max(nw, 1), MAX_H / max(nh, 1))
        nw = max(1, round(nw * s))
        nh = max(1, round(nh * s))
        part = part.resize((nw, nh), Image.Resampling.NEAREST)
    x = (CELL[0] - nw) // 2
    y = CELL[1] - nh - 1
    out.paste(part, (x, y), part)
    arr = np.array(out)
    a = arr[:, :, 3]
    arr[a > 48, 3] = 255
    arr[a <= 48] = (0, 0, 0, 0)
    return outline_cell(Image.fromarray(arr))


def bob_idle(frames):
    dips = [0, 1, 2, 2, 1, 0]
    out = []
    for i, fr in enumerate(frames):
        d = dips[i % len(dips)]
        if not d:
            out.append(fr)
            continue
        shifted = Image.new("RGBA", CELL, (0, 0, 0, 0))
        shifted.paste(fr, (0, d), fr)
        out.append(shifted)
    return out


def looks_full_body(im):
    box = im.getbbox()
    if not box:
        return False
    part = im.crop(box)
    arr = np.array(part)
    h, w = arr.shape[:2]
    if h < 8 or w < 4:
        return False
    solid = arr[:, :, 3] > 48
    # Waist-up gens: the bottom of the crop is a wide torso cut, not boots.
    bot = solid[int(h * 0.88) :].any(axis=0)
    mid = solid[int(h * 0.36) : int(h * 0.58)].any(axis=0)
    bot_w = int(bot.sum())
    mid_w = int(mid.sum()) or 1
    if bot_w >= mid_w * 0.88 and bot_w > max(8, int(w * 0.4)):
        return False
    return True


def full_body_frames(frames):
    good = [f for f in frames if looks_full_body(f)]
    return good or frames


def tallest_frames(frames):
    hs = [bbox_h(f) for f in frames]
    floor = max(hs) * 0.88
    good = [f for f, h in zip(frames, hs) if h >= floor]
    return good or frames


IDLE_SCALE = None


def sheet_scale(frames, kind):
    global IDLE_SCALE
    hs = np.array([bbox_h(f) for f in frames], dtype=float)
    if kind == "idle":
        hs = np.array([bbox_h(f) for f in tallest_frames(frames)], dtype=float)
        IDLE_SCALE = BODY_H / max(float(np.median(hs)), 1)
        return IDLE_SCALE
    # Gens are not the same pixel size. Match idle body height using typical
    # frames on this sheet (drop tiny splits and giant close-ups).
    med = float(np.median(hs))
    typical = [h for h in hs if 0.72 * med <= h <= 1.32 * med]
    base = float(np.median(typical if typical else hs))
    return BODY_H / max(base, 1)


def load_src(name):
    p = SRC / name
    if not p.exists():
        p = DST / name
    return chroma_clear(Image.open(p))


def pack(src_name, n, dest_name, kind, bob=False):
    raw = equal_split(load_src(src_name), n)
    if kind == "idle":
        raw = tallest_frames(raw)
    else:
        kept = full_body_frames(raw)
        if len(kept) < len(raw):
            print(src_name, "dropped busts", len(raw) - len(kept))
        raw = kept
    scale = sheet_scale(raw, kind)
    raw = fit_count(raw, n)
    print(src_name, "n", len(raw), "scale", round(scale, 4), "h", [bbox_h(f) for f in raw])
    frames = [fit_cell(f, scale) for f in raw]
    if bob:
        frames = bob_idle(frames)
    sheet = Image.new("RGBA", (CELL[0] * n, CELL[1]), (0, 0, 0, 0))
    for i, fr in enumerate(frames):
        sheet.paste(fr, (i * CELL[0], 0), fr)
    DST.mkdir(parents=True, exist_ok=True)
    sheet.save(DST / dest_name)
    print("wrote", dest_name, sheet.size)


jobs = [
    ("kai-idle-full.png", 6, "ninja-idle.png", "idle", True),
    ("kai-walk-full.png", 8, "ninja-walk.png", "walk", False),
    ("kai-jump-full.png", 6, "ninja-jump.png", "jump", False),
    ("kai-jab-full.png", 5, "ninja-jab.png", "jab", False),
    ("kai-punch-full.png", 5, "ninja-punch.png", "punch", False),
    ("kai-smash-full.png", 5, "ninja-smash.png", "smash", False),
    ("kai-kick-full.png", 8, "ninja-kick.png", "kick", False),
    ("kai-jumpkick-full.png", 5, "ninja-jumpkick.png", "jumpkick", False),
    ("kai-divekick-full.png", 6, "ninja-divekick.png", "divekick", False),
    ("ninja-hurt.png", 2, "ninja-hurt.png", "hurt", False),
]
if __name__ == "__main__":
    for src, n, dest, kind, bob in jobs:
        pack(src, n, dest, kind, bob=bob)
    print("done")
