import { MeshBuilder }            from '@babylonjs/core/Meshes/meshBuilder'
import { StandardMaterial }       from '@babylonjs/core/Materials/standardMaterial'
import { Color3 }                 from '@babylonjs/core/Maths/math.color'
import { AdvancedDynamicTexture } from '@babylonjs/gui/2D/advancedDynamicTexture'
import { Rectangle }              from '@babylonjs/gui/2D/controls/rectangle'
import { TextBlock }              from '@babylonjs/gui/2D/controls/textBlock'
import { StackPanel }             from '@babylonjs/gui/2D/controls/stackPanel'
import { Control }                from '@babylonjs/gui/2D/controls/control'
import { showCombinationOverlay } from '../../UI/combinationOverlay.js'
import { showLevelComplete }      from '../../UI/levelComplete.js'

// Coordonnées décryptées au level 8
const FACTORY_POS  = { x: -46.57, y: 0.14, z: 15.64 }
const INTERACT_DIST = 5

export const LEVEL9_INTRO = {
  label:    'Manche',
  title:    'Manche 9',
  subtitle: 'Accédez à l\'usine centrale IA',
  dangers: [
    { icon: 'fa-location-dot', text: 'Rendez-vous aux coordonnées décryptées' },
    { icon: 'fa-lock',         text: 'Entrez la combinaison de sécurité directionnelle' },
  ],
  duration: 7000,
}

// ─── Panneau de sécurité (entrée de l'usine) ─────────────────────────────────
function createFactoryPanel(scene) {
  // Porte
  const door = MeshBuilder.CreateBox('factory_door', { width: 3, height: 4, depth: 0.3 }, scene)
  door.position.set(FACTORY_POS.x, FACTORY_POS.y + 2, FACTORY_POS.z)
  door.isPickable = false
  const doorMat = new StandardMaterial('factory_door_mat', scene)
  doorMat.diffuseColor  = new Color3(0.08, 0.08, 0.14)
  doorMat.emissiveColor = new Color3(0.02, 0.02, 0.06)
  doorMat.specularColor = new Color3(0.3, 0.3, 0.4)
  door.material = doorMat

  // Cadre lumineux
  const frame = MeshBuilder.CreateBox('factory_frame', { width: 3.3, height: 4.3, depth: 0.15 }, scene)
  frame.position.set(FACTORY_POS.x, FACTORY_POS.y + 2, FACTORY_POS.z - 0.1)
  frame.isPickable = false
  const frameMat = new StandardMaterial('factory_frame_mat', scene)
  frameMat.emissiveColor  = new Color3(0.6, 0.1, 0.1)
  frameMat.disableLighting = true
  frame.material = frameMat

  // Panneau de saisie (boîtier)
  const panel = MeshBuilder.CreateBox('factory_panel', { width: 0.6, height: 0.9, depth: 0.15 }, scene)
  panel.position.set(FACTORY_POS.x + 1.8, FACTORY_POS.y + 1.3, FACTORY_POS.z - 0.25)
  panel.isPickable = false
  const panelMat = new StandardMaterial('factory_panel_mat', scene)
  panelMat.emissiveColor  = new Color3(0.05, 0.15, 0.4)
  panelMat.disableLighting = true
  panel.material = panelMat

  // Halo au sol
  const halo = MeshBuilder.CreateDisc('factory_halo', { radius: 2, tessellation: 48 }, scene)
  halo.rotation.x = Math.PI / 2
  halo.position.set(FACTORY_POS.x, FACTORY_POS.y + 0.02, FACTORY_POS.z)
  halo.isPickable = false
  const haloMat = new StandardMaterial('factory_halo_mat', scene)
  haloMat.emissiveColor   = new Color3(0.6, 0.08, 0.08)
  haloMat.disableLighting = true
  haloMat.alpha           = 0.25
  halo.material = haloMat

  // Pulsation porte + halo
  let t = 0
  const pulseObs = scene.onBeforeRenderObservable.add(() => {
    const dt = scene.getEngine().getDeltaTime() / 1000
    t += dt
    const pulse = 0.5 + Math.abs(Math.sin(t * 1.5)) * 0.5
    frameMat.emissiveColor.set(0.5 * pulse, 0.05 * pulse, 0.05 * pulse)
    haloMat.alpha = 0.12 + Math.abs(Math.sin(t * 1.2)) * 0.18
  })

  return {
    pulseObs,
    dispose() {
      scene.onBeforeRenderObservable.remove(pulseObs)
      door.dispose(); frame.dispose(); panel.dispose(); halo.dispose()
    },
  }
}

