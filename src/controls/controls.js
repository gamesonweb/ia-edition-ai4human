import { Vector3 } from '@babylonjs/core/Maths/math.vector'
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder'
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial'
import { Color3 } from '@babylonjs/core/Maths/math.color'
import { GAME_CONFIG } from '../config/gameConfig.js'
import '@babylonjs/inspector'

const TARGET_FPS        = 60
const MOUSE_SENSITIVITY = 0.003
const GRAVITY_FORCE     = 0.15

const BULLET_SPEED       = 1.9   // unités / frame à 60fps
const BULLET_MAX_DIST    = 300   // distance max avant destruction
const FIRE_COOLDOWN_MS   = 200   // intervalle minimum entre deux tirs (ms)
const FLASH_DURATION_MS  = 120   // durée du flash de départ (ms)
const IMPACT_DURATION_MS = 180   // durée de l'effet d'impact sur le robot (ms)
const BULLET_HIT_RADIUS  = 2.0   // rayon de détection d'impact sur le robot (unités)
const BULLET_DAMAGE      = 20    // dégâts par balle (5 balles pour tuer)

export function setupControls(scene, hero, animations, camera, canvas) {
  const { idleAnim, walkAnim, runAnim, deathAnim, fightIdleAnim, fightAnim } = animations
  const layout     = GAME_CONFIG.KEYBOARD.LAYOUT
  const keys       = GAME_CONFIG.KEYBOARD.CONTROLS[layout]
  const arrows     = GAME_CONFIG.KEYBOARD.ARROWS
  const camCfg     = GAME_CONFIG.CAMERA.FOLLOW
  const camLimits  = GAME_CONFIG.CAMERA.LIMITS
  const heroCfg    = GAME_CONFIG.HERO

  // --- Pointer lock : clic sur le canvas pour capturer la souris ---
  // Le navigateur impose un cooldown (~1.25s) après une sortie de pointer lock.
  // Si on reclique trop tôt, requestPointerLock() rejette avec SecurityError → on l'ignore.
  let pointerLockBusy = false
  canvas.addEventListener('click', () => {
    if (document.pointerLockElement === canvas || pointerLockBusy) return
    pointerLockBusy = true
    const req = canvas.requestPointerLock()
    if (req && typeof req.then === 'function') {
      req.catch(() => { /* cooldown navigateur, on ignore */ })
         .finally(() => { pointerLockBusy = false })
    } else {
      setTimeout(() => { pointerLockBusy = false }, 200)
    }
  })

  document.addEventListener('pointerlockerror', () => {
    pointerLockBusy = false
  })

  // --- Rotation caméra via souris (pointer lock) ---
  document.addEventListener('mousemove', e => {
    if (document.pointerLockElement !== canvas) return
    camera.alpha -= e.movementX * MOUSE_SENSITIVITY
    camera.beta  -= e.movementY * MOUSE_SENSITIVITY
    camera.beta   = Math.max(camLimits.BETA.LOWER, Math.min(camLimits.BETA.UPPER, camera.beta))
  })

  // --- Clavier ---
  const inputMap = {}
  window.addEventListener('keydown', e => {
    inputMap[e.key] = true
    inputMap[e.key.toLowerCase()] = true
    if (e.key.toLowerCase() === 'i') {
      if (scene.debugLayer.isVisible()) {
        scene.debugLayer.hide()
      } else {
        scene.debugLayer.show()
      }
    }
  })
  window.addEventListener('keyup', e => {
    inputMap[e.key] = false
    inputMap[e.key.toLowerCase()] = false
  })

  // --- Animation ---
  let currentAnim = null
  let combatMode  = false   // true = posture de combat (fight_idle en boucle)

  const setAnimation = (next, loop = true) => {
    if (!next || currentAnim === next) return
    // En mode combat, seules fight_idle et death peuvent s'afficher
    if (combatMode && next !== fightIdleAnim && next !== deathAnim) return
    if (currentAnim) currentAnim.stop()
    next.play(loop)
    currentAnim = next
  }
  setAnimation(idleAnim)

  // --- Touche F maintenue : fight_idle en boucle, relâchée : retour idle ---
  const enterCombat = () => {
    if (scene.metadata?.dead || scene.metadata?.paused) return
    if (!fightIdleAnim || combatMode) return
    combatMode = true
    if (currentAnim) currentAnim.stop()
    fightIdleAnim.play(true)
    currentAnim = fightIdleAnim
  }

  const exitCombat = () => {
    if (!combatMode) return
    combatMode = false
    if (currentAnim) currentAnim.stop()
    currentAnim = null
  }

  window.addEventListener('keydown', (e) => {
    if (e.key === 'f' || e.key === 'F') enterCombat()
  })
  window.addEventListener('keyup', (e) => {
    if (e.key === 'f' || e.key === 'F') exitCombat()
  })

  // --- Système de tir (clic gauche) ---
  const bullets  = []
  const flashes  = []
  const impacts  = []
  let lastFireTime = 0

  // Matériau balle : tracer jaune-orangé lumineux
  const bulletMat = new StandardMaterial('bulletMat', scene)
  bulletMat.emissiveColor = new Color3(1, 0.75, 0.1)
  bulletMat.disableLighting = true

  // Matériau flash de départ : blanc très lumineux
  const flashMat = new StandardMaterial('flashMat', scene)
  flashMat.emissiveColor = new Color3(1, 1, 0.7)
  flashMat.disableLighting = true

  // Matériau d'impact robot : rouge/orange lumineux
  const impactMat = new StandardMaterial('impactMat', scene)
  impactMat.emissiveColor = new Color3(1, 0.25, 0.05)
  impactMat.disableLighting = true

  const fireBullet = () => {
    if (scene.metadata?.dead || scene.metadata?.paused) return
    const now = performance.now()
    if (now - lastFireTime < FIRE_COOLDOWN_MS) return
    lastFireTime = now

    // Direction de tir = de la caméra vers sa cible (ce que vise le crosshair)
    const dir = new Vector3(
      -Math.sin(camera.beta) * Math.cos(camera.alpha),
      -Math.cos(camera.beta),
      -Math.sin(camera.beta) * Math.sin(camera.alpha),
    ).normalize()

    const spawnPos = camera.target.clone()

    // Balle : sphère plus grosse
    const bullet = MeshBuilder.CreateSphere(`bullet_${now}`, { diameter: 0.45, segments: 5 }, scene)
    bullet.position = spawnPos.clone()
    bullet.material = bulletMat
    bullet.isPickable = false
    bullets.push({ mesh: bullet, dir, distTravelled: 0 })

    // Flash de départ : sphère lumineuse qui grossit puis disparaît
    const flash = MeshBuilder.CreateSphere(`flash_${now}`, { diameter: 0.6, segments: 5 }, scene)
    flash.position = spawnPos.clone()
    flash.material = flashMat
    flash.isPickable = false
    flashes.push({ mesh: flash, born: now })
  }

  canvas.addEventListener('mousedown', (e) => {
    if (e.button !== 0 || document.pointerLockElement !== canvas) return
    enterCombat()
    fireBullet()
  })

  canvas.addEventListener('mouseup', (e) => {
    if (e.button !== 0) return
    exitCombat()
  })

  // Mise à jour des balles et des flashs dans la boucle de rendu
  scene.onBeforeRenderObservable.add(() => {
    const dt       = scene.getEngine().getDeltaTime() / 1000
    const fpsRatio = TARGET_FPS * dt
    const now      = performance.now()

    // Déplacement des balles + détection d'impact sur le robot
    const robotHandle = scene.metadata?.robotHandle
    const robotRoot   = robotHandle?.getRoot?.()
    const robotAlive  = robotHandle && robotHandle.getState?.() !== 'dead'

    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i]
      const step = BULLET_SPEED * fpsRatio
      b.mesh.position.addInPlace(b.dir.scale(step))
      b.distTravelled += step

      // Test d'impact sur le robot
      if (robotAlive && robotRoot?.isEnabled()) {
        const rp = robotRoot.position
        const dx = b.mesh.position.x - rp.x
        const dy = b.mesh.position.y - (rp.y + 1.2) // centre du corps
        const dz = b.mesh.position.z - rp.z
        if (dx*dx + dy*dy + dz*dz < BULLET_HIT_RADIUS * BULLET_HIT_RADIUS) {
          // Appliquer les dégâts
          robotHandle.damage(BULLET_DAMAGE)

          // Effet d'impact : éclat rouge-orangé qui s'estompe
          const imp = MeshBuilder.CreateSphere(`impact_${now}`, { diameter: 0.5, segments: 4 }, scene)
          imp.position  = b.mesh.position.clone()
          imp.material  = impactMat
          imp.isPickable = false
          impacts.push({ mesh: imp, born: now })

          b.mesh.dispose()
          bullets.splice(i, 1)
          continue
        }
      }

      // Test d'impact sur les ennemiIA (level 5)
      if (!bullets[i]) continue   // déjà supprimée par le test robot
      const ennemiHandles = scene.metadata?.ennemiHandles ?? []
      let hitEnnemi = false
      for (const eh of ennemiHandles) {
        if (eh.getState?.() === 'dead') continue
        const er = eh.getRoot?.()
        if (!er) continue
        const ep = er.position
        const ex = b.mesh.position.x - ep.x
        const ey = b.mesh.position.y - (ep.y + 1.2)
        const ez = b.mesh.position.z - ep.z
        const ehR = Math.max(BULLET_HIT_RADIUS, er.scaling.x * 1.5)
        if (ex*ex + ey*ey + ez*ez < ehR * ehR) {
          eh.damage(BULLET_DAMAGE)
          const imp2 = MeshBuilder.CreateSphere(`impact_e_${now}`, { diameter: 0.5, segments: 4 }, scene)
          imp2.position   = b.mesh.position.clone()
          imp2.material   = impactMat
          imp2.isPickable = false
          impacts.push({ mesh: imp2, born: now })
          b.mesh.dispose()
          bullets.splice(i, 1)
          hitEnnemi = true
          break
        }
      }
      if (hitEnnemi) continue

      // Test d'impact sur les caméras de surveillance (level 5)
      if (!bullets[i]) continue
      const cameraHandles = scene.metadata?.cameraHandles ?? []
      let hitCamera = false
      for (const ch of cameraHandles) {
        if (ch.getState?.() === 'dead') continue
        const cr = ch.getRoot?.()
        if (!cr) continue
        const cp = cr.position
        const cx = b.mesh.position.x - cp.x
        const cy = b.mesh.position.y - cp.y
        const cz = b.mesh.position.z - cp.z
        const camR = ch.hitRadius ?? BULLET_HIT_RADIUS
        if (cx*cx + cy*cy + cz*cz < camR * camR) {
          ch.damage(BULLET_DAMAGE)
          const impC = MeshBuilder.CreateSphere(`impact_c_${now}`, { diameter: 0.5, segments: 4 }, scene)
          impC.position   = b.mesh.position.clone()
          impC.material   = impactMat
          impC.isPickable = false
          impacts.push({ mesh: impC, born: now })
          b.mesh.dispose()
          bullets.splice(i, 1)
          hitCamera = true
          break
        }
      }
      if (hitCamera) continue

      if (b.distTravelled >= BULLET_MAX_DIST) {
        b.mesh.dispose()
        bullets.splice(i, 1)
      }
    }

    // Animation des flashs de départ
    for (let i = flashes.length - 1; i >= 0; i--) {
      const f = flashes[i]
      const elapsed = now - f.born
      if (elapsed >= FLASH_DURATION_MS) {
        f.mesh.dispose()
        flashes.splice(i, 1)
        continue
      }
      const t = elapsed / FLASH_DURATION_MS
      f.mesh.scaling.setAll(1 + t * 2.5)
      f.mesh.material.alpha = 1 - t
    }

    // Animation des impacts robot : explose vers l'extérieur puis disparaît
    for (let i = impacts.length - 1; i >= 0; i--) {
      const imp = impacts[i]
      const elapsed = now - imp.born
      if (elapsed >= IMPACT_DURATION_MS) {
        imp.mesh.dispose()
        impacts.splice(i, 1)
        continue
      }
      const t = elapsed / IMPACT_DURATION_MS
      imp.mesh.scaling.setAll(1 + t * 4)   // grossit rapidement
      imp.mesh.material.alpha = 1 - t       // s'efface
    }
  })

  // --- Boucle principale ---
  scene.onBeforeRenderObservable.add(() => {
    // Mort : quitte le mode combat, joue death une fois, bloque les inputs
    if (scene.metadata?.dead) {
      if (combatMode) { combatMode = false }
      setAnimation(deathAnim ?? idleAnim, false)
      return
    }

    if (scene.metadata?.paused) return

    const dt       = scene.getEngine().getDeltaTime() / 1000
    const fpsRatio = TARGET_FPS * dt

    // Héros face à la direction de la caméra (dérivé de camera.alpha)
    hero.rotation.y = -(camera.alpha + Math.PI / 2)

    // Vecteurs direction relatifs à la caméra (plan XZ)
    const forward = new Vector3(-Math.cos(camera.alpha), 0, -Math.sin(camera.alpha))
    const right   = new Vector3(-Math.sin(camera.alpha), 0,  Math.cos(camera.alpha))

    const fwd = inputMap[keys.FORWARD]  || inputMap[arrows.FORWARD]
    const bwd = inputMap[keys.BACKWARD] || inputMap[arrows.BACKWARD]
    const lft = inputMap[keys.LEFT]     || inputMap[arrows.LEFT]
    const rgt = inputMap[keys.RIGHT]    || inputMap[arrows.RIGHT]

    let fwdVec    = Vector3.Zero()
    let strafeVec = Vector3.Zero()

    if (fwd) fwdVec.addInPlace(forward)
    if (bwd) fwdVec.subtractInPlace(forward)
    if (lft) strafeVec.subtractInPlace(right)
    if (rgt) strafeVec.addInPlace(right)

    const isSprinting = inputMap['Shift'] || inputMap['shift']
    const speedMultiplier = isSprinting ? heroCfg.SPEED_RUN_MULTIPLIER ?? 2 : 1
    const fwdSpeed = bwd ? heroCfg.SPEED_BACKWARDS : heroCfg.SPEED * speedMultiplier
    const isMoving = fwdVec.lengthSquared() > 0 || strafeVec.lengthSquared() > 0

    if (isMoving) {
      const movement = Vector3.Zero()
      if (fwdVec.lengthSquared()    > 0) movement.addInPlace(fwdVec.normalize().scale(fwdSpeed * fpsRatio))
      if (strafeVec.lengthSquared() > 0) movement.addInPlace(strafeVec.normalize().scale(heroCfg.SPEED_STRAFE * speedMultiplier * fpsRatio))
      hero.moveWithCollisions(movement)
      // En mode combat : garder fight_idle même en mouvement
      if (!combatMode) setAnimation(isSprinting && runAnim ? runAnim : (walkAnim ?? runAnim))
    } else {
      // En mode combat : garder fight_idle au repos
      if (!combatMode) setAnimation(idleAnim)
    }

    // Gravité : le héros tombe jusqu'à toucher le sol
    hero.moveWithCollisions(new Vector3(0, -GRAVITY_FORCE * fpsRatio, 0))

    // Bornes verticales : ne peut ni descendre sous le sol ni dépasser MAX_HEIGHT (~3m au-dessus)
    if (hero.position.y < heroCfg.MIN_HEIGHT) hero.position.y = heroCfg.MIN_HEIGHT
    if (hero.position.y > heroCfg.MIN_HEIGHT + heroCfg.MAX_HEIGHT) hero.position.y = heroCfg.MIN_HEIGHT + heroCfg.MAX_HEIGHT

    // Suivi caméra fluide (lerp)
    const lerp = camCfg.TARGET_LERP
    camera.target.x += (hero.position.x                      - camera.target.x) * lerp
    camera.target.y += (hero.position.y + camCfg.HEIGHT_OFFSET - camera.target.y) * lerp
    camera.target.z += (hero.position.z                      - camera.target.z) * lerp
  })
}
