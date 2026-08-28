import { makeControls } from "../input/controls.js";
import { playMove } from "../motion/anims.js";
import { THEMES } from "../look/palettes.js";
import { hint, backToHub, titleBar } from "../layouts/hud.js";
import { sfx } from "../audio/sfx.js";
import { sparkBurst, xpPop } from "../motion/transitions.js";
import { openRecall } from "./recall.js";
import { demoItems } from "../phaser/preload.js";

const COLORS = ["brick-red", "brick-blue", "brick-yellow", "brick-green", "brick-black"];

/** Lego-like: place bricks, smash, collect studs, swap figure. Original bricks (not branded). */
export class BrickScene extends Phaser.Scene {
  constructor() {
    super("BrickScene");
  }

  create() {
    this.theme = THEMES.modern;
    this.cameras.main.setBackgroundColor(0x3a3a48);
    this.add.rectangle(0, 210, 480, 60, 0x2a2a34).setOrigin(0);
    for (let x = 0; x < 15; x++) this.add.image(16 + x * 32, 228, "brick-black").setAlpha(0.5);

    this.hero = this.physics.add.sprite(80, 190, "kenney-chars", 0);
    this.hero.heroId = "sand";
    this.hero.setCollideWorldBounds(true);
    this.heroIdN = 0;
    this.bricks = this.physics.add.staticGroup();
    this.studs = 0;
    this.studText = this.add.text(360, 28, "STUDS 0", { fontFamily: "Silkscreen, monospace", fontSize: "14px", color: "#f0d060" }).setScrollFactor(0);
    this.ctrl = makeControls(this);
    this.color = 0;
    this.ghost = this.add.image(0, 0, COLORS[0]).setAlpha(0.45);
    titleBar(this, "BRICK BUILD  ·  Lego-like  ·  place / smash / swap", this.theme);
    hint(this, "ESC hub  WASD  Z place  X smash  C swap figure  E quiz-brick");
    this.busy = false;
    this.physics.world.gravity.y = 0;
  }

  update() {
    backToHub(this, this.ctrl);
    if (this.busy) return;
    const v = this.ctrl.vector();
    this.hero.setVelocity(v.x * 100, v.y * 100);
    playMove(this.hero, !!(v.x || v.y));
    const gx = Math.round(this.hero.x / 32) * 32;
    const gy = Math.round((this.hero.y - 20) / 20) * 20;
    this.ghost.setPosition(gx, gy).setTexture(COLORS[this.color]);

    if (Phaser.Input.Keyboard.JustDown(this.ctrl.k.Z)) {
      sfx.build();
      this.bricks.create(gx, gy, COLORS[this.color]);
      this.color = (this.color + 1) % COLORS.length;
    }
    if (Phaser.Input.Keyboard.JustDown(this.ctrl.k.X)) {
      this.bricks.getChildren().forEach((b) => {
        if (Phaser.Math.Distance.Between(this.hero.x, this.hero.y, b.x, b.y) < 28) {
          sfx.smash();
          sparkBurst(this, b.x, b.y, 6);
          this.studs += 10;
          this.studText.setText("STUDS " + this.studs);
          xpPop(this, b.x, b.y, "+10");
          b.destroy();
        }
      });
    }
    if (Phaser.Input.Keyboard.JustDown(this.ctrl.k.C)) {
      this.heroIdN = (this.heroIdN + 1) % 9;
      const ids = ["sand", "rose", "sky", "leaf", "gold", "mint", "bee", "mouse", "block"];
      this.hero.heroId = ids[this.heroIdN];
      this.hero.setFrame(this.heroIdN * 2);
      sfx.select();
    }
    if (this.ctrl.action()) {
      this.busy = true;
      openRecall(this, demoItems(this)[1] || { stem: "2+2", choices: ["4", "3"], answer: "4" }, {
        onDone: (ok) => {
          this.busy = false;
          if (ok) {
            this.studs += 50;
            this.studText.setText("STUDS " + this.studs);
          }
        },
      });
    }
  }
}
