import { SceneLoader }       from '@babylonjs/core/Loading/sceneLoader'
import { MeshBuilder }       from '@babylonjs/core/Meshes/meshBuilder'
import { StandardMaterial }  from '@babylonjs/core/Materials/standardMaterial'
import { Color3 }            from '@babylonjs/core/Maths/math.color'

import { AdvancedDynamicTexture } from '@babylonjs/gui/2D/advancedDynamicTexture'
import { Rectangle }              from '@babylonjs/gui/2D/controls/rectangle'
import { TextBlock }              from '@babylonjs/gui/2D/controls/textBlock'
import { StackPanel }             from '@babylonjs/gui/2D/controls/stackPanel'
import { Control }                from '@babylonjs/gui/2D/controls/control'

import { spawnRobot }        from './robot.js'
import { showLevelComplete } from '../../UI/levelComplete.js'
import { showGameTimer, updateGameTimer, hideGameTimer } from '../../UI/gameTimer.js'

const ROBOT_POS   = { x: -160.88, y: 0.14, z: 196.26 }
const DEPOSIT_POS = { x:   24.72, y: 0.14, z: 310.48 }

const LEVEL2_BASE = '/level/level1/' // on réutilise soldier.glb du level 1

const SOLDIER_POS = { x: 88.99, y: 0.14, z: 310.62 }
const TUBE_POS    = { x: 88.99, y: 0.14, z: 313.93 }

const TUBE_HEIGHT     = 4
const TUBE_DIAMETER   = 2.2
const PICKUP_RADIUS   = 3.5
const BILLBOARD_RADIUS = 14
const TASK_DURATION_MS = 60_000

const BOUNDARY = {
  A: { x: 86.24, z: 295.73 },
  B: { x: 57.34, z: 296.58 },
}
const POLICE_DURATION_MS = 60_000

function isOutsideZone(px, pz) {
  const { A, B } = BOUNDARY
  const dx = B.x - A.x
  const t  = Math.abs(dx) < 1e-6 ? 0 : (px - A.x) / dx
  const lineZ = A.z + t * (B.z - A.z)
  return pz < lineZ
}

export const LEVEL2_INTRO = {
  label:    'Manche',
  title:    'Manche 2',
  subtitle: 'Présentez votre passeport à l\'autorité',
  dangers: [
    { icon: 'fa-id-badge', text: 'Montrez le passeport au soldat' },
    { icon: 'fa-clock',    text: '1 minute pour accomplir la tâche' },
  ],
  duration: 6000,
}

function makePromptCard(gui, anchor, { key, label, color, shadowColor }) {
  const card = new Rectangle()
  card.width        = '340px'
  card.height       = '72px'
  card.cornerRadius = 12
  card.thickness    = 2
  card.color        = color
  card.background   = 'rgba(8, 12, 22, 0.85)'
  card.shadowColor  = shadowColor
  card.shadowBlur   = 18
  card.linkOffsetY  = -120
  card.isVisible    = false
  gui.addControl(card)
  card.linkWithMesh(anchor)

  const stack = new StackPanel()
  stack.isVertical = false
  stack.spacing    = 14
  stack.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER
  card.addControl(stack)

  const badge = new Rectangle()
  badge.width        = '40px'
  badge.height       = '40px'
  badge.cornerRadius = 6
  badge.thickness    = 2
  badge.color        = color
  badge.background   = `rgba(${hexToRgb(color)}, 0.18)`
  stack.addControl(badge)

  const keyTb = new TextBlock()
  keyTb.text       = key
  keyTb.color      = '#f3f6ff'
  keyTb.fontWeight = 'bold'
  keyTb.fontSize   = 22
  keyTb.fontFamily = '"Segoe UI", system-ui, sans-serif'
  badge.addControl(keyTb)

  const labelTb = new TextBlock()
  labelTb.text        = label
  labelTb.color       = '#f3f6ff'
  labelTb.fontSize    = 16
  labelTb.fontWeight  = '600'
  labelTb.fontFamily  = '"Segoe UI", system-ui, sans-serif'
  labelTb.resizeToFit = true
  stack.addControl(labelTb)

  return card
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `${r}, ${g}, ${b}`
}

function makeAnchor(name, scene, pos, yOffset = 0) {
  const a = MeshBuilder.CreatePlane(name, { size: 0.01 }, scene)
  a.position.set(pos.x, pos.y + yOffset, pos.z)
  a.isVisible      = false
  a.isPickable     = false
  a.checkCollisions = false
  return a
}

