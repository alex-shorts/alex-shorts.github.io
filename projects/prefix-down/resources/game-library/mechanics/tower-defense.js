import { makeControls } from "../input/controls.js";
import { THEMES } from "../look/palettes.js";
import { kitChrome, backToHub, hint } from "../layouts/hud.js";
import { sfx } from "../audio/sfx.js";
import { openRecall } from "./recall.js";
import { demoItems } from "../phaser/preload.js";

export class TowerDefenseScene extends Phaser.Scene {
  constructor() {
    super("TowerDefenseScene");
  }

  create() {
    this.theme = THEMES.n64;
    this.cameras.main.setBackgroundColor(0x2a4030);
    this.path = [{ x: 20, y: 80 }, { x: 200, y: 80 }, { x: 200, y: 180 }, { x: 440, y: 180 }];
    for (let i = 0; i < this.path.length - 1; i++) {
      const a = this.path[i];
      const b = this.path[i + 1];
      this.add.line(0, 0, a.x, a.y, b.x, b.y, 0x6a8a60).setOrigin(0, 0).setLineWidth(10);
    }
    this.towers = [];
    this.mobs = [];
    this.busy = false;
    this.ctrl = makeControls(this);
    this.spawnMob();
    this.time.addEvent({ delay: 1600, loop: true, callback: () => this.spawnMob() });
    kitChrome(this, "TOWER DEFENSE  ·  E/click path to place (recall pays)", this.theme, this.ctrl);
    hint(this, "ESC hub   place tower with E after a correct fact");
    this.input.on("pointerdown", (p) => this.tryPlace(p.worldX, p.worldY));
  }

  spawnMob() {
    const s = this.add.sprite(this.path[0].x, this.path[0].y, "kenney-chars", 12);
    s.pi = 0;
    this.mobs.push(s);
  }

  tryPlace(x, y) {
    if (this.busy || y < 40) return;
    this.busy = true;
    openRecall(this, demoItems(this)[1], {
      onDone: (ok) => {
        this.busy = false;
        if (!ok) return;
        sfx.place();
        this.towers.push(this.add.image(x, y, "brick-blue").setScale(0.7));
      },
    });
  }

  update(t, dt) {
    backToHub(this, this.ctrl);
    if (this.ctrl.action()) this.tryPlace(240, 140);
    this.mobs.forEach((m) => {
      const tgt = this.path[Math.min(m.pi + 1, this.path.length - 1)];
      const dx = tgt.x - m.x;
      const dy = tgt.y - m.y;
      const len = Math.hypot(dx, dy) || 1;
      m.x += (dx / len) * 0.8;
      m.y += (dy / len) * 0.8;
      if (len < 8) m.pi += 1;
      this.towers.forEach((tw) => {
        if (Phaser.Math.Distance.Between(m.x, m.y, tw.x, tw.y) < 36 && !m.hit) {
          m.hit = true;
          sfx.hit();
          m.destroy();
        }
      });
    });
    this.mobs = this.mobs.filter((m) => m.active);
  }
}
