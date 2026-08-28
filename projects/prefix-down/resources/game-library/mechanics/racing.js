import { makeControls } from "../input/controls.js";
import { THEMES } from "../look/palettes.js";
import { kitChrome, backToHub, hint } from "../layouts/hud.js";
import { sfx } from "../audio/sfx.js";
import { openRecall } from "./recall.js";
import { demoItems } from "../phaser/preload.js";

export class RacingScene extends Phaser.Scene {
  constructor() {
    super("RacingScene");
  }

  create() {
    this.theme = THEMES.n64;
    this.cameras.main.setBackgroundColor(0x3a5040);
    this.add.rectangle(240, 145, 400, 180, 0x4a6050);
    this.cps = [
      { x: 120, y: 80 },
      { x: 360, y: 80 },
      { x: 360, y: 200 },
      { x: 120, y: 200 },
    ];
    this.cps.forEach((c, i) => this.add.circle(c.x, c.y, 10, i === 0 ? 0xf0d060 : 0x80c070));
    this.car = this.add.sprite(120, 80, "kenney-chars", 16);
    this.car.angle = 0;
    this.i = 0;
    this.boost = 0;
    this.busy = false;
    this.ctrl = makeControls(this);
    kitChrome(this, "RACING  ·  steer  ·  boost pad is recall", this.theme, this.ctrl);
    hint(this, "ESC hub   left/right steer   up gas   E boost (fact)");
  }

  update() {
    backToHub(this, this.ctrl);
    if (this.busy) return;
    const v = this.ctrl.vector();
    this.car.angle += v.x * 3;
    const spd = (v.y < 0 ? 1.6 : 0.4) + this.boost;
    this.boost = Math.max(0, this.boost - 0.02);
    const r = Phaser.Math.DegToRad(this.car.angle - 90);
    this.car.x = Phaser.Math.Clamp(this.car.x + Math.cos(r) * spd, 40, 440);
    this.car.y = Phaser.Math.Clamp(this.car.y + Math.sin(r) * spd, 40, 240);
    const cp = this.cps[this.i % 4];
    if (Phaser.Math.Distance.Between(this.car.x, this.car.y, cp.x, cp.y) < 18) {
      this.i += 1;
      sfx.engine();
    }
    if (this.ctrl.action()) {
      this.busy = true;
      openRecall(this, demoItems(this)[2], {
        onDone: (ok) => {
          this.busy = false;
          if (ok) this.boost = 2.2;
        },
      });
    }
  }
}
