import { SceneLoader }      from '@babylonjs/core/Loading/sceneLoader'
import { MeshBuilder }      from '@babylonjs/core/Meshes/meshBuilder'
import { Mesh }             from '@babylonjs/core/Meshes/mesh'
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial'
import { DynamicTexture }   from '@babylonjs/core/Materials/Textures/dynamicTexture'
import { Color3 }           from '@babylonjs/core/Maths/math.color'

const ROBOT_BASE = '/level/level2/'
const ROBOT_FILE = 'robot.glb'

// Paramètres steering / combat (mêlée)
const STATS = {
  hp:              100,
  speed:           10,     // unités / seconde
  detectionRange:  60,    // ennemi détecté → PURSUIT
  attackRange:     4,     // distance de mêlée → ATTACK (punch)
  retreatRange:    2,     // ennemi trop proche → RETREAT
  punchCooldown:   0.9,   // s entre coups
  punchDamage:     10,    // dégâts par coup au joueur
  playerAttackRange: 8,
  playerAttackDmg:   25,
  pickupRange:       5,
}

function drawRoundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

/**
 * Barre de vie 3D placée au-dessus du robot.
 * Rendue dans un plan billboardé avec une DynamicTexture — aucun DOM.
 */
function makeHealthBar(scene) {
  const W = 512
  const H = 96
  const tex = new DynamicTexture('robot-hp-tex', { width: W, height: H }, scene, false)
  tex.hasAlpha = true

  const mat = new StandardMaterial('robot-hp-mat', scene)
  mat.diffuseTexture             = tex
  mat.emissiveColor              = new Color3(1, 1, 1)
  mat.specularColor              = new Color3(0, 0, 0)
  mat.useAlphaFromDiffuseTexture = true
  mat.backFaceCulling            = false
  mat.disableLighting            = true

  const plane = MeshBuilder.CreatePlane(
    'robot-hp-bar',
    { width: 3, height: 0.56, sideOrientation: Mesh.DOUBLESIDE },
    scene,
  )
  plane.material        = mat
  plane.billboardMode   = Mesh.BILLBOARDMODE_ALL
  plane.isPickable      = false
  plane.checkCollisions = false
  plane.renderingGroupId = 1  // au-dessus du reste
  plane.setEnabled(false)

  const render = (hp, maxHp) => {
    const ctx = tex.getContext()
    ctx.clearRect(0, 0, W, H)

    const pad   = 6
    const bgX   = pad,         bgY = pad
    const bgW   = W - pad * 2, bgH = H - pad * 2
    const rOut  = bgH / 2

    // Fond
    drawRoundedRect(ctx, bgX, bgY, bgW, bgH, rOut)
    ctx.fillStyle = 'rgba(8, 12, 22, 0.88)'
    ctx.fill()
    ctx.strokeStyle = 'rgba(124, 156, 255, 0.55)'
    ctx.lineWidth   = 3
    ctx.stroke()

    // Remplissage HP
    const ratio = Math.max(0, Math.min(1, hp / maxHp))
    const innerPad = 8
    const innerH   = bgH - innerPad * 2
    const innerMaxW = bgW - innerPad * 2
    const fillW    = innerMaxW * ratio
    const rIn      = innerH / 2

    if (fillW > 4) {
      const color =
        ratio > 0.5  ? '#4ADE80' :
        ratio > 0.25 ? '#FBBF24' : '#F87171'
      drawRoundedRect(ctx, bgX + innerPad, bgY + innerPad, fillW, innerH, Math.min(rIn, fillW / 2))
      ctx.fillStyle = color
      ctx.shadowColor = color
      ctx.shadowBlur  = 18
      ctx.fill()
      ctx.shadowBlur = 0
    }

    // Texte HP centré
    ctx.font         = 'bold 38px "Segoe UI", system-ui, sans-serif'
    ctx.textAlign    = 'center'
    ctx.textBaseline = 'middle'
    ctx.strokeStyle  = '#000'
    ctx.lineWidth    = 5
    const label = `${hp} / ${maxHp}`
    ctx.strokeText(label, W / 2, H / 2 + 1)
    ctx.fillStyle    = '#ffffff'
    ctx.fillText(label, W / 2, H / 2 + 1)

    tex.update(false)
  }

  return {
    plane,
    update: render,
    show() { plane.setEnabled(true) },
    hide() { plane.setEnabled(false) },
    dispose() {
      plane.dispose()
      mat.dispose()
      tex.dispose()
    },
  }
}

