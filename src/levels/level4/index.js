import { SceneLoader }    from '@babylonjs/core/Loading/sceneLoader'
import { Vector3 }        from '@babylonjs/core/Maths/math.vector'
import { Color3 }         from '@babylonjs/core/Maths/math.color'
import { MeshBuilder }    from '@babylonjs/core/Meshes/meshBuilder'
import { Mesh }           from '@babylonjs/core/Meshes/mesh'
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial'
import { DynamicTexture }   from '@babylonjs/core/Materials/Textures/dynamicTexture'

import { AdvancedDynamicTexture } from '@babylonjs/gui/2D/advancedDynamicTexture'
import { Rectangle }              from '@babylonjs/gui/2D/controls/rectangle'
import { TextBlock }              from '@babylonjs/gui/2D/controls/textBlock'
import { StackPanel }             from '@babylonjs/gui/2D/controls/stackPanel'
import { Control }                from '@babylonjs/gui/2D/controls/control'

import { showHackingOverlay } from '../../UI/hackingOverlay.js'
import { showLevelComplete }  from '../../UI/levelComplete.js'

const COMPUTER_POS  = { x: -115.36, y: 0.14, z: 14.11 }
const PROMPT_RADIUS = 5
const COMPUTER_BASE = '/level/level4/'
const COMPUTER_FILE = 'computer.glb'
const ADMIN_CODE    = 'GOW2026'
const CODE_DISPLAY_MS = 12000   // durée d'affichage du code au-dessus du robot (ms)

/**
 * Affiche le code admin au-dessus de la tête du robot pendant CODE_DISPLAY_MS.
 */
function showCodeAboveRobot(scene, robot) {
  const robotRoot = robot?.root
  if (!robotRoot) return

  const pos = robotRoot.position
  const resolution = 512
  const tex = new DynamicTexture('robot-code-tex', resolution, scene, true)
  tex.hasAlpha = true

  const ctx = tex.getContext()
  ctx.clearRect(0, 0, resolution, resolution)
  ctx.fillStyle = 'rgba(8, 12, 30, 0.88)'
  ctx.roundRect?.(resolution * 0.05, resolution * 0.25, resolution * 0.9, resolution * 0.5, 32)
  ctx.fill?.()
  tex.drawText('CODE ADMIN', null, resolution * 0.42, 'bold 38px "Segoe UI", Arial', 'rgba(103,232,249,0.9)', null, true, true)
  tex.drawText(ADMIN_CODE,   null, resolution * 0.68, 'bold 72px "Courier New", monospace', '#FBBF24', null, true, true)

  const mat = new StandardMaterial('robot-code-mat', scene)
  mat.diffuseTexture             = tex
  mat.emissiveColor              = new Color3(1, 1, 1)
  mat.specularColor              = new Color3(0, 0, 0)
  mat.useAlphaFromDiffuseTexture = true
  mat.backFaceCulling            = false

  const plane = MeshBuilder.CreatePlane('robot-code-plane', { width: 4, height: 2 }, scene)
  plane.position.set(pos.x, pos.y + 5, pos.z)
  plane.billboardMode  = Mesh.BILLBOARDMODE_ALL
  plane.material       = mat
  plane.isPickable     = false

  // Suit la position du robot chaque frame
  const obs = scene.onBeforeRenderObservable.add(() => {
    const rp = robotRoot.position
    plane.position.set(rp.x, rp.y + 5, rp.z)
  })

  // Disparaît après CODE_DISPLAY_MS
  setTimeout(() => {
    scene.onBeforeRenderObservable.remove(obs)
    plane.dispose()
    mat.dispose()
    tex.dispose()
  }, CODE_DISPLAY_MS)
}

export const LEVEL4_INTRO = {
  label:    'Manche',
  title:    'Manche 4',
  subtitle: 'Infiltrez l\'usine — bypass de la reconnaissance faciale',
  dangers: [
    { icon: 'fa-camera',   text: 'Trouvez l\'ordinateur de l\'usine'      },
    { icon: 'fa-user-plus',text: 'Inscrivez-vous comme robot autorisé'   },
  ],
  duration: 7000,
}

/**
 * Charge la manche 4 : ordinateur d'usine + bypass reconnaissance faciale.
 *
 * @param {import('@babylonjs/core').Scene} scene
 * @param {{
 *   getHero?: () => any,
 *   notifications?: any,
 *   robot?: any,
 *   onComplete?: () => void,
 * }} [opts]
 */
