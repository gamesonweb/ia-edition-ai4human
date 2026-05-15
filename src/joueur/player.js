import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader'
import { Vector3 } from '@babylonjs/core/Maths/math.vector'
import { AnimationPropertiesOverride } from '@babylonjs/core/Animations/animationPropertiesOverride'
import { GAME_CONFIG } from '../config/gameConfig.js'

// Noms exacts d'os courants pour la main droite (rigs Mixamo, Rigify, Biped, etc.)
const RIGHT_HAND_BONE_EXACT = [
  'mixamorig:RightHand',
  'RightHand',
  'hand_r',
  'Hand_R',
  'Bip001 R Hand',
  'right_hand',
  'RHand',
  'mixamorig:RightHandIndex1',
]

// Position / rotation du pistolet dans l'espace de l'os de la main
// → à ajuster si le pistolet n'est pas bien orienté/placé
const GUN_OFFSET = {
  position: new Vector3(0, 0.5, 0),
  rotation: new Vector3(-Math.PI / 2, 0, -Math.PI / 2),
  // Scale du pistolet en espace local de l'os.
  // Le héros est à scale 0.5 ; on compense pour obtenir une taille de main réaliste.
  scale: 1 / GAME_CONFIG.HERO.SCALE * 1,   // ≈ 0.16 — tweakable
}

const CHARACTER_FILES = {
  George:   'George.glb',
  stephane: 'stephane.glb',
}

export async function createPlayer(scene, { character = 'George' } = {}) {
  const file = CHARACTER_FILES[character] ?? CHARACTER_FILES.George
  const result = await SceneLoader.ImportMeshAsync(null, '/map/mainPersonnage/', file, scene)
  const hero = result.meshes[0]
  hero.name = 'hero'

  const cfg = GAME_CONFIG.HERO
  hero.position   = new Vector3(29.28, 0.14, 322.42)
  hero.scaling.setAll(cfg.SCALE)
  hero.isPickable = false

  // Le GLB importe avec un rotationQuaternion actif → rotation.y serait ignoré sans ça
  hero.rotationQuaternion = null

  // Collision : ellipsoïde autour du héros (ne pas l'appliquer aux enfants pour éviter les auto-collisions)
  hero.checkCollisions = true
  hero.ellipsoid       = new Vector3(cfg.ELLIPSOID.x, cfg.ELLIPSOID.y, cfg.ELLIPSOID.z)
  hero.ellipsoidOffset = new Vector3(cfg.ELLIPSOID_OFFSET.x, cfg.ELLIPSOID_OFFSET.y, cfg.ELLIPSOID_OFFSET.z)

  scene.animationPropertiesOverride = new AnimationPropertiesOverride()
  scene.animationPropertiesOverride.enableBlending = true
  scene.animationPropertiesOverride.blendingSpeed  = GAME_CONFIG.ANIMATIONS.BLENDING_SPEED

  const animGroups = result.animationGroups
  console.log('[player] Animations disponibles:', animGroups.map(a => a.name))
  animGroups.forEach(ag => ag.stop())

  const findAnim = (...names) => {
    for (const name of names) {
      const found = animGroups.find(ag => ag.name.toLowerCase().includes(name.toLowerCase()))
      if (found) return found
    }
    return null
  }

  const idleAnim      = findAnim('idle', 'stand')
  const walkAnim      = findAnim('walk')
  const runAnim       = findAnim('running', 'run')
  const deathAnim     = findAnim('death', 'die', 'dying', 'killed', 'dead')
  // fight_idle : posture de combat en boucle (touche F toggle)
  const fightIdleAnim =
    animGroups.find(ag => ag.name.toLowerCase() === 'fight_idle') ??
    animGroups.find(ag => {
      const n = ag.name.toLowerCase()
      return n.includes('fight') && n.includes('idle')
    }) ?? null
  // fight : frappe one-shot (gardé pour usage futur)
  const fightAnim =
    animGroups.find(ag => ag.name.toLowerCase() === 'fight') ??
    animGroups.find(ag => {
      const n = ag.name.toLowerCase()
      return n.includes('fight') && !n.includes('idle')
    }) ?? null

  console.log('[player] idle:', idleAnim?.name, '| walk:', walkAnim?.name, '| run:', runAnim?.name, '| death:', deathAnim?.name, '| fight_idle:', fightIdleAnim?.name, '| fight:', fightAnim?.name)

  // ---- Pistolet dans la main droite ----
  const gunMesh = await attachGunToHand(scene, hero, result.skeletons)

  return { hero, meshes: result.meshes, animations: { idleAnim, walkAnim, runAnim, deathAnim, fightIdleAnim, fightAnim }, gunMesh }
}