/**
 * Bulle de dialogue 3D billboardée — utilisée pour afficher le code admin
 * au-dessus de la tête du robot quand le joueur le lui demande.
 */
function makeSpeechPanel(scene) {
  const W = 768
  const H = 320
  const tex = new DynamicTexture('robot-speech-tex', { width: W, height: H }, scene, false)
  tex.hasAlpha = true

  const mat = new StandardMaterial('robot-speech-mat', scene)
  mat.diffuseTexture             = tex
  mat.emissiveColor              = new Color3(1, 1, 1)
  mat.specularColor              = new Color3(0, 0, 0)
  mat.useAlphaFromDiffuseTexture = true
  mat.backFaceCulling            = false
  mat.disableLighting            = true

  const plane = MeshBuilder.CreatePlane(
    'robot-speech',
    { width: 4.5, height: 1.9, sideOrientation: Mesh.DOUBLESIDE },
    scene,
  )
  plane.material        = mat
  plane.billboardMode   = Mesh.BILLBOARDMODE_ALL
  plane.isPickable      = false
  plane.checkCollisions = false
  plane.renderingGroupId = 1
  plane.setEnabled(false)

  const render = (label, code) => {
    const ctx = tex.getContext()
    ctx.clearRect(0, 0, W, H)

    // Carte arrondie style "terminal IA"
    const pad = 12
    const x = pad, y = pad, w = W - pad * 2, h = H - pad * 2, r = 22
    ctx.beginPath()
    ctx.moveTo(x + r, y)
    ctx.arcTo(x + w, y,     x + w, y + h, r)
    ctx.arcTo(x + w, y + h, x,     y + h, r)
    ctx.arcTo(x,     y + h, x,     y,     r)
    ctx.arcTo(x,     y,     x + w, y,     r)
    ctx.closePath()
    ctx.fillStyle = 'rgba(8, 12, 22, 0.92)'
    ctx.fill()
    ctx.lineWidth   = 4
    ctx.strokeStyle = 'rgba(124, 156, 255, 0.7)'
    ctx.stroke()

    // Petite "queue" sous la bulle pour pointer vers la tête
    ctx.beginPath()
    ctx.moveTo(W / 2 - 22, y + h - 1)
    ctx.lineTo(W / 2,      y + h + 28)
    ctx.lineTo(W / 2 + 22, y + h - 1)
    ctx.closePath()
    ctx.fillStyle = 'rgba(8, 12, 22, 0.92)'
    ctx.fill()
    ctx.strokeStyle = 'rgba(124, 156, 255, 0.7)'
    ctx.stroke()

    // Header
    ctx.font         = '600 22px "Segoe UI", system-ui, sans-serif'
    ctx.textAlign    = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle    = '#A78BFA'
    ctx.fillText('// ROBOT COMPAGNON · ADMIN', W / 2, y + 38)

    // Label
    ctx.font      = '500 26px "Segoe UI", system-ui, sans-serif'
    ctx.fillStyle = 'rgba(232, 240, 255, 0.85)'
    ctx.fillText(label, W / 2, y + 92)

    // Code mis en valeur
    ctx.font         = 'bold 68px "JetBrains Mono", "Fira Code", monospace'
    ctx.fillStyle    = '#67E8F9'
    ctx.shadowColor  = '#67E8F9'
    ctx.shadowBlur   = 24
    ctx.fillText(code, W / 2, y + 168)
    ctx.shadowBlur   = 0
    ctx.strokeStyle  = 'rgba(103, 232, 249, 0.4)'
    ctx.lineWidth    = 1
    ctx.strokeText(code, W / 2, y + 168)

    // Footnote
    ctx.font      = '400 18px "Segoe UI", system-ui, sans-serif'
    ctx.fillStyle = 'rgba(199, 210, 254, 0.6)'
    ctx.fillText('Tape-le exactement à l\'ordinateur.', W / 2, y + 230)

    tex.update(false)
  }

  return {
    plane,
    render,
    show() { plane.setEnabled(true) },
    hide() { plane.setEnabled(false) },
    dispose() {
      plane.dispose()
      mat.dispose()
      tex.dispose()
    },
  }
}

