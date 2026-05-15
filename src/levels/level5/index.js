import { showLevelComplete }      from '../../UI/levelComplete.js'
import { MeshBuilder }            from '@babylonjs/core/Meshes/meshBuilder'
import { Vector3 }                from '@babylonjs/core/Maths/math.vector'
import { AdvancedDynamicTexture } from '@babylonjs/gui/2D/advancedDynamicTexture'
import { Rectangle }              from '@babylonjs/gui/2D/controls/rectangle'
import { TextBlock }              from '@babylonjs/gui/2D/controls/textBlock'
import { Control }                from '@babylonjs/gui/2D/controls/control'

// Hitboxes calées sur les caméras existantes dans le GLB de la map
const HITBOX_ZONES = [
  { x: 95.89,  y: 12, z: 271.99, w: 5, h: 5, d: 5 },
  { x: -72.10, y: 12, z: 264.91, w: 5, h: 5, d: 5 },
  { x: 17.29,  y: 12, z: 224.40, w: 5, h: 5, d: 5 },
  { x: 97.54,  y: 12, z: -30.97, w: 5, h: 5, d: 5 },
  { x: -57.50, y: 12, z: 25.53,  w: 5, h: 3, d: 5 },
  { x: -93.16, y: 12, z: 23.81,  w: 5, h: 5, d: 5 },
]

const CAMERA_HP = 40  // 2 balles (20 dégâts chacune)

export const LEVEL5_INTRO = {
  label:    'Manche',
  title:    'Manche 5',
  subtitle: 'Détruisez toutes les caméras de surveillance',
  dangers: [
    { icon: 'fa-video',      text: 'Caméras de surveillance actives dans la zone' },
    { icon: 'fa-crosshairs', text: 'Neutralisez-les toutes pour progresser' },
  ],
  duration: 7000,
}

function createCameraZone(scene, gui, zone, index, onDeath) {
  // Hitbox invisible — calée sur la caméra GLB de la map
  const hitbox = MeshBuilder.CreateBox(`cam_hitbox_${index}`, {
    width: zone.w, height: zone.h, depth: zone.d,
  }, scene)
  hitbox.position  = new Vector3(zone.x, zone.y, zone.z)
  hitbox.isVisible  = false
  hitbox.isPickable = false

  // Ancre GUI flottante au-dessus de la caméra
  const anchor = MeshBuilder.CreatePlane(`cam_anchor_${index}`, { size: 0.01 }, scene)
  anchor.position = new Vector3(zone.x, zone.y + zone.h / 2 + 2, zone.z)
  anchor.isVisible  = false
  anchor.isPickable = false

  // --- Carte barre de vie ---
  const hpCard = new Rectangle(`cam_hp_card_${index}`)
  hpCard.width        = '164px'
  hpCard.height       = '40px'
  hpCard.cornerRadius = 6
  hpCard.thickness    = 1
  hpCard.color        = 'rgba(148,163,184,0.35)'
  hpCard.background   = 'rgba(0,0,0,0.80)'
  hpCard.isVisible    = false
  hpCard.linkOffsetY  = -95
  gui.addControl(hpCard)
  hpCard.linkWithMesh(anchor)

  // Label "CAM 01"
  const label = new TextBlock(`cam_label_${index}`)
  label.text      = `CAM ${String(index + 1).padStart(2, '0')}`
  label.color     = '#94a3b8'
  label.fontSize  = 11
  label.fontFamily = '"Segoe UI", monospace'
  label.height    = '16px'
  label.verticalAlignment  = Control.VERTICAL_ALIGNMENT_TOP
  label.paddingTop = '4px'
  hpCard.addControl(label)

  // Fond de la barre
  const barBg = new Rectangle(`cam_bar_bg_${index}`)
  barBg.width  = '144px'
  barBg.height = '10px'
  barBg.cornerRadius = 3
  barBg.thickness    = 0
  barBg.background   = 'rgba(30,30,30,0.95)'
  barBg.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM
  barBg.paddingBottom = '6px'
  hpCard.addControl(barBg)

  // Remplissage de la barre (rétrécit avec les HP)
  const barFill = new Rectangle(`cam_bar_fill_${index}`)
  barFill.widthInPixels       = 144
  barFill.height              = '100%'
  barFill.cornerRadius        = 3
  barFill.thickness           = 0
  barFill.background          = '#22c55e'
  barFill.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT
  barBg.addControl(barFill)

  let hp        = CAMERA_HP
  let state     = 'alive'
  let hideTimer = null

  const refreshBar = () => {
    const ratio = Math.max(0, hp / CAMERA_HP)
    barFill.widthInPixels = Math.round(ratio * 144)
    if      (ratio > 0.5)  barFill.background = '#22c55e'
    else if (ratio > 0.2)  barFill.background = '#f59e0b'
    else                   barFill.background = '#ef4444'
    hpCard.isVisible = true
    if (hideTimer) clearTimeout(hideTimer)
    if (state !== 'dead') {
      hideTimer = setTimeout(() => { try { hpCard.isVisible = false } catch {} }, 3000)
    }
  }

  const handle = {
    getRoot:   () => hitbox,
    getState:  () => state,
    hitRadius: Math.max(zone.w, zone.h, zone.d) / 2,  // rayon de détection balle
    damage(amount) {
      if (state === 'dead') return
      hp -= amount
      if (hp <= 0) {
        hp    = 0
        state = 'dead'
        refreshBar()
        setTimeout(() => { try { hpCard.isVisible = false } catch {} }, 1500)
        onDeath?.()
      } else {
        refreshBar()
      }
    },
    dispose() {
      if (hideTimer) clearTimeout(hideTimer)
      try { hitbox.dispose() } catch {}
      try { anchor.dispose() } catch {}
      try { hpCard.dispose() } catch {}
    },
  }

  return handle
}

