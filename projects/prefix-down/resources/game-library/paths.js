/** Resolve files inside this library from any game. */
const PACK = "w2";
export function asset(path) {
  const href = new URL(`./assets/${path}`, import.meta.url).href;
  const v = new URLSearchParams(location.search).get("v") || "1";
  return `${href}?v=${encodeURIComponent(v)}-${PACK}`;
}

export const PHASER_CDN = "https://cdn.jsdelivr.net/npm/phaser@4.2.1/dist/phaser.min.js";
export const PHASER_VERSION = "4.2.1";
