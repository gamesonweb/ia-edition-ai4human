import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader'

import { spawnCollectibles }  from '../../scene/collectibles.js'
import { showLevelComplete }  from '../../UI/levelComplete.js'
import { playCutscene }       from '../../UI/cutscene.js'

const LEVEL1_BASE = '/level/level1/'

function showCarteId(onDone) {
  const overlay = document.createElement('div')
  overlay.id = 'carte-id-overlay'

  overlay.innerHTML = `
    <style>
      #carte-id-overlay {
        position:fixed; inset:0; z-index:6000;
        display:flex; flex-direction:column; align-items:center; justify-content:center;
        background:rgba(4,5,14,0.92); backdrop-filter:blur(8px);
        opacity:0; transition:opacity 0.4s ease;
      }
      #carte-id-overlay.ci-visible { opacity:1; }
      .ci-label {
        font-family:'Segoe UI',system-ui,sans-serif;
        font-size:13px; letter-spacing:3px; text-transform:uppercase;
        color:rgba(103,232,249,0.85); margin-bottom:22px;
        animation:ciFadeUp 0.5s 0.2s both;
      }
      .ci-stamp {
        font-family:'Segoe UI',system-ui,sans-serif;
        font-size:12px; letter-spacing:2px; text-transform:uppercase;
        color:rgba(74,222,128,0.85); margin-top:22px;
        animation:ciFadeUp 0.5s 1.9s both;
      }
      .ci-scene { perspective:1000px; }
      .ci-coin {
        width:min(460px,88vw);
        border-radius:12px;
        transform-style:preserve-3d;
        animation:coinFlip 1.5s cubic-bezier(.4,0,.2,1) forwards;
        position:relative;
      }
      .ci-coin img {
        width:100%; border-radius:12px; display:block;
        border:2px solid rgba(103,232,249,0.55);
        box-shadow:0 0 50px rgba(103,232,249,0.3), 0 0 100px rgba(167,139,250,0.15);
        backface-visibility:hidden;
      }
      .ci-coin::after {
        content:'';
        position:absolute; inset:0; border-radius:12px; pointer-events:none;
        background:linear-gradient(115deg,transparent 25%,rgba(255,255,255,0.22) 50%,transparent 75%);
        background-size:200% 100%;
        animation:ciSheen 0.7s 1.4s ease-out both;
      }
      @keyframes coinFlip {
        0%   { transform:rotateY(-600deg) scale(0.5); opacity:0; }
        55%  { opacity:1; }
        82%  { transform:rotateY(10deg)  scale(1.04); }
        91%  { transform:rotateY(-5deg)  scale(1);    }
        100% { transform:rotateY(0deg)   scale(1);    opacity:1; }
      }
      @keyframes ciSheen {
        from { background-position:200% 0; opacity:0.8; }
        to   { background-position:-50% 0; opacity:0;   }
      }
      @keyframes ciFadeUp {
        from { opacity:0; transform:translateY(12px); }
        to   { opacity:1; transform:translateY(0);    }
      }
    </style>
    <div class="ci-label">Carte d'identité constituée</div>
    <div class="ci-scene">
      <div class="ci-coin">
        <img src="/img/photoProfile/carteId.jpg" alt="Carte d'identité" />
      </div>
    </div>
    <div class="ci-stamp">✓ Tampons officiels apposés</div>
  `

  document.body.appendChild(overlay)
  requestAnimationFrame(() => overlay.classList.add('ci-visible'))

  setTimeout(() => {
    overlay.style.opacity = '0'
    overlay.style.transition = 'opacity 0.5s ease'
    setTimeout(() => { overlay.remove(); onDone?.() }, 520)
  }, 4000)
}

const CARD_POSITIONS = [
  { x:  24.02, y: 0.14, z: 354.81 },
  { x: -24.17, y: 0.14, z: 311.15 },
  { x:  51.76, y: 0.14, z: 307.46 },
]

const STAMP_POSITIONS = [
  { x:  87.48, y: 0.14, z: 302.18 },
  { x: -39.24, y: 0.14, z: 300.35 },
]

export const LEVEL1_INTRO = {
  label:    'Manche',
  title:    'Manche 1',
  subtitle: 'Explorez la zone en évitant les patrouilles',
  dangers: [
    { icon: 'fa-eye',          text: 'Cône de vision des policiers' },
    { icon: 'fa-heart-crack',  text: 'Dégâts continus si repéré' },
    { icon: 'fa-person-rifle', text: 'Soldats et barrières aux carrefours' },
  ],
  duration: 7000,
}