export async function loadLevel5(scene, { notifications, onComplete } = {}) {
  if (!scene.metadata) scene.metadata = {}
  scene.metadata.currentLevel = 5
  scene.metadata.level5Phase  = 'cameras'
  scene.metadata.cameraHandles = []

  notifications?.show({
    id:         'objective',
    icon:       'fa-video',
    title:      'Objectif',
    message:    `Détruisez les ${HITBOX_ZONES.length} caméras de surveillance.`,
    persistent: true,
  })

  const gui = AdvancedDynamicTexture.CreateFullscreenUI('level5-gui', true, scene)
  gui.idealWidth = 1920

  let destroyedCount = 0
  let completed      = false

  const onCameraDeath = () => {
    destroyedCount++
    notifications?.show({
      icon:    'fa-video-slash',
      variant: 'success',
      title:   'Caméra détruite',
      message: `${destroyedCount} / ${HITBOX_ZONES.length}`,
      duration: 2500,
    })
    if (destroyedCount >= HITBOX_ZONES.length && !completed) {
      completed = true
      scene.metadata.level5Phase = 'completed'
      notifications?.dismiss('objective')
      showLevelComplete({
        title:    'Manche 5 terminée',
        subtitle: 'Toutes les caméras de surveillance ont été neutralisées.',
        duration: 3500,
      })
      setTimeout(() => onComplete?.(), 4000)
    }
  }

  const handles = HITBOX_ZONES.map((zone, i) =>
    createCameraZone(scene, gui, zone, i, onCameraDeath)
  )
  scene.metadata.cameraHandles = handles

  console.log(`[level5] ${handles.length} zone(s) caméra créée(s)`)

  const skip = () => {
    if (completed) return
    completed = true
    scene.metadata.level5Phase = 'completed'
    notifications?.dismiss('objective')
    notifications?.show({
      icon:    'fa-forward',
      variant: 'info',
      title:   'Niveau passé',
      message: 'Cheat: Manche 5 ignorée.',
      duration: 3500,
    })
    onComplete?.()
  }

  return {
    skip,
    dispose: () => {
      for (const h of handles) try { h.dispose?.() } catch {}
      try { gui.dispose() } catch {}
      scene.metadata.cameraHandles = []
    },
  }
}
