import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader'
import { Vector3 }     from '@babylonjs/core/Maths/math.vector'

// Distance au-delà de laquelle on gèle le déplacement (économie CPU)
const CULL_DISTANCE = 300

// Cache : un template désactivé par fichier GLB — chargé une seule fois
const templateCache = new Map()

// ─── Patrouilleur ──────────────────────────────────────────────────────────

class PatrolPNJ {
  /**
   * @param {import('@babylonjs/core').TransformNode} root
   * @param {Vector3} pointA
   * @param {Vector3} pointB
   * @param {number}  speed       — unités / seconde
   * @param {number}  startRatio  — 0 = démarre en A, 1 = démarre en B
   */
  constructor(root, pointA, pointB, speed, startRatio = 0) {
    this.root   = root
    this.pointA = pointA.clone()
    this.pointB = pointB.clone()
    this.speed  = speed
    this.dir    = 1  // 1 = vers B, -1 = vers A

    // Position initiale interpolée
    const r = Math.max(0, Math.min(1, startRatio))
    this.root.position = Vector3.Lerp(pointA, pointB, r)

    this._applyRotation()
  }

  update(dt, playerPos = null) {
    if (playerPos) {
      const dx = this.root.position.x - playerPos.x
      const dz = this.root.position.z - playerPos.z
      if (dx * dx + dz * dz > CULL_DISTANCE * CULL_DISTANCE) return
    }

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
}

// ─── Registre global ───────────────────────────────────────────────────────

const pnjs = []

// ─── Chargement du template (une seule fois par fichier) ───────────────────

async function getOrLoadTemplate(scene, basePath, file) {
  const key = basePath + file
  if (templateCache.has(key)) return templateCache.get(key)

  const result = await SceneLoader.ImportMeshAsync(null, basePath, file, scene)
  const root   = result.meshes[0]

  root.rotationQuaternion = null
  for (const mesh of result.meshes) {
    mesh.checkCollisions = false
    mesh.isPickable      = false
  }

  // Cacher avec isVisible=false et non setEnabled(false) :
  // InstancedMesh.isEnabled() vérifie le sourceMesh → setEnabled bloquerait les instances.
  for (const mesh of result.meshes) mesh.isVisible = false
  templateCache.set(key, root)
  return root
}

// ─── API publique ──────────────────────────────────────────────────────────

/**
 * Spawn d'une flotte de PNJ à partir d'un seul GLB chargé une fois.
 *
 * @param {import('@babylonjs/core').Scene} scene
 * @param {{
 *   file:     string,
 *   basePath?: string,
 *   scale?:   number,
 *   cars: Array<{
 *     pointA:      { x: number, y: number, z: number },
 *     pointB:      { x: number, y: number, z: number },
 *     speed?:      number,
 *     startRatio?: number,   // 0‥1, position initiale sur le trajet
 *   }>
 * }} opts
 */
export async function spawnPNJFleet(scene, opts) {
  const {
    file,
    basePath = '/pnj/',
    scale    = 1,
    cars     = [],
  } = opts

  const template = await getOrLoadTemplate(scene, basePath, file)

  for (const cfg of cars) {
    // instantiateHierarchy crée des InstancedMesh → draw call partagé
    const instanceRoot = template.instantiateHierarchy(null, { doNotInstantiate: false })
    instanceRoot.setEnabled(true)
    instanceRoot.scaling.setAll(scale)
    instanceRoot.rotationQuaternion = null

    const pA = new Vector3(cfg.pointA.x, cfg.pointA.y, cfg.pointA.z)
    const pB = new Vector3(cfg.pointB.x, cfg.pointB.y, cfg.pointB.z)

    const patrol = new PatrolPNJ(
      instanceRoot,
      pA, pB,
      cfg.speed      ?? 15,
      cfg.startRatio ?? 0
    )
    pnjs.push(patrol)
  }
}

/**
 * Branche la boucle de mise à jour de tous les PNJ.
 * À appeler une seule fois.
 *
 * @param {import('@babylonjs/core').Scene} scene
 * @param {() => Vector3 | null} getPlayerPos
 */
export function attachPNJLoop(scene, getPlayerPos) {
  scene.onBeforeRenderObservable.add(() => {
    if (pnjs.length === 0) return
    const dt        = scene.getEngine().getDeltaTime() / 1000
    const playerPos = getPlayerPos()
    for (const pnj of pnjs) pnj.update(dt, playerPos)
  })
}
