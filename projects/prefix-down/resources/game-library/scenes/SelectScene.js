import { fadeTo } from "../motion/transitions.js";

/** Single-fighter game — select is a passthrough. */
export class SelectScene extends Phaser.Scene {
  constructor() {
    super("SelectScene");
  }

  create() {
    fadeTo(this, "BrawlerScene", {}, 80);
  }
}
