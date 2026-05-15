import { SceneLoader }      from '@babylonjs/core/Loading/sceneLoader'
import { MeshBuilder }      from '@babylonjs/core/Meshes/meshBuilder'
import { Mesh }             from '@babylonjs/core/Meshes/mesh'
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial'
import { DynamicTexture }   from '@babylonjs/core/Materials/Textures/dynamicTexture'
import { Color3 }           from '@babylonjs/core/Maths/math.color'
import { Vector3 }          from '@babylonjs/core/Maths/math.vector'

const ENNEMI_BASE = '/ennemiIA/'

const STATE = {
  WANDER:  'wander',
  FOLLOW:  'follow',
  PURSUIT: 'pursuit',
  SHOOT:   'shoot',
  RETREAT: 'retreat',
  DEAD:    'dead',
}

// Stats par type de fichier GLB
const PRESETS = {
  'ennemiIA_1.glb': {
    hp:             80,
    speed:          6,
    detectionRange: 55,
    shootRange:     28,
    retreatRange:   3.5,
    shootCooldown:  1.6,
    shootDamage:    10,
    scale:          1.1,
  },
  'ennemiIA_3.glb': {
    hp:             40,
    speed:          11,
    detectionRange: 65,
    shootRange:     22,
    retreatRange:   2.5,
    shootCooldown:  1.0,
    shootDamage:    6,
    scale:          1.0,
  },
}

const WANDER_RADIUS      = 25
const WANDER_STOP_DIST   = 1.5
const ENEMY_GRAVITY      = 9    // unités/s, identique au héros (0.15 × 60fps)
const HEALTH_BAR_DURATION = 4000

const ENEMY_BULLET_SPEED    = 28   // unités/seconde
const ENEMY_BULLET_MAX_DIST = 120  // distance max avant destruction
const ENEMY_BULLET_HIT_DIST = 1.8  // rayon d'impact sur le joueur

// Matériau partagé entre toutes les instances d'ennemis
let _sharedBulletMat = null
function getEnemyBulletMat(scene) {
  if (_sharedBulletMat) return _sharedBulletMat
  _sharedBulletMat = new StandardMaterial('enm-bullet-shared-mat', scene)
  _sharedBulletMat.emissiveColor  = new Color3(1, 0.15, 0.05)
  _sharedBulletMat.disableLighting = true
  return _sharedBulletMat
}

// ─── Barre de vie 3D ─────────────────────────────────────────────────────────
function makeHealthBar(scene, id) {
  const W = 512, H = 80
  const tex = new DynamicTexture(`enm-hp-tex-${id}`, { width: W, height: H }, scene, false)
  tex.hasAlpha = true

  const mat = new StandardMaterial(`enm-hp-mat-${id}`, scene)
  mat.diffuseTexture             = tex
  mat.emissiveColor              = new Color3(1, 1, 1)
  mat.specularColor              = new Color3(0, 0, 0)
  mat.useAlphaFromDiffuseTexture = true
  mat.backFaceCulling            = false
  mat.disableLighting            = true

  const plane = MeshBuilder.CreatePlane(`enm-hp-bar-${id}`, { width: 2.5, height: 0.4, sideOrientation: Mesh.DOUBLESIDE }, scene)
  plane.material       = mat
  plane.billboardMode  = Mesh.BILLBOARDMODE_ALL
  plane.isPickable     = false
  plane.renderingGroupId = 1
  plane.setEnabled(false)

  const render = (hp, maxHp) => {
    const ctx = tex.getContext()
    ctx.clearRect(0, 0, W, H)
    ctx.fillStyle = 'rgba(8,12,22,0.85)'
    ctx.beginPath(); ctx.roundRect(4, 4, W - 8, H - 8, (H - 8) / 2); ctx.fill()
    const ratio = Math.max(0, Math.min(1, hp / maxHp))
    const fillW = (W - 24) * ratio
    if (fillW > 2) {
      ctx.fillStyle = ratio > 0.5 ? '#4ADE80' : ratio > 0.25 ? '#FBBF24' : '#F87171'
      ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 14
      ctx.beginPath(); ctx.roundRect(12, 12, fillW, H - 24, (H - 24) / 2); ctx.fill()
      ctx.shadowBlur = 0
    }
    ctx.font = `bold 30px "Segoe UI",Arial`
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    ctx.fillStyle = '#fff'
    ctx.fillText(`${Math.ceil(hp)} / ${maxHp}`, W / 2, H / 2)
    tex.update(false)
  }

  return {
    plane,
    update: render,
    show() { plane.setEnabled(true) },
    hide() { plane.setEnabled(false) },
    dispose() { plane.dispose(); mat.dispose(); tex.dispose() },
  }
}

let _ennemiCounter = 0

/**
 * Spawn un ennemi IA.
 *
 * @param {import('@babylonjs/core').Scene} scene
 * @param {{
 *   file: string,
 *   position: { x:number, y:number, z:number },
 *   getHero: () => any,
 *   damagePlayer?: (amount:number) => void,
 *   onDeath?: () => void,
 * }} opts
 */
