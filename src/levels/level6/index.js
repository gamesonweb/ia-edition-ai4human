import { spawnEnnemi }            from '../level5/ennemiIA.js'
import { showLevelComplete }      from '../../UI/levelComplete.js'
import { showWantedOverlay }      from '../../UI/wantedOverlay.js'
import { SceneLoader }            from '@babylonjs/core/Loading/sceneLoader'
import { MeshBuilder }            from '@babylonjs/core/Meshes/meshBuilder'
import { StandardMaterial }      from '@babylonjs/core/Materials/standardMaterial'
import { Color3 }                from '@babylonjs/core/Maths/math.color'
import { Vector3 }               from '@babylonjs/core/Maths/math.vector'
import { Ray }                   from '@babylonjs/core/Culling/ray'
import { AdvancedDynamicTexture } from '@babylonjs/gui/2D/advancedDynamicTexture'
import { Rectangle }              from '@babylonjs/gui/2D/controls/rectangle'
import { TextBlock }              from '@babylonjs/gui/2D/controls/textBlock'
import { StackPanel }             from '@babylonjs/gui/2D/controls/stackPanel'
import { Control }                from '@babylonjs/gui/2D/controls/control'

// ─── Validation de position ───────────────────────────────────────────────────
// Lance un rayon du centre de zone vers le point de spawn.
// Si un mur bloque le trajet, le spawn est inaccessible → retourne false.
function isSpawnReachable(scene, zoneCenter, spawnPos, enemyRoot) {
  const from = new Vector3(zoneCenter.x, zoneCenter.y + 1.5, zoneCenter.z)
  const to   = new Vector3(spawnPos.x,   spawnPos.y + 1.5,   spawnPos.z)
  const diff = to.subtract(from)
  const dist = diff.length()
  if (dist < 0.5) return true
  diff.scaleInPlace(1 / dist)

  const excluded = new Set([enemyRoot, ...enemyRoot.getChildMeshes(false)])
  const ray = new Ray(from, diff, dist)
  const hit = scene.pickWithRay(ray, m => m.checkCollisions && !excluded.has(m))

  // Un mur est détecté si l'impact est nettement avant la cible
  return !hit?.hit || hit.distance >= dist - 1
}

// Scale par type (ennemiIA_1 = tank plus trapu, ennemiIA_3 = scout plus grand)
const SCALE_BY_FILE = {
  'ennemiIA_1.glb': 2.0,
  'ennemiIA_3.glb': 3.5,
}

const KEY_BASE_PATH  = '/level/level6/'
const KEY_FILE       = 'Key.glb'
const KEY_PICK_DIST  = 5   // rayon de ramassage (unités)

// ─── Zones ────────────────────────────────────────────────────────────────────
// Chaque zone = 4 ennemis + 1 clé qui apparaît une fois la zone libérée
const ZONES = [
  {
    label:  'Zone 1',
    center: { x: 15.27,    y: 0.14, z: 185.44 },
    // Centroïde des spawns ≈ (28.75, 185.75), rayon englobant tous les spawns + marge
    wander: { cx: 28.75, cz: 185.75, radius: 75 },
    spawns: [
      { file: 'ennemiIA_1.glb', position: { x: -35,  y: 0.14, z: 183 } },
      { file: 'ennemiIA_3.glb', position: { x:  10,  y: 0.14, z: 189 } },
      { file: 'ennemiIA_1.glb', position: { x:  55,  y: 0.14, z: 183 } },
      { file: 'ennemiIA_3.glb', position: { x:  85,  y: 0.14, z: 188 } },
    ],
  },
  {
    label:  'Zone 2',
    center: { x: 164.67,   y: 0.14, z: 34.77 },
    // Centroïde des spawns ≈ (165, 38), rayon englobant
    wander: { cx: 165, cz: 38, radius: 55 },
    spawns: [
      { file: 'ennemiIA_3.glb', position: { x: 162, y: 0.14, z: -10 } },
      { file: 'ennemiIA_1.glb', position: { x: 168, y: 0.14, z:  25 } },
      { file: 'ennemiIA_3.glb', position: { x: 162, y: 0.14, z:  55 } },
      { file: 'ennemiIA_1.glb', position: { x: 168, y: 0.14, z:  82 } },
    ],
  },
  {
    label:  'Zone 3',
    center: { x: -191.64,  y: 0.14, z: 132.37 },
    // Centroïde des spawns ≈ (-190, 55), rayon englobant
    wander: { cx: -190, cz: 55, radius: 55 },
    spawns: [
      { file: 'ennemiIA_1.glb', position: { x: -192, y: 0.14, z:   10 } },
      { file: 'ennemiIA_3.glb', position: { x: -188, y: 0.14, z:  100 } },
    ],
  },
]

