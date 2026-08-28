import { makeControls } from "../input/controls.js";
import { KENNEY_HEROES, playMove } from "../motion/anims.js";
import { THEMES } from "../look/palettes.js";
import { textStyle } from "../look/type.js";
import { hint, titleBar, backToHub } from "../layouts/hud.js";
import { sfx } from "../audio/sfx.js";

export class WardrobeScene extends Phaser.Scene {
  constructor() {
    super("WardrobeScene");
  }

  create() {
    this.theme = THEMES.snes;
    this.cameras.main.setBackgroundColor(this.theme.bg2);
    this.ctrl = makeControls(this);
    this.idx = 0;
    this.sprites = KENNEY_HEROES.map((h, i) => {
      const s = this.add.sprite(40 + (i % 9) * 48, 80, "kenney-chars", h.idle).setInteractive({ useHandCursor: true });
      s.heroId = h.id;
      s.on("pointerdown", () => this.pick(i));
      return s;
    });
    this.preview = this.add.sprite(240, 180, "kenney-chars", 0).setScale(3);
    this.preview.heroId = "sand";
    this.label = this.add.text(240, 220, "sand", textStyle(this.theme, "subtitle")).setOrigin(0.5);
    titleBar(this, "WARDROBE  ·  Kenney heroes  ·  click or 1-9", this.theme);
    hint(this, "ESC hub   click a figure   walk preview is idle/walk anim");
    this.pick(0);
  }

  pick(i) {
    this.idx = i;
    const h = KENNEY_HEROES[i];
    this.preview.heroId = h.id;
    this.preview.setFrame(h.idle);
    this.label.setText(h.id);
    sfx.select();
    this.registry.set("heroId", h.id);
    this.registry.set("heroFrame", h.idle);
  }

  update() {
    backToHub(this, this.ctrl);
    playMove(this.preview, true);
    for (let n = 1; n <= 9; n++) if (this.ctrl.digit(n)) this.pick(n - 1);
  }
}