const BARRIER_POSITIONS = [
  { x:  87.63, y: 0, z: 297.51 },
  { x: -51.38, y: 0, z: 296.35 },
]

const SOLDIER_POSITIONS = [
  { x: -61.00, y: 0.14, z: 308.40 },
  { x:  89.14, y: 0.14, z:   310.25 },
]

async function importDecor(scene, file, positions, namePrefix, scale = 1, rotationY = Math.PI) {
  const result = await SceneLoader.ImportMeshAsync(null, LEVEL1_BASE, file, scene)
  result.animationGroups?.forEach(ag => ag.stop())

  const root = result.meshes.find(m => m.name === '__root__') ?? result.meshes[0]
  if (!root) return []

  const enableCollisions = (node) => {
    for (const m of node.getChildMeshes(false)) {
      if (m.subMeshes && m.subMeshes.length > 0) {
        m.checkCollisions = true
      }
    }
  }

  const applyScale = (node) => {
    node.scaling.set(scale, scale, scale)
  }

  const placed = []

  // Premier
  root.name = `${namePrefix}_0`
  root.rotationQuaternion = null
  root.rotation.y = rotationY
  root.position.set(positions[0].x, positions[0].y, positions[0].z)

  applyScale(root)
  enableCollisions(root)

  placed.push(root)

  // Clones
  for (let i = 1; i < positions.length; i++) {
    const clone = root.clone(`${namePrefix}_${i}`, null)
    if (!clone) continue

    clone.rotationQuaternion = null
    clone.rotation.y = rotationY
    clone.position.set(
      positions[i].x,
      positions[i].y,
      positions[i].z
    )

    applyScale(clone)
    enableCollisions(clone)

    placed.push(clone)
  }

  return placed
}

