import { SceneLoader }            from '@babylonjs/core/Loading/sceneLoader'
import { MeshBuilder }            from '@babylonjs/core/Meshes/meshBuilder'
import { StandardMaterial }       from '@babylonjs/core/Materials/standardMaterial'
import { Color3 }                 from '@babylonjs/core/Maths/math.color'
import { AdvancedDynamicTexture } from '@babylonjs/gui/2D/advancedDynamicTexture'
import { Rectangle }              from '@babylonjs/gui/2D/controls/rectangle'
import { TextBlock }              from '@babylonjs/gui/2D/controls/textBlock'
import { StackPanel }             from '@babylonjs/gui/2D/controls/stackPanel'
import { Control }                from '@babylonjs/gui/2D/controls/control'
import { showAiRecognitionHUD }   from '../../UI/aiRecognitionHUD.js'
import { showFrequencyOverlay }   from '../../UI/frequencyOverlay.js'
import { showLevelComplete }      from '../../UI/levelComplete.js'

const ROBOT_BASE_PATH = '/level/level8/'
const ROBOT_FILE      = 'robotAgent.glb'
const SCAN_DIST       = 14   // distance K pour scanner
const INTERACT_DIST   = 5    // distance E pour synchroniser

const ROBOTS = [
  {
    id:       'XR-221',
    pos:      { x: -41.63, y: 2.24, z: 44.37 },
    rotY:     Math.PI,
    role:     'SECURITY PATROL',
    status:   'ACTIVE',
    loyalty:  '71%',
    created:  '03/11/2025',
    accessLevel: 1,
    sector:   'PERIMETER SECTOR',
    network:  'ISOLATED',
    workAuth: 'SECTOR B — DATA CENTER: DENIED',
    behavior: 'NOMINAL',
    dbMatch:  'PARTIAL',
    isAgent:  false,
  },
  {
    id:       'XR-308',
    pos:      { x: 46.05, y: 1.14, z: -40.98 },
    rotY:     Math.PI,
    role:     'MAINTENANCE',
    status:   'ACTIVE',
    loyalty:  '94%',
    created:  '17/07/2025',
    accessLevel: 2,
    sector:   'MAINTENANCE ZONE',
    network:  'RESTRICTED',
    workAuth: 'MAINTENANCE ONLY',
    behavior: 'NOMINAL',
    dbMatch:  'SUCCESS',
    isAgent:  false,
  },
  {
    id:       'XR-442',
    pos:      { x: 47.57, y: 0.24, z: 137.07 },
    role:     'DATA TRANSPORT',
    status:   'ACTIVE',
    loyalty:  '87%',
    created:  '12/04/2026',
    accessLevel: 3,
    sector:   'AI DATA CENTER',
    network:  'STABLE',
    workAuth: 'VALID',
    behavior: 'NORMAL',
    dbMatch:  'SUCCESS',
    isAgent:  true,
  },
]

export const LEVEL8_INTRO = {
  label:    'Manche',
  title:    'Manche 8',
  subtitle: 'Identifiez l\'agent IA du Data Center et décryptez les coordonnées',
  dangers: [
    { icon: 'fa-robot', text: '3 robots dans le secteur — l\'un travaille au Data Center IA' },
    { icon: 'fa-eye',   text: '[K] Protocole de reconnaissance IA pour scanner les robots' },
    { icon: 'fa-wifi',  text: '[E] Synchroniser les fréquences avec l\'agent identifié' },
  ],
  duration: 8000,
}