async function importSoldier(scene, position) {
  const result = await SceneLoader.ImportMeshAsync(null, LEVEL2_BASE, 'soldier.glb', scene)
  result.animationGroups?.forEach(ag => ag.stop())

  const root = result.meshes.find(m => m.name === '__root__') ?? result.meshes[0]
  if (!root) return null

  root.name = 'level2_soldier'
  root.rotationQuaternion = null
  root.scaling.setAll(1.1)
  root.position.set(position.x, position.y, position.z)
  root.rotation.y = -80 * Math.PI / 180

  for (const m of root.getChildMeshes(false)) {
    if (m.subMeshes && m.subMeshes.length > 0) m.checkCollisions = true
  }

  return root
}

export async function loadLevel2(scene, { getHero, notifications, damage, inventory, onComplete } = {}) {
  if (!scene.metadata) scene.metadata = {}
  scene.metadata.currentLevel = 2
  scene.metadata.level2Phase  = 'show-passport'

  // ----- Tube orange (indicateur d'objectif) -----
  const tubeColor = Color3.FromHexString('#FF8C00')
  const tubeMat   = new StandardMaterial('level2-tube-mat', scene)
  tubeMat.diffuseColor    = tubeColor
  tubeMat.emissiveColor   = tubeColor.scale(0.6)
  tubeMat.specularColor   = new Color3(0, 0, 0)
  tubeMat.alpha           = 0.32
  tubeMat.backFaceCulling = false

  const tube = MeshBuilder.CreateCylinder('level2-tube', {
    diameter:     TUBE_DIAMETER,
    height:       TUBE_HEIGHT,
    tessellation: 24,
  }, scene)
  tube.material        = tubeMat
  tube.position.set(TUBE_POS.x, TUBE_POS.y + TUBE_HEIGHT / 2, TUBE_POS.z)
  tube.isPickable      = false
  tube.checkCollisions = false

  // ----- GUI billboards (style level 4) -----
  const gui = AdvancedDynamicTexture.CreateFullscreenUI('level2-gui', true, scene)
  gui.idealWidth = 1920

  // Billboard 1 — Montrer le passeport
  const signAnchor   = makeAnchor('l2-sign-anchor',    scene, TUBE_POS,    TUBE_HEIGHT + 2.5)
  const signCard     = makePromptCard(gui, signAnchor, {
    key:         '!',
    label:       'Montrer le passeport',
    color:       '#FF8C00',
    shadowColor: '#FF8C00',
  })

  // ----- Soldat -----
  const soldier = await importSoldier(scene, SOLDIER_POS)

  // ----- Zone de dépôt -----
  const depositMat = new StandardMaterial('level2-deposit-mat', scene)
  const depositColor = Color3.FromHexString('#4ADE80')
  depositMat.diffuseColor    = depositColor
  depositMat.emissiveColor   = depositColor.scale(0.6)
  depositMat.specularColor   = new Color3(0, 0, 0)
  depositMat.alpha           = 0.32
  depositMat.backFaceCulling = false

  const depositTube = MeshBuilder.CreateCylinder('level2-deposit-tube', {
    diameter:     TUBE_DIAMETER,
    height:       TUBE_HEIGHT,
    tessellation: 24,
  }, scene)
  depositTube.material        = depositMat
  depositTube.position.set(DEPOSIT_POS.x, DEPOSIT_POS.y + TUBE_HEIGHT / 2, DEPOSIT_POS.z)
  depositTube.isPickable      = false
  depositTube.checkCollisions = false
  depositTube.setEnabled(false)

  // Billboard 3 — Déposer le robot
  const depositAnchor   = makeAnchor('l2-deposit-anchor', scene, DEPOSIT_POS, TUBE_HEIGHT + 2.5)
  const depositSignCard = makePromptCard(gui, depositAnchor, {
    key:         '→',
    label:       'Déposer le robot',
    color:       '#4ADE80',
    shadowColor: '#4ADE80',
  })

  let depositActive = false
  let depositDone   = false

  // ----- Robot contaminé -----
  const robot = await spawnRobot(scene, {
    position:     ROBOT_POS,
    getHero,
    damagePlayer: damage,
    notifications,
    inventory,
    onPickup: () => {
      depositActive = true
      depositTube.setEnabled(true)
      depositAnchor.setEnabled(true)
      notifications?.show({
        id:         'objective',
        icon:       'fa-box',
        title:      'Objectif',
        message:    'Déposez le robot dans la zone verte.',
        persistent: true,
      })
    },
  })

  const depositObserver = scene.onBeforeRenderObservable.add(() => {
    if (!depositActive || depositDone) return
    if (scene.metadata?.currentLevel !== 2) return
    if (scene.metadata?.paused || scene.metadata?.dead) return

    const hero = getHero?.()
    if (!hero) return
    const dx = hero.position.x - DEPOSIT_POS.x
    const dz = hero.position.z - DEPOSIT_POS.z
    const dDistSq = dx*dx + dz*dz
    depositSignCard.isVisible = dDistSq <= BILLBOARD_RADIUS * BILLBOARD_RADIUS

    if (dDistSq < PICKUP_RADIUS * PICKUP_RADIUS) {
      depositDone   = true
      depositActive = false
      depositTube.setEnabled(false)
      depositSignCard.isVisible = false
      depositAnchor.setEnabled(false)
      inventory?.setItem(0, null)
      notifications?.dismiss('objective')

      robot?.placeAsIdle(DEPOSIT_POS)

      scene.metadata.level2Phase = 'completed'

      showLevelComplete({
        title:    'Manche 2 terminée',
        subtitle: 'Robot déposé avec succès.',
        duration: 3500,
      })
      setTimeout(() => onComplete?.(), 4000)
    }
  })

  // ----- Objectif -----
  notifications?.show({
    id:         'objective',
    icon:       'fa-id-badge',
    title:      'Objectif',
    message:    'Montrez votre passeport au soldat (1 minute).',
    persistent: true,
  })

  // ----- Timer 60s -----
  const taskStart   = performance.now()
  let taskDone      = false
  let timeoutFired  = false

  let boundaryWatchActive  = false
  let wasOutside           = false
  let outsideStart         = null
  let policeNotified       = false

  showGameTimer({ total: TASK_DURATION_MS / 1000, label: 'Montrer le passeport' })

  const updateTimerNotif = () => {
    if (taskDone || timeoutFired) return
    const remainMs  = Math.max(0, TASK_DURATION_MS - (performance.now() - taskStart))
    const remainSec = Math.ceil(remainMs / 1000)
    updateGameTimer(remainSec)
  }
  updateTimerNotif()
  const tickId = setInterval(updateTimerNotif, 1000)

  // Garde-visibilité
  let level2Active = null
  const visObserver = scene.onBeforeRenderObservable.add(() => {
    const isLevel2 = scene.metadata?.currentLevel === 2
    if (isLevel2 === level2Active) return
    level2Active = isLevel2
    tube.setEnabled(isLevel2 && !taskDone)
    signAnchor.setEnabled(isLevel2 && !taskDone)
    if (!isLevel2) signCard.isVisible = false
    if (soldier) soldier.setEnabled(isLevel2)
  })

  const onPassportShown = () => {
    if (taskDone) return
    taskDone = true
    scene.metadata.level2Phase = 'leave-camp'

    tube.setEnabled(false)
    signCard.isVisible = false
    signAnchor.setEnabled(false)

    clearInterval(tickId)
    hideGameTimer()
    notifications?.dismiss('objective')
    notifications?.show({
      icon:    'fa-circle-check',
      variant: 'success',
      title:   'Passeport validé',
      message: 'Vous avez l\'autorisation de quitter le camp.',
      duration: 5000,
    })
    setTimeout(() => {
      notifications?.show({
        id:         'objective',
        icon:       'fa-robot',
        variant:    'warning',
        title:      'Objectif',
        message:    'Trouvez votre robot IA contaminé. Il va vous attaquer — détruisez-le puis ramenez-le à la zone de dépôt.',
        persistent: true,
      })
    }, 5500)

    boundaryWatchActive = true
  }

  const onTimeout = () => {
    if (timeoutFired || taskDone) return
    timeoutFired = true
    clearInterval(tickId)
    hideGameTimer()
    notifications?.dismiss('objective')
    notifications?.show({
      icon:    'fa-skull',
      variant: 'warning',
      title:   'Temps écoulé',
      message: 'Vous n\'avez pas montré votre passeport à temps.',
      duration: 3000,
    })
    setTimeout(() => damage?.(999), 1000)
  }

  const proxObserver = scene.onBeforeRenderObservable.add(() => {
    if (taskDone || timeoutFired) return
    if (scene.metadata?.paused) return
    if (scene.metadata?.dead)   return
    if (scene.metadata?.currentLevel !== 2) return

    if (performance.now() - taskStart >= TASK_DURATION_MS) {
      onTimeout()
      return
    }

    const hero = getHero?.()
    if (!hero) return
    const dx = hero.position.x - TUBE_POS.x
    const dz = hero.position.z - TUBE_POS.z
    const distSq = dx * dx + dz * dz
    signCard.isVisible = distSq <= BILLBOARD_RADIUS * BILLBOARD_RADIUS
    if (distSq < PICKUP_RADIUS * PICKUP_RADIUS) {
      onPassportShown()
    }
  })

  // ----- Surveillance sortie du camp -----
  const updateBoundaryNotif = () => {
    if (!boundaryWatchActive || !wasOutside || outsideStart == null) return
    if (policeNotified) return
    const remainMs  = Math.max(0, POLICE_DURATION_MS - (performance.now() - outsideStart))
    const remainSec = Math.ceil(remainMs / 1000)
    updateGameTimer(remainSec)
  }
  const boundaryTickId = setInterval(updateBoundaryNotif, 1000)

  const boundaryObserver = scene.onBeforeRenderObservable.add(() => {
    if (!boundaryWatchActive) return
    if (scene.metadata?.paused) return
    if (scene.metadata?.dead)   return
    if (scene.metadata?.currentLevel !== 2) return

    const hero = getHero?.()
    if (!hero) return

    const outside = isOutsideZone(hero.position.x, hero.position.z)

    if (outside && !wasOutside) {
      outsideStart   = performance.now()
      policeNotified = false
      showGameTimer({ total: POLICE_DURATION_MS / 1000, label: 'Rentrez dans la zone' })
      updateBoundaryNotif()
    } else if (!outside && wasOutside) {
      outsideStart   = null
      policeNotified = false
      hideGameTimer()
    }
    wasOutside = outside

    if (outside && !policeNotified && outsideStart != null) {
      if (performance.now() - outsideStart >= POLICE_DURATION_MS) {
        policeNotified = true
        hideGameTimer()
        notifications?.show({
          icon:    'fa-triangle-exclamation',
          variant: 'warning',
          title:   'Repérés',
          message: 'Les policiers IA vont vous retrouver !',
          duration: 6000,
        })
      }
    }
  })

  console.log('[level2] chargé', { soldier: !!soldier })

  let skipped = false
  const skip = () => {
    if (skipped) return
    skipped = true

    if (!taskDone) {
      taskDone = true
      scene.metadata.level2Phase = 'leave-camp'
      tube.setEnabled(false)
      signCard.isVisible = false
      signAnchor.setEnabled(false)
      clearInterval(tickId)
      hideGameTimer()
    }

    try {
      if (typeof robot?.getHp === 'function' && robot.getHp() > 0) {
        robot.damage?.(9999)
      }
    } catch {}
    boundaryWatchActive = false
    wasOutside          = false
    outsideStart        = null

    robot?.placeAsIdle?.(DEPOSIT_POS)
    depositTube.setEnabled(false)
    depositSignCard.isVisible = false
    depositAnchor.setEnabled(false)
    depositActive = false
    depositDone   = true
    inventory?.setItem(0, null)

    scene.metadata.level2Phase = 'completed'

    notifications?.dismiss('objective')
    notifications?.show({
      icon:    'fa-forward',
      variant: 'info',
      title:   'Niveau passé',
      message: 'Cheat: Manche 2 ignorée.',
      duration: 3500,
    })

    setTimeout(() => onComplete?.(), 600)
  }

  return {
    soldier,
    tube,
    robot,
    skip,
    dispose: () => {
      scene.onBeforeRenderObservable.remove(visObserver)
      scene.onBeforeRenderObservable.remove(proxObserver)
      scene.onBeforeRenderObservable.remove(boundaryObserver)
      scene.onBeforeRenderObservable.remove(depositObserver)
      clearInterval(tickId)
      clearInterval(boundaryTickId)
      tube.dispose()
      tubeMat.dispose()
      signAnchor.dispose()
      depositTube.dispose()
      depositMat.dispose()
      depositAnchor.dispose()
      try { gui.dispose() } catch {}
      soldier?.dispose()
      robot?.dispose()
    },
  }
}
