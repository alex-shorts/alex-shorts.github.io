/** Keyboard + pointer + gamepad. Modes: topdown, platform, grid, menu. */

export function makeControls(scene) {
  const k = scene.input.keyboard.addKeys(
    "W,A,S,D,T,R,P,UP,DOWN,LEFT,RIGHT,SPACE,ENTER,E,Z,X,C,ESC,ONE,TWO,THREE,FOUR,FIVE,SIX,SEVEN,EIGHT,F,J,K",
    false,
  );
  const touch = { x: 0, y: 0, jump: false, action: false, cancel: false };
  return {
    k,
    touch,
    vector() {
      let x = touch.x;
      let y = touch.y;
      if (k.A.isDown || k.LEFT.isDown) x -= 1;
      if (k.D.isDown || k.RIGHT.isDown) x += 1;
      if (k.W.isDown || k.UP.isDown) y -= 1;
      if (k.S.isDown || k.DOWN.isDown) y += 1;
      const pad = scene.input.gamepad?.pad1;
      if (pad) {
        x += Math.abs(pad.leftStick.x) > 0.25 ? Math.sign(pad.leftStick.x) : 0;
        y += Math.abs(pad.leftStick.y) > 0.25 ? Math.sign(pad.leftStick.y) : 0;
        if (pad.left) x -= 1;
        if (pad.right) x += 1;
        if (pad.up) y -= 1;
        if (pad.down) y += 1;
      }
      return { x: Math.max(-1, Math.min(1, x)), y: Math.max(-1, Math.min(1, y)) };
    },
    jump() {
      const t = touch.jump;
      touch.jump = false;
      return t || Phaser.Input.Keyboard.JustDown(k.SPACE) || Phaser.Input.Keyboard.JustDown(k.Z);
    },
    action() {
      const t = touch.action;
      touch.action = false;
      return t || Phaser.Input.Keyboard.JustDown(k.E) || Phaser.Input.Keyboard.JustDown(k.X) || Phaser.Input.Keyboard.JustDown(k.ENTER);
    },
    cancel() {
      const t = touch.cancel;
      touch.cancel = false;
      return t || Phaser.Input.Keyboard.JustDown(k.ESC) || Phaser.Input.Keyboard.JustDown(k.C);
    },
    digit(n) {
      const keys = [k.ONE, k.TWO, k.THREE, k.FOUR, k.FIVE, k.SIX, k.SEVEN, k.EIGHT];
      return keys[n - 1] && Phaser.Input.Keyboard.JustDown(keys[n - 1]);
    },
  };
}

/** Phaser capture eats WASD/Z/X while a DOM field is focused. */
export function clearStuckKeys(scene) {
  Object.values(scene.ctrl?.k || {}).forEach((key) => {
    if (!key || typeof key !== "object") return;
    if (typeof key.reset === "function") key.reset();
    else {
      key.isDown = false;
      key.isUp = true;
    }
  });
  if (scene.hero?.body) scene.hero.setVelocity(0, 0);
}

export function setFightKeys(scene, on) {
  const kb = scene.input?.keyboard;
  if (kb) kb.enabled = on;
  Object.values(scene.ctrl?.k || {}).forEach((key) => {
    if (!key || typeof key !== "object") return;
    key.enabled = on;
    if ("preventDefault" in key) key.preventDefault = on;
  });
  if (on) clearStuckKeys(scene);
}

export function driveTopDown(sprite, vec, speed) {
  sprite.setVelocity(vec.x * speed, vec.y * speed);
  if (vec.x || vec.y) sprite.dir = vec.x ? (vec.x > 0 ? "right" : "left") : vec.y > 0 ? "down" : "up";
}

export function drivePlatform(sprite, vec, speed, jumpVy, grounded) {
  sprite.setVelocityX(vec.x * speed);
  if (grounded && arguments[3] !== undefined) {
    /* jump handled by caller */
  }
}
