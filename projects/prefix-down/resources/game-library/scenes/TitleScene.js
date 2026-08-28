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

function plaque(scene, x, y, str, { color, size, originX = 0.5, originY = 0.5, padX = 36, padY = 18, stroke = 5, weight = "800" } = {}) {
  const t = scene.add
    .text(x, y, str, {
      ...clearStyle(color, size),
      fontStyle: weight,
      stroke: "#000000",
      strokeThickness: stroke,
      align: "center",
    })
    .setOrigin(originX, originY)
    .setDepth(2002);
  const bg = scene.add
    .rectangle(x, y, t.width + padX * 2, t.height + padY * 2, 0x0c0618, 0.97)
    .setOrigin(originX, originY)
    .setStrokeStyle(4, 0xf0c040)
    .setDepth(2001);
  return { text: t, bg };
}

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

    this.add.rectangle(W / 2, 360, 1680, 460, 0x0c0618, 0.97).setStrokeStyle(6, 0xf0c040).setDepth(2000);

    const title = this.add
      .text(W / 2, 200, "PREFIX DOWN", {
        ...clearStyle("#f0c040", 120),
        fontStyle: "800",
        stroke: "#000000",
        strokeThickness: 12,
      })
      .setOrigin(0.5)
      .setDepth(2002);
    floaty(this, title, 8);

    this.add
      .text(W / 2, 292, "STREET BRAWL", { ...clearStyle("#fff6dc", 48), fontStyle: "800", stroke: "#000000", strokeThickness: 6 })
      .setOrigin(0.5)
      .setDepth(2002);

    this.add
      .text(W / 2, 352, "Walk the road. Clear a round. Move forward.", {
        ...clearStyle("#e8dcf8", 34),
        fontStyle: "700",
        stroke: "#000000",
        strokeThickness: 5,
      })
      .setOrigin(0.5)
      .setDepth(2002);

    const coin = this.add
      .text(W / 2, 428, "ENTER  ·  FIGHT", {
        ...clearStyle("#fff6dc", 56),
        fontStyle: "800",
        stroke: "#000000",
        strokeThickness: 6,
      })
      .setOrigin(0.5)
      .setDepth(2002);
    this.tweens.add({ targets: coin, alpha: 0.7, duration: 520, yoyo: true, repeat: -1 });

    this.add
      .text(W / 2, 500, "D  ·  blank chart     T  ·  tile chart", {
        ...clearStyle("#ddd0f4", 32),
        fontStyle: "700",
        stroke: "#000000",
        strokeThickness: 5,
      })
      .setOrigin(0.5)
      .setDepth(2002);

    plaque(this, W / 2, H - 28, `${HERO.name.toUpperCase()}   ARROWS move   SPACE jump   Z punch   X kick`, {
      color: "#fff6dc",
      size: 34,
      originX: 0.5,
      originY: 1,
      padX: 40,
      padY: 16,
      stroke: 5,
    });
  }

  update() {
    if (this.ctrl.action() || Phaser.Input.Keyboard.JustDown(this.ctrl.k.ENTER)) {
      sfx.confirm();
      fadeTo(this, "ChartReviewScene");
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
