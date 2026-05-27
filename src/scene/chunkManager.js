import { Vector3 } from '@babylonjs/core/Maths/math.vector'

const chunks = []
const ACTIVE_COUNT       = 3    // chunks principaux rendus
const PRELOAD_COUNT      = 2    // chunks pré-rendus en avance (seul le rang 5 est caché)
const UPDATE_INTERVAL_MS = 200

let lastUpdate = 0

/**
 * Enregistre un chunk avec ses meshes actifs et son centre monde.
 * @param {string} name
 * @param {import('@babylonjs/core').AbstractMesh[]} meshes
 * @param {import('@babylonjs/core').Vector3} center
 */
export function registerMapChunk(name, meshes, center) {
  if (!meshes || meshes.length === 0) {
    console.warn('[chunks] aucun mesh pour', name)
    return
  }
  chunks.push({ name, meshes, center: center.clone(), enabled: true })
}

/**
 * Garde les ACTIVE_COUNT chunks les plus proches rendus, cache les autres via isVisible.
 * On évite setEnabled pour ne pas déclencher de spike GPU au swap.
 * @param {import('@babylonjs/core').Vector3} playerPosition
 * @param {boolean} [force]
 */
export function updateMapChunks(playerPosition, force = false) {
  const now = performance.now()
  if (!force && now - lastUpdate < UPDATE_INTERVAL_MS) return
  lastUpdate = now

  if (chunks.length === 0) return

  const sorted = chunks
    .map(c => ({ chunk: c, dist: Vector3.Distance(playerPosition, c.center) }))
    .sort((a, b) => a.dist - b.dist)

  for (let i = 0; i < sorted.length; i++) {
    const { chunk } = sorted[i]
    // Rangs 0 à ACTIVE_COUNT-1 : actifs
    // Rang ACTIVE_COUNT (le suivant) : pré-rendu pour éviter le spike au swap
    // Au-delà : cachés
    const shouldShow = i < ACTIVE_COUNT + PRELOAD_COUNT
    if (shouldShow === chunk.enabled) continue

    chunk.enabled = shouldShow
    for (const mesh of chunk.meshes) {
      mesh.isVisible = shouldShow
      if (!mesh.metadata) mesh.metadata = {}
      mesh.metadata.chunkHidden = !shouldShow
    }
  }
}

/**
 * @param {import('@babylonjs/core').Scene} scene
 * @param {() => import('@babylonjs/core').Vector3 | null} getPlayerPosition
 */
export function attachChunkLoop(scene, getPlayerPosition) {
  scene.onBeforeRenderObservable.add(() => {
    const pos = getPlayerPosition()
    if (pos) updateMapChunks(pos)
  })
}

export function clearMapChunks() {
  chunks.length = 0
}

export function listMapChunks() {
  return chunks.map(c => ({
    name:      c.name,
    enabled:   c.enabled,
    meshCount: c.meshes.length,
  }))
}
