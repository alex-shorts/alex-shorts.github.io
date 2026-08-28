import { makeControls } from "../input/controls.js";
import { THEMES } from "../look/palettes.js";
import { kitChrome, backToHub, hint } from "../layouts/hud.js";
import { sfx } from "../audio/sfx.js";
import { openRecall } from "./recall.js";
import { demoItems } from "../phaser/preload.js";

export class RunnerScene extends Phaser.Scene {
  constructor() {
    super("RunnerScene");
  }

  create() {
    this.theme = THEMES.modern;
    this.physics.world.gravity.y = 700;
    this.cameras.main.setBackgroundColor(0x1e2430);
    this.ground = this.physics.add.staticGroup();
    for (let x = 0; x < 40; x++) this.ground.create(9 + x * 18, 252, "kenney-tiles", 1);
    this.hero = this.physics.add.sprite(80, 200, "kenney-chars", 0);
    this.hero.heroId = "sand";
    this.hero.setCollideWorldBounds(true);
    this.physics.add.collider(this.hero, this.ground);
    this.flag = this.physics.add.staticImage(420, 220, "node-due");
    this.ctrl = makeControls(this);
    this.busy = false;
    this.dist = 0;
    kitChrome(this, "RUNNER  ·  auto-run  ·  flag is recall", this.theme, this.ctrl);
    hint(this, "ESC hub   A/SPACE jump   survive to the flag");
  }

  update() {
    backToHub(this, this.ctrl);
    if (this.busy) return;
    this.hero.setVelocityX(90);
    this.dist += 1;
    if (this.ctrl.jump() && (this.hero.body.blocked.down || this.hero.body.touching.down)) {
      sfx.jump();
      this.hero.setVelocityY(-260);
    }
    if (this.hero.x > 400 && !this.busy) {
      this.busy = true;
      this.hero.setVelocityX(0);
      openRecall(this, demoItems(this)[1], { onDone: () => { this.scene.restart(); } });
    }
  }
}
