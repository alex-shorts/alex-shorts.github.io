import { makeControls, driveTopDown } from "../input/controls.js";
import { playMove } from "../motion/anims.js";
import { THEMES } from "../look/palettes.js";
import { kitChrome, backToHub, hint } from "../layouts/hud.js";
import { sfx } from "../audio/sfx.js";
import { openRecall } from "./recall.js";
import { demoItems } from "../phaser/preload.js";

export class StealthScene extends Phaser.Scene {
  constructor() {
    super("StealthScene");
  }

  create() {
    this.theme = THEMES.modern;
    this.cameras.main.setBackgroundColor(0x12141c);
    for (let y = 0; y < 12; y++) for (let x = 0; x < 26; x++) this.add.image(9 + x * 18, 40 + y * 18, "kenney-tiles", 0).setAlpha(0.4);
    this.cover = this.physics.add.staticImage(200, 140, "kenney-tiles", 50).setScale(1.4);
    this.hero = this.physics.add.sprite(40, 80, "kenney-chars", 0);
    this.hero.heroId = "sand";
    this.guard = this.add.sprite(300, 140, "kenney-chars", 6);
    this.guard.dir = 1;
    this.ctrl = makeControls(this);
    this.busy = false;
    this.goal = this.add.image(430, 200, "icon-chest");
    kitChrome(this, "STEALTH  ·  hide in bush  ·  spotted = recall", this.theme, this.ctrl);
    hint(this, "ESC hub   WASD  ·  stay out of the cone or duck in cover");
  }

  update() {
    backToHub(this, this.ctrl);
    if (this.busy) {
      this.hero.setVelocity(0);
      return;
    }
    const v = this.ctrl.vector();
    driveTopDown(this.hero, v, 80);
    playMove(this.hero, !!(v.x || v.y));
    this.guard.x += this.guard.dir * 0.7;
    if (this.guard.x > 400 || this.guard.x < 220) this.guard.dir *= -1;
    const hidden = Phaser.Math.Distance.Between(this.hero.x, this.hero.y, this.cover.x, this.cover.y) < 22;
    const seen = !hidden && Math.abs(this.hero.y - this.guard.y) < 28 && Math.abs(this.hero.x - this.guard.x) < 70;
    if (seen) {
      sfx.alert();
      this.busy = true;
      openRecall(this, demoItems(this)[0], {
        onDone: () => {
          this.busy = false;
          this.hero.setPosition(40, 80);
        },
      });
    }
    if (Phaser.Math.Distance.Between(this.hero.x, this.hero.y, this.goal.x, this.goal.y) < 20) {
      this.add.text(180, 40, "EXTRACT", { fontFamily: "Silkscreen", color: "#6ee8a0" });
    }
  }
}
