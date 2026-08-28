/** Genre kits. IDs are stable. Not Nintendo/Lego IP — patterns only. */
export const GENRES = [
  { id: "overworld", short: "Overworld", scene: "OverworldScene", like: "Zelda-like top-down" },
  { id: "platformer", short: "Platform", scene: "PlatformerScene", like: "side-scroll jump" },
  { id: "battle", short: "Battle", scene: "BattleScene", like: "Pokemon-like menu fight" },
  { id: "bricks", short: "Bricks", scene: "BrickScene", like: "Lego-like place/smash" },
  { id: "match3", short: "Match-3", scene: "Match3Scene", like: "swap gems" },
  { id: "recall", short: "Recall", scene: "RecallScene", like: "learning verb" },
  { id: "wardrobe", short: "Wardrobe", scene: "WardrobeScene", like: "character skins" },
  { id: "metroid", short: "Metroid", scene: "MetroidvaniaScene", like: "ability-gated map" },
  { id: "vn", short: "Novel", scene: "VisualNovelScene", like: "dialogue + choice" },
  { id: "rhythm", short: "Rhythm", scene: "RhythmScene", like: "hit-on-beat" },
  { id: "td", short: "Towers", scene: "TowerDefenseScene", like: "place towers" },
  { id: "race", short: "Race", scene: "RacingScene", like: "top-down drive" },
  { id: "cards", short: "Cards", scene: "CardBattleScene", like: "hand of facts" },
  { id: "stealth", short: "Stealth", scene: "StealthScene", like: "avoid cones" },
  { id: "cook", short: "Cook", scene: "CookingScene", like: "recipe order" },
  { id: "runner", short: "Runner", scene: "RunnerScene", like: "auto-run jump" },
  { id: "pause", short: "Invent.", scene: "InventoryScene", like: "save / pause" },
  { id: "brawler", short: "Brawler", scene: "BrawlerScene", like: "street brawler" },
  { id: "chart", short: "Chart", scene: "ChartDumpScene", like: "blank metric grid" },
  { id: "tiles", short: "Tiles", scene: "ChartTilesScene", like: "drag metric tiles" },
];

export const PACKS = [
  {
    id: "kenney-pixel-platformer",
    license: "CC0",
    path: "assets/vendor/kenney-pixel-platformer/",
    load: { chars: "24x24 spritesheet", tiles: "18x18 spritesheet" },
  },
  {
    id: "kenney-2d",
    license: "CC0",
    path: "assets/vendor/kenney-2d/",
    load: { coin: "png", cursors: "png", sparkle: "png" },
  },
  {
    id: "fonts-ofl",
    license: "OFL",
    path: "assets/fonts/",
    families: ["Press Start 2P", "Silkscreen", "VT323", "Tiny5", "Jersey 10", "Jersey 15", "Pixelify Sans", "Nunito"],
  },
  {
    id: "kit-runtime",
    license: "internal",
    note: "Buttons, panels, bricks, gems, hearts baked in Phaser at boot",
  },
];