export const LEVEL6_INTRO = {
  label:    'Manche',
  title:    'Manche 6',
  subtitle: 'Éliminez toutes les unités et récupérez les clés',
  dangers: [
    { icon: 'fa-robot',   text: 'Unités ennemies réparties en 3 zones' },
    { icon: 'fa-key',     text: 'Chaque zone libérée dépose une clé — récupérez-les toutes' },
  ],
  duration: 7000,
}

// ─── Prompt "E" pour la clé ───────────────────────────────────────────────────
function createKeyPrompt(gui, anchor, zoneIndex) {
  const card = new Rectangle(`key_prompt_card_${zoneIndex}`)
  card.width        = '260px'
  card.height       = '72px'
  card.cornerRadius = 12
  card.thickness    = 2
  card.color        = '#FCD34D'
  card.background   = 'rgba(8,12,22,0.88)'
  card.shadowColor  = '#F59E0B'
  card.shadowBlur   = 20
  card.linkOffsetY  = -130
  card.isVisible    = false
  gui.addControl(card)
  card.linkWithMesh(anchor)

  const stack = new StackPanel(`key_prompt_stack_${zoneIndex}`)
  stack.isVertical = false
  stack.spacing    = 14
  stack.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER
  card.addControl(stack)

  const badge = new Rectangle(`key_prompt_badge_${zoneIndex}`)
  badge.width        = '40px'
  badge.height       = '40px'
  badge.cornerRadius = 6
  badge.thickness    = 2
  badge.color        = '#FCD34D'
  badge.background   = 'rgba(251,191,36,0.18)'
  stack.addControl(badge)

  const badgeText = new TextBlock(`key_prompt_badge_text_${zoneIndex}`)
  badgeText.text       = 'E'
  badgeText.color      = '#fefce8'
  badgeText.fontWeight = 'bold'
  badgeText.fontSize   = 22
  badgeText.fontFamily = '"Segoe UI", system-ui, sans-serif'
  badge.addControl(badgeText)

  const label = new TextBlock(`key_prompt_label_${zoneIndex}`)
  label.text       = 'Ramasser la clé'
  label.color      = '#fefce8'
  label.fontSize   = 16
  label.fontWeight = '600'
  label.fontFamily = '"Segoe UI", system-ui, sans-serif'
  label.resizeToFit = true
  stack.addControl(label)

  return card
}