export async function loadLevel1(scene, { getHero, notifications, inventory, onComplete, onCardReady } = {}) {
  if (!scene.metadata) scene.metadata = {}
  scene.metadata.currentLevel = 1
  scene.metadata.level1Phase  = 'cards'

  let level1Skipped = false

  const [barriers, soldiers] = await Promise.all([
    importDecor(
      scene,
      'barriere.glb',
      BARRIER_POSITIONS,
      'barriere',
      3.5 // scale barrières
    ),

    importDecor(
      scene,
      'soldier.glb',
      SOLDIER_POSITIONS,
      'soldier',
      1.1, // scale soldats
      (2 * Math.PI) / 3 // rotation 120°
    ),
  ])

  console.log('[level1] décor placé', {
    barrieres: barriers.length,
    soldats: soldiers.length,
  })

  // Garde-circulation : tout le décor du level 1 est masqué
  // dès que `currentLevel` change (cohérent avec le pattern de police.js)
  const collectiblesHandles = []
  let level1Active = null
  const visObserver = scene.onBeforeRenderObservable.add(() => {
    const isLevel1 = scene.metadata?.currentLevel === 1
    if (isLevel1 === level1Active) return
    level1Active = isLevel1

    for (const m of barriers) m.setEnabled(isLevel1)
    for (const m of soldiers) m.setEnabled(isLevel1)

    for (const h of collectiblesHandles) {
      for (const item of h.items) {
        if (!item.collected) {
          item.root.setEnabled(isLevel1)
          if (item.tube) item.tube.setEnabled(isLevel1)
        }
      }
    }
  })

  // ---------------- PHASE 1 : récupérer les 3 cartes ----------------
  if (getHero && notifications) {
    notifications.show({
      id:         'objective',
      icon:       'fa-id-card',
      title:      'Objectif',
      message:    'Récupérez les 3 cartes éparpillées dans la zone.',
      persistent: true,
    })

    const cardsHandle = await spawnCollectibles(scene, {
      basePath: LEVEL1_BASE,
      file:     'cards.glb',
      positions: CARD_POSITIONS.map(p => ({ ...p, y: 0.24 })),
      scale:    4,
      name:     'card',
      getHero,
      tube: {
        color:    '#FF8C00',
        alpha:    0.32,
        diameter: 2.2,
        height:   4,
      },
      onPickup: (idx, count, total) => {
        console.log('[level1] onPickup cartes', { count, total, inventoryDefined: !!inventory })
        inventory?.setItem(0, { name: 'Cartes', icon: '/img/inventaire/cards.png', quantity: count, rarity: 'uncommon' })
        notifications.show({
          id:      'card-progress',
          icon:    'fa-id-card',
          title:   'Carte récupérée',
          message: `${count} / ${total}`,
          duration: 2500,
        })
      },
      // (handle stocké après ce bloc)
      onAllCollected: async () => {
        scene.metadata.level1Phase = 'stamps'

        // ---------------- PHASE 2 : spawner les tampons d'abord ----------------
        const stampsHandle = await spawnCollectibles(scene, {
          basePath: LEVEL1_BASE,
          file:     'stamp.glb',
          positions: STAMP_POSITIONS.map(p => ({ ...p, y: 0.40 })),
          scale:    0.03,
          name:     'stamp',
          getHero,
          tube: {
            color:    '#FF8C00',
            alpha:    0.32,
            diameter: 2.2,
            height:   4,
          },
          onPickup: (idx, count, total) => {
            inventory?.setItem(1, { name: 'Tampons', icon: '/img/inventaire/cards.png', quantity: count, rarity: 'rare' })
            notifications.show({
              id:      'stamp-progress',
              icon:    'fa-stamp',
              title:   'Tampon récupéré',
              message: `${count} / ${total}`,
              duration: 2500,
            })
          },
          onAllCollected: () => {
            scene.metadata.level1Phase = 'completed'
            notifications.dismiss('objective')
            notifications.dismiss('police-warning')
            onCardReady?.()
            showCarteId(() => {
              showLevelComplete({
                title:    'Manche 1 terminée',
                subtitle: 'Carte d\'identité validée.',
                duration: 3500,
              })
              setTimeout(() => onComplete?.(), 4000)
            })
          },
        })
        if (stampsHandle) collectiblesHandles.push(stampsHandle)

        // ---- Cutscene maintenant que les tampons sont visibles ----
        await new Promise(resolve => {
          scene.metadata.activeCutscene?.skip()
          scene.metadata.activeCutscene = playCutscene(scene, [
            {
              pos: [77, 4.5, 302], tar: [87, 0.8, 302],
              subtitle: "Carte d'identité constituée. Il lui manque les tampons officiels.",
              hold: 3000, move: 1800,
            },
            {
              pos: [-49, 4.5, 300], tar: [-39, 0.8, 300],
              subtitle: "Deux tampons officiels sont gardés dans le secteur.",
              hold: 3000,
            },
          ], { chapter: 'Manche 1 — Phase 2', onDone: resolve })
        })
        if (level1Skipped) return

        notifications.show({
          icon:    'fa-circle-info',
          title:   'Carte d\'identité créée',
          message: 'Votre carte d\'identité a été réalisée par les moyens du bord. Volez des tampons officiels pour qu\'elle soit valide.',
          duration: 12000,
        })
        notifications.show({
          id: 'objective', icon: 'fa-stamp',
          title: 'Objectif', message: 'Récupérez les 2 tampons officiels dans la zone.',
          persistent: true,
        })
        notifications.show({
          id: 'police-warning', icon: 'fa-triangle-exclamation', variant: 'warning',
          title: 'Surveillance active',
          message: 'Les robots IA policier surveillent cette zone. Récupérez vite, sinon vous perdez des vies.',
          persistent: true,
        })
      },
    })
    if (cardsHandle) collectiblesHandles.push(cardsHandle)
  }

  const skip = () => {
    if (level1Skipped) return
    level1Skipped = true
    scene.metadata.level1Phase = 'completed'
    for (const h of collectiblesHandles) {
      try { h.dispose?.() } catch {}
    }
    notifications?.dismiss('objective')
    notifications?.dismiss('police-warning')
    notifications?.dismiss('card-progress')
    notifications?.dismiss('stamp-progress')
    notifications?.show({
      icon:    'fa-forward',
      variant: 'info',
      title:   'Niveau passé',
      message: 'Cheat: Manche 1 ignorée. Chargement de la Manche 2…',
      duration: 3500,
    })
    onComplete?.()
  }

  return {
    barriers,
    soldiers,
    skip,
    dispose: () => {
      scene.onBeforeRenderObservable.remove(visObserver)
      for (const h of collectiblesHandles) try { h.dispose?.() } catch {}
      notifications?.dismiss('objective')
      notifications?.dismiss('police-warning')
      notifications?.dismiss('card-progress')
      notifications?.dismiss('stamp-progress')
      for (const m of barriers) try { m.dispose() } catch {}
      for (const m of soldiers) try { m.dispose() } catch {}
    },
  }
}