import { THEMES } from "../look/palettes.js";
import { textStyle } from "../look/type.js";
import { typewriter } from "../motion/transitions.js";
import { sfx } from "../audio/sfx.js";

/** SNES RPG dialogue box. Launch over another scene. */
export class DialogueScene extends Phaser.Scene {
  constructor() {
    super("DialogueScene");
  }

  init(data) {
    this.payload = data || {};
  }

  create() {
    const theme = THEMES.snes;
    const lines = this.payload.lines || ["..."];
    this.i = 0;
    this.add.rectangle(240, 220, 460, 88, 0x000000, 0.2);
    this.add.image(240, 222, "panel-speech");
    this.name = this.add.text(30, 184, this.payload.speaker || "NPC", textStyle(theme, "subtitle"));
    this.body = this.add.text(30, 206, "", textStyle(theme, "dialogue"));
    this.tw = typewriter(this, this.body, lines[0]);
    this.input.keyboard.on("keydown-X", () => this.advance(lines));
    this.input.keyboard.on("keydown-ENTER", () => this.advance(lines));
    this.input.keyboard.on("keydown-E", () => this.advance(lines));
    this.input.on("pointerdown", () => this.advance(lines));
  }

  advance(lines) {
    sfx.select();
    this.i += 1;
    if (this.i >= lines.length) {
      this.payload.onClose?.();
      this.scene.stop();
      return;
    }
    this.tw?.remove();
    this.tw = typewriter(this, this.body, lines[this.i]);
  }
}