// ─── Spawn clé ────────────────────────────────────────────────────────────────
async function spawnKey(scene, gui, zone, zoneIndex, getHero, onCollect) {
  const pos = zone.center

  // Charge le modèle Key.glb
  let keyRoot = null
  try {
    const result = await SceneLoader.ImportMeshAsync(null, KEY_BASE_PATH, KEY_FILE, scene)
    keyRoot = result.meshes.find(m => m.name === '__root__') ?? result.meshes[0]
    if (keyRoot) {
      keyRoot.rotationQuaternion = null
      keyRoot.scaling.setAll(2)
      keyRoot.position.set(pos.x, pos.y + 1.5, pos.z)
      for (const m of keyRoot.getChildMeshes(false)) m.isPickable = false
    }
  } catch (e) {
    console.warn('[level6] échec Key.glb — fallback sphère dorée', e)
    keyRoot = MeshBuilder.CreateSphere(`key_fallback_${zoneIndex}`, { diameter: 0.9, segments: 8 }, scene)
    keyRoot.position.set(pos.x, pos.y + 1.5, pos.z)
    const mat = new StandardMaterial(`key_mat_${zoneIndex}`, scene)
    mat.emissiveColor  = new Color3(1, 0.82, 0.1)
    mat.diffuseColor   = new Color3(1, 0.75, 0)
    mat.disableLighting = true
    keyRoot.material   = mat
    keyRoot.isPickable = false
  }

  // Ancre GUI au-dessus de la clé
  const anchor = MeshBuilder.CreatePlane(`key_anchor_${zoneIndex}`, { size: 0.01 }, scene)
  anchor.position.set(pos.x, pos.y + 4, pos.z)
  anchor.isVisible  = false
  anchor.isPickable = false

  const promptCard = createKeyPrompt(gui, anchor, zoneIndex)

  let collected = false

  // Rotation + détection proximité
  const obs = scene.onBeforeRenderObservable.add(() => {
    if (collected) return
    if (keyRoot) keyRoot.rotation.y += 0.025

    if (scene.metadata?.paused || scene.metadata?.dead) {
      promptCard.isVisible = false
      return
    }
    const hero = getHero?.()
    if (!hero) { promptCard.isVisible = false; return }

    const dx = hero.position.x - pos.x
    const dz = hero.position.z - pos.z
    promptCard.isVisible = dx * dx + dz * dz <= KEY_PICK_DIST * KEY_PICK_DIST
  })

  // Collecte via touche E
  const onKey = (e) => {
    if (e.key !== 'e' && e.key !== 'E') return
    if (collected) return
    if (scene.metadata?.currentLevel !== 6) return
    if (scene.metadata?.paused || scene.metadata?.dead) return
    const hero = getHero?.()
    if (!hero) return
    const dx = hero.position.x - pos.x
    const dz = hero.position.z - pos.z
    if (dx * dx + dz * dz > KEY_PICK_DIST * KEY_PICK_DIST) return

    collected = true
    promptCard.isVisible = false
    scene.onBeforeRenderObservable.remove(obs)
    window.removeEventListener('keydown', onKey)
    try { keyRoot?.dispose() }   catch {}
    try { anchor.dispose() }     catch {}
    onCollect?.()
  }
  window.addEventListener('keydown', onKey)

  return {
    dispose() {
      collected = true
      scene.onBeforeRenderObservable.remove(obs)
      window.removeEventListener('keydown', onKey)
      try { keyRoot?.dispose() }    catch {}
      try { anchor.dispose() }      catch {}
      try { promptCard.dispose() }  catch {}
    },
  }
}

// ─── Ordinateur central ──────────────────────────────────────────────────────
const COMPUTER_BASE_PATH = '/level/level4/'
const COMPUTER_FILE      = 'computer.glb'
const COMPUTER_POSITION  = { x: 15.27, y: 0.14, z: 185.44 } // centre Zone 1
const COMPUTER_PICK_DIST = 5

