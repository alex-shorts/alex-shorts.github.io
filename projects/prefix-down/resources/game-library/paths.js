/** Resolve files inside this library from any game. */
export function asset(path) {
  return new URL(`./assets/${path}`, import.meta.url).href;
}

export const PHASER_CDN = "https://cdn.jsdelivr.net/npm/phaser@4.2.1/dist/phaser.min.js";
export const PHASER_VERSION = "4.2.1";
