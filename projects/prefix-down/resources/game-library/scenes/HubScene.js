import { makeControls } from "../input/controls.js";
import { THEMES } from "../look/palettes.js";
import { textStyle } from "../look/type.js";
import { kitChrome } from "../layouts/hud.js";
import { sfx } from "../audio/sfx.js";
import { fadeTo, punch } from "../motion/transitions.js";
import { startBed } from "../audio/music.js";
import { GENRES } from "../catalog.js";

const COLS = 6;
const BTN_W = 72;
const BTN_H = 36;
const GAP_X = 4;
const GAP_Y = 6;

export class HubScene extends Phaser.Scene {
  constructor() {
    super("HubScene");
  }

  create() {
    this.theme = THEMES.snes;
    this.cameras.main.setBackgroundColor(this.theme.bg);
    this.add.image(240, 80, "bg-mid").setAlpha(0.35);
    this.ctrl = makeControls(this);
    kitChrome(this, "GAME LIBRARY  ·  Phaser 4  ·  pick a kit", this.theme, this.ctrl);
    startBed();
    this.add.text(8, 24, "Genre sandboxes. Retrieval scores.  1–8 first eight  ·  click a door", textStyle(this.theme, "caption"));

    const gridW = COLS * BTN_W + (COLS - 1) * GAP_X;
    const originX = (480 - gridW) / 2 + BTN_W / 2;
    const originY = 48 + BTN_H / 2;

    this.cards = GENRES.map((g, i) => {
      const col = i % COLS;
      const row = Math.floor(i / COLS);
      const x = originX + col * (BTN_W + GAP_X);
      const y = originY + row * (BTN_H + GAP_Y);
      const img = this.add.image(x, y, "btn-wide-up").setDisplaySize(BTN_W, BTN_H).setInteractive({ useHandCursor: true });
      const t = this.add.text(x, y, g.short, { ...textStyle(this.theme, "caption"), fontSize: "11px", align: "center" }).setOrigin(0.5);
      img.on("pointerover", () => punch(this, img, 1.06));
      img.on("pointerdown", () => this.go(g));
      return { g, img, t };
    });
  }

  go(g) {
    sfx.confirm();
    fadeTo(this, g.scene);
  }

  update() {
    for (let i = 0; i < 8; i++) {
      if (this.ctrl.digit(i + 1)) this.go(GENRES[i]);
    }
  }
}
