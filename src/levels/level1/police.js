import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader'
import { Vector3 }     from '@babylonjs/core/Maths/math.vector'

const POLICE_BASE = '/level/level1/'
const POLICE_FILE = 'police2.glb'

const PATHS = [
  {
    start: { x:  83.95, y: 0.14, z: 309.83 },
    end:   { x:  86.45, y: 0.14, z: 379.75 },
  },
  {
    start: { x: -53.80, y: 0.14, z: 313.80 },
    end:   { x: -56.21, y: 0.14, z: 382.49 },
  },
]

const SPEED = 30.0  // unités / seconde
const SCALE = 2

// ----- Champ de vision -----
const FOV_ANGLE_DEG  = 60   // ouverture totale du cône
const FOV_RANGE      = 50 // portée en unités
const DAMAGE_PER_SEC = 100  // dégâts si le joueur reste dans le cône
const FOV_COS_HALF   = Math.cos((FOV_ANGLE_DEG * Math.PI / 180) / 2)

class PolicePatrol {
  constructor(root, pointA, pointB, speed) {
    this.root   = root
    this.pointA = pointA.clone()
    this.pointB = pointB.clone()
    this.speed  = speed
    this.dir    = 1
    this.root.position.copyFrom(pointA)
    this._applyRotation()
  }

  update(dt) {
    const target = this.dir > 0 ? this.pointB : this.pointA
    const dx     = target.x - this.root.position.x
    const dz     = target.z - this.root.position.z
    const dist   = Math.sqrt(dx * dx + dz * dz)
    const step   = this.speed * dt

    if (dist <= step) {
      this.root.position.x = target.x
      this.root.position.z = target.z
      this.dir *= -1
      this._applyRotation()
    } else {
      this.root.position.x += (dx / dist) * step
      this.root.position.z += (dz / dist) * step
    }
  }

  _applyRotation() {
    const from = this.dir > 0 ? this.pointA : this.pointB
    const to   = this.dir > 0 ? this.pointB : this.pointA
    this.root.rotation.y = Math.atan2(to.x - from.x, to.z - from.z)
  }

  /**
   * Test cône de vision (XZ uniquement).
   * @param {Vector3} playerPos
   */
  canSee(playerPos) {
    const dx = playerPos.x - this.root.position.x
    const dz = playerPos.z - this.root.position.z
    const dist2 = dx * dx + dz * dz
    if (dist2 < 0.0001 || dist2 > FOV_RANGE * FOV_RANGE) return false

    const dist = Math.sqrt(dist2)
    const toX  = dx / dist
    const toZ  = dz / dist

    // Direction "avant" dérivée de root.rotation.y (cohérente avec atan2 ci-dessus)
    const fwdX = Math.sin(this.root.rotation.y)
    const fwdZ = Math.cos(this.root.rotation.y)

    const dot = fwdX * toX + fwdZ * toZ
    return dot >= FOV_COS_HALF
  }
}

async function spawnPolice(scene, path, index) {
  const result = await SceneLoader.ImportMeshAsync(null, POLICE_BASE, POLICE_FILE, scene)

  const root = result.meshes.find(m => m.name === '__root__') ?? result.meshes[0]
  if (!root) return null

  root.name = `police_${index}`
  root.rotationQuaternion = null
  root.scaling.setAll(SCALE)

  for (const m of result.meshes) {
    m.checkCollisions = false
    m.isPickable      = false
  }

  if (result.animationGroups?.length) {
    result.animationGroups.forEach(ag => ag.stop())
    result.animationGroups[0].play(true)
  }

  return new PolicePatrol(
    root,
    new Vector3(path.start.x, path.start.y, path.start.z),
    new Vector3(path.end.x,   path.end.y,   path.end.z),
    SPEED,
  )
}

/**
 * Charge la police du level 1. Le système :
 * - n'est actif que si `scene.metadata.currentLevel === 1`
 * - cache les meshes quand on quitte le level 1
 * - inflige `DAMAGE_PER_SEC` au joueur s'il entre dans le cône d'un policier
 *
 * @param {import('@babylonjs/core').Scene} scene
 * @param {{ getHero?: () => any, damage?: (amount: number) => void }} [opts]
 */
export async function setupPolice(scene, { getHero, damage, setAlert } = {}) {
  const results = await Promise.all(PATHS.map((p, i) => spawnPolice(scene, p, i)))
  const patrols = results.filter(Boolean)

  let lastActive = null

  scene.onBeforeRenderObservable.add(() => {
    const isLevel1 = scene.metadata?.currentLevel === 1

    // Bascule visibilité quand le level change
    if (isLevel1 !== lastActive) {
      for (const p of patrols) p.root.setEnabled(isLevel1)
      lastActive = isLevel1
    }

    if (!isLevel1) return
    if (scene.metadata?.paused) return

    const dt   = scene.getEngine().getDeltaTime() / 1000
    const hero = getHero?.()
    const heroPos = hero?.position ?? null

    let spotted = false
    for (const p of patrols) {
      p.update(dt)
      if (!spotted && heroPos && p.canSee(heroPos)) spotted = true
    }

    if (spotted && damage) damage(DAMAGE_PER_SEC * dt)
    setAlert?.(spotted)
  })

  return patrols
}
