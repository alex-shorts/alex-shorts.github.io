import { makeControls } from "../input/controls.js";
import { THEMES } from "../look/palettes.js";
import { textStyle } from "../look/type.js";
import { kitChrome, backToHub, hint } from "../layouts/hud.js";
import { sfx } from "../audio/sfx.js";
import { openRecall } from "./recall.js";
import { demoItems } from "../phaser/preload.js";
import { sparkBurst } from "../motion/transitions.js";

const RECIPE = ["flour", "egg", "milk", "heat"];

export class CookingScene extends Phaser.Scene {
  constructor() {
    super("CookingScene");
  }

  create() {
    this.theme = THEMES.n64;
    this.cameras.main.setBackgroundColor(0x403028);
    this.add.rectangle(240, 150, 200, 80, 0x5a4030);
    this.ctrl = makeControls(this);
    this.step = 0;
    this.status = this.add.text(240, 70, "Recipe: flour → egg → milk → heat", textStyle(this.theme, "caption")).setOrigin(0.5);
    RECIPE.forEach((name, i) => {
      const b = this.add.image(80 + i * 100, 200, "btn-wood-up").setInteractive({ useHandCursor: true });
      this.add.text(80 + i * 100, 200, name, { ...textStyle(this.theme, "caption"), color: "#f8f0d8" }).setOrigin(0.5);
      b.on("pointerdown", () => this.addIn(name));
    });
    kitChrome(this, "COOKING  ·  order is the fact  ·  plate quiz", this.theme, this.ctrl);
    hint(this, "ESC hub   tap ingredients in order   E plate recall");
    this.busy = false;
  }

  addIn(name) {
    if (this.busy) return;
    if (name === RECIPE[this.step]) {
      sfx.cook();
      this.step += 1;
      sparkBurst(this, 240, 150, 4);
      if (this.step >= RECIPE.length) this.status.setText("Plated. E for the quiz.");
    } else sfx.miss();
  }

  update() {
    backToHub(this, this.ctrl);
    if (!this.busy && this.ctrl.action() && this.step >= RECIPE.length) {
      this.busy = true;
      openRecall(this, demoItems(this)[4], { onDone: () => { this.busy = false; } });
    }
  }
}