function makeSignText(scene, text, position) {
  const resolution = 512
  const tex = new DynamicTexture('robot-pickup-tex', resolution, scene, true)
  tex.hasAlpha = true

  const ctx = tex.getContext()
  ctx.clearRect(0, 0, resolution, resolution)
  ctx.fillStyle = 'rgba(0, 0, 0, 0.55)'
  ctx.fillRect(0, resolution * 0.25, resolution, resolution * 0.5)
  tex.drawText(text, null, resolution / 2 + 18, 'bold 52px "Segoe UI", Arial', '#4ADE80', null, true, true)

  const mat = new StandardMaterial('robot-pickup-mat', scene)
  mat.diffuseTexture            = tex
  mat.emissiveColor             = new Color3(1, 1, 1)
  mat.specularColor             = new Color3(0, 0, 0)
  mat.useAlphaFromDiffuseTexture = true
  mat.backFaceCulling           = false

  const plane = MeshBuilder.CreatePlane('robot-pickup-sign', { width: 6, height: 3 }, scene)
  plane.material        = mat
  plane.position.set(position.x, position.y, position.z)
  plane.billboardMode   = Mesh.BILLBOARDMODE_ALL
  plane.isPickable      = false
  plane.checkCollisions = false

  return { plane, material: mat, texture: tex }
}

const STATE = {
  IDLE:      'idle',
  PURSUIT:   'pursuit',
  ATTACK:    'attack',
  RETREAT:   'retreat',
  DEAD:      'dead',
  DEPOSITED: 'deposited',
  FOLLOW:    'follow',
}

const FOLLOW_STOP_DIST = 3
const FOLLOW_SPEED     = 22   // ~= HERO.SPEED (0.35) × TARGET_FPS (60) + léger surplus pour rattraper

/**
 * @param {import('@babylonjs/core').Scene} scene
 * @param {{
 *   position: { x:number, y:number, z:number },
 *   getHero: () => any,
 *   damagePlayer?: (amount:number) => void,
 *   notifications?: any,
 *   inventory?: any,
 *   onPickup?: () => void,
 * }} opts
 */
