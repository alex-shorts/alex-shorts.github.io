export { PHASER_CDN, PHASER_VERSION, asset } from "./paths.js";
export { THEMES, SKINS, ARCHETYPES } from "./look/palettes.js";
export { FONTS, textStyle } from "./look/type.js";
export { GENRES, PACKS } from "./catalog.js";
export { gameConfig } from "./phaser/config.js";
export { preloadLibrary, bootLibrary, demoItems, metricItems } from "./phaser/preload.js";
export { makeControls } from "./input/controls.js";
export { sfx } from "./audio/sfx.js";
export { fadeTo, flash, shake, sparkBurst } from "./motion/transitions.js";
export { KENNEY_HEROES, registerAnims } from "./motion/anims.js";
export { openRecall } from "./mechanics/recall.js";

export { BootScene } from "./scenes/BootScene.js";
export { HubScene } from "./scenes/HubScene.js";
export { TitleScene } from "./scenes/TitleScene.js";
export { SelectScene } from "./scenes/SelectScene.js";
export { OverworldScene } from "./mechanics/overworld.js";
export { PlatformerScene } from "./mechanics/platformer.js";
export { BattleScene } from "./mechanics/party-battle.js";
export { BrickScene } from "./mechanics/brick-build.js";
export { Match3Scene } from "./mechanics/match3.js";
export { RecallScene } from "./mechanics/recall-scene.js";
export { WardrobeScene } from "./mechanics/wardrobe.js";
export { DialogueScene } from "./mechanics/dialogue.js";
export { MetroidvaniaScene } from "./mechanics/metroidvania.js";
export { VisualNovelScene } from "./mechanics/visual-novel.js";
export { RhythmScene } from "./mechanics/rhythm.js";
export { TowerDefenseScene } from "./mechanics/tower-defense.js";
export { RacingScene } from "./mechanics/racing.js";
export { CardBattleScene } from "./mechanics/card-battle.js";
export { StealthScene } from "./mechanics/stealth.js";
export { CookingScene } from "./mechanics/cooking.js";
export { RunnerScene } from "./mechanics/runner.js";
export { InventoryScene } from "./mechanics/inventory.js";
export { BrawlerScene } from "./mechanics/brawler.js";
export { ChartDumpScene } from "./mechanics/chart-dump.js";
export { ChartTilesScene } from "./mechanics/chart-tiles.js";
export { ChartReviewScene } from "./mechanics/chart-review.js";

import { BootScene } from "./scenes/BootScene.js";
import { HubScene } from "./scenes/HubScene.js";
import { TitleScene } from "./scenes/TitleScene.js";
import { SelectScene } from "./scenes/SelectScene.js";
import { OverworldScene } from "./mechanics/overworld.js";
import { PlatformerScene } from "./mechanics/platformer.js";
import { BattleScene } from "./mechanics/party-battle.js";
import { BrickScene } from "./mechanics/brick-build.js";
import { Match3Scene } from "./mechanics/match3.js";
import { RecallScene } from "./mechanics/recall-scene.js";
import { WardrobeScene } from "./mechanics/wardrobe.js";
import { DialogueScene } from "./mechanics/dialogue.js";
import { MetroidvaniaScene } from "./mechanics/metroidvania.js";
import { VisualNovelScene } from "./mechanics/visual-novel.js";
import { RhythmScene } from "./mechanics/rhythm.js";
import { TowerDefenseScene } from "./mechanics/tower-defense.js";
import { RacingScene } from "./mechanics/racing.js";
import { CardBattleScene } from "./mechanics/card-battle.js";
import { StealthScene } from "./mechanics/stealth.js";
import { CookingScene } from "./mechanics/cooking.js";
import { RunnerScene } from "./mechanics/runner.js";
import { InventoryScene } from "./mechanics/inventory.js";
import { BrawlerScene } from "./mechanics/brawler.js";
import { ChartDumpScene } from "./mechanics/chart-dump.js";
import { ChartTilesScene } from "./mechanics/chart-tiles.js";
import { ChartReviewScene } from "./mechanics/chart-review.js";

export const SCENES = [
  BootScene,
  HubScene,
  TitleScene,
  SelectScene,
  OverworldScene,
  PlatformerScene,
  BattleScene,
  BrickScene,
  Match3Scene,
  RecallScene,
  WardrobeScene,
  DialogueScene,
  MetroidvaniaScene,
  VisualNovelScene,
  RhythmScene,
  TowerDefenseScene,
  RacingScene,
  CardBattleScene,
  StealthScene,
  CookingScene,
  RunnerScene,
  InventoryScene,
  BrawlerScene,
  ChartDumpScene,
  ChartTilesScene,
  ChartReviewScene,
];

export const METRIC_SCENES = [BootScene, TitleScene, ChartReviewScene, BrawlerScene, ChartDumpScene, ChartTilesScene];
