import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader'
import { Vector3 }     from '@babylonjs/core/Maths/math.vector'
import { registerMapChunk } from './chunkManager.js'

const MAP_BASE_PATH = '/map/'
const MAP_PARTS     = [
  'mapAJ1.glb',
  'mapAJ2.glb',
  'mapAJ3.glb',
  'mapAJ4.glb',
  'mapAJ5.glb',
  'mapAJ6.glb',
]

/**
 * @param {import('@babylonjs/core').Scene} scene
 * @returns {Promise<Array<{ mainMesh: import('@babylonjs/core').AbstractMesh }>>}
 */
export async function loadMapParts(scene) {
  const results = await Promise.all(
    MAP_PARTS.map(file => SceneLoader.ImportMeshAsync(null, MAP_BASE_PATH, file, scene))
  )

  let totalMeshes = 0
  const partsData = []

  for (let i = 0; i < results.length; i++) {
    const partData = processMapPart(results[i].meshes, MAP_PARTS[i])
    partsData.push(partData)
    totalMeshes += results[i].meshes.length
  }

  console.log('[map] import ok', { parts: MAP_PARTS.length, meshes: totalMeshes })
  return partsData
}

/**
 * @param {import('@babylonjs/core').AbstractMesh[]} meshes
 * @param {string} partName
 */
function processMapPart(meshes, partName) {
  const root = meshes.find(m => m.name === '__root__') ?? meshes[0]
  if (root) root.rotation.y = Math.PI

  // Force world matrix avec la nouvelle rotation avant tout calcul de position
  root.computeWorldMatrix(true)

  /** @type {Map<string, { original: import('@babylonjs/core').Mesh, matrices: import('@babylonjs/core').Matrix[] }>} */
  const meshMap = new Map()

  for (const mesh of meshes) {
    if (!mesh.subMeshes || mesh.subMeshes.length === 0) continue

    mesh.checkCollisions = true

    const baseName = mesh.name.replace(/_\d+$/, '')

    if (!meshMap.has(baseName)) {
      meshMap.set(baseName, { original: mesh, matrices: [] })
    } else {
      mesh.computeWorldMatrix(true)
      meshMap.get(baseName).matrices.push(mesh.getWorldMatrix().clone())
      mesh.setEnabled(false)
    }
  }

  for (const { original, matrices } of meshMap.values()) {
    if (matrices.length === 0) continue
    for (const matrix of matrices) {
      original.thinInstanceAdd(matrix, false)
    }
    original.thinInstanceBufferUpdated('matrix')
    // Bounding box étendue à toutes les instances pour que le frustum culling soit correct
    original.thinInstanceRefreshBoundingInfo()
  }

  // Meshes actifs = les "originals" de chaque groupe
  const activeMeshes = [...meshMap.values()].map(e => e.original)

  // Centre du chunk = centre de la bounding box de toute la hiérarchie (en world space)
  root.getHierarchyBoundingVectors(true)  // force world matrices sur tous les enfants
  const { min, max } = root.getHierarchyBoundingVectors(true)
  const center = Vector3.Center(min, max)

  registerMapChunk(partName, activeMeshes, center)

  // Freeze après l'enregistrement
  for (const mesh of meshes) {
    mesh.freezeWorldMatrix()
    if (mesh.material) mesh.material.freeze()
  }

  return { mainMesh: root }
}
