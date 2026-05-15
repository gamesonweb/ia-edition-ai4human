import { MeshBuilder }      from '@babylonjs/core/Meshes/meshBuilder'
import { Mesh }             from '@babylonjs/core/Meshes/mesh'
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial'
import { DynamicTexture }   from '@babylonjs/core/Materials/Textures/dynamicTexture'
import { Color3 }           from '@babylonjs/core/Maths/math.color'

import { spawnCollectibles } from '../../scene/collectibles.js'
import { showSwapModal }     from '../../UI/swapModal.js'
import { showAdoptModal }    from '../../UI/adoptModal.js'
import { showLevelComplete } from '../../UI/levelComplete.js'

const LEVEL3_BASE = '/level/level2/' // les GLB demandés se trouvent dans ce dossier

const MOTHERBOARD_POS = { x:  -22.79, y: 0.14, z:  28.55 }
const DISK_POS        = { x:  148.86, y: 0.14, z:  38.11 }
// même point que DEPOSIT_POS du level 2 — c'est là que le robot est figé en idle
const ROBOT_POS       = { x:   24.72, y: 0.14, z: 310.48 }
const SWAP_RADIUS     = 5

const TUBE = { color: '#FF8C00', alpha: 0.32, diameter: 2.2, height: 4 }

export const LEVEL3_INTRO = {
  label:    'Manche',
  title:    'Manche 3',
  subtitle: 'Récupérez les composants',
  dangers: [
    { icon: 'fa-microchip',    text: 'Récupérez la carte mère' },
    { icon: 'fa-compact-disc', text: 'Récupérez le disque' },
  ],
  duration: 7000,
}

function makeSignText(scene, text, position) {
  const width  = 1024
  const height = 256
  const tex = new DynamicTexture('level3-sign-tex', { width, height }, scene, false)
  tex.hasAlpha = true
  const ctx = tex.getContext()
  ctx.clearRect(0, 0, width, height)
  ctx.fillStyle = 'rgba(0, 0, 0, 0.55)'
  ctx.fillRect(0, 0, width, height)
  ctx.font         = 'bold 96px "Segoe UI", system-ui, sans-serif'
  ctx.textAlign    = 'center'
  ctx.textBaseline = 'middle'
  ctx.strokeStyle  = '#000000'
  ctx.lineWidth    = 8
  ctx.strokeText(text, width / 2, height / 2)
  ctx.fillStyle    = '#4ADE80'
  ctx.fillText(text, width / 2, height / 2)
  tex.update(false)

  const mat = new StandardMaterial('level3-sign-mat', scene)
  mat.diffuseTexture            = tex
  mat.emissiveColor             = new Color3(1, 1, 1)
  mat.specularColor             = new Color3(0, 0, 0)
  mat.useAlphaFromDiffuseTexture = true
  mat.backFaceCulling           = false

  const plane = MeshBuilder.CreatePlane(
    'level3-sign',
    { width: 6, height: 1.5, sideOrientation: Mesh.DOUBLESIDE },
    scene,
  )
  plane.rotation.y      = Math.PI
  plane.material        = mat
  plane.position.set(position.x, position.y, position.z)
  plane.billboardMode   = Mesh.BILLBOARDMODE_ALL
  plane.isPickable      = false
  plane.checkCollisions = false

  return { plane, material: mat, texture: tex }
}

/**
 * Charge la manche 3 : 2 composants à récupérer puis échange auprès du robot.
 *
 * @param {import('@babylonjs/core').Scene} scene
 * @param {{
 *   getHero?: () => any,
 *   notifications?: any,
 *   inventory?: any,
 *   onComplete?: () => void,
 * }} [opts]
 */
