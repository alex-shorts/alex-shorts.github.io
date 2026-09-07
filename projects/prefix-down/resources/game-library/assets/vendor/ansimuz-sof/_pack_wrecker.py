"""Pack Giga Wrecker as whole robots, not isolated plates."""
from pathlib import Path

import numpy as np
from PIL import Image

SRC = Path(r"C:\Users\Alex\.cursor\projects\c-Users-Alex-Dual-Credit\assets")
DST = Path(r"C:\Users\Alex\Dual-Credit\resources\game-library\assets\vendor\ansimuz-sof\wrecker")
CELL = (192, 176)
BODY_H = 158
MAX_H = 168


def chroma(im):
    im = im.convert("RGBA")
    arr = np.array(im)
    rgb = arr[:, :, :3].astype(np.int16)
    dark = rgb.max(axis=2) < 12
    arr[dark, 3] = 0
    arr[arr[:, :, 3] > 40, 3] = 255
    arr[arr[:, :, 3] <= 40] = (0, 0, 0, 0)
    return Image.fromarray(arr)


def bbox_h(im):
    box = im.getbbox()
    return (box[3] - box[1]) if box else 1


def split_row(im, n):
    w, h = im.size
    cw = w / n
    out = []
    for i in range(n):
        out.append(im.crop((int(i * cw), 0, int((i + 1) * cw), h)))
    return out


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
    return out


def pack(src_name, n, dest_name):
    raw = split_row(chroma(Image.open(SRC / src_name)), n)
    hs = [bbox_h(f) for f in raw]
    scale = BODY_H / max(float(np.median(hs)), 1)
    print(src_name, "scale", round(scale, 4), "h", hs)
    frames = [fit_cell(f, scale) for f in raw]
    sheet = Image.new("RGBA", (CELL[0] * n, CELL[1]), (0, 0, 0, 0))
    for i, fr in enumerate(frames):
        sheet.paste(fr, (i * CELL[0], 0), fr)
        b = fr.getbbox()
        print("  frame", i, (b[2] - b[0], b[3] - b[1]) if b else None)
    DST.mkdir(parents=True, exist_ok=True)
    sheet.save(DST / dest_name)
    print("wrote", dest_name, sheet.size)


if __name__ == "__main__":
    pack("wrecker-idle-full.png", 6, "wrecker-idle.png")
    pack("wrecker-walk-full.png", 6, "wrecker-walk.png")
    pack("wrecker-punch-full.png", 5, "wrecker-punch.png")
    pack("wrecker-break-full.png", 6, "wrecker-break.png")
    print("done")
