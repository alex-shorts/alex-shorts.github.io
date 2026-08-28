import { THEMES } from "../look/palettes.js";
import { HERO, roadLayout } from "../mechanics/brawler-contract.js";
import { makeControls } from "../input/controls.js";
import { sfx } from "../audio/sfx.js";
import { startBed } from "../audio/music.js";
import { fadeTo, floaty } from "../motion/transitions.js";
import { playFighter, FIGHTERS, faceFighter } from "../motion/fighter-anims.js";
import { paintRoad } from "../layouts/city.js";
import { homeOf } from "../systems/save.js";
import { clearStyle } from "../look/type.js";

export class TitleScene extends Phaser.Scene {
  constructor() {
    super("TitleScene");
  }

  create() {
    this.theme = THEMES.snes;
    const W = this.scale.width;
    const H = this.scale.height;
    const road = roadLayout(H);
    this.cameras.main.setBackgroundColor(0x000010);
    startBed();
    this.ctrl = makeControls(this);
    paintRoad(this, W);

    this.hero = this.add.sprite(W * 0.28, road.floorY, "ash-idle", 0);
    this.hero.fighterId = "ash";
    this.hero.setOrigin(0.5, 1).setScale(FIGHTERS.ash.scale);
    playFighter(this.hero, "idle");

    const rival = this.add.sprite(W * 0.52, road.floorY, "wolf-idle", 0);
    rival.fighterId = "wolf";
    rival.setOrigin(0.5, 1).setScale(FIGHTERS.wolf.scale);
    faceFighter(rival, this.hero.x - rival.x, FIGHTERS.wolf);
    playFighter(rival, "idle");

    const bot = this.add.sprite(W * 0.68, road.floorY, "bot-idle", 0);
    bot.fighterId = "bot";
    bot.setOrigin(0.5, 1).setScale(FIGHTERS.bot.scale);
    faceFighter(bot, this.hero.x - bot.x, FIGHTERS.bot);
    playFighter(bot, "idle");

    const title = this.add
      .text(W / 2, 170, "PREFIX DOWN", {
        ...clearStyle("#f0c040", 96),
        fontStyle: "800",
        stroke: "#120818",
        strokeThickness: 10,
      })
      .setOrigin(0.5);
    floaty(this, title, 8);

    this.add.text(W / 2, 268, "STREET BRAWL", { ...clearStyle("#f8f0d8", 36), fontStyle: "700" }).setOrigin(0.5);

    this.add
      .text(W / 2, 318, "Walk the road. Clear a round. Move forward.", { ...clearStyle("#c8b8e0", 26) })
      .setOrigin(0.5);

    const coin = this.add.text(W / 2, 410, "ENTER  ·  FIGHT", { ...clearStyle("#f8f0d8", 40), fontStyle: "800" }).setOrigin(0.5);
    this.tweens.add({ targets: coin, alpha: 0.25, duration: 520, yoyo: true, repeat: -1 });

    this.add.text(W / 2, 470, "D  ·  blank chart     T  ·  tile chart", { ...clearStyle("#a090c0", 26) }).setOrigin(0.5);

    this.add
      .text(W / 2, H - 36, `${HERO.name.toUpperCase()}   ARROWS move   SPACE jump   Z punch   X kick`, {
        ...clearStyle("#c8b8e0", 26),
      })
      .setOrigin(0.5, 1);
  }

  update() {
    if (this.ctrl.action() || Phaser.Input.Keyboard.JustDown(this.ctrl.k.ENTER)) {
      sfx.confirm();
      fadeTo(this, "BrawlerScene");
    }
    if (this.ctrl.digit(2) || Phaser.Input.Keyboard.JustDown(this.ctrl.k.D)) {
      sfx.select();
      fadeTo(this, "ChartDumpScene");
    }
    if (Phaser.Input.Keyboard.JustDown(this.ctrl.k.T)) {
      sfx.select();
      fadeTo(this, "ChartTilesScene");
    }
    if (Phaser.Input.Keyboard.JustDown(this.ctrl.k.ESC) && homeOf(this) === "HubScene") {
      fadeTo(this, "HubScene");
    }
  }
}