export async function loadLevel3(scene, { getHero, notifications, inventory, robot, onComplete } = {}) {
  if (!scene.metadata) scene.metadata = {}
  scene.metadata.currentLevel = 3
  scene.metadata.level3Phase  = 'collect'

  notifications?.show({
    id:         'objective',
    icon:       'fa-microchip',
    title:      'Objectif',
    message:    'Récupérez la carte mère et le disque.',
    persistent: true,
  })

  let mbDone      = false
  let diskDone    = false
  let swapActive  = false
  let swapDone    = false
  let adoptActive = false
  let adoptDone   = false
  let completed   = false
  let swapSign    = null
  let adoptSign   = null
  let inRange     = false
  let modalOpen   = false

  const handles = []

  const tryActivateSwap = () => {
    if (swapActive || swapDone) return
    if (!mbDone || !diskDone) return
    swapActive = true
    scene.metadata.level3Phase = 'swap'
    notifications?.dismiss('objective')
    notifications?.show({
      id:         'objective',
      icon:       'fa-screwdriver-wrench',
      title:      'Objectif',
      message:    'Retournez au robot pour installer la carte mère et le disque.',
      persistent: true,
    })

    // Panneau 3D créé tout de suite, masqué — on l'allume quand le joueur est à portée
    swapSign = makeSignText(scene, 'Appuyer sur B', {
      x: ROBOT_POS.x, y: ROBOT_POS.y + 3, z: ROBOT_POS.z,
    })
    swapSign.plane.setEnabled(false)
  }

  const mbHandle = await spawnCollectibles(scene, {
    basePath:  LEVEL3_BASE,
    file:      'mother_board.glb',
    positions: [{ x: MOTHERBOARD_POS.x, y: 0.14, z: MOTHERBOARD_POS.z }],
    scale:     4,
    name:      'motherboard',
    getHero,
    tube:      TUBE,
    onPickup: () => {
      inventory?.setItem(0, { name: 'Carte mère', icon: '/img/inventaire/mother_board.png', rarity: 'epic' })
      notifications?.show({
        id:       'mb-progress',
        icon:     'fa-microchip',
        title:    'Carte mère récupérée',
        message:  '1 / 1',
        duration: 2500,
      })
    },
    onAllCollected: () => { mbDone = true; tryActivateSwap() },
  })
  if (mbHandle) handles.push(mbHandle)

  const diskHandle = await spawnCollectibles(scene, {
    basePath:  LEVEL3_BASE,
    file:      'disk.glb',
    positions: [{ x: DISK_POS.x, y: 0.14, z: DISK_POS.z }],
    scale:     0.6,
    name:      'disk',
    getHero,
    tube:      TUBE,
    onPickup: () => {
      inventory?.setItem(1, { name: 'Disque', icon: '/img/inventaire/disk.png', rarity: 'epic' })
      notifications?.show({
        id:       'disk-progress',
        icon:     'fa-compact-disc',
        title:    'Disque récupéré',
        message:  '1 / 1',
        duration: 2500,
      })
    },
    onAllCollected: () => { diskDone = true; tryActivateSwap() },
  })
  if (diskHandle) handles.push(diskHandle)

  // Garde de visibilité pour les collectibles
  let level3Active = null
  const visObserver = scene.onBeforeRenderObservable.add(() => {
    const isLevel3 = scene.metadata?.currentLevel === 3
    if (isLevel3 === level3Active) return
    level3Active = isLevel3
    for (const h of handles) {
      for (const item of h.items) {
        if (!item.collected) {
          item.root.setEnabled(isLevel3)
          if (item.tube) item.tube.setEnabled(isLevel3)
        }
      }
    }
    if (swapSign)  swapSign.plane.setEnabled(isLevel3 && inRange)
    if (adoptSign) adoptSign.plane.setEnabled(isLevel3 && inRange)
  })

  const activeSign = () =>
    (swapActive  && !swapDone)  ? swapSign  :
    (adoptActive && !adoptDone) ? adoptSign : null

  // Détection de proximité au robot — affiche / masque le panneau 3D actif
  const proxObserver = scene.onBeforeRenderObservable.add(() => {
    if (completed) return
    if (!(swapActive || adoptActive)) return
    if (scene.metadata?.currentLevel !== 3) return
    if (scene.metadata?.paused || scene.metadata?.dead) return

    const hero = getHero?.()
    if (!hero) return

    const dx = hero.position.x - ROBOT_POS.x
    const dz = hero.position.z - ROBOT_POS.z
    const wasInRange = inRange
    inRange = dx*dx + dz*dz <= SWAP_RADIUS * SWAP_RADIUS

    const sign = activeSign()
    if (sign && inRange !== wasInRange) sign.plane.setEnabled(inRange)
  })

  const finalizeSwap = () => {
    if (swapDone) return
    swapDone   = true
    swapActive = false

    if (swapSign) {
      swapSign.plane.dispose()
      swapSign.material.dispose()
      swapSign.texture.dispose()
      swapSign = null
    }

    inventory?.setItem(0, null)
    inventory?.setItem(1, null)
    notifications?.dismiss('objective')
    notifications?.show({
      icon:    'fa-screwdriver-wrench',
      variant: 'success',
      title:   'Apprentissage terminé',
      message: 'Le robot a appris ses nouvelles fonctions.',
      duration: 4000,
    })

    // Le robot active sa danse, on enchaîne sur la phase d'adoption
    robot?.playDance?.()

    adoptActive = true
    scene.metadata.level3Phase = 'adopt'
    inRange = false // force la re-création du panneau d'invite

    adoptSign = makeSignText(scene, 'Appuyer sur B pour adopter', {
      x: ROBOT_POS.x, y: ROBOT_POS.y + 3, z: ROBOT_POS.z,
    })
    adoptSign.plane.setEnabled(false)

    notifications?.show({
      id:         'objective',
      icon:       'fa-heart',
      title:      'Objectif',
      message:    'Adoptez le robot (combinaison de flèches).',
      persistent: true,
    })
  }

  const finalizeAdopt = () => {
    if (adoptDone) return
    adoptDone   = true
    adoptActive = false

    if (adoptSign) {
      adoptSign.plane.dispose()
      adoptSign.material.dispose()
      adoptSign.texture.dispose()
      adoptSign = null
    }

    notifications?.dismiss('objective')
    notifications?.show({
      icon:    'fa-heart',
      variant: 'success',
      title:   'Robot adopté',
      message: 'Le robot vous suivra désormais.',
      duration: 5000,
    })

    // Le robot devient compagnon et suit le joueur partout
    robot?.startFollowing?.()

    if (!completed) {
      completed = true
      scene.metadata.level3Phase = 'completed'
      showLevelComplete({
        title:    'Manche 3 terminée',
        subtitle: 'Robot remis à neuf et adopté.',
        duration: 3500,
      })
      setTimeout(() => onComplete?.(), 4000)
    }
  }

  const openSwapModal = () => {
    modalOpen = true
    scene.metadata.paused = true
    if (document.pointerLockElement) document.exitPointerLock()
    showSwapModal({
      onComplete: () => {
        modalOpen = false
        scene.metadata.paused = false
        finalizeSwap()
      },
      onCancel: () => {
        modalOpen = false
        scene.metadata.paused = false
      },
    })
  }

  const openAdoptModal = () => {
    modalOpen = true
    scene.metadata.paused = true
    if (document.pointerLockElement) document.exitPointerLock()
    showAdoptModal({
      onComplete: () => {
        modalOpen = false
        scene.metadata.paused = false
        finalizeAdopt()
      },
      onCancel: () => {
        modalOpen = false
        scene.metadata.paused = false
      },
    })
  }

  const doBAction = () => {
    if (modalOpen) return
    if (!inRange)  return
    if (swapActive && !swapDone)  { openSwapModal();  return }
    if (adoptActive && !adoptDone){ openAdoptModal(); return }
  }

  const onKey = (e) => {
    if (e.key !== 'b' && e.key !== 'B') return
    if (scene.metadata?.currentLevel !== 3) return
    if (modalOpen) return
    // pause manuelle (pause button) : on bloque ; la pause induite par la modale
    // est court-circuitée par le check `modalOpen` au-dessus.
    if (scene.metadata?.paused) return
    if (scene.metadata?.dead) return
    doBAction()
  }
  window.addEventListener('keydown', onKey)

  const skip = () => {
    if (completed) return
    completed   = true
    swapActive  = false
    swapDone    = true
    adoptActive = false
    adoptDone   = true
    scene.metadata.level3Phase = 'completed'
    for (const h of handles) {
      try { h.dispose?.() } catch {}
    }
    if (swapSign) {
      swapSign.plane.dispose()
      swapSign.material.dispose()
      swapSign.texture.dispose()
      swapSign = null
    }
    if (adoptSign) {
      adoptSign.plane.dispose()
      adoptSign.material.dispose()
      adoptSign.texture.dispose()
      adoptSign = null
    }
    inventory?.setItem(0, null)
    inventory?.setItem(1, null)
    notifications?.dismiss('objective')
    notifications?.dismiss('mb-progress')
    notifications?.dismiss('disk-progress')
    notifications?.show({
      icon:    'fa-forward',
      variant: 'info',
      title:   'Niveau passé',
      message: 'Cheat: Manche 3 ignorée.',
      duration: 3500,
    })
    onComplete?.()
  }

  console.log('[level3] chargé', { collectibles: handles.length })

  return {
    handles,
    skip,
    dispose: () => {
      window.removeEventListener('keydown', onKey)
      scene.onBeforeRenderObservable.remove(visObserver)
      scene.onBeforeRenderObservable.remove(proxObserver)
      for (const h of handles) {
        try { h.dispose?.() } catch {}
      }
      if (swapSign) {
        swapSign.plane.dispose()
        swapSign.material.dispose()
        swapSign.texture.dispose()
        swapSign = null
      }
      if (adoptSign) {
        adoptSign.plane.dispose()
        adoptSign.material.dispose()
        adoptSign.texture.dispose()
        adoptSign = null
      }
    },
  }
}
