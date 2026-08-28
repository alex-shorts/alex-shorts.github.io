import { makeControls } from "../input/controls.js";
import { THEMES } from "../look/palettes.js";
import { textStyle } from "../look/type.js";
import { hint, backToHub, titleBar, bar } from "../layouts/hud.js";
import { sfx } from "../audio/sfx.js";
import { openRecall } from "./recall.js";
import { demoItems } from "../phaser/preload.js";
import { punch, flash } from "../motion/transitions.js";

/** Pokemon-like: two fighters, HP bars, command menu. Fight = retrieval. */
export class BattleScene extends Phaser.Scene {
  constructor() {
    super("BattleScene");
  }

  create() {
    this.theme = THEMES.n64;
    this.cameras.main.setBackgroundColor(0x6aaa70);
    this.add.rectangle(0, 160, 480, 110, 0xf0e8c0).setOrigin(0);
    this.add.ellipse(360, 150, 140, 36, 0x5a9860);
    this.add.ellipse(120, 190, 140, 36, 0x5a9860);
    this.foe = this.add.sprite(360, 110, "kenney-chars", 12).setScale(2);
    this.me = this.add.sprite(120, 168, "kenney-chars", 0).setScale(2);
    this.foeHp = bar(this, 24, 36, 160, 0x70e070);
    this.meHp = bar(this, 280, 200, 160, 0x70e070);
    this.foeH = 1;
    this.meH = 1;
    this.add.text(24, 22, "WISP", textStyle(this.theme, "caption"));
    this.add.text(280, 186, "SAND", textStyle(this.theme, "caption"));
    this.add.image(340, 232, "panel-battle");
    this.menu = ["FIGHT", "RECALL", "ITEM", "RUN"];
    this.idx = 0;
    this.labels = this.menu.map((m, i) =>
      this.add.text(250 + (i % 2) * 90, 210 + Math.floor(i / 2) * 20, m, textStyle(this.theme, "battle")),
    );
    this.cursor = this.add.image(238, 216, "cursor-open").setScale(0.5);
    this.ctrl = makeControls(this);
    titleBar(this, "PARTY BATTLE  ·  Pokemon-like  ·  FIGHT is a fact", this.theme);
    hint(this, "ESC hub   arrows pick   ENTER/X confirm");
    this.busy = false;
    this.refresh();
  }

  refresh() {
    this.labels.forEach((t, i) => t.setColor(i === this.idx ? "#c04020" : "#203040"));
    this.cursor.setPosition(238 + (this.idx % 2) * 90, 216 + Math.floor(this.idx / 2) * 20);
  }

  update() {
    backToHub(this, this.ctrl);
    if (this.busy) return;
    const v = this.ctrl.vector();
    if (Phaser.Input.Keyboard.JustDown(this.ctrl.k.RIGHT) || (v.x > 0 && Phaser.Input.Keyboard.JustDown(this.ctrl.k.D))) {
      this.idx = (this.idx + 1) % 4;
      sfx.select();
      this.refresh();
    }
    if (Phaser.Input.Keyboard.JustDown(this.ctrl.k.LEFT) || Phaser.Input.Keyboard.JustDown(this.ctrl.k.A)) {
      this.idx = (this.idx + 3) % 4;
      sfx.select();
      this.refresh();
    }
    if (Phaser.Input.Keyboard.JustDown(this.ctrl.k.DOWN) || Phaser.Input.Keyboard.JustDown(this.ctrl.k.S)) {
      this.idx = (this.idx + 2) % 4;
      sfx.select();
      this.refresh();
    }
    if (Phaser.Input.Keyboard.JustDown(this.ctrl.k.UP) || Phaser.Input.Keyboard.JustDown(this.ctrl.k.W)) {
      this.idx = (this.idx + 2) % 4;
      sfx.select();
      this.refresh();
    }
    if (this.ctrl.action()) this.confirm();
  }

  confirm() {
    const cmd = this.menu[this.idx];
    if (cmd === "RUN") {
      sfx.pause();
      this.scene.start("HubScene");
      return;
    }
    if (cmd === "ITEM") {
      this.meH = Math.min(1, this.meH + 0.25);
      this.meHp.set(this.meH);
      sfx.coin();
      return;
    }
    this.busy = true;
    const items = demoItems(this);
    openRecall(this, items[Math.floor(Math.random() * items.length)], {
      onDone: (ok) => {
        this.busy = false;
        if (ok) {
          punch(this, this.foe, 1.2);
          flash(this, 0xffffff, 60);
          sfx.hit();
          this.foeH -= 0.34;
          this.foeHp.set(this.foeH);
          if (this.foeH <= 0) this.add.text(200, 80, "WIN", textStyle(this.theme, "title"));
        } else {
          punch(this, this.me, 1.2);
          this.meH -= 0.25;
          this.meHp.set(this.meH);
        }
      },
    });
  }
}
