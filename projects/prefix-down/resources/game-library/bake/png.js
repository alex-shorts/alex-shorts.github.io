import { deflateSync } from "zlib";
import { mkdirSync, writeFileSync } from "fs";
import { dirname } from "path";

const CRC = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  CRC[n] = c >>> 0;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const t = Buffer.from(type, "ascii");
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([t, data])));
  return Buffer.concat([len, t, data, crc]);
}

export class Pix {
  constructor(w, h) {
    this.w = w;
    this.h = h;
    this.data = Buffer.alloc(w * h * 4);
  }

  set(x, y, rgb, a = 255) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h || a <= 0) return;
    const i = (y * this.w + x) * 4;
    this.data[i] = (rgb >> 16) & 255;
    this.data[i + 1] = (rgb >> 8) & 255;
    this.data[i + 2] = rgb & 255;
    this.data[i + 3] = a;
  }

  fill(rgb, a = 255) {
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) this.set(x, y, rgb, a);
  }

  rect(x, y, w, h, rgb, a = 255) {
    for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) this.set(x + xx, y + yy, rgb, a);
  }

  hline(x, y, w, rgb, a = 255) {
    for (let i = 0; i < w; i++) this.set(x + i, y, rgb, a);
  }

  vline(x, y, h, rgb, a = 255) {
    for (let i = 0; i < h; i++) this.set(x, y + i, rgb, a);
  }

  outline(x, y, w, h, rgb) {
    this.hline(x, y, w, rgb);
    this.hline(x, y + h - 1, w, rgb);
    this.vline(x, y, h, rgb);
    this.vline(x + w - 1, y, h, rgb);
  }

  blit(src, dx, dy) {
    for (let y = 0; y < src.h; y++) {
      for (let x = 0; x < src.w; x++) {
        const i = (y * src.w + x) * 4;
        const a = src.data[i + 3];
        if (!a) continue;
        const rgb = (src.data[i] << 16) | (src.data[i + 1] << 8) | src.data[i + 2];
        this.set(dx + x, dy + y, rgb, a);
      }
    }
  }

  png() {
    const raw = Buffer.alloc((this.w * 4 + 1) * this.h);
    for (let y = 0; y < this.h; y++) {
      const o = y * (this.w * 4 + 1);
      raw[o] = 0;
      this.data.copy(raw, o + 1, y * this.w * 4, (y + 1) * this.w * 4);
    }
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(this.w, 0);
    ihdr.writeUInt32BE(this.h, 4);
    ihdr[8] = 8;
    ihdr[9] = 6;
    return Buffer.concat([
      Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
      chunk("IHDR", ihdr),
      chunk("IDAT", deflateSync(raw, { level: 9 })),
      chunk("IEND", Buffer.alloc(0)),
    ]);
  }
}

export class Atlas {
  constructor(w, h) {
    this.pix = new Pix(w, h);
    this.frames = {};
    this.x = 1;
    this.y = 1;
    this.rowH = 0;
  }

  add(name, src) {
    if (this.x + src.w + 1 > this.pix.w) {
      this.x = 1;
      this.y += this.rowH + 1;
      this.rowH = 0;
    }
    if (this.y + src.h + 1 > this.pix.h) {
      throw new Error(`Atlas overflow placing ${name} at ${this.x},${this.y}`);
    }
    this.pix.blit(src, this.x, this.y);
    this.frames[name] = {
      frame: { x: this.x, y: this.y, w: src.w, h: src.h },
      rotated: false,
      trimmed: false,
      spriteSourceSize: { x: 0, y: 0, w: src.w, h: src.h },
      sourceSize: { w: src.w, h: src.h },
    };
    this.x += src.w + 1;
    this.rowH = Math.max(this.rowH, src.h);
  }

  json(image) {
    return {
      frames: this.frames,
      meta: {
        app: "dual-credit-game-library",
        image,
        size: { w: this.pix.w, h: this.pix.h },
        scale: "1",
      },
    };
  }
}

export function writePng(path, pix) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, pix.png());
}

export function writeJson(path, obj) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(obj, null, 2));
}

export function rgb(hex) {
  return hex;
}