// ─── Spawn un robot ────────────────────────────────────────────────────────────
async function spawnRobot(scene, data) {
  let root = null
  try {
    const result = await SceneLoader.ImportMeshAsync(null, ROBOT_BASE_PATH, ROBOT_FILE, scene)
    root = result.meshes.find(m => m.name === '__root__') ?? result.meshes[0]
    if (root) {
      root.rotationQuaternion = null
      root.scaling.setAll(2)
      root.position.set(data.pos.x, data.pos.y, data.pos.z)
      root.rotation.y = data.rotY ?? 0
      for (const m of root.getChildMeshes(false)) m.isPickable = false
      result.animationGroups?.forEach(ag => ag.stop())
      const idle = result.animationGroups?.find(ag =>
        ag.name.toLowerCase().includes('idle') || ag.name.toLowerCase().includes('stand'))
      idle?.play(true)
    }
  } catch (e) {
    console.warn(`[level8] échec robotAgent.glb — fallback pour ${data.id}`, e)
    root = MeshBuilder.CreateCylinder(`robot_fallback_${data.id}`, { height: 1.8, diameter: 0.7, tessellation: 12 }, scene)
    root.position.set(data.pos.x, data.pos.y + 0.9, data.pos.z)
    root.isPickable = false
    const mat = new StandardMaterial(`robot_mat_${data.id}`, scene)
    mat.emissiveColor   = data.isAgent ? new Color3(0.1, 0.8, 0.2) : new Color3(0.3, 0.3, 0.5)
    mat.disableLighting = true
    root.material = mat
  }

  // Halo au sol
  const halo = MeshBuilder.CreateDisc(`robot_halo_${data.id}`, { radius: 0.7, tessellation: 24 }, scene)
  halo.rotation.x = Math.PI / 2
  halo.position.set(data.pos.x, data.pos.y + 0.02, data.pos.z)
  halo.isPickable = false
  const haloMat = new StandardMaterial(`robot_halo_mat_${data.id}`, scene)
  haloMat.emissiveColor   = data.isAgent ? new Color3(0.1, 0.9, 0.3) : new Color3(0.3, 0.3, 0.6)
  haloMat.disableLighting = true
  haloMat.alpha           = 0.3
  halo.material = haloMat

  return {
    data,
    root,
    halo,
    dispose() {
      try { root?.dispose() } catch {}
      try { halo?.dispose() } catch {}
    },
  }
}

// ─── Prompt GUI ──────────────────────────────────────────────────────────────
function createRobotPrompt(scene, gui, data) {
  const anchor = MeshBuilder.CreatePlane(`robot_anchor_${data.id}`, { size: 0.01 }, scene)
  anchor.position.set(data.pos.x, data.pos.y + 3.4, data.pos.z)
  anchor.isVisible = false
  anchor.isPickable = false

  // Carte K (scanner)
  const scanCard = new Rectangle(`scan_card_${data.id}`)
  scanCard.width = '260px'; scanCard.height = '60px'
  scanCard.cornerRadius = 10; scanCard.thickness = 2
  scanCard.color = '#00FF41'; scanCard.background = 'rgba(0,8,2,0.88)'
  scanCard.shadowColor = '#00FF41'; scanCard.shadowBlur = 18
  scanCard.linkOffsetY = -110; scanCard.isVisible = false
  gui.addControl(scanCard)
  scanCard.linkWithMesh(anchor)

  const scanStack = new StackPanel(`scan_stack_${data.id}`)
  scanStack.isVertical = false; scanStack.spacing = 10
  scanStack.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER
  scanCard.addControl(scanStack)

  const scanBadge = new Rectangle(`scan_badge_${data.id}`)
  scanBadge.width = '36px'; scanBadge.height = '36px'
  scanBadge.cornerRadius = 5; scanBadge.thickness = 2
  scanBadge.color = '#00FF41'; scanBadge.background = 'rgba(0,255,65,0.12)'
  scanStack.addControl(scanBadge)
  const scanBadgeText = new TextBlock(`scan_badge_text_${data.id}`)
  scanBadgeText.text = 'K'; scanBadgeText.color = '#ccffcc'
  scanBadgeText.fontWeight = 'bold'; scanBadgeText.fontSize = 20
  scanBadgeText.fontFamily = '"Segoe UI", system-ui, sans-serif'
  scanBadge.addControl(scanBadgeText)

  const scanLabel = new TextBlock(`scan_label_${data.id}`)
  scanLabel.text = 'Scanner ce robot'; scanLabel.color = '#ccffcc'
  scanLabel.fontSize = 14; scanLabel.fontWeight = '600'
  scanLabel.fontFamily = '"Segoe UI", system-ui, sans-serif'
  scanLabel.resizeToFit = true
  scanStack.addControl(scanLabel)

  // Carte E (synchroniser) — uniquement pour l'agent, cachée jusqu'au scan
  let eCard = null
  if (data.isAgent) {
    eCard = new Rectangle(`e_card_${data.id}`)
    eCard.width = '290px'; eCard.height = '60px'
    eCard.cornerRadius = 10; eCard.thickness = 2
    eCard.color = '#FCD34D'; eCard.background = 'rgba(8,6,0,0.88)'
    eCard.shadowColor = '#F59E0B'; eCard.shadowBlur = 18
    eCard.linkOffsetY = -180; eCard.isVisible = false
    gui.addControl(eCard)
    eCard.linkWithMesh(anchor)

    const eStack = new StackPanel(`e_stack_${data.id}`)
    eStack.isVertical = false; eStack.spacing = 10
    eStack.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER
    eCard.addControl(eStack)

    const eBadge = new Rectangle(`e_badge_${data.id}`)
    eBadge.width = '36px'; eBadge.height = '36px'
    eBadge.cornerRadius = 5; eBadge.thickness = 2
    eBadge.color = '#FCD34D'; eBadge.background = 'rgba(252,211,77,0.15)'
    eStack.addControl(eBadge)
    const eBadgeText = new TextBlock(`e_badge_text_${data.id}`)
    eBadgeText.text = 'E'; eBadgeText.color = '#fef3c7'
    eBadgeText.fontWeight = 'bold'; eBadgeText.fontSize = 20
    eBadgeText.fontFamily = '"Segoe UI", system-ui, sans-serif'
    eBadge.addControl(eBadgeText)

    const eLabel = new TextBlock(`e_label_${data.id}`)
    eLabel.text = 'Synchroniser les fréquences'; eLabel.color = '#fef3c7'
    eLabel.fontSize = 14; eLabel.fontWeight = '600'
    eLabel.fontFamily = '"Segoe UI", system-ui, sans-serif'
    eLabel.resizeToFit = true
    eStack.addControl(eLabel)
  }

  return { anchor, scanCard, eCard }
}

