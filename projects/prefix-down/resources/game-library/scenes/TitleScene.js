import { THEMES } from "../look/palettes.js";
import { roadLayout } from "../mechanics/brawler-contract.js";
import { makeControls } from "../input/controls.js";
import { sfx } from "../audio/sfx.js";
import { startBed } from "../audio/music.js";
import { fadeTo, floaty } from "../motion/transitions.js";
import { playFighter, FIGHTERS, PLAYABLE, faceFighter } from "../motion/fighter-anims.js";
import { paintRoad } from "../layouts/city.js";
import { homeOf, loadSave, writeSave } from "../systems/save.js";
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
    paintRoad(this, W, { props: false });

    this.picks = PLAYABLE.slice();
    const saved = loadSave().fighterId;
    this.pick = Math.max(0, this.picks.indexOf(saved === "kai" ? "kai" : "ash"));

    const xs = [W * 0.22, W * 0.4];
    this.previews = this.picks.map((id, i) => {
      const spec = FIGHTERS[id];
      const spr = this.add.sprite(xs[i], road.floorY, `${id}-idle`, 0);
      spr.fighterId = id;
      spr.setOrigin(0.5, 1).setScale(spec.scale).setDepth(100);
      spr.baseScale = spec.scale;
      playFighter(spr, "idle");
      const label = this.add
        .text(xs[i], road.floorY + 8, spec.name.toUpperCase(), {
          ...clearStyle("#fff6dc", 28),
          fontStyle: "800",
          stroke: "#000000",
          strokeThickness: 5,
        })
        .setOrigin(0.5, 0)
        .setDepth(2002);
      return { id, spec, spr, label };
    });
    this.ring = this.add.rectangle(xs[this.pick], road.floorY + 4, 260, 430, 0x000000, 0).setStrokeStyle(6, 0xf0c040).setOrigin(0.5, 1).setDepth(1990);

    const rival = this.add.sprite(W * 0.64, road.floorY, "wolf-idle", 0);
    rival.fighterId = "wolf";
    rival.setOrigin(0.5, 1).setScale(FIGHTERS.wolf.scale).setDepth(100);
    faceFighter(rival, -1, FIGHTERS.wolf);
    playFighter(rival, "idle");

    const bot = this.add.sprite(W * 0.78, road.floorY, "bot-idle", 0);
    bot.fighterId = "bot";
    bot.setOrigin(0.5, 1).setScale(FIGHTERS.bot.scale).setDepth(100);
    faceFighter(bot, -1, FIGHTERS.bot);
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
      .text(W / 2, 352, "LEFT / RIGHT choose a fighter", {
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

    this.hint = plaque(this, W / 2, H - 28, "", {
      color: "#fff6dc",
      size: 34,
      originX: 0.5,
      originY: 1,
      padX: 40,
      padY: 16,
      stroke: 5,
    });
    this.paintPick();
  }

  paintPick() {
    this.previews.forEach((p, i) => {
      const on = i === this.pick;
      p.spr.setAlpha(1);
      p.label.setColor(on ? "#f0c040" : "#c8b8e0");
      playFighter(p.spr, on ? "idle" : "idle");
    });
    const cur = this.previews[this.pick];
    this.ring.x = cur.spr.x;
    const name = cur.spec.name.toUpperCase();
    this.hint.text.setText(`${name}   ARROWS choose   SPACE double jump   Z punches   X kicks`);
    this.hint.bg.width = this.hint.text.width + 80;
  }

  lockPick() {
    const id = this.picks[this.pick];
    this.registry.set("runOutfit", id);
    writeSave({ fighterId: id });
    sfx.confirm();
    fadeTo(this, "ChartReviewScene");
  }

  update() {
    const left = Phaser.Input.Keyboard.JustDown(this.ctrl.k.LEFT) || Phaser.Input.Keyboard.JustDown(this.ctrl.k.A);
    const right = Phaser.Input.Keyboard.JustDown(this.ctrl.k.RIGHT) || Phaser.Input.Keyboard.JustDown(this.ctrl.k.D);
    if (left) {
      this.pick = (this.pick + this.picks.length - 1) % this.picks.length;
      sfx.select();
      this.paintPick();
    }
    if (right && !Phaser.Input.Keyboard.JustDown(this.ctrl.k.D)) {
      this.pick = (this.pick + 1) % this.picks.length;
      sfx.select();
      this.paintPick();
    }
    if (this.ctrl.action() || Phaser.Input.Keyboard.JustDown(this.ctrl.k.ENTER)) {
      this.lockPick();
    }
    if (Phaser.Input.Keyboard.JustDown(this.ctrl.k.D)) {
      this.lockPickQuiet();
      sfx.select();
      fadeTo(this, "ChartDumpScene");
    }
    if (Phaser.Input.Keyboard.JustDown(this.ctrl.k.T)) {
      this.lockPickQuiet();
      sfx.select();
      fadeTo(this, "ChartTilesScene");
    }
    if (Phaser.Input.Keyboard.JustDown(this.ctrl.k.ESC) && homeOf(this) === "HubScene") {
      fadeTo(this, "HubScene");
    }
  }

  lockPickQuiet() {
    const id = this.picks[this.pick];
    this.registry.set("runOutfit", id);
    writeSave({ fighterId: id });
  }
}
