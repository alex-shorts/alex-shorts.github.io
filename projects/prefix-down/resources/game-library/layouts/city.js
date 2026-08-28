/** Streets of Fight night street. Native stage 240px tall, scaled to fill 1440. */
export const STAGE_SCALE = 6;
export const STAGE_NATIVE_H = 240;
export const STREET_NATIVE_W = 1920;

export function paintRoad(scene, worldW) {
  const W = scene.scale.width;
  const H = scene.scale.height;
  const S = STAGE_SCALE;
  const span = Math.max(worldW || W, W);
  scene.cameras.main.setBackgroundColor(0x000010);

  const bw = 96 * S;
  for (let x = -bw; x < span + bw; x += bw) {
    scene.add.image(x, 0, "sof-back").setOrigin(0, 0).setScale(S).setScrollFactor(0.12).setDepth(-8);
  }

  const sw = STREET_NATIVE_W * S;
  for (let x = 0; x < span + sw; x += sw) {
    scene.add.image(x, 0, "sof-street").setOrigin(0, 0).setScale(S).setScrollFactor(1).setDepth(-4);
  }

  const feet = 208 * S;
  for (let x = 1100; x < span; x += 980) {
    scene.add.image(x, feet, "sof-hydrant").setOrigin(0.5, 1).setScale(S).setDepth(-1);
  }
  for (let x = 1680; x < span; x += 1400) {
    scene.add.image(x, feet, "sof-barrel").setOrigin(0.5, 1).setScale(S).setDepth(-1);
  }

  for (let x = 180; x < span; x += 720) {
    scene.add.image(x, H - 8, "sof-lamp").setOrigin(0.45, 1).setScale(S).setDepth(40);
  }
  for (let x = 40; x < span; x += 860) {
    scene.add.image(x, H + 6, "sof-bush").setOrigin(0.5, 1).setScale(S).setDepth(1600);
  }

  scene.add.rectangle(0, 0, W, 56, 0x040208, 0.35).setOrigin(0).setScrollFactor(0).setDepth(180);
}

export function paintCity(scene, worldW) {
  paintRoad(scene, worldW);
}
