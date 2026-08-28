import { makeControls } from "../input/controls.js";
import { THEMES } from "../look/palettes.js";
import { hint, backToHub, titleBar } from "../layouts/hud.js";
import { openRecall } from "./recall.js";
import { demoItems } from "../phaser/preload.js";

export class RecallScene extends Phaser.Scene {
  constructor() {
    super("RecallScene");
  }

  create() {
    this.theme = THEMES.snes;
    this.cameras.main.setBackgroundColor(this.theme.bg);
    this.ctrl = makeControls(this);
    titleBar(this, "RECALL  ·  learning verb  ·  produce then reveal", this.theme);
    hint(this, "ESC hub   click a choice   misses come back next open");
    this.queue = [...demoItems(this)];
    this.next();
  }

  next() {
    const item = this.queue.shift();
    if (!item) {
      this.add.text(160, 130, "Session clear", { fontFamily: '"Press Start 2P"', fontSize: "10px", color: "#f0c040" });
      return;
    }
    openRecall(this, item, {
      onDone: (ok) => {
        if (!ok) this.queue.push(item);
        this.time.delayedCall(200, () => this.next());
      },
    });
  }

  update() {
    backToHub(this, this.ctrl);
  }
}
