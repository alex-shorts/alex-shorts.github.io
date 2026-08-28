import { BRAWLER, HERO, FOES, STATIONS, roadLayout } from "./brawler-contract.js";
import { openStrike } from "./strike-recall.js";
import { createBrawlerHud } from "../layouts/brawler-hud.js";
import { paintRoad } from "../layouts/city.js";
import { makeControls } from "../input/controls.js";
import { FIGHTERS, playFighter, faceFighter, lockBusy, fitFighterBody } from "../motion/fighter-anims.js";
import { metricItems } from "../phaser/preload.js";
import { THEMES } from "../look/palettes.js";
import { clearStyle } from "../look/type.js";
import { sfx } from "../audio/sfx.js";
import { sparkBurst, flash, shake, fadeTo, xpPop } from "../motion/transitions.js";
import { pickMetricItem } from "../systems/queue.js";
import { homeOf } from "../systems/save.js";

const foeOf = (id) => FOES.find((f) => f.id === id);

export class BrawlerScene extends Phaser.Scene {
  constructor() {
    super("BrawlerScene");
  }

  create() {
    this.theme = THEMES.snes;
    this.brawlerLocked = false;
    this.overlay = null;
    this.lastItemId = null;
    this.combo = 0;
    this.waveI = 0;
    this.fightOn = false;
    this.needGo = false;
    this.lastAtk = 0;
    this.invulnUntil = 0;
    const W = this.scale.width;
    const H = this.scale.height;
    this.road = roadLayout(H);

    this.physics.world.gravity.y = 0;
    this.physics.world.setBounds(0, 0, BRAWLER.width, H);
    this.cameras.main.setBounds(0, 0, BRAWLER.width, H).setBackgroundColor(0x000010);

    paintRoad(this, BRAWLER.width);

    const spec = FIGHTERS.ash;
    this.hero = this.physics.add.sprite(280, this.road.floorY, "ash-idle", 0);
    this.hero.fighterId = "ash";
    this.hero.setOrigin(0.5, 1).setScale(spec.scale);
    this.hero.baseScale = spec.scale;
    this.hero.body.setAllowGravity(false);
    fitFighterBody(this.hero, spec);
    this.hero.hp = BRAWLER.maxHp;
    this.hero.air = false;
    this.hero.laneY = this.road.floorY;
    playFighter(this.hero, "idle");
    this.cameras.main.startFollow(this.hero, true, 0.14, 0);
    this.cameras.main.setDeadzone(W * 0.22, 0);

    this.foes = this.physics.add.group();
    this.rockets = this.add.group();
    this.slices = this.physics.add.group();
    this.ctrl = makeControls(this);
    this.hud = createBrawlerHud(this);
    this.hud.setHp(this.hero.hp);
    this.hud.setWave(0, STATIONS.length);
    this.hud.setFighter(HERO.name);

    this.add
      .text(W / 2, H - 28, "Z punch   X kick   SPACE hop rockets   ESC pause", {
        ...clearStyle("#c8b8e0", 28),
      })
      .setOrigin(0.5, 1)
      .setScrollFactor(0)
      .setDepth(3200);

    this.comboT = this.add
      .text(W / 2, 110, "", { ...clearStyle("#f0c040", 64), fontStyle: "800" })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(3010)
      .setAlpha(0);

    this.goT = this.add
      .text(W / 2, H * 0.38, "", {
        ...clearStyle("#f0c040", 84),
        fontStyle: "800",
        stroke: "#120810",
        strokeThickness: 10,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(3300)
      .setAlpha(0);
    this.tweens.add({ targets: this.goT, alpha: { from: 0.25, to: 1 }, duration: 420, yoyo: true, repeat: -1 });

    this.hud.toast("WALK THE ROAD");
  }

  aliveFoes() {
    return this.foes.getChildren().filter((e) => e.active && e.hp > 0);
  }

  update() {
    if (this.overlay) {
      this.freezeCombat();
      this.handleOverlayKeys();
      return;
    }
    if (Phaser.Input.Keyboard.JustDown(this.ctrl.k.ESC)) {
      this.openPause();
      return;
    }
    this.sortDepth();
    if (this.brawlerLocked) {
      this.freezeCombat();
      return;
    }

    const v = this.ctrl.vector();
    const lockedMove = this.time.now < (this.ignoreMoveUntil || 0);
    const vx = lockedMove ? 0 : v.x;
    const vy = lockedMove ? 0 : v.y;
    if (!this.hero.air) {
      this.hero.setVelocity(vx * BRAWLER.walkSpeed, vy * BRAWLER.laneSpeed);
      this.hero.y = Phaser.Math.Clamp(this.hero.y, this.road.laneMin, this.road.laneMax);
      this.hero.x = Phaser.Math.Clamp(this.hero.x, 40, BRAWLER.width - 40);
      this.hero.laneY = this.hero.y;
    } else {
      this.hero.setVelocity(vx * BRAWLER.walkSpeed, 0);
    }

    if (this.fightOn) {
      const st = STATIONS[this.waveI];
      if (st) {
        const pad = this.scale.width * 0.38;
        this.hero.x = Phaser.Math.Clamp(this.hero.x, st.x - pad, st.x + pad);
      }
    }

    faceFighter(this.hero, vx, FIGHTERS.ash);
    if (this.hero.air) playFighter(this.hero, this.hero.body.velocity.y < 0 ? "jump" : "fall");
    else playFighter(this.hero, vx || vy ? "run" : "idle");

    if (Phaser.Input.Keyboard.JustDown(this.ctrl.k.SPACE)) this.tryJump();
    if (Phaser.Input.Keyboard.JustDown(this.ctrl.k.Z) || Phaser.Input.Keyboard.JustDown(this.ctrl.k.J)) {
      this.tryStrike("punch");
    }
    if (Phaser.Input.Keyboard.JustDown(this.ctrl.k.X) || Phaser.Input.Keyboard.JustDown(this.ctrl.k.K)) {
      this.tryStrike("kick");
    }

    if (this.brawlerLocked) {
      this.freezeCombat();
      return;
    }

    this.driveFoes();
    this.driveRockets();
    this.tryPickup();
    this.checkRoad();
  }

  checkRoad() {
    if (this.fightOn) {
      if (this.aliveFoes().length === 0) this.roundCleared();
      return;
    }
    if (this.waveI >= STATIONS.length) return;
    const st = STATIONS[this.waveI];
    if (this.hero.x >= st.x - this.scale.width * 0.35) this.beginRound();
  }

  beginRound() {
    const st = STATIONS[this.waveI];
    if (!st) return;
    this.fightOn = true;
    this.needGo = false;
    this.goT.setText("");
    this.invulnUntil = this.time.now + 1400;
    this.hud.setWave(this.waveI + 1, STATIONS.length);
    this.hud.toast(`ROUND ${this.waveI + 1}`);
    sfx.alert();
    const lane = (i) => Phaser.Math.Clamp(this.road.floorY + (i - 1) * 48, this.road.laneMin, this.road.laneMax);
    st.foes.forEach(([id, dx, li]) => this.spawnFoe(id, st.x + dx, lane(li)));
  }

  roundCleared() {
    this.fightOn = false;
    this.waveI += 1;
    if (this.waveI >= STATIONS.length) {
      this.openClear();
      return;
    }
    this.needGo = true;
    this.goT.setText("GO  →");
    this.hud.toast("MOVE FORWARD");
    sfx.confirm();
  }

  handleOverlayKeys() {
    if (!this.overlay) return;
    if (this.overlay.kind === "pause") {
      if (Phaser.Input.Keyboard.JustDown(this.ctrl.k.ESC) || Phaser.Input.Keyboard.JustDown(this.ctrl.k.ENTER)) {
        this.closeOverlay();
      }
      if (Phaser.Input.Keyboard.JustDown(this.ctrl.k.D)) this.goDump();
      if (Phaser.Input.Keyboard.JustDown(this.ctrl.k.T)) fadeTo(this, homeOf(this));
    } else if (this.overlay.kind === "clear") {
      if (Phaser.Input.Keyboard.JustDown(this.ctrl.k.ENTER) || this.ctrl.action()) this.goReview();
      if (Phaser.Input.Keyboard.JustDown(this.ctrl.k.ESC)) fadeTo(this, homeOf(this));
    } else if (this.overlay.kind === "dead") {
      if (Phaser.Input.Keyboard.JustDown(this.ctrl.k.ENTER)) this.scene.restart();
      if (Phaser.Input.Keyboard.JustDown(this.ctrl.k.D)) this.goDump();
      if (Phaser.Input.Keyboard.JustDown(this.ctrl.k.ESC)) fadeTo(this, homeOf(this));
    }
  }

  goDump() {
    this.closeOverlay();
    fadeTo(this, "ChartDumpScene");
  }

  goReview() {
    this.closeOverlay();
    fadeTo(this, "ChartReviewScene");
  }

  openPause() {
    this.brawlerLocked = true;
    this.overlay = { kind: "pause", root: this.makeSheet("PAUSE", "ENTER resume   D chart   T title") };
  }

  openClear() {
    this.brawlerLocked = true;
    this.freezeCombat();
    this.goT.setText("");
    sfx.correct();
    this.overlay = { kind: "clear", root: this.makeSheet("STAGE CLEAR", "ENTER learning chart   ESC title") };
  }

  openDead() {
    this.brawlerLocked = true;
    lockBusy(this.hero, "death");
    this.overlay = { kind: "dead", root: this.makeSheet("DOWN", "ENTER continue   D chart   ESC title") };
  }

  makeSheet(title, sub) {
    const W = this.scale.width;
    const H = this.scale.height;
    const root = this.add.container(0, 0).setDepth(5000).setScrollFactor(0);
    const dim = this.add.rectangle(W / 2, H / 2, W, H, 0x080414, 0.72);
    const panel = this.add.image(W / 2, H / 2, "panel-snes").setDisplaySize(720, 280);
    const t = this.add.text(W / 2, H / 2 - 40, title, { ...clearStyle("#f0c040", 52), fontStyle: "800" }).setOrigin(0.5);
    const s = this.add.text(W / 2, H / 2 + 40, sub, { ...clearStyle("#e8dcc8", 28) }).setOrigin(0.5);
    root.add([dim, panel, t, s]);
    return root;
  }

  closeOverlay() {
    this.overlay?.root?.destroy();
    this.overlay = null;
    this.brawlerLocked = false;
  }

  freezeCombat() {
    this.hero.setVelocity(0);
    this.foes.getChildren().forEach((e) => e.active && e.body && e.setVelocity(0));
  }

  sortDepth() {
    this.hero.setDepth(this.hero.y);
    this.foes.getChildren().forEach((e) => {
      if (!e.active) return;
      e.setDepth(e.y);
      if (e.hpBar) e.hpBar.setPosition(e.x, e.y - 56 * (e.scaleY || 6)).setDepth(e.y + 2);
    });
    this.slices.getChildren().forEach((s) => s.active && s.setDepth(s.y + 1));
    this.rockets?.getChildren().forEach((r) => r.active && r.setDepth(r.y + 4));
  }

  tryJump() {
    if (this.hero.air || this.brawlerLocked) return;
    this.hero.air = true;
    this.hero.laneY = this.hero.y;
    sfx.jump();
    lockBusy(this.hero, "jump");
    this.tweens.add({
      targets: this.hero,
      y: this.hero.laneY - BRAWLER.jump,
      duration: 220,
      yoyo: true,
      ease: "Quad.easeOut",
      onComplete: () => {
        this.hero.y = this.hero.laneY;
        this.hero.air = false;
      },
    });
  }

  nextItem() {
    const item = pickMetricItem(metricItems(this), this.lastItemId);
    this.lastItemId = item.id;
    return item;
  }

  nearestFoe(range) {
    let best = null;
    let bestD = range + 1;
    this.aliveFoes().forEach((e) => {
      if (Math.abs(e.y - this.hero.laneY) > 14 * 6) return;
      const d = Phaser.Math.Distance.Between(this.hero.x, this.hero.laneY, e.x, e.y);
      if (d < bestD) {
        bestD = d;
        best = e;
      }
    });
    return best;
  }

  tryStrike(kind) {
    if (this.brawlerLocked) return;
    const now = this.time.now;
    if (now - this.lastAtk < BRAWLER.attackMs) return;
    this.lastAtk = now;
    const range = kind === "kick" ? BRAWLER.kickRange : BRAWLER.punchRange;
    lockBusy(this.hero, kind);
    const target = this.nearestFoe(range);
    if (!target) {
      sfx.whoosh();
      return;
    }
    sfx.punch();
    if (target.hp > 1) {
      this.chip(target);
      return;
    }
    this.askKo(target);
  }

  chip(target) {
    target.hp -= BRAWLER.chip;
    target.x += this.hero.flipX ? -36 : 36;
    lockBusy(target, "hit");
    this.combo += 1;
    this.showCombo();
    sparkBurst(this, target.x, target.y - 48 * (target.scaleY || 6), 8);
    sfx.hit();
    this.paintFoeHp(target);
    this.invulnUntil = this.time.now + 120;
  }

  showCombo() {
    if (this.combo < 2) return;
    this.comboT.setText(this.combo + " HIT").setAlpha(1);
    this.tweens.add({ targets: this.comboT, alpha: 0, delay: 400, duration: 250 });
  }

  askKo(target) {
    if (this.registry.get("practiceFight") || new URLSearchParams(location.search).has("practice")) {
      this.finishKo(target);
      return;
    }
    const item = this.nextItem();
    this.hud.toast?.("FINISH HIM");
    openStrike(this, item, {
      onLand: () => this.finishKo(target),
      onWhiff: () => {
        this.hurtHero(1, true);
        this.time.delayedCall(220, () => {
          if (!this.sys.isActive()) return;
          if (this.hero.hp <= 0 || !target?.active) return;
          this.askKo(target);
        });
      },
    });
  }

  finishKo(target) {
    if (!target?.active) return;
    lockBusy(target, "death");
    sparkBurst(this, target.x, target.y - 48 * (target.scaleY || 6), 14);
    flash(this, 0xf0c040, 80);
    shake(this, 180, 0.01);
    sfx.hit();
    xpPop(this, target.x, target.y - 64 * (target.scaleY || 6), "KO");
    this.combo += 1;
    this.showCombo();
    if (Math.random() < 0.6) this.dropSlice(target.x, target.y - 40);
    const bar = target.hpBar;
    this.time.delayedCall(420, () => {
      bar?.destroy();
      if (target.active) target.destroy();
    });
    target.hp = 0;
  }

  hurtHero(n, force = false) {
    if (!force && this.time.now < this.invulnUntil) return;
    this.hero.hp = Math.max(0, this.hero.hp - n);
    this.hud.setHp(this.hero.hp);
    this.combo = 0;
    lockBusy(this.hero, "hit");
    flash(this, 0xe04030, 90);
    shake(this, 150, 0.008);
    sfx.miss();
    this.invulnUntil = this.time.now + 500;
    if (this.hero.hp <= 0) this.openDead();
  }

  dropSlice(x, y) {
    const key = this.textures.exists("icon-pizza") ? "icon-pizza" : "kenney-coin";
    const p = this.physics.add.image(x, y, key).setScale(3);
    if (key === "kenney-coin") p.setTint(0xf0a040);
    p.setVelocity(0).setDepth(y + 1);
    this.slices.add(p);
  }

  tryPickup() {
    this.slices.getChildren().forEach((p) => {
      if (!p.active) return;
      if (Phaser.Math.Distance.Between(this.hero.x, this.hero.y, p.x, p.y) > 90) return;
      this.hero.hp = Math.min(BRAWLER.maxHp, this.hero.hp + 1);
      this.hud.setHp(this.hero.hp);
      sfx.coin();
      p.destroy();
    });
  }

  driveFoes() {
    const now = this.time.now;
    this.aliveFoes().forEach((e) => {
      const spec = FIGHTERS[e.fighterId] || FIGHTERS.punk;
      faceFighter(e, this.hero.x - e.x, spec);
      if (e.kind === "gunner") this.driveGunner(e, now, spec);
      else this.driveMelee(e, now, spec);
      e.y = Phaser.Math.Clamp(e.y, this.road.laneMin, this.road.laneMax);
    });
  }

  driveMelee(e, now, spec) {
    const dist = Phaser.Math.Distance.Between(e.x, e.y, this.hero.x, this.hero.laneY);
    if (dist < 110 && !this.hero.air) {
      e.setVelocity(0);
      playFighter(e, "idle");
      if (now - (e.lastHit || 0) > 900) {
        e.lastHit = now;
        lockBusy(e, "punch");
        this.hurtHero(1);
      }
    } else {
      e.setVelocity(Math.sign(this.hero.x - e.x) * e.speed, Math.sign(this.hero.laneY - e.y) * 60);
      playFighter(e, "run");
    }
  }

  driveGunner(e, now) {
    const dist = Phaser.Math.Distance.Between(e.x, e.y, this.hero.x, this.hero.laneY);
    const dx = Math.sign(this.hero.x - e.x) || -1;
    const dy = Math.sign(this.hero.laneY - e.y);
    if (dist < 280) {
      e.setVelocity(-dx * e.speed, dy * 40);
      playFighter(e, "run");
    } else if (dist > 460) {
      e.setVelocity(dx * e.speed, dy * 50);
      playFighter(e, "run");
    } else {
      e.setVelocity(0, dy * 36);
      playFighter(e, "idle");
      if (now - (e.lastHit || 0) > 1400) {
        e.lastHit = now;
        lockBusy(e, "punch");
        this.time.delayedCall(220, () => {
          if (!this.sys.isActive() || !e.active || e.hp <= 0) return;
          this.spawnRocket(e);
        });
      }
    }
  }

  spawnRocket(e) {
    const dir = Math.sign(this.hero.x - e.x) || -1;
    const r = this.add.sprite(e.x + dir * 128, e.y - 210, "rocket-fly", 0);
    r.setOrigin(0.5, 0.5).setScale(4);
    r.setFlipX(dir < 0);
    r.dir = dir;
    r.spd = 560;
    r.laneY = e.y;
    r.anims?.play("rocket-fly", true);
    r.setDepth(e.y + 4);
    this.rockets.add(r);
    sfx.whoosh();
  }

  driveRockets() {
    const dt = this.game.loop.delta / 1000;
    this.rockets.getChildren().forEach((r) => {
      if (!r.active) return;
      r.x += r.dir * r.spd * dt;
      if (Math.abs(r.x - this.hero.x) > 2400) {
        r.destroy();
        return;
      }
      const nearX = Math.abs(r.x - this.hero.x) < 56;
      const nearLane = Math.abs((r.laneY || r.y) - this.hero.laneY) < 44;
      if (nearX && nearLane && !this.hero.air) {
        sparkBurst(this, r.x, r.y, 8);
        r.destroy();
        this.hurtHero(1);
      }
    });
  }

  paintFoeHp(e) {
    const g = e.hpBar;
    if (!g) return;
    g.clear();
    g.fillStyle(0x101018, 0.85);
    g.fillRect(-40, -4, 80, 10);
    g.fillStyle(0xe03838, 1);
    g.fillRect(-40, -4, 80 * (Math.max(0, e.hp) / e.maxHp), 10);
  }

  spawnFoe(id, x, y) {
    const spec = foeOf(id);
    if (!spec) return;
    const kit = FIGHTERS[spec.fighterId];
    const e = this.physics.add.sprite(x, y, `${spec.fighterId}-idle`, 0);
    e.fighterId = spec.fighterId;
    e.kind = spec.kind || "melee";
    e.setOrigin(0.5, 1).setScale(spec.scale).setTint(spec.tint);
    e.baseScale = spec.scale;
    e.body.setAllowGravity(false);
    fitFighterBody(e, kit);
    e.hp = spec.hp;
    e.maxHp = spec.hp;
    e.speed = spec.speed;
    e.lastHit = this.time.now + 500 + Math.random() * 400;
    e.hpBar = this.add.graphics().setDepth(y + 2);
    playFighter(e, "idle");
    faceFighter(e, this.hero.x - e.x, kit);
    this.paintFoeHp(e);
    this.foes.add(e);
  }
}
