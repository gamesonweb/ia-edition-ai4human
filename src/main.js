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
import { startTronScene }         from './minigame/tron/tronScene.js'
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
import { showIntroVideo }         from './UI/introVideo.js'
import { loadTutorial }           from './levels/tutorial/index.js'
import { playCutscene }           from './UI/cutscene.js'
import { showEndScreen }          from './UI/endScreen.js'
import { showOutroVideo }         from './UI/outroVideo.js'
import { attachChunkLoop, listMapChunks } from './scene/chunkManager.js'
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
  adaptToDeviceRatio:       true,
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
  sessionStorage.clear()
  scene.metadata = scene.metadata ?? {}
  scene.metadata.playerName      = name
  scene.metadata.playerCharacter = character

  let heroRef               = null
  let tutorialHandle        = null
  let level1Handle          = null
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
  const miniMap         = setupMiniMap({ scene })
  const statsBar        = setupStatsBar({ playerName: name })
  const inventory       = setupInventoryBar(scene)
  const keybindings     = setupKeybindings()
  const pauseButton     = setupPauseButton(scene, { engine, camera, onQuit: () => location.reload() })
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

  const playLevelCutscene = (shots, chapter) => {
    scene.metadata.activeCutscene?.skip()
    scene.metadata.activeCutscene = playCutscene(scene, shots, { chapter })
  }

  const respawn = async () => {
    if (heroRef) heroRef.position.set(SPAWN.x, SPAWN.y, SPAWN.z)
    playerStats.setAlert(false)
    playerStats.setHealth(100)
    playerStats.setShield(100)
    scene.metadata.dead   = false
    scene.metadata.paused = false
    // Rejouer la cutscene du niveau en cours après une mort
    sessionStorage.removeItem(`cs_done_${scene.metadata.currentLevel}`)
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

  const LEVEL9_INTRO_SHOTS = [
    // Plan 1 — zone joueur / contexte
    {
      pos: [20, 5, 336], tar: [29, 1.5, 322],
      subtitle: 'Les coordonnées ont été décryptées. L\'usine centrale IA est localisée.',
      hold: 2800, move: 1800,
    },
    // Plan 2 — usine centrale (-46.57, 15.64) — saut lointain au sud-ouest
    {
      pos: [-36, 4.5, 16], tar: [-47, 1, 16],
      cut: true, teleport: true,
      orbit: { deg: 90 },
      subtitle: 'Approchez-vous et entrez la combinaison de sécurité. C\'est la fin.',
      hold: 3500, move: 1600,
    },
    // Plan 3 — retour joueur
    {
      pos: [20, 5, 336], tar: [29, 1.5, 322],
      subtitle: 'Appuyez sur E pour accéder au panneau. Une dernière mission.',
      hold: 2500,
    },
  ]

  const startLevel9 = async () => {
    playerStats.setInvincible(true)
    level9Handle?.dispose?.()
    inventory.clear()
    restartCurrentLevel = startLevel9
    level9Handle = await loadLevel9(scene, {
      getHero: () => heroRef,
      notifications,
      onComplete: () => {
        statsBar.stopTimer()
        const finalTime = statsBar.getTime()
        showOutroVideo('/videoOutro/videoOutro.mp4', () => {
          showEndScreen({ playerTimeMs: finalTime, scene })
        })
      },
    })
    playerStats.setInvincible(false)
    if (!sessionStorage.getItem('cs_done_9')) {
      sessionStorage.setItem('cs_done_9', '1')
      playLevelCutscene(LEVEL9_INTRO_SHOTS, 'Manche 9 — Entrée de la centrale')
    }
  }

  const LEVEL8_INTRO_SHOTS = [
    // Plan 1 — plan large : vue d'ensemble des 3 robots (saut lointain au sud)
    {
      pos: [10, 10, -180], tar: [10, 5, 50],
      cut: true, teleport: true,
      subtitle: 'Trois robots patrouillent le secteur. L\'un travaille au Data Center IA — identifiez-le.',
      hold: 3000, move: 1800,
    },
    // Plan 2 — XR-221 (-41.63, 44.37) — orbit
    {
      pos: [-52, 14.5, 44], tar: [-42, 1, 44],
      orbit: { deg: 90 },
      subtitle: 'Scannez chaque robot avec [K]. Un seul a accès au Data Center.',
      hold: 3200, move: 1600,
    },
    // Plan 3 — XR-442 / agent (47.57, 137.07) — cut+teleport+orbit
    {
      pos: [57, 14.5, 137], tar: [48, 1, 137],
      cut: true, teleport: true,
      orbit: { deg: 90 },
      subtitle: 'Une fois identifié, synchronisez vos fréquences avec [E].',
      hold: 3500, move: 1600,
    },
    // Plan 4 — retour joueur
    {
      pos: [20, 5, 336], tar: [29, 1.5, 322],
      subtitle: 'Trois suspects. Un seul est votre porte d\'entrée.',
      hold: 2500,
    },
  ]

  const startLevel8 = async () => {
    playerStats.setInvincible(true)
    level8Handle?.dispose?.()
    inventory.clear()
    restartCurrentLevel = startLevel8
    level8Handle = await loadLevel8(scene, {
      getHero: () => heroRef,
      notifications,
      onComplete: startLevel9,
    })
    playerStats.setInvincible(false)
    if (!sessionStorage.getItem('cs_done_8')) {
      sessionStorage.setItem('cs_done_8', '1')
      playLevelCutscene(LEVEL8_INTRO_SHOTS, 'Manche 8 — Connexion IA')
    }
  }

  const LEVEL7_INTRO_SHOTS = [
    // Plan 1 — zone joueur / contexte
    {
      pos: [20, 5, 336], tar: [29, 1.5, 322],
      subtitle: 'Jacob Martin est quelque part dans la zone. Trouvez-le — il détient l\'accréditation Sergent IA.',
      hold: 2800, move: 1800,
    },
    // Plan 2 — Jacob (47.73, 24.97) — saut lointain au sud
    {
      pos: [62, 4.5, 25], tar: [48, 1, 25],
      cut: true, teleport: true,
      orbit: { deg: 90 },
      subtitle: 'Jacob Martin — parlez-lui et résolvez le puzzle d\'accréditation.',
      hold: 3500, move: 1600,
    },
    // Plan 3 — retour joueur
    {
      pos: [20, 5, 336], tar: [29, 1.5, 322],
      subtitle: 'Appuyez sur E pour interagir. Une seule chance.',
      hold: 2500,
    },
  ]

  const startLevel7 = async () => {
    playerStats.setInvincible(true)
    level7Handle?.dispose?.()
    inventory.clear()
    restartCurrentLevel = startLevel7
    level7Handle = await loadLevel7(scene, {
      getHero: () => heroRef,
      notifications,
      inventory,
      onComplete: startLevel8,
    })
    playerStats.setInvincible(false)
    if (!sessionStorage.getItem('cs_done_7')) {
      sessionStorage.setItem('cs_done_7', '1')
      playLevelCutscene(LEVEL7_INTRO_SHOTS, 'Manche 7 — Découverte de Jacob')
    }
  }

  const LEVEL6_INTRO_SHOTS = [
    // Plan 1 — plan large aérien avec sweep orbital pour voir toutes les zones
    {
      pos: [-14, 220, -100], tar: [-14, 5, 110],
      orbit: { deg: 150 },
      subtitle: 'Dix unités ennemies. Trois zones. La ville appartient aux machines.',
      hold: 5000, move: 1800,
    },
    // Plan 2 — Zone 1 (15.27, 185.44) — détail au sol
    {
      pos: [6, 5, 185], tar: [15, 1, 185],
      orbit: { deg: 90 },
      subtitle: 'Zone 1 — cœur de la ville...',
      hold: 3200, move: 1600,
    },
    // Plan 3 — Zone 3 (-191.64, 132.37) — extrême ouest, saut lointain
    {
      pos: [-182, 5, 132], tar: [-192, 1, 132],
      cut: true, teleport: true,
      subtitle: "...jusqu'à l'extrême ouest de Rey Michell. Chaque zone libérée révèle une clé.",
      hold: 3000, move: 1600,
    },
    // Plan 4 — retour joueur
    {
      pos: [20, 5, 336], tar: [29, 1.5, 322],
      subtitle: "Trois clés. Ensuite, l'ordinateur central. Bonne chance.",
      hold: 2500,
    },
  ]

  const startLevel6 = async () => {
    playerStats.setInvincible(true)
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
    playerStats.setInvincible(false)
    if (!sessionStorage.getItem('cs_done_6')) {
      sessionStorage.setItem('cs_done_6', '1')
      playLevelCutscene(LEVEL6_INTRO_SHOTS, 'Manche 6 — Attaque du robot policier')
    }
  }

  const LEVEL5_INTRO_SHOTS = [
    // Plan 1 — zone joueur / contexte
    {
      pos: [20, 5, 336], tar: [29, 1.5, 322],
      subtitle: 'Pour ne pas se faire repérer facilement par la reconnaissance IA.',
      hold: 2800, move: 1800,
    },
    // Plan 2 — caméra nord-est (95.89, 12, 271.99) — orbit
    {
      pos: [86, 5, 272], tar: [96, 12, 272],
      orbit: { deg: 90 },
      subtitle: '6 caméras de surveillance actives dans la zone. Neutralisez-les toutes.',
      hold: 3200, move: 1600,
    },
    // Plan 3 — caméra sud-ouest (-93.16, 12, 23.81) — saut lointain
    {
      pos: [-84, 5, 24], tar: [-93, 12, 24],
      cut: true, teleport: true,
      subtitle: 'Cherchez. Visez. Détruisez.',
      hold: 3000, move: 1600,
    },
    // Plan 4 — retour joueur
    {
      pos: [20, 5, 336], tar: [29, 1.5, 322],
      subtitle: 'Six cibles !',
      hold: 2500,
    },
  ]

  const startLevel5 = async () => {
    playerStats.setInvincible(true)
    level5Handle?.dispose?.()
    inventory.clear()
    restartCurrentLevel = startLevel5
    level5Handle = await loadLevel5(scene, {
      getHero: () => heroRef,
      notifications,
      onComplete: startLevel6,
    })
    playerStats.setInvincible(false)
    if (!sessionStorage.getItem('cs_done_5')) {
      sessionStorage.setItem('cs_done_5', '1')
      playLevelCutscene(LEVEL5_INTRO_SHOTS, 'Manche 5 — Destruction des caméras')
    }
  }

  const LEVEL4_INTRO_SHOTS = [
    // Plan 1 — zone joueur / contexte
    {
      pos: [20, 4.5, 336], tar: [29, 1.5, 322],
      subtitle: 'Votre couverture doit être parfaite — le système de reconnaissance faciale bloque l\'accès à l\'usine.',
      hold: 3000, move: 1800,
    },
    // Plan 2 — ordinateur (-115.36, 14.11) — saut lointain à l'ouest
    {
      pos: [-125, 4.5, 14], tar: [-115, 1, 14],
      cut: true, teleport: true,
      orbit: { deg: 90 },
      subtitle: 'Un terminal d\'administration dans la zone industrielle. Enregistrez-vous comme robot autorisé.',
      hold: 3500, move: 1600,
    },
    // Plan 3 — avertissement délai
    {
      pos: [20, 4.5, 336], tar: [29, 1.5, 322],
      subtitle: 'Attention, ça peut prendre quelques heures pour que les IA vous considèrent comme un véritable robot.',
      hold: 3200, move: 1600,
    },
    // Plan 4 — retour joueur
    {
      pos: [20, 4.5, 336], tar: [29, 1.5, 322],
      subtitle: 'Approchez le terminal et appuyez sur E. Votre robot vous aidera.',
      hold: 2500,
    },
  ]

  const startLevel4 = async () => {
    playerStats.setInvincible(true)
    level4Handle?.dispose?.()
    inventory.clear()
    restartCurrentLevel = startLevel4
    level4Handle = await loadLevel4(scene, {
      getHero: () => heroRef,
      notifications,
      robot: level2Handle?.robot,
      onComplete: startLevel5,
      onTeleport: () => teleport.teleport(),
    })
    playerStats.setInvincible(false)
    if (!sessionStorage.getItem('cs_done_4')) {
      sessionStorage.setItem('cs_done_4', '1')
      playLevelCutscene(LEVEL4_INTRO_SHOTS, 'Manche 4 — Infiltration IA')
    }
  }

  const LEVEL3_INTRO_SHOTS = [
    // Plan 1 — robot à réparer (24.72, 310.48)
    {
      pos: [15, 4.5, 310], tar: [25, 1, 310],
      orbit: { deg: 90 },
      subtitle: 'Votre robot a besoin de pièces pour être remis en état.',
      hold: 3500, move: 1800,
    },
    // Plan 2 — carte mère (-22.79, 28.55) — saut lointain
    {
      pos: [-32, 4.5, 29], tar: [-23, 1, 29],
      cut: true, teleport: true,
      subtitle: 'Une carte mère abandonnée dans la zone sud...',
      hold: 2800, move: 1800,
    },
    // Plan 3 — disque (148.86, 38.11) — autre saut lointain
    {
      pos: [159, 4.5, 38], tar: [149, 1, 38],
      cut: true, teleport: true,
      subtitle: '...et un disque de données dissimulé à l\'est.',
      hold: 2800, move: 1600,
    },
    // Plan 4 — retour joueur
    {
      pos: [20, 4.5, 336], tar: [29, 1.5, 322],
      subtitle: 'Récupérez les deux composants et ramenez-les au robot.',
      hold: 2500,
    },
  ]

  const startLevel3 = async () => {
    playerStats.setInvincible(true)
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
    playerStats.setInvincible(false)
    if (!sessionStorage.getItem('cs_done_3')) {
      sessionStorage.setItem('cs_done_3', '1')
      playLevelCutscene(LEVEL3_INTRO_SHOTS, 'Manche 3 — Réparation du compagnon')
    }
  }

  const LEVEL2_INTRO_SHOTS = [
    {
      pos: [78, 4.5, 314], tar: [89, 1, 314],
      subtitle: 'Poste de contrôle frontalier Rey Michell.',
      hold: 2800, move: 1800,
    },
    {
      pos: [78, 4.5, 305], tar: [88, 1, 298],
      subtitle: "Présentez votre passeport au soldat d'autorité.",
      hold: 2800, move: 1800,
    },
    {
      pos: [-170, 4.5, 196], tar: [-161, 1, 196],
      cut: true,
      teleport: true,
      orbit: { deg: 120 },
      subtitle: 'Votre robot IA contaminé rôde dans la zone industrielle. Détruisez-le !',
      hold: 3500, move: 1800,
    },
    {
      pos: [15, 4.5, 310], tar: [25, 1, 310],
      subtitle: 'Récupérez le corps et déposez-le dans la zone verte.',
      hold: 2800, move: 1600,
    },
    {
      pos: [29, 4.5, 336], tar: [29, 1.5, 322],
      subtitle: 'Une minute pour montrer vos papiers. Ne tardez pas.',
      hold: 2500,
    },
  ]

  const startLevel2 = async () => {
    playerStats.setInvincible(true)
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
    playerStats.setInvincible(false)
    if (!sessionStorage.getItem('cs_done_2')) {
      sessionStorage.setItem('cs_done_2', '1')
      playLevelCutscene(LEVEL2_INTRO_SHOTS, 'Manche 2 — Combat du compagnon infecté')
    }
  }

  const LEVEL1_INTRO_SHOTS = [
    // Plan 1 — carte 1 (24.02, 354.81)
    {
      pos: [14, 4.5, 355], tar: [24, 0.8, 354],
      subtitle: 'Poste de contrôle frontalier Rey Michell.',
      hold: 2800, move: 1800,
    },
    // Plan 2 — carte 2 (-24.17, 311.15)
    {
      pos: [-34, 4.5, 311], tar: [-24, 0.8, 311],
      subtitle: "Vos documents d'identité sont éparpillés dans la zone.",
      hold: 2800, move: 1800,
    },
    // Plan 3 — carte 3 (51.76, 307.46)
    {
      pos: [43, 4.5, 315], tar: [51, 0.8, 307],
      subtitle: 'Trois cartes à récupérer pour pouvoir sortir de cette zone.',
      hold: 2800, move: 1800,
    },
    // Plan 4 — soldat / barrière (danger)
    {
      pos: [75, 4.5, 312], tar: [89, 1.8, 310],
      subtitle: "Les unités IA patrouillent le secteur. Restez discret.",
      hold: 2800, move: 1600,
    },
    // Plan 5 — retour joueur
    {
      pos: [29, 4.5, 336], tar: [29, 1.5, 322],
      subtitle: 'Récupérez-les. Vite.',
      hold: 2500,
    },
  ]

  const startLevel1 = async () => {
    playerStats.setInvincible(true)
    level1Handle?.dispose?.()
    inventory.clear()
    restartCurrentLevel = startLevel1
    level1Handle = await loadLevel1(scene, {
      getHero:     () => heroRef,
      notifications,
      inventory,
      onComplete:  startLevel2,
      onCardReady: () => teleport.teleport(),
    })
    playerStats.setInvincible(false)

    if (!sessionStorage.getItem('cs_done_1')) {
      sessionStorage.setItem('cs_done_1', '1')
      playLevelCutscene(LEVEL1_INTRO_SHOTS, 'Manche 1 — Faux laissez-passer')
    }
  }

  const [, player] = await Promise.all([
    loadMapParts(scene),
    createPlayer(scene, { character }),
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

  // Musique de jeu en boucle — démarre silencieuse pendant la vidéo d'intro
  const bgm = new Audio('/music/music_game.mp3')
  bgm.loop   = true
  bgm.volume = 0
  pauseButton.setAudio(bgm)
  bgm.play().catch(() => {})

  const bgmFadeIn = (targetVol = 0.45, durationMs = 2500) => {
    const step = 50
    const inc  = targetVol / (durationMs / step)
    const id   = setInterval(() => {
      bgm.volume = Math.min(targetVol, bgm.volume + inc)
      if (bgm.volume >= targetVol) clearInterval(id)
    }, step)
  }

  // Pré-chauffe le cache HTTP des assets des niveaux suivants
  // pour éviter le freeze au moment de la transition inter-manches.
  const prefetch = (...urls) => urls.forEach(url =>
    fetch(url, { priority: 'low' }).catch(() => {}),
  )
  // Assets level 2 : robot (le soldier.glb est déjà en cache via level 1)
  prefetch('/level/level2/robot.glb')
  // Assets level 3 : composants à récupérer
  setTimeout(() => prefetch('/level/level2/mother_board.glb', '/level/level2/disk.glb'), 8000)

  heroRef             = player.hero
  restartCurrentLevel = startLevel1
  setupControls(scene, player.hero, player.animations, camera, canvas)
  attachChunkLoop(scene, () => heroRef?.position ?? null)
  window.__chunkDebug = () => listMapChunks()
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
      const handles = { 0: tutorialHandle, 1: level1Handle, 2: level2Handle, 3: level3Handle, 4: level4Handle, 5: level5Handle, 6: level6Handle, 7: level7Handle, 8: level8Handle, 9: level9Handle }
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
    showIntroVideo('/videoIntro/introVideo.mp4', () => {
      bgmFadeIn()
      loadTutorial(scene, {
        getHero: () => heroRef,
        notifications,
        onComplete: () => startLevel1(),
      }).then(handle => {
        tutorialHandle = handle
      })
    })
  }
}

// ---- Écran d'accueil ----
showMainMenu({
  onPlay: (opts) => startGame(opts),
  onPlayExtra: () => startTronScene(),
})
