export { PHASER_CDN, PHASER_VERSION, asset } from "./paths.js?r=w3";
export { THEMES, SKINS, ARCHETYPES } from "./look/palettes.js?r=w3";
export { FONTS, textStyle } from "./look/type.js?r=w3";
export { GENRES, PACKS } from "./catalog.js?r=w3";
export { gameConfig } from "./phaser/config.js?r=w3";
export { preloadLibrary, bootLibrary, demoItems, metricItems } from "./phaser/preload.js?r=w3";
export { makeControls } from "./input/controls.js?r=w3";
export { sfx } from "./audio/sfx.js?r=w3";
export { fadeTo, flash, shake, sparkBurst } from "./motion/transitions.js?r=w3";
export { KENNEY_HEROES, registerAnims } from "./motion/anims.js?r=w3";
export { openRecall } from "./mechanics/recall.js?r=w3";

export { BootScene } from "./scenes/BootScene.js?r=w3";
export { HubScene } from "./scenes/HubScene.js?r=w3";
export { TitleScene } from "./scenes/TitleScene.js?r=w3";
export { SelectScene } from "./scenes/SelectScene.js?r=w3";
export { OverworldScene } from "./mechanics/overworld.js?r=w3";
export { PlatformerScene } from "./mechanics/platformer.js?r=w3";
export { BattleScene } from "./mechanics/party-battle.js?r=w3";
export { BrickScene } from "./mechanics/brick-build.js?r=w3";
export { Match3Scene } from "./mechanics/match3.js?r=w3";
export { RecallScene } from "./mechanics/recall-scene.js?r=w3";
export { WardrobeScene } from "./mechanics/wardrobe.js?r=w3";
export { DialogueScene } from "./mechanics/dialogue.js?r=w3";
export { MetroidvaniaScene } from "./mechanics/metroidvania.js?r=w3";
export { VisualNovelScene } from "./mechanics/visual-novel.js?r=w3";
export { RhythmScene } from "./mechanics/rhythm.js?r=w3";
export { TowerDefenseScene } from "./mechanics/tower-defense.js?r=w3";
export { RacingScene } from "./mechanics/racing.js?r=w3";
export { CardBattleScene } from "./mechanics/card-battle.js?r=w3";
export { StealthScene } from "./mechanics/stealth.js?r=w3";
export { CookingScene } from "./mechanics/cooking.js?r=w3";
export { RunnerScene } from "./mechanics/runner.js?r=w3";
export { InventoryScene } from "./mechanics/inventory.js?r=w3";
export { BrawlerScene } from "./mechanics/brawler.js?r=w3";
export { ChartDumpScene } from "./mechanics/chart-dump.js?r=w3";
export { ChartTilesScene } from "./mechanics/chart-tiles.js?r=w3";
export { ChartReviewScene } from "./mechanics/chart-review.js?r=w3";

import { BootScene } from "./scenes/BootScene.js?r=w3";
import { HubScene } from "./scenes/HubScene.js?r=w3";
import { TitleScene } from "./scenes/TitleScene.js?r=w3";
import { SelectScene } from "./scenes/SelectScene.js?r=w3";
import { OverworldScene } from "./mechanics/overworld.js?r=w3";
import { PlatformerScene } from "./mechanics/platformer.js?r=w3";
import { BattleScene } from "./mechanics/party-battle.js?r=w3";
import { BrickScene } from "./mechanics/brick-build.js?r=w3";
import { Match3Scene } from "./mechanics/match3.js?r=w3";
import { RecallScene } from "./mechanics/recall-scene.js?r=w3";
import { WardrobeScene } from "./mechanics/wardrobe.js?r=w3";
import { DialogueScene } from "./mechanics/dialogue.js?r=w3";
import { MetroidvaniaScene } from "./mechanics/metroidvania.js?r=w3";
import { VisualNovelScene } from "./mechanics/visual-novel.js?r=w3";
import { RhythmScene } from "./mechanics/rhythm.js?r=w3";
import { TowerDefenseScene } from "./mechanics/tower-defense.js?r=w3";
import { RacingScene } from "./mechanics/racing.js?r=w3";
import { CardBattleScene } from "./mechanics/card-battle.js?r=w3";
import { StealthScene } from "./mechanics/stealth.js?r=w3";
import { CookingScene } from "./mechanics/cooking.js?r=w3";
import { RunnerScene } from "./mechanics/runner.js?r=w3";
import { InventoryScene } from "./mechanics/inventory.js?r=w3";
import { BrawlerScene } from "./mechanics/brawler.js?r=w3";
import { ChartDumpScene } from "./mechanics/chart-dump.js?r=w3";
import { ChartTilesScene } from "./mechanics/chart-tiles.js?r=w3";
import { ChartReviewScene } from "./mechanics/chart-review.js?r=w3";

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
