export const GAME_CONFIG = {
  HERO: {
    SCALE: 0.5,
    SPEED: 0.35,
    SPEED_BACKWARDS: 0.25,
    SPEED_STRAFE: 0.25,
    ELLIPSOID:        { x: 0.5, y: 0.9, z: 0.5 },
    ELLIPSOID_OFFSET: { x: 0,   y: 0.9, z: 0   },
    MIN_HEIGHT: 0,
    MAX_HEIGHT: 3
  },
  CAMERA: {
    INITIAL: {
      ALPHA:  Math.PI / 2,
      BETA:   Math.PI / 3,
      RADIUS: 10
    },
    LIMITS: {
      BETA:   { LOWER: 0.3,  UPPER: 1.75 },
      RADIUS: { LOWER: 3,    UPPER: 20   }
    },
    SENSITIVITY: { ANGULAR_X: 2000, ANGULAR_Y: 2000 },
    FOLLOW: {
      TARGET_LERP:   0.15,
      HEIGHT_OFFSET: 6
    }
  },
  ANIMATIONS: {
    BLENDING_SPEED: 0.05
  },
  KEYBOARD: {
    LAYOUT: 'AZERTY',
    CONTROLS: {
      AZERTY: { FORWARD: 'z', BACKWARD: 's', LEFT: 'q', RIGHT: 'd' },
      QWERTY: { FORWARD: 'w', BACKWARD: 's', LEFT: 'a', RIGHT: 'd' }
    },
    ARROWS: {
      FORWARD: 'arrowup', BACKWARD: 'arrowdown',
      LEFT: 'arrowleft', RIGHT: 'arrowright'
    }
  }
}
