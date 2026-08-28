/** Generate UI / FX / brick / battle chrome as Phaser textures (no extra PNG bake required). */

function gfx(scene) {
  return scene.make.graphics({ x: 0, y: 0, add: false });
}

function btn(g, key, w, h, face, hi, lo, down) {
  g.clear();
  const y = down ? 2 : 0;
  g.fillStyle(lo);
  g.fillRect(0, 2, w, h - 2);
  g.fillStyle(face);
  g.fillRoundedRect(0, y, w, h - 3, 3);
  g.fillStyle(hi);
  g.fillRect(2, y + 1, w - 4, 3);
  g.lineStyle(1, 0x101018, 1);
  g.strokeRoundedRect(0, y, w, h - 3, 3);
  g.generateTexture(key, w, h);
}

function panel(g, key, w, h, fill, edge, hi) {
  g.clear();
  g.fillStyle(0x08060c, 0.55);
  g.fillRect(3, 4, w - 3, h - 3);
  g.fillStyle(fill);
  g.fillRoundedRect(0, 0, w - 3, h - 3, 4);
  g.lineStyle(2, edge, 1);
  g.strokeRoundedRect(1, 1, w - 5, h - 5, 4);
  g.lineStyle(1, hi, 0.8);
  g.strokeRoundedRect(3, 3, w - 9, h - 9, 3);
  g.generateTexture(key, w, h);
}

