import { makeControls } from "../input/controls.js";
import { THEMES } from "../look/palettes.js";
import { textStyle } from "../look/type.js";
import { kitChrome, backToHub, hint } from "../layouts/hud.js";
import { loadSave } from "../systems/save.js";
import { KENNEY_HEROES } from "../motion/anims.js";

export class InventoryScene extends Phaser.Scene {
  constructor() {
    super("InventoryScene");
  }

  create() {
    this.theme = THEMES.snes;
    this.cameras.main.setBackgroundColor(this.theme.bg);
    this.ctrl = makeControls(this);
    const s = loadSave();
    this.add.image(240, 130, "panel-card").setDisplaySize(360, 160);
    this.add.text(90, 70, `Hero  ${s.heroId}`, textStyle(this.theme, "body"));
    this.add.text(90, 96, `XP ${s.xp}   due ${Object.keys(s.due).length}`, textStyle(this.theme, "body"));
    this.add.text(90, 122, `Theme ${s.theme}`, textStyle(this.theme, "caption"));
    const h = KENNEY_HEROES.find((x) => x.id === s.heroId) || KENNEY_HEROES[0];
    this.add.sprite(360, 120, "kenney-chars", h.idle).setScale(3);
    kitChrome(this, "PAUSE / INVENTORY  ·  save slot", this.theme, this.ctrl);
    hint(this, "ESC hub   localStorage dc-game-lib-v1");
  }

  update() {
    backToHub(this, this.ctrl);
  }
}