export async function spawnRobot(scene, {
  position, getHero, damagePlayer, notifications, inventory, onPickup,
} = {}) {
  const result = await SceneLoader.ImportMeshAsync(null, ROBOT_BASE, ROBOT_FILE, scene)
  result.animationGroups?.forEach(ag => ag.stop())

  const root = result.meshes.find(m => m.name === '__root__') ?? result.meshes[0]
  if (!root) return null

  root.name = 'level2_robot'
  root.rotationQuaternion = null
  root.scaling.setAll(1)
  root.position.set(position.x, position.y, position.z)

  for (const m of root.getChildMeshes(false)) {
    if (m.subMeshes?.length) m.isPickable = false
  }

  // Sélection d'animations connues si le GLB en contient
  const findAnim = (...names) => {
    for (const n of names) {
      const found = result.animationGroups?.find(
        ag => ag.name.toLowerCase().includes(n.toLowerCase())
      )
      if (found) return found
    }
    return null
  }
  const idleAnim  = findAnim('idle', 'stand')
  const walkAnim  = findAnim('walk', 'run', 'move')
  const punchAnim = findAnim('robot_punch', 'punch', 'attack')
  const deathAnim = findAnim('death', 'die', 'dead')
  const danceAnim = findAnim('robot_dance', 'dance')
  const jumpAnim  = findAnim('jump', 'hop', 'leap')

  let activeAnim = null
  const playAnim = (anim, loop = true) => {
    if (!anim || anim === activeAnim) return
    activeAnim?.stop()
    activeAnim = anim
    anim.play(loop)
  }

  // État
  let hp      = STATS.hp
  let state   = STATE.IDLE
  let punchCD = 0

  // ---- Barre de vie 3D (au-dessus du robot, billboard, sans DOM) ----
  const healthBar = makeHealthBar(scene)
  healthBar.update(hp, STATS.hp)
  const HEALTH_BAR_OFFSET = 3.4 // hauteur au-dessus du root
  let healthBarHideAt = 0       // timestamp où la barre doit se masquer (0 = jamais)
  const HEALTH_BAR_DURATION = 4000 // ms après le dernier coup

  const healthBarObserver = scene.onBeforeRenderObservable.add(() => {
    if (!healthBar.plane.isEnabled()) return
    healthBar.plane.position.set(
      root.position.x,
      root.position.y + HEALTH_BAR_OFFSET,
      root.position.z,
    )
    if (healthBarHideAt && performance.now() > healthBarHideAt) {
      healthBar.hide()
      healthBarHideAt = 0
    }
  })

  // ---- Bulle de dialogue 3D (au-dessus du robot, auto-hide) ----
  const speech = makeSpeechPanel(scene)
  const SPEECH_OFFSET = 4.6
  let speechHideAt = 0
  const speechObserver = scene.onBeforeRenderObservable.add(() => {
    if (!speech.plane.isEnabled()) return
    speech.plane.position.set(
      root.position.x,
      root.position.y + SPEECH_OFFSET,
      root.position.z,
    )
    if (speechHideAt && performance.now() > speechHideAt) {
      speech.hide()
      speechHideAt = 0
    }
  })

  /**
   * Affiche un texte au-dessus de la tête du robot (label + code mis en valeur).
   * @param {string} label
   * @param {string} code
   * @param {number} [durationMs=10000]
   */
  const showSpeech = (label, code, durationMs = 10000) => {
    speech.render(label, code)
    speech.show()
    speechHideAt = performance.now() + Math.max(1000, durationMs)
  }

  // Panneau 3D "Appuyer sur B" affiché après la mort
  let pickupSign = null
  let pickedUp   = false

  const showPickupSign = () => {
    if (pickupSign) return
    pickupSign = makeSignText(
      scene,
      'Appuyer sur B pour le récupérer',
      { x: root.position.x, y: root.position.y + 3, z: root.position.z },
    )
  }
  const hidePickupSign = () => {
    if (!pickupSign) return
    pickupSign.plane.dispose()
    pickupSign.material.dispose()
    pickupSign.texture.dispose()
    pickupSign = null
  }

  // Visibilité gate (le robot déposé ou en mode follow reste visible partout)
  let lastActive = null
  const visibilityObserver = scene.onBeforeRenderObservable.add(() => {
    const isLevel2 = scene.metadata?.currentLevel === 2
    if (isLevel2 === lastActive) return
    lastActive = isLevel2
    if (state !== STATE.DEPOSITED &&
        state !== STATE.FOLLOW    &&
        !pickedUp) {
      root.setEnabled(isLevel2)
    }
    if (pickupSign) pickupSign.plane.setEnabled(isLevel2)
  })

  // Steering / IA (mêlée — plus de balles)
  const aiObserver = scene.onBeforeRenderObservable.add(() => {
    if (scene.metadata?.paused) return
    if (scene.metadata?.dead)   return

    if (state === STATE.DEAD)      return
    if (state === STATE.DEPOSITED) return

    const dt = scene.getEngine().getDeltaTime() / 1000
    const hero    = getHero?.()
    const heroPos = hero?.position

    // ----- FOLLOW : suit le joueur légèrement à sa droite -----
    if (state === STATE.FOLLOW) {
      if (!heroPos) { playAnim(idleAnim); return }

      // Calcul de la direction "droite" du héros à partir de sa rotation Y
      const heroAngle = hero.rotation?.y ?? 0
      const rightX =  Math.cos(heroAngle)   // vecteur droit du héros (X)
      const rightZ = -Math.sin(heroAngle)   // vecteur droit du héros (Z)
      const SIDE_OFFSET = 2.5               // distance à droite du joueur

      const targetX = heroPos.x + rightX * SIDE_OFFSET
      const targetZ = heroPos.z + rightZ * SIDE_OFFSET

      const dx = targetX - root.position.x
      const dz = targetZ - root.position.z
      const dist = Math.hypot(dx, dz)

      if (dist > FOLLOW_STOP_DIST) {
        root.rotation.y = Math.atan2(dx, dz)
        const catchup = dist > 12 ? 2 : dist > 6 ? 1.4 : 1
        const step = Math.min(FOLLOW_SPEED * catchup * dt, dist - FOLLOW_STOP_DIST)
        root.position.x += (dx / dist) * step
        root.position.z += (dz / dist) * step
        playAnim(jumpAnim ?? walkAnim ?? idleAnim)
      } else {
        playAnim(jumpAnim ?? idleAnim)
      }
      return
    }

    // En dehors du level 2, on n'exécute pas l'IA de combat
    if (scene.metadata?.currentLevel !== 2) return

    if (!heroPos) {
      state = STATE.IDLE
      playAnim(idleAnim)
      return
    }

    const dx   = heroPos.x - root.position.x
    const dz   = heroPos.z - root.position.z
    const dist = Math.hypot(dx, dz)

    // Transitions
    if (dist > STATS.detectionRange)      state = STATE.IDLE
    else if (dist < STATS.retreatRange)   state = STATE.RETREAT
    else if (dist <= STATS.attackRange)   state = STATE.ATTACK
    else                                   state = STATE.PURSUIT

    // Orientation vers le joueur dès qu'il est détecté
    if (state !== STATE.IDLE) {
      root.rotation.y = Math.atan2(dx, dz)
    }

    if (state === STATE.PURSUIT) {
      const step = STATS.speed * dt
      root.position.x += (dx / dist) * step
      root.position.z += (dz / dist) * step
      playAnim(walkAnim ?? idleAnim)

    } else if (state === STATE.RETREAT) {
      const step = STATS.speed * dt
      root.position.x -= (dx / dist) * step
      root.position.z -= (dz / dist) * step
      playAnim(walkAnim ?? idleAnim)

    } else if (state === STATE.ATTACK) {
      // Combat de mêlée — joue Robot_Punch en boucle, inflige des dégâts au tick
      punchCD -= dt
      if (punchCD <= 0) {
        punchCD = STATS.punchCooldown
        if (dist <= STATS.attackRange) damagePlayer?.(STATS.punchDamage)
      }
      playAnim(punchAnim ?? idleAnim)

    } else { // IDLE
      punchCD = STATS.punchCooldown
      playAnim(idleAnim)
    }
  })

  // Fige l'anim de mort sur sa dernière frame
  const freezeDeathAnim = () => {
    if (!deathAnim) return
    deathAnim.loopAnimation = false
    deathAnim.onAnimationGroupEndObservable.addOnce(() => {
      try { deathAnim.pause() } catch {}
    })
    deathAnim.play(false)
  }

  const damage = (amount) => {
    if (state === STATE.DEAD) return
    hp = Math.max(0, hp - amount)

    // Barre de vie 3D : on l'affiche, on met à jour, et on programme l'auto-hide
    healthBar.update(hp, STATS.hp)
    healthBar.show()
    healthBarHideAt = performance.now() + HEALTH_BAR_DURATION

    if (hp <= 0) {
      state = STATE.DEAD
      activeAnim?.stop()
      activeAnim = null
      freezeDeathAnim()
      healthBar.hide()
      healthBarHideAt = 0
      notifications?.show({
        icon:    'fa-skull',
        variant: 'success',
        title:   'Robot abattu',
        message: 'La menace est neutralisée.',
        duration: 4000,
      })
      showPickupSign()
    }
  }

  const tryPickup = () => {
    if (state !== STATE.DEAD || pickedUp) return
    const hero = getHero?.()
    if (!hero) return
    const dx = hero.position.x - root.position.x
    const dz = hero.position.z - root.position.z
    if (dx*dx + dz*dz > STATS.pickupRange * STATS.pickupRange) return

    pickedUp = true
    hidePickupSign()
    root.setEnabled(false)
    inventory?.setItem(0, { name: 'Robot', icon: '/img/inventaire/robot.png', rarity: 'rare' })
    notifications?.show({
      icon:    'fa-box-archive',
      variant: 'success',
      title:   'Robot récupéré',
      message: 'Ajouté à l\'inventaire.',
      duration: 3500,
    })
    onPickup?.()
  }

  // Clavier joueur : B → récupération du robot mort
  const onKey = (e) => {
    if (scene.metadata?.currentLevel !== 2) return
    if (scene.metadata?.paused || scene.metadata?.dead) return
    if (e.key.toLowerCase() === 'b') tryPickup()
  }
  window.addEventListener('keydown', onKey)

  // Expose le handle de dégâts pour le système de balles (controls.js)
  scene.metadata.robotHandle = {
    damage,
    getState:  () => state,
    getRoot:   () => root,
  }

  const placeAsIdle = (pos, rotationY = Math.PI) => {
    state = STATE.DEPOSITED
    activeAnim?.stop()
    activeAnim = null
    root.setEnabled(true)
    root.rotationQuaternion = null
    root.rotation.y = rotationY
    root.position.set(pos.x, pos.y, pos.z)
    // Démarre l'anim idle en boucle (continue de tourner même si l'aiObserver
    // sort tôt parce qu'on n'est plus en level 2)
    if (idleAnim) {
      idleAnim.loopAnimation = true
      idleAnim.play(true)
      activeAnim = idleAnim
    }
  }

  const playDance = () => {
    state = STATE.DEPOSITED
    activeAnim?.stop()
    activeAnim = null
    root.setEnabled(true)
    if (danceAnim) {
      danceAnim.loopAnimation = true
      danceAnim.play(true)
      activeAnim = danceAnim
    } else if (idleAnim) {
      // fallback : reste en idle si Robot_Dance n'existe pas dans le GLB
      idleAnim.play(true)
      activeAnim = idleAnim
    }
  }

  const startFollowing = () => {
    state = STATE.FOLLOW
    activeAnim?.stop()
    activeAnim = null
    root.setEnabled(true)
    if (idleAnim) {
      idleAnim.loopAnimation = true
      idleAnim.play(true)
      activeAnim = idleAnim
    }
  }

  return {
    root,
    getHp:    () => hp,
    getState: () => state,
    isPickedUp: () => pickedUp,
    damage,
    placeAsIdle,
    playDance,
    startFollowing,
    showSpeech,
    dispose: () => {
      window.removeEventListener('keydown', onKey)
      scene.onBeforeRenderObservable.remove(visibilityObserver)
      scene.onBeforeRenderObservable.remove(aiObserver)
      scene.onBeforeRenderObservable.remove(healthBarObserver)
      scene.onBeforeRenderObservable.remove(speechObserver)
      speech.dispose()
      healthBar.dispose()
      hidePickupSign()
      if (scene.metadata?.robotHandle?.getRoot?.() === root) {
        delete scene.metadata.robotHandle
      }
      root.dispose()
    },
  }
}