// ─── Prompt GUI ──────────────────────────────────────────────────────────────
function createEntryPrompt(scene, gui) {
  const anchor = MeshBuilder.CreatePlane('factory_anchor', { size: 0.01 }, scene)
  anchor.position.set(FACTORY_POS.x, FACTORY_POS.y + 5.5, FACTORY_POS.z)
  anchor.isVisible  = false
  anchor.isPickable = false

  const card = new Rectangle('factory_prompt_card')
  card.width        = '310px'
  card.height       = '68px'
  card.cornerRadius = 12
  card.thickness    = 2
  card.color        = '#F87171'
  card.background   = 'rgba(14,4,4,0.9)'
  card.shadowColor  = '#EF4444'
  card.shadowBlur   = 22
  card.linkOffsetY  = -120
  card.isVisible    = false
  gui.addControl(card)
  card.linkWithMesh(anchor)

  const stack = new StackPanel('factory_prompt_stack')
  stack.isVertical  = false
  stack.spacing     = 14
  stack.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER
  card.addControl(stack)

  const badge = new Rectangle('factory_prompt_badge')
  badge.width        = '40px'
  badge.height       = '40px'
  badge.cornerRadius = 6
  badge.thickness    = 2
  badge.color        = '#F87171'
  badge.background   = 'rgba(239,68,68,0.18)'
  stack.addControl(badge)

  const badgeText = new TextBlock('factory_prompt_badge_text')
  badgeText.text       = 'E'
  badgeText.color      = '#fef2f2'
  badgeText.fontWeight = 'bold'
  badgeText.fontSize   = 22
  badgeText.fontFamily = '"Segoe UI", system-ui, sans-serif'
  badge.addControl(badgeText)

  const label = new TextBlock('factory_prompt_label')
  label.text       = 'Accéder au panneau de sécurité'
  label.color      = '#fef2f2'
  label.fontSize   = 14
  label.fontWeight = '600'
  label.fontFamily = '"Segoe UI", system-ui, sans-serif'
  label.resizeToFit = true
  stack.addControl(label)

  return { card, anchor }
}

// ─── Chargement principal ─────────────────────────────────────────────────────
export async function loadLevel9(scene, { getHero, notifications, onComplete } = {}) {
  if (!scene.metadata) scene.metadata = {}
  scene.metadata.currentLevel = 9
  scene.metadata.level9Phase  = 'reach-factory'

  const gui = AdvancedDynamicTexture.CreateFullscreenUI('level9-gui', true, scene)
  gui.idealWidth = 1920

  notifications?.show({
    id:         'objective',
    icon:       'fa-location-dot',
    title:      'Objectif',
    message:    'Rendez-vous à l\'usine centrale IA (coordonnées décryptées) et entrez la combinaison de sécurité.',
    persistent: true,
  })

  const factoryPanel       = createFactoryPanel(scene)
  const { card, anchor }   = createEntryPrompt(scene, gui)

  let overlayOpen = false
  let completed   = false

  const finalize = () => {
    if (completed) return
    completed = true
    scene.metadata.level9Phase = 'completed'
    notifications?.dismiss('objective')
    showLevelComplete({
      title:    'Manche 9 terminée',
      subtitle: 'Accès à l\'usine centrale IA obtenu — opération en cours.',
      duration: 3500,
    })
    setTimeout(() => onComplete?.(), 4000)
  }

  const obs = scene.onBeforeRenderObservable.add(() => {
    if (completed) return
    if (scene.metadata?.paused || scene.metadata?.dead) {
      card.isVisible = false
      return
    }
    const hero = getHero?.()
    if (!hero) { card.isVisible = false; return }
    const dx = hero.position.x - FACTORY_POS.x
    const dz = hero.position.z - FACTORY_POS.z
    card.isVisible = !overlayOpen && dx * dx + dz * dz <= INTERACT_DIST * INTERACT_DIST
  })

  const onKey = (e) => {
    if (e.key !== 'e' && e.key !== 'E') return
    if (overlayOpen || completed) return
    if (scene.metadata?.currentLevel !== 9) return
    if (scene.metadata?.paused || scene.metadata?.dead) return
    const hero = getHero?.()
    if (!hero) return
    const dx = hero.position.x - FACTORY_POS.x
    const dz = hero.position.z - FACTORY_POS.z
    if (dx * dx + dz * dz > INTERACT_DIST * INTERACT_DIST) return

    overlayOpen = true
    card.isVisible = false
    scene.metadata.paused = true
    document.exitPointerLock?.()
    notifications?.dismiss('objective')

    showCombinationOverlay({
      onClose: () => {
        overlayOpen = false
        scene.metadata.paused = false
        if (!completed) {
          notifications?.show({
            id:         'objective',
            icon:       'fa-lock',
            title:      'Objectif',
            message:    'Revenez au panneau de sécurité et entrez la combinaison correcte.',
            persistent: true,
          })
        }
      },
      onSuccess: () => {
        overlayOpen = false
        scene.metadata.paused = false
        finalize()
      },
    })
  }
  window.addEventListener('keydown', onKey)

  const skip = () => {
    if (completed) return
    completed = true
    scene.metadata.level9Phase = 'completed'
    notifications?.dismiss('objective')
    notifications?.show({
      icon: 'fa-forward', variant: 'info',
      title: 'Niveau passé', message: 'Cheat: Manche 9 ignorée.', duration: 3500,
    })
    onComplete?.()
  }

  return {
    skip,
    dispose: () => {
      scene.onBeforeRenderObservable.remove(obs)
      window.removeEventListener('keydown', onKey)
      factoryPanel.dispose()
      try { anchor.dispose() } catch {}
      try { card.dispose() }   catch {}
      try { gui.dispose() }    catch {}
    },
  }
}
