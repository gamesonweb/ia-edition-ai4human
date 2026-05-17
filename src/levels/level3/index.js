import { MeshBuilder }      from '@babylonjs/core/Meshes/meshBuilder'

import { AdvancedDynamicTexture } from '@babylonjs/gui/2D/advancedDynamicTexture'
import { Rectangle }              from '@babylonjs/gui/2D/controls/rectangle'
import { TextBlock }              from '@babylonjs/gui/2D/controls/textBlock'
import { StackPanel }             from '@babylonjs/gui/2D/controls/stackPanel'
import { Control }                from '@babylonjs/gui/2D/controls/control'

import { spawnCollectibles } from '../../scene/collectibles.js'
import { showSwapModal }     from '../../UI/swapModal.js'
import { showAdoptModal }    from '../../UI/adoptModal.js'
import { showLevelComplete } from '../../UI/levelComplete.js'

const LEVEL3_BASE = '/level/level2/'

const MOTHERBOARD_POS = { x:  -22.79, y: 0.14, z:  28.55 }
const DISK_POS        = { x:  148.86, y: 0.14, z:  38.11 }
const ROBOT_POS       = { x:   24.72, y: 0.14, z: 310.48 }
const SWAP_RADIUS     = 5
const BILLBOARD_RADIUS = 14

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

function makePromptCard(gui, anchor, { key, label }) {
  const card = new Rectangle()
  card.width        = '340px'
  card.height       = '72px'
  card.cornerRadius = 12
  card.thickness    = 2
  card.color        = '#67E8F9'
  card.background   = 'rgba(8, 12, 22, 0.85)'
  card.shadowColor  = '#7C9CFF'
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
  badge.color        = '#A78BFA'
  badge.background   = 'rgba(124, 156, 255, 0.18)'
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

  // ----- GUI billboards (style level 4) -----
  const gui = AdvancedDynamicTexture.CreateFullscreenUI('level3-gui', true, scene)
  gui.idealWidth = 1920

  const robotAnchor = MeshBuilder.CreatePlane('l3-robot-anchor', { size: 0.01 }, scene)
  robotAnchor.position.set(ROBOT_POS.x, ROBOT_POS.y + 4.5, ROBOT_POS.z)
  robotAnchor.isVisible      = false
  robotAnchor.isPickable     = false
  robotAnchor.checkCollisions = false

  const swapCard  = makePromptCard(gui, robotAnchor, { key: 'B', label: 'Installer les composants' })
  const adoptCard = makePromptCard(gui, robotAnchor, { key: 'B', label: 'Devenir ami' })

  let mbDone      = false
  let diskDone    = false
  let swapActive  = false
  let swapDone    = false
  let adoptActive = false
  let adoptDone   = false
  let completed   = false
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
    if (!isLevel3) {
      swapCard.isVisible  = false
      adoptCard.isVisible = false
    }
  })

  // Proximité robot — affiche le bon billboard
  const proxObserver = scene.onBeforeRenderObservable.add(() => {
    if (completed) return
    if (!(swapActive || adoptActive)) return
    if (scene.metadata?.currentLevel !== 3) return
    if (scene.metadata?.paused || scene.metadata?.dead) return

    const hero = getHero?.()
    if (!hero) return

    const dx = hero.position.x - ROBOT_POS.x
    const dz = hero.position.z - ROBOT_POS.z
    const distSq = dx*dx + dz*dz
    inRange = distSq <= SWAP_RADIUS * SWAP_RADIUS

    const nearEnough = distSq <= BILLBOARD_RADIUS * BILLBOARD_RADIUS
    swapCard.isVisible  = nearEnough && swapActive  && !swapDone
    adoptCard.isVisible = nearEnough && adoptActive && !adoptDone
  })

  const finalizeSwap = () => {
    if (swapDone) return
    swapDone   = true
    swapActive = false
    swapCard.isVisible = false

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

    robot?.playDance?.()

    adoptActive = true
    inRange     = false
    scene.metadata.level3Phase = 'adopt'

    notifications?.show({
      id:         'objective',
      icon:       'fa-heart',
      title:      'Objectif',
      message:    'Devenez ami avec le robot (combinaison de flèches).',
      persistent: true,
    })
  }

  const finalizeAdopt = () => {
    if (adoptDone) return
    adoptDone   = true
    adoptActive = false
    adoptCard.isVisible = false

    notifications?.dismiss('objective')
    notifications?.show({
      icon:    'fa-heart',
      variant: 'success',
      title:   'Robot adopté',
      message: 'Le robot vous suivra désormais.',
      duration: 5000,
    })

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
    if (swapActive  && !swapDone)  { openSwapModal();  return }
    if (adoptActive && !adoptDone) { openAdoptModal(); return }
  }

  const onKey = (e) => {
    if (e.key !== 'b' && e.key !== 'B') return
    if (scene.metadata?.currentLevel !== 3) return
    if (modalOpen) return
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
    swapCard.isVisible  = false
    adoptCard.isVisible = false
    scene.metadata.level3Phase = 'completed'
    for (const h of handles) {
      try { h.dispose?.() } catch {}
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
      robotAnchor.dispose()
      try { gui.dispose() } catch {}
    },
  }
}