async function spawnComputer(scene, gui, { getHero, notifications, onSuccess } = {}) {
  let computerRoot = null
  try {
    const result = await SceneLoader.ImportMeshAsync(null, COMPUTER_BASE_PATH, COMPUTER_FILE, scene)
    computerRoot = result.meshes.find(m => m.name === '__root__') ?? result.meshes[0]
    if (computerRoot) {
      computerRoot.rotationQuaternion = null
      computerRoot.rotation.y = -Math.PI / 2
      computerRoot.scaling.setAll(4)
      computerRoot.position.set(COMPUTER_POSITION.x, COMPUTER_POSITION.y, COMPUTER_POSITION.z)
      for (const m of computerRoot.getChildMeshes(false)) m.isPickable = false
    }
  } catch (e) {
    console.warn('[level6] échec computer.glb — fallback boîte', e)
    computerRoot = MeshBuilder.CreateBox('computer_fallback', { width: 1.2, height: 1.8, depth: 0.6 }, scene)
    computerRoot.position.set(COMPUTER_POSITION.x, COMPUTER_POSITION.y + 0.9, COMPUTER_POSITION.z)
    const mat = new StandardMaterial('computer_mat', scene)
    mat.emissiveColor   = new Color3(0.1, 0.4, 1)
    mat.disableLighting = true
    computerRoot.material = mat
    computerRoot.isPickable = false
  }

  // Ancre GUI
  const anchor = MeshBuilder.CreatePlane('computer_anchor', { size: 0.01 }, scene)
  anchor.position.set(COMPUTER_POSITION.x, COMPUTER_POSITION.y + 4, COMPUTER_POSITION.z)
  anchor.isVisible  = false
  anchor.isPickable = false

  // Prompt "E"
  const card = new Rectangle('computer_prompt_card')
  card.width        = '300px'
  card.height       = '72px'
  card.cornerRadius = 12
  card.thickness    = 2
  card.color        = '#67E8F9'
  card.background   = 'rgba(8,12,22,0.88)'
  card.shadowColor  = '#22D3EE'
  card.shadowBlur   = 20
  card.linkOffsetY  = -130
  card.isVisible    = false
  gui.addControl(card)
  card.linkWithMesh(anchor)

  const stack = new StackPanel('computer_prompt_stack')
  stack.isVertical  = false
  stack.spacing     = 14
  stack.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER
  card.addControl(stack)

  const badge = new Rectangle('computer_prompt_badge')
  badge.width        = '40px'
  badge.height       = '40px'
  badge.cornerRadius = 6
  badge.thickness    = 2
  badge.color        = '#67E8F9'
  badge.background   = 'rgba(34,211,238,0.18)'
  stack.addControl(badge)

  const badgeText = new TextBlock('computer_prompt_badge_text')
  badgeText.text       = 'E'
  badgeText.color      = '#ecfeff'
  badgeText.fontWeight = 'bold'
  badgeText.fontSize   = 22
  badgeText.fontFamily = '"Segoe UI", system-ui, sans-serif'
  badge.addControl(badgeText)

  const label = new TextBlock('computer_prompt_label')
  label.text       = 'Entrer dans le système'
  label.color      = '#ecfeff'
  label.fontSize   = 16
  label.fontWeight = '600'
  label.fontFamily = '"Segoe UI", system-ui, sans-serif'
  label.resizeToFit = true
  stack.addControl(label)

  let used = false

  const obs = scene.onBeforeRenderObservable.add(() => {
    if (used) return
    if (scene.metadata?.paused || scene.metadata?.dead) {
      card.isVisible = false
      return
    }
    const hero = getHero?.()
    if (!hero) { card.isVisible = false; return }
    const dx = hero.position.x - COMPUTER_POSITION.x
    const dz = hero.position.z - COMPUTER_POSITION.z
    card.isVisible = dx * dx + dz * dz <= COMPUTER_PICK_DIST * COMPUTER_PICK_DIST
  })

  const onKey = (e) => {
    if (e.key !== 'e' && e.key !== 'E') return
    if (used) return
    if (scene.metadata?.currentLevel !== 6) return
    if (scene.metadata?.paused || scene.metadata?.dead) return
    const hero = getHero?.()
    if (!hero) return
    const dx = hero.position.x - COMPUTER_POSITION.x
    const dz = hero.position.z - COMPUTER_POSITION.z
    if (dx * dx + dz * dz > COMPUTER_PICK_DIST * COMPUTER_PICK_DIST) return

    used = true
    card.isVisible = false
    scene.onBeforeRenderObservable.remove(obs)
    window.removeEventListener('keydown', onKey)

    // Pause + déverrouille le pointeur
    scene.metadata.paused = true
    document.exitPointerLock?.()

    notifications?.dismiss('objective')

    showWantedOverlay({
      onClose: () => {
        scene.metadata.paused = false
      },
      onSuccess: () => {
        scene.metadata.paused = false
        onSuccess?.()
      },
    })
  }
  window.addEventListener('keydown', onKey)

  return {
    dispose() {
      used = true
      scene.onBeforeRenderObservable.remove(obs)
      window.removeEventListener('keydown', onKey)
      try { computerRoot?.dispose() } catch {}
      try { anchor.dispose() }        catch {}
      try { card.dispose() }          catch {}
    },
  }
}

