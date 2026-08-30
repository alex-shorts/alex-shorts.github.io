import { preloadLibrary, bootLibrary } from "../phaser/preload.js";
import { loadSave, resetSave, writeSave } from "../systems/save.js";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  preload() {
    const t = this.add.text(this.scale.width / 2, this.scale.height / 2, "LOADING…", {
      fontFamily: '"Nunito", "Segoe UI", sans-serif',
      fontSize: "48px",
      color: "#f0c040",
    }).setOrigin(0.5);
    preloadLibrary(this);
    this.load.on("complete", () => t.destroy());
  }

  create() {
    try {
      bootLibrary(this);
    } catch (err) {
      this.add.text(8, 160, String(err && err.stack ? err.stack : err), {
        fontFamily: "monospace",
        fontSize: "10px",
        color: "#f06050",
        wordWrap: { width: 460 },
      });
      console.error(err);
      return;
    }
    const q = new URLSearchParams(location.search);
    if (q.has("reset")) resetSave();
    if (q.has("practice")) this.registry.set("practiceFight", true);
    const fighter = q.get("fighter");
    if (fighter === "kai" || fighter === "ash") writeSave({ fighterId: fighter });
    this.registry.set("runOutfit", loadSave().fighterId === "kai" ? "kai" : "ash");
    const start = q.get("start") || this.registry.get("startScene") || "TitleScene";
    this.scene.start(start);
  }
}
