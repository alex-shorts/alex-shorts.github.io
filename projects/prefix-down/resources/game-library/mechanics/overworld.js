import { makeControls, driveTopDown } from "../input/controls.js";
import { playMove } from "../motion/anims.js";
import { KENNEY_HEROES } from "../motion/anims.js";
import { THEMES } from "../look/palettes.js";
import { hearts, hint, backToHub, titleBar } from "../layouts/hud.js";
import { openRecall } from "./recall.js";
import { demoItems } from "../phaser/preload.js";
import { sfx } from "../audio/sfx.js";
import { sparkBurst, floaty } from "../motion/transitions.js";

/** Zelda-like: top-down room, slash, bushes, chest, NPC, hearts. */
export class OverworldScene extends Phaser.Scene {
  constructor() {
    super("OverworldScene");
  }

  create() {
    this.theme = THEMES.snes;
    this.cameras.main.setBackgroundColor(this.theme.bg);
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 28; x++) {
        const t = (x + y) % 7 === 0 ? 20 : 0;
        this.add.image(9 + x * 18, 30 + y * 18, "kenney-tiles", t).setDepth(0);
      }
    }
    this.bushes = this.physics.add.staticGroup();
    [[6, 5], [10, 4], [14, 7], [8, 9], [18, 6]].forEach(([gx, gy], i) => {
      const b = this.bushes.create(gx * 18, 24 + gy * 18, "kenney-tiles", 50 + (i % 3));
      b.setData("kind", "bush");
    });
    this.chest = this.physics.add.staticImage(360, 120, "icon-chest").setScale(1.4);
    this.npc = this.physics.add.staticImage(90, 160, "kenney-chars", 4);
    floaty(this, this.npc, 3);

    this.hero = this.physics.add.sprite(80, 90, "kenney-chars", 0);
    this.hero.heroId = KENNEY_HEROES[0].id;
    this.hero.setCollideWorldBounds(true);
    this.hero.hp = 3;
    this.physics.world.setBounds(0, 22, 480, 248);
    this.physics.add.collider(this.hero, this.bushes);

    this.slash = this.add.image(0, 0, "slash").setVisible(false).setDepth(10);
    this.ctrl = makeControls(this);
    this.hpHud = hearts(this, 8, 24, 3);
    titleBar(this, "OVERWORLD  ·  Zelda-like  ·  X slash  E chest/NPC", this.theme);
    hint(this, "ESC hub   X slash bushes   E open chest (recall) or talk");
    this.busy = false;
  }

  update() {
    backToHub(this, this.ctrl);
    if (this.busy) {
      this.hero.setVelocity(0, 0);
      return;
    }
    const v = this.ctrl.vector();
    driveTopDown(this.hero, v, 90);
    playMove(this.hero, !!(v.x || v.y));
    if (this.ctrl.jump() || Phaser.Input.Keyboard.JustDown(this.ctrl.k.X)) this.doSlash();
    if (this.ctrl.action()) this.tryUse();
  }

  doSlash() {
    sfx.whoosh();
    const dir = this.hero.flipX ? -1 : 1;
    this.slash.setPosition(this.hero.x + dir * 16, this.hero.y).setFlipX(dir < 0).setVisible(true);
    this.time.delayedCall(120, () => this.slash.setVisible(false));
    this.bushes.getChildren().forEach((b) => {
      if (Phaser.Math.Distance.Between(this.slash.x, this.slash.y, b.x, b.y) < 22) {
        sfx.smash();
        sparkBurst(this, b.x, b.y, 5);
        const coin = this.add.image(b.x, b.y, "icon-coin");
        this.tweens.add({ targets: coin, y: b.y - 18, alpha: 0, duration: 400, onComplete: () => coin.destroy() });
        b.destroy();
      }
    });
  }

  tryUse() {
    if (Phaser.Math.Distance.Between(this.hero.x, this.hero.y, this.chest.x, this.chest.y) < 28) {
      this.busy = true;
      openRecall(this, pick(demoItems(this)), {
        onDone: (ok) => {
          this.busy = false;
          if (ok) {
            this.chest.setTint(0x808080);
            sparkBurst(this, this.chest.x, this.chest.y);
          }
        },
      });
    } else if (Phaser.Math.Distance.Between(this.hero.x, this.hero.y, this.npc.x, this.npc.y) < 28) {
      this.busy = true;
      this.scene.launch("DialogueScene", {
        speaker: "Scribe",
        lines: ["The shrine only opens if you can name the fact.", "Slash grass for coins. Chest is a retrieval."],
        onClose: () => {
          this.busy = false;
        },
      });
    }
  }
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)] || { stem: "2+2?", choices: ["3", "4"], answer: "4" };
}
