import { SceneLoader }            from '@babylonjs/core/Loading/sceneLoader'
import { MeshBuilder }            from '@babylonjs/core/Meshes/meshBuilder'
import { StandardMaterial }       from '@babylonjs/core/Materials/standardMaterial'
import { Color3 }                 from '@babylonjs/core/Maths/math.color'
import { Vector3 }                from '@babylonjs/core/Maths/math.vector'
import { AdvancedDynamicTexture } from '@babylonjs/gui/2D/advancedDynamicTexture'
import { Rectangle }              from '@babylonjs/gui/2D/controls/rectangle'
import { TextBlock }              from '@babylonjs/gui/2D/controls/textBlock'
import { StackPanel }             from '@babylonjs/gui/2D/controls/stackPanel'
import { Control }                from '@babylonjs/gui/2D/controls/control'
import { showMlPuzzleOverlay }    from '../../UI/mlPuzzleOverlay.js'
import { showLevelComplete }      from '../../UI/levelComplete.js'

const JACOB_POS    = { x: 47.73, y: 0.14, z: 24.97 }
const TALK_DIST    = 5

export const LEVEL7_INTRO = {
  label:    'Manche',
  title:    'Manche 7',
  subtitle: 'Trouvez Jacob et obtenez l\'accréditation Sergent IA',
  dangers: [
    { icon: 'fa-person',       text: 'Localisez Jacob Martin dans le secteur' },
    { icon: 'fa-puzzle-piece', text: 'Résolvez le puzzle ML pour obtenir l\'accréditation' },
  ],
  duration: 7000,
}

const JACOB_BASE_PATH = '/level/level7/'
const JACOB_FILE      = 'jacob.glb'

// ─── Création du PNJ Jacob ────────────────────────────────────────────────────
async function createJacob(scene) {
  let jacobRoot  = null
  let useFallback = false

  try {
    const result = await SceneLoader.ImportMeshAsync(null, JACOB_BASE_PATH, JACOB_FILE, scene)
    jacobRoot = result.meshes.find(m => m.name === '__root__') ?? result.meshes[0]
    if (jacobRoot) {
      jacobRoot.rotationQuaternion = null
      jacobRoot.scaling.setAll(3)
      jacobRoot.rotation.y = Math.PI
      jacobRoot.position.set(JACOB_POS.x, JACOB_POS.y, JACOB_POS.z)
      for (const m of jacobRoot.getChildMeshes(false)) m.isPickable = false
      result.animationGroups?.forEach(ag => ag.stop())
      // Lance idle si disponible
      const idle = result.animationGroups?.find(ag => ag.name.toLowerCase().includes('idle') || ag.name.toLowerCase().includes('stand'))
      idle?.play(true)
    }
  } catch (e) {
    console.warn('[level7] échec jacob.glb — fallback placeholder', e)
    useFallback = true
  }

  // Fallback : silhouette humanoïde simple
  if (useFallback || !jacobRoot) {
    const body = MeshBuilder.CreateCylinder('jacob_body', { height: 1.6, diameter: 0.6, tessellation: 12 }, scene)
    body.position.set(JACOB_POS.x, JACOB_POS.y + 0.8, JACOB_POS.z)
    body.isPickable = false
    const head = MeshBuilder.CreateSphere('jacob_head', { diameter: 0.45, segments: 8 }, scene)
    head.position.set(JACOB_POS.x, JACOB_POS.y + 1.85, JACOB_POS.z)
    head.isPickable = false
    const mat = new StandardMaterial('jacob_mat', scene)
    mat.emissiveColor = new Color3(0.2, 0.5, 1.0)
    mat.disableLighting = true
    body.material = mat
    head.material = mat

    // Crée un nœud racine factice pour simplifier le dispose
    jacobRoot = { position: { y: JACOB_POS.y }, _fallbackMeshes: [body, head] }
  }

  // Halo au sol
  const halo = MeshBuilder.CreateDisc('jacob_halo', { radius: 0.9, tessellation: 32 }, scene)
  halo.rotation.x = Math.PI / 2
  halo.position.set(JACOB_POS.x, JACOB_POS.y + 0.02, JACOB_POS.z)
  halo.isPickable = false
  const haloMat = new StandardMaterial('jacob_halo_mat', scene)
  haloMat.emissiveColor   = new Color3(0.15, 0.4, 1.0)
  haloMat.disableLighting = true
  haloMat.alpha           = 0.35
  halo.material = haloMat

  // Flottement léger + halo pulsé
  let t = 0
  const isBabylonMesh = typeof jacobRoot.getChildMeshes === 'function'
  const floatObs = scene.onBeforeRenderObservable.add(() => {
    const dt = scene.getEngine().getDeltaTime() / 1000
    t += dt
    if (isBabylonMesh) {
      jacobRoot.position.y = JACOB_POS.y + Math.sin(t * 1.2) * 0.04
    } else {
      for (const m of jacobRoot._fallbackMeshes ?? []) {
        m.position.y += Math.sin(t * 1.4) * 0.001
      }
    }
    haloMat.alpha = 0.2 + Math.abs(Math.sin(t * 1.2)) * 0.25
  })

  return {
    floatObs,
    dispose() {
      scene.onBeforeRenderObservable.remove(floatObs)
      halo.dispose()
      if (isBabylonMesh) {
        jacobRoot.dispose()
      } else {
        for (const m of jacobRoot._fallbackMeshes ?? []) try { m.dispose() } catch {}
      }
    },
  }
}

