import { makeControls } from "../input/controls.js";
import { THEMES } from "../look/palettes.js";
import { textStyle } from "../look/type.js";
import { kitChrome, backToHub, hint } from "../layouts/hud.js";
import { typewriter } from "../motion/transitions.js";
import { sfx } from "../audio/sfx.js";
import { openRecall } from "./recall.js";
import { demoItems } from "../phaser/preload.js";

export class VisualNovelScene extends Phaser.Scene {
  constructor() {
    super("VisualNovelScene");
  }

  create() {
    this.theme = THEMES.snes;
    this.cameras.main.setBackgroundColor(0x2a1848);
    this.add.rectangle(0, 0, 480, 180, 0x3a2860).setOrigin(0);
    this.left = this.add.sprite(70, 140, "kenney-chars", 4).setScale(3);
    this.right = this.add.sprite(410, 140, "kenney-chars", 8).setScale(3).setFlipX(true);
    this.add.image(240, 222, "panel-speech");
    this.body = this.add.text(30, 198, "", textStyle(this.theme, "dialogue"));
    this.lines = [
      "Librarian: The exam only cares if you can produce the fact.",
      "Scribe: Watching me say it is not knowing it.",
      "Librarian: Then try this one yourself.",
    ];
    this.i = 0;
    typewriter(this, this.body, this.lines[0]);
    this.ctrl = makeControls(this);
    kitChrome(this, "VISUAL NOVEL  ·  tap to advance  ·  choice is recall", this.theme, this.ctrl);
    hint(this, "ESC hub   A/X/click next line");
    this.input.on("pointerdown", () => this.advance());
    this.busy = false;
  }

  advance() {
    if (this.busy) return;
    sfx.select();
    this.i += 1;
    if (this.i < this.lines.length) {
      typewriter(this, this.body, this.lines[this.i]);
      return;
    }
    this.busy = true;
    openRecall(this, demoItems(this)[5], {
      onDone: () => {
        this.body.setText("Librarian: That was the real verb.");
        this.busy = false;
      },
    });
  }

  update() {
    backToHub(this, this.ctrl);
    if (this.ctrl.action()) this.advance();
  }
}
