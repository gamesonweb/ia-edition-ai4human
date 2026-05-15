import './style.css'

// Side-effects requis par Babylon (build ES modules)
import '@babylonjs/core/Loading/loadingScreen'
import '@babylonjs/core/Collisions/collisionCoordinator'

import { Engine }          from '@babylonjs/core/Engines/engine'
import { Scene }           from '@babylonjs/core/scene'
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight'
import { Vector3 }         from '@babylonjs/core/Maths/math.vector'
import '@babylonjs/loaders/glTF'

import { setupCamera }           from './camera/cameraManager.js'
import { createPlayer }          from './joueur/player.js'
import { setupControls }         from './controls/controls.js'
import { createSky }             from './sky/skyManager.js'
import { setupVisibilityManager } from './visibility/visibilityManager.js'
import { setupCompass }           from './UI/compass.js'
import { setupPositionDisplay }   from './UI/positionDisplay.js'
import { setupMiniMap }           from './UI/miniMap.js'
import { setupStatsBar }          from './UI/statsBar.js'
import { setupInventoryBar }      from './UI/inventory/inventoryBar.js'
import { setupKeyHints }          from './UI/keyHints.js'
import { setupKeybindings }       from './UI/keybindings.js'
import { setupPauseButton }       from './UI/pauseButton.js'
import { setupPlayerStats }       from './UI/playerStats.js'
import { setupGraphicsSettings }  from './UI/graphicsSettings.js'
import { setupTeleport }          from './UI/teleport.js'
import { setupDeathScreen }       from './UI/deathScreen.js'
import { setupNotifications }     from './UI/notification.js'
import { setupCrosshair }        from './UI/crosshair.js'
import { showMainMenu }           from './UI/mainMenu.js'
import { loadMapParts }           from './scene/mapLoader.js'
import { loadLevel1, LEVEL1_INTRO } from './levels/level1/index.js'
import { loadLevel2, LEVEL2_INTRO } from './levels/level2/index.js'
import { loadLevel3, LEVEL3_INTRO } from './levels/level3/index.js'
import { loadLevel4, LEVEL4_INTRO } from './levels/level4/index.js'
import { loadLevel5, LEVEL5_INTRO } from './levels/level5/index.js'
import { loadLevel6, LEVEL6_INTRO } from './levels/level6/index.js'
import { loadLevel7, LEVEL7_INTRO } from './levels/level7/index.js'
import { loadLevel8, LEVEL8_INTRO } from './levels/level8/index.js'
import { loadLevel9, LEVEL9_INTRO } from './levels/level9/index.js'
import { setupPolice }              from './levels/level1/police.js'
import { showLevelIntro }         from './UI/levelIntro.js'
import { attachChunkLoop }        from './scene/chunkManager.js'
import { spawnPNJFleet, attachPNJLoop } from './pnj/pnjManager.js'

const app = document.querySelector('#app')
if (!app) throw new Error('Élément #app introuvable')

app.innerHTML = `<canvas id="renderCanvas"></canvas><div id="top-vignette"></div>`

const canvas = /** @type {HTMLCanvasElement} */ (document.getElementById('renderCanvas'))
const engine = new Engine(canvas, true /* antialias on */, {
  preserveDrawingBuffer:    false,
  stencil:                  true,
  powerPreference:          'high-performance',
  disableWebGL2Support:     false,
})
const scene  = new Scene(engine)
scene.collisionsEnabled           = true
scene.skipPointerMovePicking      = true
scene.autoClearDepthAndStencil    = true
scene.blockMaterialDirtyMechanism = true

new HemisphericLight('light', new Vector3(0, 1, 0), scene)

window.addEventListener('resize', () => engine.resize())

/**
 * Démarre la scène : caméra, ciel, UI, chargement des assets, render loop.
 * Appelé après le clic sur "Jouer" depuis le menu principal.
 * Throw en cas d'erreur pour que le menu propose un "Réessayer".
 */
