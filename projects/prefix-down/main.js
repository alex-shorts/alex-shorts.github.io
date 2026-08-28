import { gameConfig, METRIC_SCENES } from "./resources/game-library/index.js";

function showErr(msg) {
  const el = document.getElementById("boot-err");
  if (el) {
    el.hidden = false;
    el.textContent = msg;
  }
  console.error(msg);
}

window.addEventListener("error", (e) => showErr(e.message || String(e)));
window.addEventListener("unhandledrejection", (e) => showErr(String(e.reason || e)));

let started = false;
function start() {
  if (started) return;
  started = true;
  if (typeof Phaser === "undefined") {
    showErr("Phaser failed to load. Check the network and refresh.");
    return;
  }
  window.game = new Phaser.Game(
    gameConfig(METRIC_SCENES, "snes", {
      startScene: "TitleScene",
      homeScene: "TitleScene",
      w: 2560,
      h: 1440,
      pixelArt: false,
    }),
  );
}

const t = setTimeout(start, 600);
if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(() => {
    clearTimeout(t);
    start();
  });
} else {
  clearTimeout(t);
  start();
}
