import { makeControls } from "../input/controls.js";
import { playMove } from "../motion/anims.js";
import { THEMES } from "../look/palettes.js";
import { hint, backToHub, titleBar, hearts } from "../layouts/hud.js";
import { sfx } from "../audio/sfx.js";
import { openRecall } from "./recall.js";
import { demoItems } from "../phaser/preload.js";
import { sparkBurst } from "../motion/transitions.js";

/** Mario-like side view using Kenney tiles. */
export class PlatformerScene extends Phaser.Scene {
  constructor() {
    super("PlatformerScene");
  }

  create() {
    this.theme = THEMES.snes;
    this.add.image(240, 80, "bg-top").setScrollFactor(0.15);
    this.add.image(240, 140, "bg-mid").setScrollFactor(0.3);
    this.physics.world.gravity.y = 520;
    this.physics.world.setBounds(0, 0, 960, 270);
    this.cameras.main.setBounds(0, 0, 960, 270);

    this.ground = this.physics.add.staticGroup();
    for (let x = 0; x < 54; x++) {
      this.ground.create(9 + x * 18, 252, "kenney-tiles", 1);
      if (x % 11 === 5) this.ground.create(9 + x * 18, 180, "kenney-tiles", 6);
    }
    this.qblock = this.physics.add.staticImage(220, 160, "kenney-tiles", 8);

    this.hero = this.physics.add.sprite(40, 200, "kenney-chars", 0);
    this.hero.heroId = "sand";
    this.hero.setCollideWorldBounds(true);
    this.hero.setMaxVelocity(200, 500);
    this.physics.add.collider(this.hero, this.ground);
    this.physics.add.collider(this.hero, this.qblock, () => {}, null, this);
    this.cameras.main.startFollow(this.hero, true, 0.12, 0.12);

    this.ctrl = makeControls(this);
    this.hpHud = hearts(this, 8, 24, 3);
    titleBar(this, "PLATFORMER  ·  jump  ·  hit ? for recall", this.theme);
    hint(this, "ESC hub   WASD/arrows  SPACE jump   bump the ? block");
    this.busy = false;
    this.hitQ = false;
  }

  update() {
    backToHub(this, this.ctrl);
    if (this.busy) {
      this.hero.setVelocityX(0);
      return;
    }
    const v = this.ctrl.vector();
    this.hero.setVelocityX(v.x * 120);
    playMove(this.hero, Math.abs(this.hero.body.velocity.x) > 8);
    const onFloor = this.hero.body.blocked.down || this.hero.body.touching.down;
    if (this.ctrl.jump() && onFloor) {
      sfx.jump();
      this.hero.setVelocityY(-240);
    }
    if (!this.hitQ && this.hero.body.touching.up && this.qblock.body.touching.down) {
      this.hitQ = true;
      sfx.coin();
      sparkBurst(this, this.qblock.x, this.qblock.y - 12);
      this.busy = true;
      const items = demoItems(this);
      openRecall(this, items[0] || { stem: "2+2", choices: ["4", "5"], answer: "4" }, {
        onDone: () => {
          this.busy = false;
        },
      });
    }
  }
}