async function startGame({ name = 'Player', character = 'George' } = {}) {
  scene.metadata = scene.metadata ?? {}
  scene.metadata.playerName      = name
  scene.metadata.playerCharacter = character

  let heroRef       = null
  let level1Handle  = null
  let level2Handle  = null
  let level3Handle  = null
  let level4Handle  = null
  let level5Handle  = null
  let level6Handle  = null
  let level7Handle  = null
  let level8Handle  = null
  let level9Handle  = null

  // 1. Caméra
  const camera = setupCamera(scene, canvas)

  // 2. Ciel
  createSky(scene)

  // 3. UI HUD
  const compass         = setupCompass()
  const positionDisplay = setupPositionDisplay()
  const miniMap         = setupMiniMap()
  const statsBar        = setupStatsBar()
  const inventory       = setupInventoryBar(scene)
  const keybindings     = setupKeybindings()
  const pauseButton     = setupPauseButton(scene, { engine, camera })
  const graphics        = setupGraphicsSettings(engine)
  const playerStats     = setupPlayerStats()
  const teleport        = setupTeleport({ getHero: () => heroRef })
  const notifications   = setupNotifications()
  setupCrosshair()
  setupKeyHints({
    onMap:  () => miniMap.toggle(),
    onKeys: () => keybindings.toggle(),
  })

  const SPAWN = { x: 29.28, y: 0.14, z: 322.42 }

  let restartCurrentLevel = null

  const respawn = async () => {
    if (heroRef) heroRef.position.set(SPAWN.x, SPAWN.y, SPAWN.z)
    playerStats.setAlert(false)
    playerStats.setHealth(100)
    playerStats.setShield(100)
    scene.metadata.dead   = false
    scene.metadata.paused = false
    await restartCurrentLevel?.()
  }

  const deathScreen = setupDeathScreen({ onRespawn: respawn })

  const deathSfx = new Audio('/music/death.mp3')
  deathSfx.volume = 0.7

  playerStats.setOnDeath(() => {
    playerStats.setAlert(false)
    if (!scene.metadata) scene.metadata = {}
    scene.metadata.dead = true
    if (document.pointerLockElement) document.exitPointerLock()
    deathSfx.currentTime = 0
    deathSfx.play().catch(() => {})
    deathScreen.show()
  })

  // 4. Chargement parallèle map + joueur + level 1
  // Les startLevelN sont définis ici (avant le Promise.all) pour que
  // chaque onComplete puisse référencer le suivant, et pour permettre
  // le restart de la manche en cours lors d'un respawn.

  const startLevel9 = async () => {
    level9Handle?.dispose?.()
    inventory.clear()
    restartCurrentLevel = startLevel9
    level9Handle = await loadLevel9(scene, {
      getHero: () => heroRef,
      notifications,
      onComplete: () => notifications?.show({
        icon: 'fa-circle-check', variant: 'success',
        title: 'Jeu terminé', message: 'Vous avez complété toutes les manches !', duration: 8000,
      }),
    })
    showLevelIntro(LEVEL9_INTRO)
  }

  const startLevel8 = async () => {
    level8Handle?.dispose?.()
    inventory.clear()
    restartCurrentLevel = startLevel8
    level8Handle = await loadLevel8(scene, {
      getHero: () => heroRef,
      notifications,
      onComplete: startLevel9,
    })
    showLevelIntro(LEVEL8_INTRO)
  }

  const startLevel7 = async () => {
    level7Handle?.dispose?.()
    inventory.clear()
    restartCurrentLevel = startLevel7
    level7Handle = await loadLevel7(scene, {
      getHero: () => heroRef,
      notifications,
      inventory,
      onComplete: startLevel8,
    })
    showLevelIntro(LEVEL7_INTRO)
  }

  const startLevel6 = async () => {
    level6Handle?.dispose?.()
    inventory.clear()
    restartCurrentLevel = startLevel6
    level6Handle = await loadLevel6(scene, {
      getHero:  () => heroRef,
      notifications,
      damage:   (amount) => playerStats.damage(amount),
      inventory,
      onComplete: startLevel7,
    })
    showLevelIntro(LEVEL6_INTRO)
  }

  const startLevel5 = async () => {
    level5Handle?.dispose?.()
    inventory.clear()
    restartCurrentLevel = startLevel5
    level5Handle = await loadLevel5(scene, {
      getHero: () => heroRef,
      notifications,
      onComplete: startLevel6,
    })
    showLevelIntro(LEVEL5_INTRO)
  }

  const startLevel4 = async () => {
    level4Handle?.dispose?.()
    inventory.clear()
    restartCurrentLevel = startLevel4
    level4Handle = await loadLevel4(scene, {
      getHero: () => heroRef,
      notifications,
      robot: level2Handle?.robot,
      onComplete: startLevel5,
    })
    showLevelIntro(LEVEL4_INTRO)
  }

  const startLevel3 = async () => {
    level3Handle?.dispose?.()
    inventory.clear()
    restartCurrentLevel = startLevel3
    level3Handle = await loadLevel3(scene, {
      getHero: () => heroRef,
      notifications,
      inventory,
      robot: level2Handle?.robot,
      onComplete: startLevel4,
    })
    showLevelIntro(LEVEL3_INTRO)
  }

  const startLevel2 = async () => {
    level2Handle?.dispose?.()
    inventory.clear()
    restartCurrentLevel = startLevel2
    level2Handle = await loadLevel2(scene, {
      getHero: () => heroRef,
      notifications,
      damage: (amount) => playerStats.damage(amount),
      inventory,
      onComplete: startLevel3,
    })
    showLevelIntro(LEVEL2_INTRO)
  }

  const startLevel1 = async () => {
    level1Handle?.dispose?.()
    inventory.clear()
    restartCurrentLevel = startLevel1
    level1Handle = await loadLevel1(scene, {
      getHero: () => heroRef,
      notifications,
      inventory,
      onComplete: startLevel2,
    })
    showLevelIntro(LEVEL1_INTRO)
  }

  const [, player, level1] = await Promise.all([
    loadMapParts(scene),
    createPlayer(scene, { character }),
    loadLevel1(scene, {
      getHero: () => heroRef,
      notifications,
      inventory,
      onComplete: startLevel2,
    }),
    setupPolice(scene, {
      getHero:  () => heroRef,
      damage:   (amount) => playerStats.damage(amount),
      setAlert: (active) => playerStats.setAlert(active),
    }),
    spawnPNJFleet(scene, {
      file:  'pnj_car.glb',
      scale: 1.5,
      cars: [
        // Route existante (z≊283) — 2 voitures seules, espacement 0.5
        { pointA: { x:  176.70, y: 0.14, z:  283.38 }, pointB: { x: -206.17, y: 0.14, z:  283.38 }, speed: 15, startRatio: 0   },
        { pointA: { x:  176.70, y: 0.14, z:  283.38 }, pointB: { x: -206.17, y: 0.14, z:  283.38 }, speed: 15, startRatio: 0.5 },
        // Axe vertical est — 4 PNJs (voitures 0/0.5 + scooters 0.25/0.75), même vitesse
        { pointA: { x:   87.97, y: 0.14, z:  273.04 }, pointB: { x:   84.81, y: 0.14, z:  -97.93 }, speed: 14, startRatio: 0   },
        { pointA: { x:   87.97, y: 0.14, z:  273.04 }, pointB: { x:   84.81, y: 0.14, z:  -97.93 }, speed: 14, startRatio: 0.5 },
        // Axe horizontal sud — 4 PNJs (voitures 0/0.5 + scooters 0.25/0.75), même vitesse
        { pointA: { x: -138.87, y: 0.14, z:  187.24 }, pointB: { x:  168.43, y: 0.14, z:  183.94 }, speed: 15, startRatio: 0   },
        { pointA: { x: -138.87, y: 0.14, z:  187.24 }, pointB: { x:  168.43, y: 0.14, z:  183.94 }, speed: 15, startRatio: 0.5 },
      ],
    }),
    spawnPNJFleet(scene, {
      file:  'pnjscooter_1.glb',
      scale: 1.5,
      cars: [
        // Axe vertical est — intercalés entre les voitures (0.25/0.75)
        { pointA: { x:   87.97, y: 0.14, z:  273.04 }, pointB: { x:   84.81, y: 0.14, z:  -97.93 }, speed: 14, startRatio: 0.25 },
        { pointA: { x:   87.97, y: 0.14, z:  273.04 }, pointB: { x:   84.81, y: 0.14, z:  -97.93 }, speed: 14, startRatio: 0.75 },
        // Axe horizontal centre — 2 scooters seuls, espacement 0.5
        { pointA: { x:  168.71, y: 0.14, z:  -15.53 }, pointB: { x: -193.72, y: 0.14, z:  -16.34 }, speed: 14, startRatio: 0   },
        { pointA: { x:  168.71, y: 0.14, z:  -15.53 }, pointB: { x: -193.72, y: 0.14, z:  -16.34 }, speed: 14, startRatio: 0.5 },
        // Axe horizontal sud — intercalés entre les voitures (0.25/0.75)
        { pointA: { x: -138.87, y: 0.14, z:  187.24 }, pointB: { x:  168.43, y: 0.14, z:  183.94 }, speed: 15, startRatio: 0.25 },
        { pointA: { x: -138.87, y: 0.14, z:  187.24 }, pointB: { x:  168.43, y: 0.14, z:  183.94 }, speed: 15, startRatio: 0.75 },
      ],
    }),
  ])

  console.log('[app] joueur prêt')

  // Musique de jeu en boucle
  const bgm = new Audio('/music/music_game.mp3')
  bgm.loop = true
  pauseButton.setAudio(bgm)
  bgm.play().catch(() => {})

  // Pré-chauffe le cache HTTP des assets des niveaux suivants
  // pour éviter le freeze au moment de la transition inter-manches.
  const prefetch = (...urls) => urls.forEach(url =>
    fetch(url, { priority: 'low' }).catch(() => {}),
  )
  // Assets level 2 : robot (le soldier.glb est déjà en cache via level 1)
  prefetch('/level/level2/robot.glb')
  // Assets level 3 : composants à récupérer
  setTimeout(() => prefetch('/level/level2/mother_board.glb', '/level/level2/disk.glb'), 8000)

  heroRef               = player.hero
  level1Handle          = level1
  restartCurrentLevel   = startLevel1
  setupControls(scene, player.hero, player.animations, camera, canvas)
  attachChunkLoop(scene, () => heroRef?.position ?? null)
  attachPNJLoop(scene,   () => heroRef?.position ?? null)

  setupVisibilityManager(scene, camera, player.meshes)

  // ---- Cheat : Tab x3 (en moins d'1s) → skip la manche en cours ----
  {
    const WINDOW_MS = 1000
    let presses = []
    window.addEventListener('keydown', (e) => {
      if (e.key !== 'Tab') return
      e.preventDefault()
      const now = performance.now()
      presses = presses.filter(t => now - t < WINDOW_MS)
      presses.push(now)
      if (presses.length < 3) return
      presses = []
      const handles = { 1: level1Handle, 2: level2Handle, 3: level3Handle, 4: level4Handle, 5: level5Handle, 6: level6Handle, 7: level7Handle, 8: level8Handle, 9: level9Handle }
      handles[scene.metadata?.currentLevel]?.skip?.()
    })
  }

  // 5. Boucle de rendu — UI mise à jour à ~30 Hz (1 frame sur 2).
  let uiTick = 0
  engine.runRenderLoop(() => {
    if (heroRef && (++uiTick & 1) === 0) {
      compass.update(heroRef.rotation.y)
      positionDisplay.update(heroRef.position)
      miniMap.update(heroRef.position, heroRef.rotation.y)
    }
    scene.render()
  })

  return () => {
    if (scene.metadata?.currentLevel === 1) showLevelIntro(LEVEL1_INTRO)
  }
}

// ---- Écran d'accueil ----
showMainMenu({ onPlay: (opts) => startGame(opts) })
