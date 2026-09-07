export { PHASER_CDN, PHASER_VERSION, asset } from "./paths.js?r=w5";
export { THEMES, SKINS, ARCHETYPES } from "./look/palettes.js?r=w5";
export { FONTS, textStyle } from "./look/type.js?r=w5";
export { GENRES, PACKS } from "./catalog.js?r=w5";
export { gameConfig } from "./phaser/config.js?r=w5";
export { preloadLibrary, bootLibrary, demoItems, metricItems } from "./phaser/preload.js?r=w5";
export { makeControls } from "./input/controls.js?r=w5";
export { sfx } from "./audio/sfx.js?r=w5";
export { fadeTo, flash, shake, sparkBurst } from "./motion/transitions.js?r=w5";
export { KENNEY_HEROES, registerAnims } from "./motion/anims.js?r=w5";
export { openRecall } from "./mechanics/recall.js?r=w5";

export { BootScene } from "./scenes/BootScene.js?r=w5";
export { HubScene } from "./scenes/HubScene.js?r=w5";
export { TitleScene } from "./scenes/TitleScene.js?r=w5";
export { SelectScene } from "./scenes/SelectScene.js?r=w5";
export { OverworldScene } from "./mechanics/overworld.js?r=w5";
export { PlatformerScene } from "./mechanics/platformer.js?r=w5";
export { BattleScene } from "./mechanics/party-battle.js?r=w5";
export { BrickScene } from "./mechanics/brick-build.js?r=w5";
export { Match3Scene } from "./mechanics/match3.js?r=w5";
export { RecallScene } from "./mechanics/recall-scene.js?r=w5";
export { WardrobeScene } from "./mechanics/wardrobe.js?r=w5";
export { DialogueScene } from "./mechanics/dialogue.js?r=w5";
export { MetroidvaniaScene } from "./mechanics/metroidvania.js?r=w5";
export { VisualNovelScene } from "./mechanics/visual-novel.js?r=w5";
export { RhythmScene } from "./mechanics/rhythm.js?r=w5";
export { TowerDefenseScene } from "./mechanics/tower-defense.js?r=w5";
export { RacingScene } from "./mechanics/racing.js?r=w5";
export { CardBattleScene } from "./mechanics/card-battle.js?r=w5";
export { StealthScene } from "./mechanics/stealth.js?r=w5";
export { CookingScene } from "./mechanics/cooking.js?r=w5";
export { RunnerScene } from "./mechanics/runner.js?r=w5";
export { InventoryScene } from "./mechanics/inventory.js?r=w5";
export { BrawlerScene } from "./mechanics/brawler.js?r=w5";
export { ChartDumpScene } from "./mechanics/chart-dump.js?r=w5";
export { ChartTilesScene } from "./mechanics/chart-tiles.js?r=w5";
export { ChartReviewScene } from "./mechanics/chart-review.js?r=w5";

import { BootScene } from "./scenes/BootScene.js?r=w5";
import { HubScene } from "./scenes/HubScene.js?r=w5";
import { TitleScene } from "./scenes/TitleScene.js?r=w5";
import { SelectScene } from "./scenes/SelectScene.js?r=w5";
import { OverworldScene } from "./mechanics/overworld.js?r=w5";
import { PlatformerScene } from "./mechanics/platformer.js?r=w5";
import { BattleScene } from "./mechanics/party-battle.js?r=w5";
import { BrickScene } from "./mechanics/brick-build.js?r=w5";
import { Match3Scene } from "./mechanics/match3.js?r=w5";
import { RecallScene } from "./mechanics/recall-scene.js?r=w5";
import { WardrobeScene } from "./mechanics/wardrobe.js?r=w5";
import { DialogueScene } from "./mechanics/dialogue.js?r=w5";
import { MetroidvaniaScene } from "./mechanics/metroidvania.js?r=w5";
import { VisualNovelScene } from "./mechanics/visual-novel.js?r=w5";
import { RhythmScene } from "./mechanics/rhythm.js?r=w5";
import { TowerDefenseScene } from "./mechanics/tower-defense.js?r=w5";
import { RacingScene } from "./mechanics/racing.js?r=w5";
import { CardBattleScene } from "./mechanics/card-battle.js?r=w5";
import { StealthScene } from "./mechanics/stealth.js?r=w5";
import { CookingScene } from "./mechanics/cooking.js?r=w5";
import { RunnerScene } from "./mechanics/runner.js?r=w5";
import { InventoryScene } from "./mechanics/inventory.js?r=w5";
import { BrawlerScene } from "./mechanics/brawler.js?r=w5";
import { ChartDumpScene } from "./mechanics/chart-dump.js?r=w5";
import { ChartTilesScene } from "./mechanics/chart-tiles.js?r=w5";
import { ChartReviewScene } from "./mechanics/chart-review.js?r=w5";

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
