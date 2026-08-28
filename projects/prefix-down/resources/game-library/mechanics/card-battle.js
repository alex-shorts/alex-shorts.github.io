import { makeControls } from "../input/controls.js";
import { THEMES } from "../look/palettes.js";
import { textStyle } from "../look/type.js";
import { kitChrome, backToHub, hint, bar } from "../layouts/hud.js";
import { sfx } from "../audio/sfx.js";
import { openRecall } from "./recall.js";
import { demoItems } from "../phaser/preload.js";
import { punch } from "../motion/transitions.js";

export class CardBattleScene extends Phaser.Scene {
  constructor() {
    super("CardBattleScene");
  }

  create() {
    this.theme = THEMES.snes;
    this.cameras.main.setBackgroundColor(0x1a1028);
    this.foe = this.add.sprite(240, 70, "kenney-chars", 12).setScale(2);
    this.hp = bar(this, 160, 28, 160, 0xe05050);
    this.h = 1;
    this.ctrl = makeControls(this);
    this.add.text(24, 100, "Play the true card.", textStyle(this.theme, "caption"));
    kitChrome(this, "CARD BATTLE  ·  hand is the fact choices", this.theme, this.ctrl);
    hint(this, "ESC hub   click a card  ·  wrong card hits you");
    this.deal();
  }

  deal() {
    const item = demoItems(this)[3];
    this.item = item;
    this.hand?.forEach((c) => c.destroy());
    this.hand = item.choices.map((c, i) => {
      const x = 70 + i * 110;
      const img = this.add.image(x, 190, "panel-snes").setDisplaySize(96, 72).setInteractive({ useHandCursor: true });
      const t = this.add.text(x, 190, c, { ...textStyle(this.theme, "caption"), wordWrap: { width: 86 }, align: "center" }).setOrigin(0.5);
      img.on("pointerdown", () => this.play(c));
      return img;
    });
  }

  play(c) {
    sfx.card();
    const ok = c === this.item.answer;
    if (ok) {
      punch(this, this.foe, 1.2);
      this.h -= 0.5;
      this.hp.set(this.h);
      sfx.hit();
      if (this.h <= 0) this.add.text(180, 120, "WIN", textStyle(this.theme, "title"));
      else this.time.delayedCall(400, () => this.deal());
    } else {
      openRecall(this, this.item, { onDone: (good) => { if (good) this.deal(); } });
    }
  }

  update() {
    backToHub(this, this.ctrl);
  }
}
