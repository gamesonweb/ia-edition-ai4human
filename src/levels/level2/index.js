import { SceneLoader }       from '@babylonjs/core/Loading/sceneLoader'
import { MeshBuilder }       from '@babylonjs/core/Meshes/meshBuilder'
import { Mesh }              from '@babylonjs/core/Meshes/mesh'
import { StandardMaterial }  from '@babylonjs/core/Materials/standardMaterial'
import { DynamicTexture }    from '@babylonjs/core/Materials/Textures/dynamicTexture'
import { Color3 }            from '@babylonjs/core/Maths/math.color'

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
const TASK_DURATION_MS = 60_000

// Ligne séparant le camp de la zone sûre.
// La "zone" (où le joueur doit être pour échapper aux policiers IA) est
// au nord de cette ligne (z > zLigne). Tant que le joueur est au sud
// (z < zLigne), le compteur de 1 minute tourne.
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

function createSignText(scene, text, position) {
  const resolution = 512
  const tex = new DynamicTexture('level2-sign-tex', resolution, scene, true)
  tex.hasAlpha = true

  const ctx = tex.getContext()
  ctx.clearRect(0, 0, resolution, resolution)
  ctx.fillStyle = 'rgba(0, 0, 0, 0.55)'
  ctx.fillRect(0, resolution * 0.25, resolution, resolution * 0.5)
  tex.drawText(text, null, resolution / 2 + 26, 'bold 52px "Segoe UI", Arial', '#FF8C00', null, true, true)

  const mat = new StandardMaterial('level2-sign-mat', scene)
  mat.diffuseTexture            = tex
  mat.emissiveColor             = new Color3(1, 1, 1)
  mat.specularColor             = new Color3(0, 0, 0)
  mat.useAlphaFromDiffuseTexture = true
  mat.backFaceCulling           = false

  const plane = MeshBuilder.CreatePlane('level2-sign', { width: 6, height: 3 }, scene)
  plane.material        = mat
  plane.position.set(position.x, position.y, position.z)
  plane.billboardMode   = Mesh.BILLBOARDMODE_ALL
  plane.isPickable      = false
  plane.checkCollisions = false

  return { plane, material: mat, texture: tex }
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
  // orientation demandée : -80°
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

  // ----- Texte 3D "Montrer le passport" au-dessus du tube -----
  const sign = createSignText(scene, 'Montrer le passport', {
    x: TUBE_POS.x,
    y: TUBE_POS.y + TUBE_HEIGHT + 1.2,
    z: TUBE_POS.z,
  })

  // ----- Soldat à la position de l'autorité -----
  const soldier = await importSoldier(scene, SOLDIER_POS)

  // ----- Zone de dépôt (créée masquée, révélée après pickup) -----
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

  const depositSign = createSignText(scene, 'Déposer le robot', {
    x: DEPOSIT_POS.x,
    y: DEPOSIT_POS.y + TUBE_HEIGHT + 1.2,
    z: DEPOSIT_POS.z,
  })
  depositSign.plane.setEnabled(false)

  let depositActive = false
  let depositDone   = false

  // ----- Robot contaminé (IA steering : pursuit / attack / retreat / dead) -----
  const robot = await spawnRobot(scene, {
    position:     ROBOT_POS,
    getHero,
    damagePlayer: damage,
    notifications,
    inventory,
    onPickup: () => {
      depositActive = true
      depositTube.setEnabled(true)
      depositSign.plane.setEnabled(true)
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
    if (dx*dx + dz*dz < PICKUP_RADIUS * PICKUP_RADIUS) {
      depositDone   = true
      depositActive = false
      depositTube.setEnabled(false)
      depositSign.plane.setEnabled(false)
      inventory?.setItem(0, null)
      notifications?.dismiss('objective')

      // Robot affiché à la position de dépôt en anim idle (reste visible aussi sur le level 3)
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

  // ----- Objectif affiché -----
  notifications?.show({
    id:         'objective',
    icon:       'fa-id-badge',
    title:      'Objectif',
    message:    'Montrez votre passeport au soldat (1 minute).',
    persistent: true,
  })

  // ----- Timer 60s + détection proximité -----
  const taskStart   = performance.now()
  let taskDone      = false
  let timeoutFired  = false

  // ----- Garde-frontière (activée après la remise du passeport) -----
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

  // Garde-visibilité : décor level 2 caché si on n'est pas sur le level 2
  let level2Active = null
  const visObserver = scene.onBeforeRenderObservable.add(() => {
    const isLevel2 = scene.metadata?.currentLevel === 2
    if (isLevel2 === level2Active) return
    level2Active = isLevel2
    tube.setEnabled(isLevel2 && !taskDone)
    sign.plane.setEnabled(isLevel2 && !taskDone)
    if (soldier) soldier.setEnabled(isLevel2)
  })

  const onPassportShown = () => {
    if (taskDone) return
    taskDone = true
    scene.metadata.level2Phase = 'leave-camp'

    tube.setEnabled(false)
    sign.plane.setEnabled(false)

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
      icon:    'fa-triangle-exclamation',
      variant: 'warning',
      title:   'Temps écoulé',
      message: 'Vous n\'avez pas montré votre passeport à temps.',
      duration: 5000,
    })
    damage?.(100)
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
    if (dx * dx + dz * dz < PICKUP_RADIUS * PICKUP_RADIUS) {
      onPassportShown()
    }
  })

  // ----- Surveillance de la sortie du camp (active après le passeport) -----
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
      // Vient de franchir la ligne vers l'extérieur
      outsideStart   = performance.now()
      policeNotified = false
      showGameTimer({ total: POLICE_DURATION_MS / 1000, label: 'Rentrez dans la zone' })
      updateBoundaryNotif()
    } else if (!outside && wasOutside) {
      // Est rentré dans la zone
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

    // 1) Phase passeport : tube + sign + timer
    if (!taskDone) {
      taskDone = true
      scene.metadata.level2Phase = 'leave-camp'
      try { tube.setEnabled(false) } catch {}
      try { sign.plane.setEnabled(false) } catch {}
      try { clearInterval(tickId) } catch {}
      try { hideGameTimer() } catch {}
    }

    // 2) Phase robot : on l'abat instantanément et on le marque "récupéré"
    try {
      if (typeof robot?.getHp === 'function' && robot.getHp() > 0) {
        robot.damage?.(9999)
      }
    } catch {}
    boundaryWatchActive = false
    wasOutside          = false
    outsideStart        = null

    // 3) Phase dépôt : on le pose direct à la zone de dépôt
    try { robot?.placeAsIdle?.(DEPOSIT_POS) } catch {}
    try { depositTube.setEnabled(false) } catch {}
    try { depositSign.plane.setEnabled(false) } catch {}
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

    // 4) Avance vers le level 3
    setTimeout(() => onComplete?.(), 600)
    return // évite l'ancien appel à onPassportShown qui suivait
  }

  return {
    soldier,
    tube,
    sign,
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
      sign.plane.dispose()
      sign.material.dispose()
      sign.texture.dispose()
      depositTube.dispose()
      depositMat.dispose()
      depositSign.plane.dispose()
      depositSign.material.dispose()
      depositSign.texture.dispose()
      soldier?.dispose()
      robot?.dispose()
    },
  }
}