// ─── Chargement principal ─────────────────────────────────────────────────────
export async function loadLevel6(scene, { getHero, notifications, damage, inventory, onComplete } = {}) {
  if (!scene.metadata) scene.metadata = {}
  scene.metadata.currentLevel       = 6
  scene.metadata.level6Phase        = 'combat'
  scene.metadata.ennemiHandles      = []
  scene.metadata.level6ZonesCleared = []   // indices des zones dont tous les ennemis sont morts
  scene.metadata.level6KeysCollected = 0   // nb de clés ramassées
  scene.metadata.level6ComputerActive = false // ordinateur apparu

  const gui = AdvancedDynamicTexture.CreateFullscreenUI('level6-gui', true, scene)
  gui.idealWidth = 1920

  const totalEnemies = ZONES.reduce((s, z) => s + z.spawns.length, 0)

  notifications?.show({
    id:         'objective',
    icon:       'fa-robot',
    title:      'Objectif',
    message:    `Éliminez les ${totalEnemies} unités ennemies réparties en ${ZONES.length} zones.`,
    persistent: true,
  })

  let totalDead   = 0
  let keysCollected = 0
  let completed   = false
  const allHandles  = []
  const keyHandles  = []

  // Appelé quand le joueur déverrouille Jacob → fin du niveau
  const finalize = () => {
    if (completed) return
    completed = true
    scene.metadata.level6Phase = 'completed'
    notifications?.dismiss('objective')
    showLevelComplete({
      title:    'Manche 6 terminée',
      subtitle: 'Jacob Martin a été déverrouillé du système de surveillance.',
      duration: 3500,
    })
    setTimeout(() => onComplete?.(), 4000)
  }

  // Appelé quand les 3 clés sont récupérées → phase ordinateur
  const onAllKeysCollected = () => {
    scene.metadata.level6Phase = 'find-computer'
    notifications?.dismiss('objective')
    notifications?.show({
      id:         'objective',
      icon:       'fa-computer',
      title:      'Objectif',
      message:    'Accédez à l\'ordinateur central et déverrouillez le système.',
      persistent: true,
    })
    scene.metadata.level6ComputerActive = true
    spawnComputer(scene, gui, { getHero, notifications, onSuccess: finalize })
  }

  // Spawn les ennemis zone par zone
  for (let zi = 0; zi < ZONES.length; zi++) {
    const zone = ZONES[zi]
    let zoneDeadCount = 0

    const onZoneEnemyDeath = async () => {
      zoneDeadCount++
      totalDead++

      notifications?.show({
        icon:    'fa-skull',
        variant: 'success',
        title:   'Unité neutralisée',
        message: `${totalDead} / ${totalEnemies}`,
        duration: 2000,
      })

      if (zoneDeadCount >= zone.spawns.length) {
        // Marque la zone comme libérée pour la minimap
        if (!scene.metadata.level6ZonesCleared.includes(zi))
          scene.metadata.level6ZonesCleared.push(zi)

        // Tous les ennemis de la zone sont morts → spawn clé
        notifications?.show({
          icon:    'fa-key',
          variant: 'info',
          title:   `${zone.label} libérée`,
          message: 'Une clé est apparue — allez la récupérer.',
          duration: 4000,
        })
        const kh = await spawnKey(scene, gui, zone, zi, getHero, () => {
          keysCollected++
          scene.metadata.level6KeysCollected = keysCollected
          inventory?.setItem(0, { name: 'Clés', icon: '/img/inventaire/Key.png', quantity: keysCollected, rarity: 'epic' })
          notifications?.show({
            icon:    'fa-key',
            variant: 'success',
            title:   'Clé récupérée',
            message: `${keysCollected} / ${ZONES.length}`,
            duration: 3000,
          })
          if (keysCollected >= ZONES.length) onAllKeysCollected()
        })
        if (kh) keyHandles.push(kh)
      }
    }

    // Spawn séquentiel pour éviter les freezes
    for (const cfg of zone.spawns) {
      const handle = await spawnEnnemi(scene, {
        file:         cfg.file,
        position:     cfg.position,
        getHero,
        damagePlayer: damage,
        wanderZone:   zone.wander,
        onDeath:      onZoneEnemyDeath,
      })
      if (handle) {
        const s = SCALE_BY_FILE[cfg.file] ?? 2.0
        handle.root.scaling.setAll(s)

        // Téléporter au centre si le spawn est derrière un mur ou dans un bâtiment
        if (!isSpawnReachable(scene, zone.center, cfg.position, handle.root)) {
          const jitter = () => (Math.random() - 0.5) * 4
          handle.root.position.set(
            zone.center.x + jitter(),
            zone.center.y,
            zone.center.z + jitter(),
          )
          console.log(`[level6] zone ${zi} — spawn bloqué, ennemi téléporté au centre`)
        }

        allHandles.push(handle)
      }
    }
  }

  console.log(`[level6] ${allHandles.length} ennemis spawned`)

  const skip = () => {
    if (completed) return
    completed = true
    scene.metadata.level6Phase = 'completed'
    notifications?.dismiss('objective')
    notifications?.show({
      icon:    'fa-forward',
      variant: 'info',
      title:   'Niveau passé',
      message: 'Cheat: Manche 6 ignorée.',
      duration: 3500,
    })
    onComplete?.()
  }

  return {
    skip,
    dispose: () => {
      for (const h of allHandles)  try { h.dispose?.() }  catch {}
      for (const k of keyHandles)  try { k.dispose?.() }  catch {}
      try { gui.dispose() } catch {}
      scene.metadata.ennemiHandles = []
    },
  }
}
