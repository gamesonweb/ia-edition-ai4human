import { Vector3 } from '@babylonjs/core/Maths/math.vector'

const chunks = []

const DEFAULT_ACTIVATE_PADDING   = 15
const DEFAULT_DEACTIVATE_PADDING = 30
const UPDATE_INTERVAL_MS         = 200

let lastUpdate = 0

/**
 * Enregistre une zone de la map.
 * On passe directement la liste des meshes visibles à toggler —
 * plus fiable que setEnabled sur le __root__ avec les world matrices freezées.
 *
 * @param {string} name
 * @param {import('@babylonjs/core').AbstractMesh[]} meshes  — meshes actifs de cette partie
 * @param {import('@babylonjs/core').Vector3} center
 * @param {number} radius
 * @param {{ activatePadding?: number, deactivatePadding?: number }} [opts]
 */
export function registerMapChunk(name, meshes, center, radius, opts = {}) {
  if (!meshes || meshes.length === 0) {
    console.warn('[chunks] aucun mesh pour', name)
    return null
  }

  const chunk = {
    name,
    meshes,
    center: center.clone(),
    radius,
    activateAt:   radius + (opts.activatePadding   ?? DEFAULT_ACTIVATE_PADDING),
    deactivateAt: radius + (opts.deactivatePadding ?? DEFAULT_DEACTIVATE_PADDING),
    enabled: true,
  }

  chunks.push(chunk)
  return chunk
}

/**
 * Met à jour l'état actif/inactif des zones selon la position du joueur.
 * Throttled à UPDATE_INTERVAL_MS — appelable chaque frame sans souci.
 * @param {import('@babylonjs/core').Vector3} playerPosition
 * @param {boolean} [force]
 */
export function updateMapChunks(playerPosition, force = false) {
  const now = performance.now()
  if (!force && now - lastUpdate < UPDATE_INTERVAL_MS) return
  lastUpdate = now

  for (const chunk of chunks) {
    const dist = Vector3.Distance(playerPosition, chunk.center)

    if (chunk.enabled && dist > chunk.deactivateAt) {
      for (const mesh of chunk.meshes) mesh.setEnabled(false)
      chunk.enabled = false
    } else if (!chunk.enabled && dist < chunk.activateAt) {
      for (const mesh of chunk.meshes) mesh.setEnabled(true)
      chunk.enabled = true
    }
  }
}

/**
 * Branche la boucle de mise à jour sur la scène.
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
    name:        c.name,
    enabled:     c.enabled,
    meshCount:   c.meshes.length,
    radius:      c.radius,
    activateAt:  c.activateAt,
    deactivateAt: c.deactivateAt,
  }))
}