export async function spawnEnnemi(scene, { file, position, getHero, damagePlayer, onDeath } = {}) {
  const id     = _ennemiCounter++
  const stats  = PRESETS[file] ?? PRESETS['ennemiIA_3.glb']

  let result
  try {
    result = await SceneLoader.ImportMeshAsync(null, ENNEMI_BASE, file, scene)
  } catch (e) {
    console.warn(`[ennemiIA] échec chargement ${file}`, e)
    return null
  }

  result.animationGroups?.forEach(ag => ag.stop())
  const root = result.meshes.find(m => m.name === '__root__') ?? result.meshes[0]
  if (!root) return null

  root.name = `ennemi_${id}`
  root.rotationQuaternion = null
  root.scaling.setAll(stats.scale)
  root.position.set(position.x, position.y, position.z)

  // Collision mur — ellipsoïde en espace local (multiplié par scaling en interne)
  root.checkCollisions  = true
  root.ellipsoid        = new Vector3(0.45, 0.9, 0.45)
  root.ellipsoidOffset  = new Vector3(0,    0.9, 0)

  for (const m of root.getChildMeshes(false)) {
    m.isPickable     = false
    m.checkCollisions = false  // seul le root fait les collisions
  }

  console.log(`[ennemiIA] ${file} #${id} anims:`, result.animationGroups?.map(a => a.name))

  const findAnim = (...names) => {
    for (const n of names) {
      const found = result.animationGroups?.find(ag => ag.name.toLowerCase().includes(n.toLowerCase()))
      if (found) return found
    }
    return null
  }

  const idleAnim  = findAnim('idle', 'stand')
  const walkAnim  = findAnim('walk', 'run', 'move')
  const shootAnim = findAnim('shoot', 'fire', 'attack')
  const deathAnim = findAnim('death', 'die', 'dead')

  let activeAnim = null
  const playAnim = (anim, loop = true) => {
    if (!anim || anim === activeAnim) return
    activeAnim?.stop()
    anim.play(loop)
    activeAnim = anim
  }
  playAnim(idleAnim)

  // ─── State machine ───────────────────────────────────────────────────────
  let hp       = stats.hp
  let state    = STATE.WANDER
  let shootCD  = 0

  // Wander : cible aléatoire autour du point de spawn
  const spawnX = position.x, spawnZ = position.z
  let wanderTarget = null
  const pickWanderTarget = () => {
    const angle = Math.random() * Math.PI * 2
    const dist  = 8 + Math.random() * WANDER_RADIUS
    wanderTarget = { x: spawnX + Math.cos(angle) * dist, z: spawnZ + Math.sin(angle) * dist }
  }
  pickWanderTarget()

  // ─── Barre de vie ────────────────────────────────────────────────────────
  const healthBar     = makeHealthBar(scene, id)
  let healthBarHideAt = 0

  const hpBarObserver = scene.onBeforeRenderObservable.add(() => {
    if (!healthBar.plane.isEnabled()) return
    healthBar.plane.position.set(root.position.x, root.position.y + 3.5, root.position.z)
    if (healthBarHideAt && performance.now() > healthBarHideAt) {
      healthBar.hide(); healthBarHideAt = 0
    }
  })

  // ─── Balles ennemies ─────────────────────────────────────────────────────
  const enemyBullets = []

  // ─── IA loop ─────────────────────────────────────────────────────────────
  const aiObserver = scene.onBeforeRenderObservable.add(() => {
    if (scene.metadata?.paused) return

    const dt   = scene.getEngine().getDeltaTime() / 1000
    const hero = getHero?.()

    // Mise à jour des balles (continuent même après la mort de l'ennemi)
    for (let bi = enemyBullets.length - 1; bi >= 0; bi--) {
      const b = enemyBullets[bi]
      b.mesh.position.addInPlace(b.dir.scale(ENEMY_BULLET_SPEED * dt))
      b.distTravelled += ENEMY_BULLET_SPEED * dt

      if (hero && !scene.metadata?.dead) {
        const hp = hero.position
        const bx = b.mesh.position.x - hp.x
        const by = b.mesh.position.y - (hp.y + 1)
        const bz = b.mesh.position.z - hp.z
        if (bx*bx + by*by + bz*bz < ENEMY_BULLET_HIT_DIST * ENEMY_BULLET_HIT_DIST) {
          damagePlayer?.(stats.shootDamage)
          b.mesh.dispose()
          enemyBullets.splice(bi, 1)
          continue
        }
      }

      if (b.distTravelled > ENEMY_BULLET_MAX_DIST) {
        b.mesh.dispose()
        enemyBullets.splice(bi, 1)
      }
    }

    if (state === STATE.DEAD) return

    const heroPos = hero?.position
    if (!heroPos) { playAnim(idleAnim); return }

    const dx   = heroPos.x - root.position.x
    const dz   = heroPos.z - root.position.z
    const dist = Math.hypot(dx, dz)

    // Transitions d'état
    if (dist > stats.detectionRange)   state = STATE.WANDER
    else if (dist < stats.retreatRange) state = STATE.RETREAT
    else if (dist <= stats.shootRange)  state = STATE.SHOOT
    else                                state = STATE.PURSUIT

    if (state !== STATE.WANDER) root.rotation.y = Math.atan2(dx, dz)

    switch (state) {
      case STATE.WANDER: {
        if (!wanderTarget) pickWanderTarget()
        const wx = wanderTarget.x - root.position.x
        const wz = wanderTarget.z - root.position.z
        const wd = Math.hypot(wx, wz)
        if (wd < WANDER_STOP_DIST) {
          pickWanderTarget()
          playAnim(idleAnim)
          root.moveWithCollisions(new Vector3(0, -ENEMY_GRAVITY * dt, 0))
        } else {
          root.rotation.y = Math.atan2(wx, wz)
          const step = stats.speed * 0.4 * dt
          root.moveWithCollisions(new Vector3((wx / wd) * step, -ENEMY_GRAVITY * dt, (wz / wd) * step))
          playAnim(walkAnim ?? idleAnim)
        }
        break
      }

      case STATE.PURSUIT: {
        const step = stats.speed * dt
        root.moveWithCollisions(new Vector3((dx / dist) * step, -ENEMY_GRAVITY * dt, (dz / dist) * step))
        playAnim(walkAnim ?? idleAnim)
        break
      }

      case STATE.SHOOT: {
        // Reste sur place, oriente vers le joueur, tire avec cooldown
        shootCD -= dt
        if (shootCD <= 0) {
          shootCD = stats.shootCooldown
          if (shootAnim) {
            if (activeAnim !== shootAnim) {
              activeAnim?.stop()
              shootAnim.play(false)
              activeAnim = shootAnim
              shootAnim.onAnimationGroupEndObservable.addOnce(() => {
                if (state !== STATE.DEAD) { activeAnim = null; playAnim(idleAnim) }
              })
            }
          }
          // Spawn balle visible vers le joueur (impact géré dans la boucle bullet ci-dessus)
          const origin = new Vector3(root.position.x, root.position.y + 1.2, root.position.z)
          const aim    = new Vector3(heroPos.x, heroPos.y + 1, heroPos.z)
          const rawDir = aim.subtract(origin)
          const dirLen = rawDir.length()
          if (dirLen > 0.1) {
            const bDir  = rawDir.scale(1 / dirLen)
            const bMesh = MeshBuilder.CreateSphere(`enm_b_${id}_${performance.now()}`, { diameter: 0.38, segments: 4 }, scene)
            bMesh.position.copyFrom(origin)
            bMesh.material   = getEnemyBulletMat(scene)
            bMesh.isPickable = false
            enemyBullets.push({ mesh: bMesh, dir: bDir, distTravelled: 0 })
          }
        } else if (activeAnim !== shootAnim) {
          playAnim(idleAnim)
        }
        root.moveWithCollisions(new Vector3(0, -ENEMY_GRAVITY * dt, 0))
        break
      }

      case STATE.RETREAT: {
        const step = stats.speed * dt
        root.moveWithCollisions(new Vector3(-(dx / dist) * step, -ENEMY_GRAVITY * dt, -(dz / dist) * step))
        playAnim(walkAnim ?? idleAnim)
        break
      }
    }
  })

  // ─── Dégâts reçus ────────────────────────────────────────────────────────
  const damage = (amount) => {
    if (state === STATE.DEAD) return
    hp = Math.max(0, hp - amount)
    healthBar.update(hp, stats.hp)
    healthBar.show()
    healthBarHideAt = performance.now() + HEALTH_BAR_DURATION

    if (hp <= 0) {
      state = STATE.DEAD
      activeAnim?.stop()
      activeAnim = null
      healthBar.hide()
      if (deathAnim) {
        deathAnim.loopAnimation = false
        deathAnim.play(false)
        deathAnim.onAnimationGroupEndObservable.addOnce(() => { try { deathAnim.pause() } catch {} })
      }
      onDeath?.()
    }
  }

  // Expose pour la détection bullet dans controls.js
  if (!scene.metadata.ennemiHandles) scene.metadata.ennemiHandles = []
  scene.metadata.ennemiHandles.push({ damage, getState: () => state, getRoot: () => root })

  return {
    root,
    getHp:    () => hp,
    getState: () => state,
    damage,
    dispose: () => {
      scene.onBeforeRenderObservable.remove(aiObserver)
      scene.onBeforeRenderObservable.remove(hpBarObserver)
      healthBar.dispose()
      for (const b of enemyBullets) try { b.mesh.dispose() } catch {}
      enemyBullets.length = 0
      if (scene.metadata?.ennemiHandles) {
        scene.metadata.ennemiHandles = scene.metadata.ennemiHandles.filter(h => h.getRoot() !== root)
      }
      root.dispose()
    },
  }
}
