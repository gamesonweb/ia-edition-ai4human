import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera'
import { Vector3 } from '@babylonjs/core/Maths/math.vector'
import { GAME_CONFIG } from '../config/gameConfig.js'

export function setupCamera(scene, canvas) {
  const cfg = GAME_CONFIG.CAMERA
  const camera = new ArcRotateCamera(
    'camera',
    cfg.INITIAL.ALPHA,
    cfg.INITIAL.BETA,
    cfg.INITIAL.RADIUS,
    new Vector3(0, cfg.FOLLOW.HEIGHT_OFFSET, 0),
    scene
  )

  camera.lowerBetaLimit      = cfg.LIMITS.BETA.LOWER
  camera.upperBetaLimit      = cfg.LIMITS.BETA.UPPER
  camera.lowerRadiusLimit    = cfg.LIMITS.RADIUS.LOWER
  camera.upperRadiusLimit    = cfg.LIMITS.RADIUS.UPPER
  camera.minZ = 0.1
  camera.maxZ = 500

  // Pas d'attachControl : la souris est gérée manuellement via pointer lock dans controls.js
  return camera
}
