import { makeControls } from "../input/controls.js";
import { THEMES } from "../look/palettes.js";
import { hint, backToHub, titleBar } from "../layouts/hud.js";
import { sfx } from "../audio/sfx.js";
import { sparkBurst } from "../motion/transitions.js";

/** Simple swap-and-match grid. */
export class Match3Scene extends Phaser.Scene {
  constructor() {
    super("Match3Scene");
  }

  create() {
    this.theme = THEMES.modern;
    this.cameras.main.setBackgroundColor(0x1a2030);
    this.n = 6;
    this.size = 24;
    this.originX = 160;
    this.originY = 48;
    this.grid = [];
    this.sel = null;
    for (let y = 0; y < this.n; y++) {
      this.grid[y] = [];
      for (let x = 0; x < this.n; x++) {
        const id = Phaser.Math.Between(0, 5);
        const im = this.add.image(this.originX + x * this.size, this.originY + y * this.size, "gem-" + id).setInteractive();
        im.gx = x;
        im.gy = y;
        im.gid = id;
        im.on("pointerdown", () => this.tap(im));
        this.grid[y][x] = im;
      }
    }
    this.ctrl = makeControls(this);
    titleBar(this, "MATCH 3  ·  click two neighbors", this.theme);
    hint(this, "ESC hub   match 3+  ·  gems are kit textures");
  }

  tap(im) {
    sfx.select();
    if (!this.sel) {
      this.sel = im;
      im.setScale(1.15);
      return;
    }
    const a = this.sel;
    a.setScale(1);
    this.sel = null;
    if (Math.abs(a.gx - im.gx) + Math.abs(a.gy - im.gy) !== 1) return;
    const tmp = a.gid;
    a.gid = im.gid;
    im.gid = tmp;
    a.setTexture("gem-" + a.gid);
    im.setTexture("gem-" + im.gid);
    this.resolve();
  }

  resolve() {
    const kill = new Set();
    const n = this.n;
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n - 2; x++) {
        const a = this.grid[y][x];
        if (a.gid === this.grid[y][x + 1].gid && a.gid === this.grid[y][x + 2].gid) {
          kill.add(a);
          kill.add(this.grid[y][x + 1]);
          kill.add(this.grid[y][x + 2]);
        }
      }
    }
    for (let x = 0; x < n; x++) {
      for (let y = 0; y < n - 2; y++) {
        const a = this.grid[y][x];
        if (a.gid === this.grid[y + 1][x].gid && a.gid === this.grid[y + 2][x].gid) {
          kill.add(a);
          kill.add(this.grid[y + 1][x]);
          kill.add(this.grid[y + 2][x]);
        }
      }
    }
    kill.forEach((im) => {
      sparkBurst(this, im.x, im.y, 4);
      im.gid = Phaser.Math.Between(0, 5);
      im.setTexture("gem-" + im.gid);
    });
    if (kill.size) sfx.correct();
  }

  update() {
    backToHub(this, this.ctrl);
  }
}
