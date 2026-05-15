import { SceneLoader }        from '@babylonjs/core/Loading/sceneLoader'
import { MeshBuilder }        from '@babylonjs/core/Meshes/meshBuilder'
import { StandardMaterial }   from '@babylonjs/core/Materials/standardMaterial'
import { Color3 }             from '@babylonjs/core/Maths/math.color'

const PICKUP_RADIUS = 3.5  // unités

/**
 * Charge un GLB une seule fois et le clone aux positions données.
 * Détecte la proximité du joueur pour déclencher les ramassages.
 *
 * @param {import('@babylonjs/core').Scene} scene
 * @param {{
 *   basePath: string,
 *   file: string,
 *   positions: Array<{ x: number, y: number, z: number }>,
 *   scale?: number,
 *   spinSpeed?: number,
 *   name?: string,
 *   getHero: () => any,
 *   onPickup?: (index: number, count: number, total: number) => void,
 *   onAllCollected?: () => void,
 * }} opts
 */
export async function spawnCollectibles(scene, opts) {
  const {
    basePath, file, positions,
    scale     = 1.5,
    spinSpeed = 1.2,
    name      = 'collectible',
    getHero,
    onPickup,
    onAllCollected,
  } = opts

  const result = await SceneLoader.ImportMeshAsync(null, basePath, file, scene)
  result.animationGroups?.forEach(ag => ag.stop())

  const root = result.meshes.find(m => m.name === '__root__') ?? result.meshes[0]
  if (!root) return null

  for (const m of result.meshes) {
    m.checkCollisions = false
    m.isPickable      = false
  }

  root.name = `${name}_0`
  root.rotationQuaternion = null
  root.scaling.setAll(scale)
  root.position.set(positions[0].x, positions[0].y, positions[0].z)

  const items = [{ root, collected: false, index: 0 }]

  for (let i = 1; i < positions.length; i++) {
    const clone = root.clone(`${name}_${i}`, null)
    if (!clone) continue
    clone.position.set(positions[i].x, positions[i].y, positions[i].z)
    items.push({ root: clone, collected: false, index: i })
  }

  // ----- Tube transparent autour de chaque pickup (option) -----
  if (opts.tube) {
    const tubeOpts = opts.tube
    const tubeColor  = Color3.FromHexString(tubeOpts.color ?? '#FF8C00')
    const tubeHeight = tubeOpts.height ?? 4
    const tubeDiam   = tubeOpts.diameter ?? 2
    const tubeAlpha  = tubeOpts.alpha ?? 0.35

    const mat = new StandardMaterial(`${name}-tube-mat`, scene)
    mat.diffuseColor    = tubeColor
    mat.emissiveColor   = tubeColor.scale(0.6)
    mat.specularColor   = new Color3(0, 0, 0)
    mat.alpha           = tubeAlpha
    mat.backFaceCulling = false

    items.forEach((item, i) => {
      const tube = MeshBuilder.CreateCylinder(`${name}_tube_${i}`, {
        diameter:     tubeDiam,
        height:       tubeHeight,
        tessellation: 24,
      }, scene)
      tube.position.set(
        positions[i].x,
        positions[i].y + tubeHeight / 2,
        positions[i].z,
      )
      tube.material        = mat
      tube.isPickable      = false
      tube.checkCollisions = false
      item.tube = tube
    })
  }

  let collectedCount = 0
  let allDone = false

  const observer = scene.onBeforeRenderObservable.add(() => {
    if (allDone) return
    if (scene.metadata?.paused) return
    if (scene.metadata?.dead)   return

    const dt = scene.getEngine().getDeltaTime() / 1000

    for (const item of items) {
      if (!item.collected) item.root.rotation.y += dt * spinSpeed
    }

    const hero = getHero?.()
    if (!hero) return
    const heroPos = hero.position

    for (const item of items) {
      if (item.collected) continue
      const dx = heroPos.x - item.root.position.x
      const dz = heroPos.z - item.root.position.z
      if (dx * dx + dz * dz < PICKUP_RADIUS * PICKUP_RADIUS) {
        item.collected = true
        item.root.setEnabled(false)
        if (item.tube) item.tube.setEnabled(false)
        collectedCount++
        onPickup?.(item.index, collectedCount, items.length)
        if (collectedCount === items.length) {
          allDone = true
          onAllCollected?.()
        }
      }
    }
  })

  return {
    items,
    getCollectedCount: () => collectedCount,
    getTotal: () => items.length,
    dispose: () => {
      scene.onBeforeRenderObservable.remove(observer)
      for (const item of items) {
        item.root.dispose()
        item.tube?.dispose()
      }
    },
  }
}