/**
 * Charge gun.glb et l'attache à l'os de la main droite du héros.
 * Logue tous les os disponibles pour faciliter l'ajustement du nom si besoin.
 * @param {import('@babylonjs/core').Scene} scene
 * @param {import('@babylonjs/core').AbstractMesh} hero
 * @returns {Promise<import('@babylonjs/core').AbstractMesh | null>}
 */
async function attachGunToHand(scene, hero, skeletons = []) {
  let gunResult
  try {
    gunResult = await SceneLoader.ImportMeshAsync(null, '/pistol/', 'gun.glb', scene)
  } catch (e) {
    console.warn('[player] Impossible de charger gun.glb :', e)
    return null
  }

  const gunRoot = gunResult.meshes[0]
  gunRoot.name = 'hero-gun'

  // Désactiver les animations internes du pistolet s'il en a
  gunResult.animationGroups.forEach(ag => ag.stop())

  // Trouver le squelette du héros
  const skeleton = skeletons?.[0] ?? scene.skeletons.find(s => s.name.includes('hero') || s.name.includes('Armature'))
  if (!skeleton) {
    console.warn('[player] Aucun squelette trouvé sur le héros — le pistolet sera parenté au mesh racine')
    gunRoot.parent = hero
    applyGunTransform(gunRoot)
    return gunRoot
  }

  // Log tous les os pour debug (utile si l'attachement ne fonctionne pas)
  const boneNames = skeleton.bones.map(b => b.name)
  console.log('[player] Os disponibles:', boneNames)

  // 1. Recherche exacte
  let handBone = RIGHT_HAND_BONE_EXACT.reduce((found, name) => {
    return found ?? skeleton.bones.find(b => b.name === name) ?? null
  }, null)

  // 2. Recherche partielle insensible à la casse : os contenant "hand" + "right" (ou "r")
  if (!handBone) {
    handBone = skeleton.bones.find(b => {
      const n = b.name.toLowerCase()
      return (n.includes('hand') || n.includes('main')) && (n.includes('right') || n.includes('droite') || /[._\s-]r($|[._\s-])/.test(n))
    }) ?? null
  }

  if (!handBone) {
    console.warn(
      '[player] Os de main droite introuvable — copie un des noms ci-dessus dans RIGHT_HAND_BONE_EXACT',
    )
    gunRoot.parent = hero
    applyGunTransform(gunRoot)
    return gunRoot
  }

  console.log('[player] Pistolet attaché à l\'os :', handBone.name)

  // Récupérer le mesh skinné auquel appartient le squelette (premier enfant non-root)
  const skinnedMesh = hero.getChildMeshes().find(m => m.skeleton === skeleton) ?? hero
  gunRoot.attachToBone(handBone, skinnedMesh)
  applyGunTransform(gunRoot)

  return gunRoot
}

/**
 * Applique position / rotation / scale du pistolet relativement à l'os (ou au mesh héros).
 * Modifier GUN_OFFSET en haut du fichier pour tweaker visuellement.
 */
function applyGunTransform(gunRoot) {
  gunRoot.rotationQuaternion = null
  gunRoot.position  = GUN_OFFSET.position.clone()
  gunRoot.rotation  = GUN_OFFSET.rotation.clone()
  gunRoot.scaling.setAll(GUN_OFFSET.scale)
}