// ─── Prompt GUI "E - Parler à Jacob" ─────────────────────────────────────────
function createTalkPrompt(scene, gui) {
  const anchor = MeshBuilder.CreatePlane('jacob_anchor', { size: 0.01 }, scene)
  anchor.position.set(JACOB_POS.x, JACOB_POS.y + 3.2, JACOB_POS.z)
  anchor.isVisible  = false
  anchor.isPickable = false

  const card = new Rectangle('jacob_prompt_card')
  card.width        = '290px'
  card.height       = '72px'
  card.cornerRadius = 12
  card.thickness    = 2
  card.color        = '#3B82F6'
  card.background   = 'rgba(8,12,22,0.88)'
  card.shadowColor  = '#60A5FA'
  card.shadowBlur   = 20
  card.linkOffsetY  = -130
  card.isVisible    = false
  gui.addControl(card)
  card.linkWithMesh(anchor)

  const stack = new StackPanel('jacob_prompt_stack')
  stack.isVertical  = false
  stack.spacing     = 14
  stack.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER
  card.addControl(stack)

  const badge = new Rectangle('jacob_prompt_badge')
  badge.width        = '40px'
  badge.height       = '40px'
  badge.cornerRadius = 6
  badge.thickness    = 2
  badge.color        = '#3B82F6'
  badge.background   = 'rgba(59,130,246,0.18)'
  stack.addControl(badge)

  const badgeText = new TextBlock('jacob_prompt_badge_text')
  badgeText.text       = 'E'
  badgeText.color      = '#eff6ff'
  badgeText.fontWeight = 'bold'
  badgeText.fontSize   = 22
  badgeText.fontFamily = '"Segoe UI", system-ui, sans-serif'
  badge.addControl(badgeText)

  const label = new TextBlock('jacob_prompt_label')
  label.text       = 'Parler à Jacob Martin'
  label.color      = '#eff6ff'
  label.fontSize   = 16
  label.fontWeight = '600'
  label.fontFamily = '"Segoe UI", system-ui, sans-serif'
  label.resizeToFit = true
  stack.addControl(label)

  return { card, anchor }
}

// ─── Chargement principal ─────────────────────────────────────────────────────
export async function loadLevel7(scene, { getHero, notifications, inventory, onComplete } = {}) {
  if (!scene.metadata) scene.metadata = {}
  scene.metadata.currentLevel  = 7
  scene.metadata.level7Phase   = 'find-jacob'

  const gui = AdvancedDynamicTexture.CreateFullscreenUI('level7-gui', true, scene)
  gui.idealWidth = 1920

  notifications?.show({
    id:         'objective',
    icon:       'fa-person',
    title:      'Objectif',
    message:    'Localisez Jacob Martin et parlez-lui pour obtenir l\'accréditation Sergent IA.',
    persistent: true,
  })

  const jacobNPC         = await createJacob(scene)
  const { card, anchor } = createTalkPrompt(scene, gui)

  let overlayOpen = false
  let completed   = false

  const finalize = () => {
    if (completed) return
    completed = true
    scene.metadata.level7Phase = 'completed'
    inventory?.setItem(0, { name: 'Hologramme', icon: '/img/inventaire/holographic.png', rarity: 'legendary' })
    notifications?.dismiss('objective')
    showLevelComplete({
      title:    'Manche 7 terminée',
      subtitle: 'Accréditation Sergent IA obtenue — chambre des données localisée.',
      duration: 3500,
    })
    setTimeout(() => onComplete?.(), 4000)
  }

  // Proximity + E key
  const obs = scene.onBeforeRenderObservable.add(() => {
    if (completed) return
    if (scene.metadata?.paused || scene.metadata?.dead) {
      card.isVisible = false
      return
    }
    const hero = getHero?.()
    if (!hero) { card.isVisible = false; return }
    const dx = hero.position.x - JACOB_POS.x
    const dz = hero.position.z - JACOB_POS.z
    card.isVisible = !overlayOpen && dx * dx + dz * dz <= TALK_DIST * TALK_DIST
  })

  const onKey = (e) => {
    if (e.key !== 'e' && e.key !== 'E') return
    if (overlayOpen || completed) return
    if (scene.metadata?.currentLevel !== 7) return
    if (scene.metadata?.paused || scene.metadata?.dead) return
    const hero = getHero?.()
    if (!hero) return
    const dx = hero.position.x - JACOB_POS.x
    const dz = hero.position.z - JACOB_POS.z
    if (dx * dx + dz * dz > TALK_DIST * TALK_DIST) return

    overlayOpen = true
    card.isVisible = false
    scene.metadata.paused = true
    document.exitPointerLock?.()

    notifications?.dismiss('objective')

    showMlPuzzleOverlay({
      onClose: () => {
        overlayOpen = false
        scene.metadata.paused = false
        if (!completed) {
          notifications?.show({
            id:         'objective',
            icon:       'fa-person',
            title:      'Objectif',
            message:    'Revenez voir Jacob pour compléter le puzzle d\'accréditation.',
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
    scene.metadata.level7Phase = 'completed'
    notifications?.dismiss('objective')
    notifications?.show({
      icon:    'fa-forward',
      variant: 'info',
      title:   'Niveau passé',
      message: 'Cheat: Manche 7 ignorée.',
      duration: 3500,
    })
    onComplete?.()
  }

  return {
    skip,
    dispose: () => {
      scene.onBeforeRenderObservable.remove(obs)
      window.removeEventListener('keydown', onKey)
      jacobNPC.dispose()
      try { anchor.dispose() }  catch {}
      try { card.dispose() }    catch {}
      try { gui.dispose() }     catch {}
    },
  }
}
