import { makeControls, driveTopDown } from "../input/controls.js";
import { playMove } from "../motion/anims.js";
import { THEMES } from "../look/palettes.js";
import { kitChrome, backToHub, hint } from "../layouts/hud.js";
import { sfx } from "../audio/sfx.js";
import { openRecall } from "./recall.js";
import { demoItems } from "../phaser/preload.js";

/** Ability-gated rooms. Recall unlocks dash, then the far door. */
export class MetroidvaniaScene extends Phaser.Scene {
  constructor() {
    super("MetroidvaniaScene");
  }

  create() {
    this.theme = THEMES.snes;
    this.physics.world.setBounds(0, 0, 960, 270);
    this.cameras.main.setBounds(0, 0, 960, 270).setBackgroundColor(0x101428);
    this.ground = this.physics.add.staticGroup();
    for (let x = 0; x < 54; x++) this.ground.create(9 + x * 18, 252, "kenney-tiles", 12);
    this.door = this.physics.add.staticImage(900, 220, "node-lock").setScale(2);
    this.shrine = this.physics.add.staticImage(200, 220, "icon-chest");
    this.hero = this.physics.add.sprite(40, 200, "kenney-chars", 0);
    this.hero.heroId = "sand";
    this.hero.setCollideWorldBounds(true);
    this.physics.add.collider(this.hero, this.ground);
    this.cameras.main.startFollow(this.hero, true, 0.1, 0.1);
    this.ctrl = makeControls(this);
    this.dash = false;
    this.busy = false;
    kitChrome(this, "METROIDVANIA  ·  shrine unlocks dash  ·  door needs dash", this.theme, this.ctrl);
    hint(this, "ESC hub   E shrine   dash with SPACE after unlock");
  }

  update() {
    backToHub(this, this.ctrl);
    if (this.busy) return;
    const v = this.ctrl.vector();
    this.hero.setVelocityX(v.x * 110);
    playMove(this.hero, Math.abs(v.x) > 0);
    if (this.dash && this.ctrl.jump()) {
      sfx.dash();
      this.hero.x += this.hero.flipX ? -48 : 48;
    }
    if (this.ctrl.action() && Phaser.Math.Distance.Between(this.hero.x, this.hero.y, this.shrine.x, this.shrine.y) < 28) {
      this.busy = true;
      openRecall(this, demoItems(this)[0], {
        onDone: (ok) => {
          this.busy = false;
          if (ok) {
            this.dash = true;
            this.door.setTexture("node-clear");
          }
        },
      });
    }
    if (this.dash && this.hero.x > 860) {
      this.add.text(this.hero.x - 40, 80, "GATE OPEN", { fontFamily: "Silkscreen", fontSize: "14px", color: "#70e070" });
    }
  }
}