// ─── Chargement principal ─────────────────────────────────────────────────────
export async function loadLevel8(scene, { getHero, notifications, onComplete } = {}) {
  if (!scene.metadata) scene.metadata = {}
  scene.metadata.currentLevel = 8
  scene.metadata.level8Phase  = 'scan-robots'

  const gui = AdvancedDynamicTexture.CreateFullscreenUI('level8-gui', true, scene)
  gui.idealWidth = 1920

  notifications?.show({
    id:         'objective',
    icon:       'fa-robot',
    title:      'Objectif',
    message:    'Scannez les robots avec [K] pour identifier l\'agent du Data Center IA. Puis approchez-vous de lui et appuyez sur [E].',
    persistent: true,
  })

  // Spawn les 3 robots
  const handles = await Promise.all(ROBOTS.map(d => spawnRobot(scene, d)))

  // Prompts GUI
  const prompts = handles.map(h => createRobotPrompt(scene, gui, h.data))

  let hudOpen       = false
  let freqOpen      = false
  let completed     = false
  let agentScanned  = false
  let currentHud    = null

  const finalize = () => {
    if (completed) return
    completed = true
    scene.metadata.level8Phase = 'completed'
    notifications?.dismiss('objective')
    showLevelComplete({
      title:    'Manche 8 terminée',
      subtitle: 'Coordonnées décryptées — prochaine destination localisée.',
      duration: 3500,
    })
    setTimeout(() => onComplete?.(), 4000)
  }

  // Observer: affiche les prompts K à proximité
  const obs = scene.onBeforeRenderObservable.add(() => {
    if (completed) return
    const hero = getHero?.()
    if (!hero) return

    handles.forEach((h, i) => {
      const { scanCard, eCard } = prompts[i]
      const paused = scene.metadata?.paused || scene.metadata?.dead
      if (paused) {
        scanCard.isVisible = false
        if (eCard) eCard.isVisible = false
        return
      }
      const dx = hero.position.x - h.data.pos.x
      const dz = hero.position.z - h.data.pos.z
      const d2 = dx * dx + dz * dz
      scanCard.isVisible = !hudOpen && !freqOpen && d2 <= SCAN_DIST * SCAN_DIST
      if (eCard) {
        eCard.isVisible = agentScanned && !hudOpen && !freqOpen && d2 <= SCAN_DIST * SCAN_DIST
      }
    })
  })

  const onKey = (e) => {
    if (completed) return
    if (scene.metadata?.paused || scene.metadata?.dead) return
    const hero = getHero?.()
    if (!hero) return

    // K : toggle scan — ferme si ouvert, sinon ouvre le scan du robot le plus proche
    if (e.key === 'k' || e.key === 'K') {
      if (hudOpen) {
        currentHud?.close()
        return
      }
      if (freqOpen) return

      let nearest = null, nearestD2 = Infinity
      handles.forEach(h => {
        const dx = hero.position.x - h.data.pos.x
        const dz = hero.position.z - h.data.pos.z
        const d2 = dx * dx + dz * dz
        if (d2 < SCAN_DIST * SCAN_DIST && d2 < nearestD2) {
          nearestD2 = d2; nearest = h
        }
      })
      if (!nearest) {
        notifications?.show({
          icon: 'fa-eye-slash', variant: 'warn',
          title: 'Hors de portée',
          message: 'Approchez-vous d\'un robot pour le scanner.',
          duration: 2500,
        })
        return
      }

      hudOpen = true
      scene.metadata.paused = true
      document.exitPointerLock?.()

      // Marque l'agent comme scanné dès que le joueur le scanne
      if (nearest.data.isAgent) agentScanned = true

      currentHud = showAiRecognitionHUD(nearest.data, {
        onClose: () => {
          hudOpen = false
          currentHud = null
          scene.metadata.paused = false
        },
      })
    }

    // E : synchroniser si on est près de l'agent
    if ((e.key === 'e' || e.key === 'E') && !hudOpen && !freqOpen) {
      const agent = handles.find(h => h.data.isAgent)
      if (!agent) return
      const dx = hero.position.x - agent.data.pos.x
      const dz = hero.position.z - agent.data.pos.z
      const d2 = dx * dx + dz * dz

      if (d2 > INTERACT_DIST * INTERACT_DIST) {
        // Si près d'un mauvais robot → feedback
        const wrongNear = handles.find(h => {
          if (h.data.isAgent) return false
          const dx2 = hero.position.x - h.data.pos.x
          const dz2 = hero.position.z - h.data.pos.z
          return dx2 * dx2 + dz2 * dz2 <= INTERACT_DIST * INTERACT_DIST
        })
        if (wrongNear) {
          notifications?.show({
            icon: 'fa-circle-xmark', variant: 'error',
            title: `${wrongNear.data.id} — Accès refusé`,
            message: 'Ce robot ne travaille pas au Data Center. Scannez les autres avec [K].',
            duration: 3000,
          })
        }
        return
      }

      freqOpen = true
      scene.metadata.paused = true
      document.exitPointerLock?.()
      notifications?.dismiss('objective')

      showFrequencyOverlay({
        onClose: () => {
          freqOpen = false
          scene.metadata.paused = false
          if (!completed) {
            notifications?.show({
              id: 'objective', icon: 'fa-wifi', title: 'Objectif',
              message: 'Revenez près de l\'agent XR-442 et appuyez sur [E] pour relancer la synchronisation.',
              persistent: true,
            })
          }
        },
        onSuccess: () => {
          freqOpen = false
          scene.metadata.paused = false
          finalize()
        },
      })
    }
  }
  window.addEventListener('keydown', onKey)

  const skip = () => {
    if (completed) return
    completed = true
    scene.metadata.level8Phase = 'completed'
    notifications?.dismiss('objective')
    notifications?.show({
      icon: 'fa-forward', variant: 'info', title: 'Niveau passé',
      message: 'Cheat: Manche 8 ignorée.', duration: 3500,
    })
    onComplete?.()
  }

  return {
    skip,
    dispose: () => {
      scene.onBeforeRenderObservable.remove(obs)
      window.removeEventListener('keydown', onKey)
      for (const h of handles)  try { h.dispose() }              catch {}
      for (const p of prompts)  {
        try { p.anchor.dispose() }   catch {}
        try { p.scanCard.dispose() } catch {}
        try { p.eCard?.dispose() }   catch {}
      }
      try { gui.dispose() } catch {}
    },
  }
}
