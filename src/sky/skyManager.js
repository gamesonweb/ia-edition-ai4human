import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder'
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial'
import { DynamicTexture } from '@babylonjs/core/Materials/Textures/dynamicTexture'
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color'
import { Scene } from '@babylonjs/core/scene'

export function createSky(scene) {
  scene.clearColor = new Color4(0.85, 0.27, 0.02, 1)

  const dome = MeshBuilder.CreateSphere('sky', { diameter: 900, segments: 32 }, scene)
  dome.infiniteDistance = true
  dome.isPickable = false

  const mat = new StandardMaterial('skyMat', scene)
  mat.backFaceCulling = false
  mat.disableLighting = true

  const tex = new DynamicTexture('skyTex', { width: 4, height: 512 }, scene, false)
  const ctx = tex.getContext()

  const grad = ctx.createLinearGradient(0, 0, 0, 512)
  grad.addColorStop(0,    '#C03200')   
  grad.addColorStop(0.35, '#FF5500')   
  grad.addColorStop(0.65, '#FF9000')  
  grad.addColorStop(0.85, '#FFBB00')  
  grad.addColorStop(1,    '#FFD700')   

  ctx.fillStyle = grad
  ctx.fillRect(0, 0, 4, 512)
  tex.update()

  mat.emissiveTexture = tex
  dome.material = mat

  scene.fogMode  = Scene.FOGMODE_LINEAR
  scene.fogStart = 30
  scene.fogEnd   = 300
  scene.fogColor = new Color3(1, 0.55, 0.1)
}
