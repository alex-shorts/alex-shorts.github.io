import { THEMES } from "../look/palettes.js";
import { fadeTo } from "../motion/transitions.js";
import { makeControls } from "../input/controls.js";
import { sfx } from "../audio/sfx.js";
import { playFighter, FIGHTERS, PLAYABLE } from "../motion/fighter-anims.js";
import { writeSave } from "../systems/save.js";
import { clearStyle } from "../look/type.js";

/** Ash vs Kai. ENTER locks the pick and goes to the filled chart. */
export class SelectScene extends Phaser.Scene {
  constructor() {
    super("SelectScene");
  }

  create() {
    this.cameras.main.setBackgroundColor(THEMES.snes.bg);
    this.ctrl = makeControls(this);
    const W = this.scale.width;
    const H = this.scale.height;
    this.picks = PLAYABLE.slice();
    this.pick = this.picks.indexOf(this.registry.get("runOutfit")) >= 0 ? this.picks.indexOf(this.registry.get("runOutfit")) : 0;

    this.add.text(W / 2, 80, "CHOOSE FIGHTER", { ...clearStyle("#f0c040", 64), fontStyle: "800" }).setOrigin(0.5);
    this.add.text(W / 2, 150, "LEFT / RIGHT    ENTER lock", { ...clearStyle("#e8dcf8", 32) }).setOrigin(0.5);

    this.previews = this.picks.map((id, i) => {
      const spec = FIGHTERS[id];
      const x = W * (0.35 + i * 0.3);
      const spr = this.add.sprite(x, H * 0.62, `${id}-idle`, 0);
      spr.fighterId = id;
      spr.setOrigin(0.5, 1).setScale(spec.scale).setDepth(100);
      playFighter(spr, "idle");
      this.add.text(x, H * 0.66, spec.name.toUpperCase(), { ...clearStyle("#fff6dc", 36), fontStyle: "800" }).setOrigin(0.5, 0);
      return { id, spec, spr };
    });
    this.ring = this.add.rectangle(this.previews[this.pick].spr.x, H * 0.62, 240, 440, 0, 0).setStrokeStyle(6, 0xf0c040).setOrigin(0.5, 1);
  }

  update() {
    if (Phaser.Input.Keyboard.JustDown(this.ctrl.k.LEFT) || Phaser.Input.Keyboard.JustDown(this.ctrl.k.A)) {
      this.pick = (this.pick + this.picks.length - 1) % this.picks.length;
      sfx.select();
      this.ring.x = this.previews[this.pick].spr.x;
    }
    if (Phaser.Input.Keyboard.JustDown(this.ctrl.k.RIGHT) || Phaser.Input.Keyboard.JustDown(this.ctrl.k.D)) {
      this.pick = (this.pick + 1) % this.picks.length;
      sfx.select();
      this.ring.x = this.previews[this.pick].spr.x;
    }
    if (this.ctrl.action() || Phaser.Input.Keyboard.JustDown(this.ctrl.k.ENTER)) {
      const id = this.picks[this.pick];
      this.registry.set("runOutfit", id);
      writeSave({ fighterId: id });
      sfx.confirm();
      fadeTo(this, "ChartReviewScene");
    }
  }
}