export async function loadLevel4(scene, { getHero, notifications, robot, onComplete } = {}) {
  if (!scene.metadata) scene.metadata = {}
  scene.metadata.currentLevel = 4
  scene.metadata.level4Phase  = 'find-computer'

  notifications?.show({
    id:         'objective',
    icon:       'fa-camera',
    title:      'Objectif',
    message:    'Trouvez l\'ordinateur de l\'usine.',
    persistent: true,
  })

  // ---- Charge l'ordinateur ----
  let computerRoot = null
  try {
    const result = await SceneLoader.ImportMeshAsync(null, COMPUTER_BASE, COMPUTER_FILE, scene)
    computerRoot = result.meshes.find(m => m.name === '__root__') ?? result.meshes[0]
    if (computerRoot) {
      computerRoot.name = 'level4_computer'
      computerRoot.rotationQuaternion = null
      computerRoot.rotation.y = -Math.PI / 2
      computerRoot.scaling.setAll(4)
      computerRoot.position.set(COMPUTER_POS.x, COMPUTER_POS.y, COMPUTER_POS.z)
      for (const m of computerRoot.getChildMeshes(false)) m.isPickable = false
    }
  } catch (e) {
    console.warn('[level4] échec chargement computer.glb', e)
  }

  // ---- Ancre invisible au-dessus de l'écran de l'ordi pour le prompt GUI ----
  const anchor = MeshBuilder.CreatePlane('level4-computer-anchor', { size: 0.01 }, scene)
  anchor.position.set(COMPUTER_POS.x, COMPUTER_POS.y + 6, COMPUTER_POS.z)
  anchor.isVisible      = false
  anchor.isPickable     = false
  anchor.checkCollisions = false

  // ---- GUI Babylon : prompt "Appuyer E" qui suit l'ordinateur à l'écran ----
  const gui = AdvancedDynamicTexture.CreateFullscreenUI('level4-gui', true, scene)
  gui.idealWidth = 1920

  const promptCard = new Rectangle('level4-prompt')
  promptCard.width        = '320px'
  promptCard.height       = '72px'
  promptCard.cornerRadius = 12
  promptCard.thickness    = 2
  promptCard.color        = '#67E8F9'
  promptCard.background   = 'rgba(8, 12, 22, 0.85)'
  promptCard.shadowColor  = '#7C9CFF'
  promptCard.shadowBlur   = 18
  promptCard.linkOffsetY  = -120
  promptCard.isVisible    = false
  gui.addControl(promptCard)
  promptCard.linkWithMesh(anchor)

  const promptStack = new StackPanel('level4-prompt-stack')
  promptStack.isVertical = false
  promptStack.spacing    = 14
  promptStack.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER
  promptCard.addControl(promptStack)

  const keyBadge = new Rectangle('level4-key')
  keyBadge.width        = '40px'
  keyBadge.height       = '40px'
  keyBadge.cornerRadius = 6
  keyBadge.thickness    = 2
  keyBadge.color        = '#A78BFA'
  keyBadge.background   = 'rgba(124, 156, 255, 0.18)'
  promptStack.addControl(keyBadge)

  const keyText = new TextBlock('level4-key-text')
  keyText.text          = 'E'
  keyText.color         = '#f3f6ff'
  keyText.fontWeight    = 'bold'
  keyText.fontSize      = 22
  keyText.fontFamily    = '"Segoe UI", system-ui, sans-serif'
  keyBadge.addControl(keyText)

  const promptLabel = new TextBlock('level4-prompt-label')
  promptLabel.text       = 'Entrer dans le système'
  promptLabel.color      = '#f3f6ff'
  promptLabel.fontSize   = 16
  promptLabel.fontWeight = '600'
  promptLabel.fontFamily = '"Segoe UI", system-ui, sans-serif'
  promptLabel.resizeToFit = true
  promptStack.addControl(promptLabel)

  // ---- Détection de proximité ----
  let inRange    = false
  let overlayOpen = false
  let completed   = false

  const proxObserver = scene.onBeforeRenderObservable.add(() => {
    if (completed) return
    if (scene.metadata?.currentLevel !== 4) {
      if (promptCard.isVisible) promptCard.isVisible = false
      return
    }
    if (scene.metadata?.paused || scene.metadata?.dead) {
      if (promptCard.isVisible) promptCard.isVisible = false
      return
    }
    const hero = getHero?.()
    if (!hero) return

    const dx = hero.position.x - COMPUTER_POS.x
    const dz = hero.position.z - COMPUTER_POS.z
    inRange = dx * dx + dz * dz <= PROMPT_RADIUS * PROMPT_RADIUS
    promptCard.isVisible = inRange && !overlayOpen
  })

  // ---- Flow E → overlay ----
  const openOverlay = () => {
    if (overlayOpen || completed)        return
    if (!inRange)                         return
    if (scene.metadata?.currentLevel !== 4) return
    if (scene.metadata?.paused || scene.metadata?.dead) return

    overlayOpen = true
    promptCard.isVisible = false
    scene.metadata.paused = true
    if (document.pointerLockElement) document.exitPointerLock()

    showHackingOverlay({
      robot,
      photoUrl: '/img/photoProfile/photo_profile.png',
      onAskRobot: () => {
        // L'overlay se ferme (géré dans hackingOverlay.js), on reprend le jeu
        overlayOpen = false
        scene.metadata.paused = false
        showCodeAboveRobot(scene, robot)
      },
      onClose: () => {
        overlayOpen = false
        scene.metadata.paused = false
      },
      onSuccess: () => {
        overlayOpen = false
        scene.metadata.paused = false
        finalize()
      },
    })
  }

  const finalize = () => {
    if (completed) return
    completed = true
    scene.metadata.level4Phase = 'completed'
    notifications?.dismiss('objective')
    notifications?.show({
      icon:    'fa-circle-check',
      variant: 'success',
      title:   'Reconnaissance trompée',
      message: 'Vous êtes désormais enregistré comme robot autorisé.',
      duration: 5000,
    })
    showLevelComplete({
      title:    'Manche 4 terminée',
      subtitle: 'L\'usine vous reconnaît comme robot.',
      duration: 3500,
    })
    setTimeout(() => onComplete?.(), 4000)
  }

  const onKey = (e) => {
    if (e.key !== 'e' && e.key !== 'E') return
    if (scene.metadata?.currentLevel !== 4) return
    openOverlay()
  }
  window.addEventListener('keydown', onKey)

  const skip = () => {
    if (completed) return
    finalize()
  }

  console.log('[level4] chargé — ordinateur prêt à ', COMPUTER_POS)

  return {
    skip,
    dispose: () => {
      window.removeEventListener('keydown', onKey)
      scene.onBeforeRenderObservable.remove(proxObserver)
      try { gui.dispose() } catch {}
      try { anchor.dispose() } catch {}
      try { computerRoot?.dispose() } catch {}
    },
  }
}
