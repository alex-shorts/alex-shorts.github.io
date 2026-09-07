export { PHASER_CDN, PHASER_VERSION, asset } from "./paths.js?r=w7";
export { THEMES, SKINS, ARCHETYPES } from "./look/palettes.js?r=w7";
export { FONTS, textStyle } from "./look/type.js?r=w7";
export { GENRES, PACKS } from "./catalog.js?r=w7";
export { gameConfig } from "./phaser/config.js?r=w7";
export { preloadLibrary, bootLibrary, demoItems, metricItems } from "./phaser/preload.js?r=w7";
export { makeControls } from "./input/controls.js?r=w7";
export { sfx } from "./audio/sfx.js?r=w7";
export { fadeTo, flash, shake, sparkBurst } from "./motion/transitions.js?r=w7";
export { KENNEY_HEROES, registerAnims } from "./motion/anims.js?r=w7";
export { openRecall } from "./mechanics/recall.js?r=w7";

export { BootScene } from "./scenes/BootScene.js?r=w7";
export { HubScene } from "./scenes/HubScene.js?r=w7";
export { TitleScene } from "./scenes/TitleScene.js?r=w7";
export { SelectScene } from "./scenes/SelectScene.js?r=w7";
export { OverworldScene } from "./mechanics/overworld.js?r=w7";
export { PlatformerScene } from "./mechanics/platformer.js?r=w7";
export { BattleScene } from "./mechanics/party-battle.js?r=w7";
export { BrickScene } from "./mechanics/brick-build.js?r=w7";
export { Match3Scene } from "./mechanics/match3.js?r=w7";
export { RecallScene } from "./mechanics/recall-scene.js?r=w7";
export { WardrobeScene } from "./mechanics/wardrobe.js?r=w7";
export { DialogueScene } from "./mechanics/dialogue.js?r=w7";
export { MetroidvaniaScene } from "./mechanics/metroidvania.js?r=w7";
export { VisualNovelScene } from "./mechanics/visual-novel.js?r=w7";
export { RhythmScene } from "./mechanics/rhythm.js?r=w7";
export { TowerDefenseScene } from "./mechanics/tower-defense.js?r=w7";
export { RacingScene } from "./mechanics/racing.js?r=w7";
export { CardBattleScene } from "./mechanics/card-battle.js?r=w7";
export { StealthScene } from "./mechanics/stealth.js?r=w7";
export { CookingScene } from "./mechanics/cooking.js?r=w7";
export { RunnerScene } from "./mechanics/runner.js?r=w7";
export { InventoryScene } from "./mechanics/inventory.js?r=w7";
export { BrawlerScene } from "./mechanics/brawler.js?r=w7";
export { ChartDumpScene } from "./mechanics/chart-dump.js?r=w7";
export { ChartTilesScene } from "./mechanics/chart-tiles.js?r=w7";
export { ChartReviewScene } from "./mechanics/chart-review.js?r=w7";

import { BootScene } from "./scenes/BootScene.js?r=w7";
import { HubScene } from "./scenes/HubScene.js?r=w7";
import { TitleScene } from "./scenes/TitleScene.js?r=w7";
import { SelectScene } from "./scenes/SelectScene.js?r=w7";
import { OverworldScene } from "./mechanics/overworld.js?r=w7";
import { PlatformerScene } from "./mechanics/platformer.js?r=w7";
import { BattleScene } from "./mechanics/party-battle.js?r=w7";
import { BrickScene } from "./mechanics/brick-build.js?r=w7";
import { Match3Scene } from "./mechanics/match3.js?r=w7";
import { RecallScene } from "./mechanics/recall-scene.js?r=w7";
import { WardrobeScene } from "./mechanics/wardrobe.js?r=w7";
import { DialogueScene } from "./mechanics/dialogue.js?r=w7";
import { MetroidvaniaScene } from "./mechanics/metroidvania.js?r=w7";
import { VisualNovelScene } from "./mechanics/visual-novel.js?r=w7";
import { RhythmScene } from "./mechanics/rhythm.js?r=w7";
import { TowerDefenseScene } from "./mechanics/tower-defense.js?r=w7";
import { RacingScene } from "./mechanics/racing.js?r=w7";
import { CardBattleScene } from "./mechanics/card-battle.js?r=w7";
import { StealthScene } from "./mechanics/stealth.js?r=w7";
import { CookingScene } from "./mechanics/cooking.js?r=w7";
import { RunnerScene } from "./mechanics/runner.js?r=w7";
import { InventoryScene } from "./mechanics/inventory.js?r=w7";
import { BrawlerScene } from "./mechanics/brawler.js?r=w7";
import { ChartDumpScene } from "./mechanics/chart-dump.js?r=w7";
import { ChartTilesScene } from "./mechanics/chart-tiles.js?r=w7";
import { ChartReviewScene } from "./mechanics/chart-review.js?r=w7";

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