export function bakeKit(scene) {
  if (scene.textures.exists("kit-ready")) return;
  const g = gfx(scene);

  btn(g, "btn-wood-up", 96, 22, 0xc07038, 0xf0b070, 0x6a3818, false);
  btn(g, "btn-wood-down", 96, 22, 0xa05828, 0xc07038, 0x4a2810, true);
  btn(g, "btn-blue-up", 96, 22, 0x3060c8, 0x70a0f0, 0x183078, false);
  btn(g, "btn-blue-down", 96, 22, 0x2048a0, 0x3060c8, 0x102050, true);
  btn(g, "btn-red-up", 96, 22, 0xc83838, 0xf07070, 0x781818, false);
  btn(g, "btn-mint-up", 96, 22, 0x28a878, 0x70e0b0, 0x146048, false);
  btn(g, "btn-gold-up", 96, 22, 0xd8a030, 0xf0d070, 0x785818, false);
  btn(g, "btn-ghost-up", 96, 22, 0x2a3040, 0x4a5870, 0x141820, false);
  btn(g, "btn-wide-up", 160, 26, 0x3060c8, 0x70a0f0, 0x183078, false);

  panel(g, "panel-snes", 200, 72, 0x302060, 0xf0c040, 0x8070c0);
  panel(g, "panel-n64", 200, 72, 0x245060, 0xf0d060, 0x70a8b8);
  panel(g, "panel-modern", 200, 72, 0x222836, 0x5ee0c0, 0x4a5870);
  panel(g, "panel-speech", 320, 64, 0xf8f0d8, 0x302040, 0xffffff);
  panel(g, "panel-battle", 220, 88, 0xf8f4e0, 0x203040, 0xffffff);
  panel(g, "panel-card", 280, 120, 0x241848, 0xf0c040, 0x6050a0);

  g.clear();
  g.fillStyle(0xe03040);
  g.fillTriangle(8, 2, 2, 8, 8, 14);
  g.fillTriangle(8, 2, 14, 8, 8, 14);
  g.generateTexture("icon-heart", 16, 16);
  g.clear();
  g.fillStyle(0x605060);
  g.fillTriangle(8, 2, 2, 8, 8, 14);
  g.fillTriangle(8, 2, 14, 8, 8, 14);
  g.generateTexture("icon-heart-empty", 16, 16);

  g.clear();
  g.fillStyle(0xc02820);
  g.fillCircle(8, 8, 7);
  g.fillStyle(0xd8a058);
  g.fillTriangle(8, 0, 4, 7, 12, 7);
  g.fillTriangle(16, 8, 9, 4, 9, 12);
  g.fillTriangle(8, 16, 4, 9, 12, 9);
  g.fillTriangle(0, 8, 7, 4, 7, 12);
  g.generateTexture("icon-pizza", 16, 16);

  g.clear();
  g.fillStyle(0xf0d040);
  g.fillCircle(6, 6, 6);
  g.fillStyle(0xfff0a0);
  g.fillCircle(4, 4, 2);
  g.generateTexture("icon-stud", 12, 12);

  g.clear();
  g.fillStyle(0xc0a050);
  g.fillRoundedRect(0, 2, 14, 10, 2);
  g.fillStyle(0xe8d080);
  g.fillRect(2, 0, 10, 6);
  g.generateTexture("icon-chest", 16, 16);

  g.clear();
  g.fillStyle(0xf8f0d0);
  g.fillRect(2, 0, 12, 16);
  g.fillStyle(0xe0c070);
  g.fillRect(3, 2, 10, 2);
  g.generateTexture("icon-book", 16, 16);

  const bricks = [
    ["brick-red", 0xc43c32, 0xe07060],
    ["brick-blue", 0x2a6cc8, 0x70a0f0],
    ["brick-yellow", 0xe0b030, 0xf8e070],
    ["brick-green", 0x2a9a50, 0x70d080],
    ["brick-black", 0x2a2a30, 0x5a5a68],
  ];
  for (const [key, face, hi] of bricks) {
    g.clear();
    g.fillStyle(face);
    g.fillRect(0, 4, 32, 16);
    g.fillStyle(hi);
    g.fillCircle(8, 4, 4);
    g.fillCircle(24, 4, 4);
    g.fillStyle(0x101018, 0.25);
    g.fillRect(0, 16, 32, 4);
    g.generateTexture(key, 32, 20);
  }

  g.clear();
  g.fillStyle(0xf0e8c0);
  g.fillCircle(8, 8, 7);
  g.lineStyle(2, 0xc0a050);
  g.strokeCircle(8, 8, 7);
  g.generateTexture("icon-coin", 16, 16);

  g.clear();
  g.fillStyle(0xffffff);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    g.fillCircle(8 + Math.cos(a) * 5, 8 + Math.sin(a) * 5, 1.5);
  }
  g.fillStyle(0xfff8c0);
  g.fillCircle(8, 8, 2);
  g.generateTexture("fx-spark", 16, 16);

  g.clear();
  g.fillStyle(0x70e070);
  g.fillRoundedRect(0, 0, 48, 16, 3);
  g.generateTexture("stamp-ok", 48, 16);
  g.clear();
  g.fillStyle(0xf06050);
  g.fillRoundedRect(0, 0, 48, 16, 3);
  g.generateTexture("stamp-miss", 48, 16);

  g.clear();
  g.fillStyle(0xf8f0d0);
  g.fillTriangle(0, 0, 10, 4, 0, 8);
  g.generateTexture("slash", 12, 8);

  g.clear();
  g.fillStyle(0xffffff);
  g.fillTriangle(1, 3, 15, 8, 2, 13);
  g.generateTexture("fx-hit", 16, 16);

  g.clear();
  g.fillStyle(0x4a80c0);
  g.fillRect(0, 0, 18, 18);
  g.fillStyle(0x70b060);
  g.fillRect(0, 0, 18, 8);
  g.generateTexture("node-clear", 18, 18);
  g.clear();
  g.fillStyle(0xc0a040);
  g.fillRect(0, 0, 18, 18);
  g.generateTexture("node-due", 18, 18);
  g.clear();
  g.fillStyle(0x404050);
  g.fillRect(0, 0, 18, 18);
  g.generateTexture("node-lock", 18, 18);
  g.clear();
  g.fillStyle(0xb04040);
  g.fillRect(0, 0, 18, 18);
  g.generateTexture("node-boss", 18, 18);

  const gems = [0xe05050, 0x50a0e0, 0x50c070, 0xe0c040, 0xc060e0, 0xe08040];
  gems.forEach((c, i) => {
    g.clear();
    g.fillStyle(c);
    g.fillRoundedRect(2, 2, 14, 14, 3);
    g.fillStyle(0xffffff, 0.35);
    g.fillRect(4, 4, 5, 3);
    g.generateTexture("gem-" + i, 18, 18);
  });

  g.clear();
  g.fillStyle(0xe8c060);
  g.fillCircle(8, 8, 7);
  g.fillStyle(0xd03028);
  g.fillCircle(8, 8, 5);
  g.fillStyle(0xf0e8a0);
  g.fillCircle(6, 6, 1);
  g.fillCircle(10, 9, 1);
  g.generateTexture("icon-pizza", 16, 16);

  g.clear();
  g.fillStyle(0xffffff);
  g.generateTexture("kit-ready", 2, 2);
  g.destroy();
}
