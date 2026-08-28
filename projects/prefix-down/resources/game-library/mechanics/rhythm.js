import { makeControls } from "../input/controls.js";
import { THEMES } from "../look/palettes.js";
import { kitChrome, backToHub, hint } from "../layouts/hud.js";
import { sfx } from "../audio/sfx.js";
import { openRecall } from "./recall.js";
import { demoItems } from "../phaser/preload.js";

/** Four lanes. Hit A when a note crosses the line. Chorus = recall. */
export class RhythmScene extends Phaser.Scene {
  constructor() {
    super("RhythmScene");
  }

  create() {
    this.theme = THEMES.modern;
    this.cameras.main.setBackgroundColor(0x101018);
    this.ctrl = makeControls(this);
    this.lanes = [160, 210, 260, 310];
    this.lanes.forEach((x) => this.add.rectangle(x, 200, 36, 8, 0x5ee0c0));
    this.notes = [];
    this.hits = 0;
    this.busy = false;
    this.time.addEvent({ delay: 500, loop: true, callback: () => this.spawn() });
    kitChrome(this, "RHYTHM  ·  A/SPACE as notes hit the bar", this.theme, this.ctrl);
    hint(this, "ESC hub   every 8 hits a recall chorus");
  }

  spawn() {
    if (this.busy) return;
    const x = Phaser.Utils.Array.GetRandom(this.lanes);
    const n = this.add.image(x, 40, "gem-" + Phaser.Math.Between(0, 5));
    this.notes.push(n);
    this.tweens.add({
      targets: n,
      y: 260,
      duration: 1400,
      onComplete: () => {
        this.notes = this.notes.filter((q) => q !== n);
        n.destroy();
      },
    });
  }

  update() {
    backToHub(this, this.ctrl);
    if (this.busy) return;
    if (this.ctrl.jump() || this.ctrl.action()) {
      const hit = this.notes.find((n) => n.y > 175 && n.y < 225);
      if (hit) {
        sfx.note();
        hit.destroy();
        this.notes = this.notes.filter((n) => n !== hit);
        this.hits += 1;
        if (this.hits % 8 === 0) {
          this.busy = true;
          openRecall(this, demoItems(this)[4], { onDone: () => { this.busy = false; } });
        }
      } else sfx.miss();
    }
  }
}
