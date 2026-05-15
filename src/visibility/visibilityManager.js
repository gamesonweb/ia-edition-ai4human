import { Vector3 } from '@babylonjs/core/Maths/math.vector'

const MAX_DISTANCE = 300

export function setupVisibilityManager(scene, camera, excludedMeshes = []) {
  const excludedIds = new Set(excludedMeshes.map(m => m.uniqueId))

  let tick = 0

  scene.registerBeforeRender(() => {
    if (++tick % 6 !== 0) return

    const camPos = camera.position
    const planes  = camera.frustumPlanes
    if (!planes) return

    for (const mesh of scene.meshes) {
      if (mesh.name === 'sky') continue
      if (excludedIds.has(mesh.uniqueId)) continue
      if (!mesh.subMeshes || mesh.subMeshes.length === 0) continue

      const dist = Vector3.Distance(camPos, mesh.getAbsolutePosition())

      if (dist > MAX_DISTANCE) {
        if (mesh.isEnabled()) mesh.setEnabled(false)
        continue
      }

      const inFrustum = mesh.isInFrustum(planes)
      if (inFrustum !== mesh.isEnabled()) mesh.setEnabled(inFrustum)
    }
  })
}
