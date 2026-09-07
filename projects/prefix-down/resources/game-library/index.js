export { PHASER_CDN, PHASER_VERSION, asset } from "./paths.js?r=w8";
export { THEMES, SKINS, ARCHETYPES } from "./look/palettes.js?r=w8";
export { FONTS, textStyle } from "./look/type.js?r=w8";
export { GENRES, PACKS } from "./catalog.js?r=w8";
export { gameConfig } from "./phaser/config.js?r=w8";
export { preloadLibrary, bootLibrary, demoItems, metricItems } from "./phaser/preload.js?r=w8";
export { makeControls } from "./input/controls.js?r=w8";
export { sfx } from "./audio/sfx.js?r=w8";
export { fadeTo, flash, shake, sparkBurst } from "./motion/transitions.js?r=w8";
export { KENNEY_HEROES, registerAnims } from "./motion/anims.js?r=w8";
export { openRecall } from "./mechanics/recall.js?r=w8";

export { BootScene } from "./scenes/BootScene.js?r=w8";
export { HubScene } from "./scenes/HubScene.js?r=w8";
export { TitleScene } from "./scenes/TitleScene.js?r=w8";
export { SelectScene } from "./scenes/SelectScene.js?r=w8";
export { OverworldScene } from "./mechanics/overworld.js?r=w8";
export { PlatformerScene } from "./mechanics/platformer.js?r=w8";
export { BattleScene } from "./mechanics/party-battle.js?r=w8";
export { BrickScene } from "./mechanics/brick-build.js?r=w8";
export { Match3Scene } from "./mechanics/match3.js?r=w8";
export { RecallScene } from "./mechanics/recall-scene.js?r=w8";
export { WardrobeScene } from "./mechanics/wardrobe.js?r=w8";
export { DialogueScene } from "./mechanics/dialogue.js?r=w8";
export { MetroidvaniaScene } from "./mechanics/metroidvania.js?r=w8";
export { VisualNovelScene } from "./mechanics/visual-novel.js?r=w8";
export { RhythmScene } from "./mechanics/rhythm.js?r=w8";
export { TowerDefenseScene } from "./mechanics/tower-defense.js?r=w8";
export { RacingScene } from "./mechanics/racing.js?r=w8";
export { CardBattleScene } from "./mechanics/card-battle.js?r=w8";
export { StealthScene } from "./mechanics/stealth.js?r=w8";
export { CookingScene } from "./mechanics/cooking.js?r=w8";
export { RunnerScene } from "./mechanics/runner.js?r=w8";
export { InventoryScene } from "./mechanics/inventory.js?r=w8";
export { BrawlerScene } from "./mechanics/brawler.js?r=w8";
export { ChartDumpScene } from "./mechanics/chart-dump.js?r=w8";
export { ChartTilesScene } from "./mechanics/chart-tiles.js?r=w8";
export { ChartReviewScene } from "./mechanics/chart-review.js?r=w8";

import { BootScene } from "./scenes/BootScene.js?r=w8";
import { HubScene } from "./scenes/HubScene.js?r=w8";
import { TitleScene } from "./scenes/TitleScene.js?r=w8";
import { SelectScene } from "./scenes/SelectScene.js?r=w8";
import { OverworldScene } from "./mechanics/overworld.js?r=w8";
import { PlatformerScene } from "./mechanics/platformer.js?r=w8";
import { BattleScene } from "./mechanics/party-battle.js?r=w8";
import { BrickScene } from "./mechanics/brick-build.js?r=w8";
import { Match3Scene } from "./mechanics/match3.js?r=w8";
import { RecallScene } from "./mechanics/recall-scene.js?r=w8";
import { WardrobeScene } from "./mechanics/wardrobe.js?r=w8";
import { DialogueScene } from "./mechanics/dialogue.js?r=w8";
import { MetroidvaniaScene } from "./mechanics/metroidvania.js?r=w8";
import { VisualNovelScene } from "./mechanics/visual-novel.js?r=w8";
import { RhythmScene } from "./mechanics/rhythm.js?r=w8";
import { TowerDefenseScene } from "./mechanics/tower-defense.js?r=w8";
import { RacingScene } from "./mechanics/racing.js?r=w8";
import { CardBattleScene } from "./mechanics/card-battle.js?r=w8";
import { StealthScene } from "./mechanics/stealth.js?r=w8";
import { CookingScene } from "./mechanics/cooking.js?r=w8";
import { RunnerScene } from "./mechanics/runner.js?r=w8";
import { InventoryScene } from "./mechanics/inventory.js?r=w8";
import { BrawlerScene } from "./mechanics/brawler.js?r=w8";
import { ChartDumpScene } from "./mechanics/chart-dump.js?r=w8";
import { ChartTilesScene } from "./mechanics/chart-tiles.js?r=w8";
import { ChartReviewScene } from "./mechanics/chart-review.js?r=w8";

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
