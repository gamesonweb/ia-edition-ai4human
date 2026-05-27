import { Vector3 } from '@babylonjs/core/Maths/math.vector';

export const TARGET_FPS = 60;
export const GRAVITY    = 0.15;

export const MAP_BASE_PATH = '/map/';
export const MAP_PARTS = [
  'mapAJ1.glb',
  'mapAJ2.glb',
  'mapAJ3.glb',
  'mapAJ4.glb',
  'mapAJ5.glb',
  'mapAJ6.glb',
];

export const MOTO = {
  SCALE:          2.0,
  VISUAL_OFFSET:  Math.PI * 2.5,
  SPEED_MAX:      1.3,
  SPEED_MAX_BWD:  0.3,
  ACCEL:          0.002,
  FRICTION:       0.993,
  TURN_SPEED:     0.045,
  ELLIPSOID:      new Vector3(1.0, 1.2, 1.8),
  ELLIPSOID_OFF:  new Vector3(0, 0, 0),
  SPAWN:          new Vector3(-29.53, 1.34, 115.73),
  MIN_HEIGHT:     -200,
};

export const CAM = {
  DIST:         16,
  HEIGHT:       6,
  LOOK_AHEAD:   5,
  LOOK_HEIGHT:  1.2,
  LERP_POS:     0.08,
  LERP_TARGET:  0.15,
};

export const RACE = {
  LAPS: 5,
  CHECKPOINT_RADIUS: 9,
  COUNTDOWN_MS: 5500,
  CHECKPOINTS: [
    new Vector3(-29.53, 1.34,  115.73), // 0 — start / finish
    new Vector3(  4.12, 1.21,   60.78), // 1
    new Vector3(-191.18, 1.21, 200.23), // 2
    new Vector3(-24.63, 1.21,  -15.51), // 3
    new Vector3(-36.52, 1.21,  282.18), // 4
    new Vector3( 83.91, 1.21,  234.74), // 5
    new Vector3( 46.73, 1.21,  186.74), // 6
    new Vector3(-188.14, 1.21,   6.32), // 7
  ],
};

export const AI_PROFILES = [
  { label: 'FACILE',    speedMult: 0.70, speedMax: 0.80, turnSpeed: 0.040, spawnOffset: new Vector3( 4, 0,  6) },
  { label: 'MOYEN',     speedMult: 0.90, speedMax: 1.10, turnSpeed: 0.055, spawnOffset: new Vector3( 0, 0, 10) },
  { label: 'DIFFICILE', speedMult: 1.15, speedMax: 1.50, turnSpeed: 0.075, spawnOffset: new Vector3(-4, 0, 14) },
];

export const AI_ROUTE         = [7, 6, 5, 4, 3, 2, 1, 0];
export const PATH_STORAGE_KEY = 'tron_idealpath_v1';
export const AI_SCALE         = 1.0;
export const AI_VISUAL_OFFSET = MOTO.VISUAL_OFFSET + Math.PI / 2 + Math.PI;
