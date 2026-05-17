import './tutorial.css'
import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader'
import { Vector3 } from '@babylonjs/core/Maths/math.vector'
import '@babylonjs/loaders/glTF'

const MOVE_KEYS = new Set(['z','q','s','d','arrowup','arrowdown','arrowleft','arrowright'])

const STEPS = [
  {
    id:    'move',
    title: 'Déplacement',
    keysHTML: `
      <span class="tut-key" data-k="z">Z</span>
      <span class="tut-key" data-k="q">Q</span>
      <span class="tut-key" data-k="s">S</span>
      <span class="tut-key" data-k="d">D</span>
      <span class="tut-key-sep">+</span>
      <span class="tut-key" data-k="arrowup">↑</span>
      <span class="tut-key" data-k="arrowdown">↓</span>
      <span class="tut-key" data-k="arrowleft">←</span>
      <span class="tut-key" data-k="arrowright">→</span>
    `,
    desc: 'Appuie sur chacune des 8 touches de déplacement une par une',
  },
  {
    id:    'camera',
    title: 'Caméra',
    keysHTML: `<span class="tut-key">🖱 Souris</span>`,
    desc:  "Clique sur l'écran pour verrouiller la souris · bouge-la pour regarder autour",
  },
  {
    id:    'sprint',
    title: 'Sprint',
    keysHTML: `
      <span class="tut-key" data-k="shift">⇧ Shift</span>
      <span class="tut-key-sep">+</span>
      <span class="tut-key">Z / Q / S / D</span>
    `,
    desc:  'Maintiens Shift tout en te déplaçant pour courir plus vite',
  },
  {
    id:    'map',
    title: 'Mini-carte',
    keysHTML: `<span class="tut-key" data-k="m">M</span>`,
    desc:  'Appuie sur M pour afficher / masquer la carte',
  },
  {
    id:    'controls',
    title: 'Contrôles',
    keysHTML: `<span class="tut-key" data-k="c">C</span>`,
    desc:  'Appuie sur C pour afficher la liste des contrôles',
  },
  {
    id:    'teleport',
    title: 'Téléportation',
    keysHTML: `<span class="tut-key" data-k="t">T</span>`,
    desc:  'Appuie sur T pour ouvrir le menu de téléportation',
  },
  {
    id:    'shoot',
    title: 'Tir',
    keysHTML: `<span class="tut-key">🖱 Clic gauche</span>`,
    desc:  'Tire au moins 3 fois (clic gauche)',
  },
  {
    id:    'interact',
    title: 'Interaction',
    keysHTML: `<span class="tut-key" data-k="e">E</span>`,
    desc:  'Approche-toi de Jacob et appuie sur E pour interagir',
  },
]

function buildOverlay() {
  const el = document.createElement('div')
  el.id = 'tutorial-overlay'

  const dotsHTML = STEPS.map((_, i) =>
    `<div class="tut-dot${i === 0 ? ' is-active' : ''}" data-dot="${i}"></div>`
  ).join('<div class="tut-progress-line"></div>')

  const numStr = (n) => n < 10 ? `0${n}` : `${n}`

  el.innerHTML = `
    <div class="tut-bg"></div>

    <button class="tut-skip" type="button" aria-label="Passer le tutoriel">
      Passer
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <polyline points="5 12 19 12" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
        <polyline points="13 6 19 12 13 18" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>

    <div class="tut-interact-prompt" hidden>
      <span class="tut-key">E</span>
      <span>Interagir avec Jacob</span>
    </div>

    <div class="tut-card">
      <div class="tut-progress">
        ${dotsHTML}
        <span class="tut-step-count" data-count>${numStr(1)} / ${numStr(STEPS.length)}</span>
      </div>
      <div class="tut-body">
        <div class="tut-title" data-title>${STEPS[0].title.toUpperCase()}</div>
        <div class="tut-keys"  data-keys>${STEPS[0].keysHTML}</div>
        <div class="tut-desc"  data-desc>${STEPS[0].desc}</div>
      </div>
      <div class="tut-status" data-status>0 / 8 touches validées</div>
    </div>
  `
  return el
}

export async function loadTutorial(scene, { getHero, notifications, onComplete } = {}) {
  scene.metadata = scene.metadata ?? {}
  scene.metadata.currentLevel = 0

  const overlay = buildOverlay()
  document.body.appendChild(overlay)
  requestAnimationFrame(() => overlay.classList.add('tut-visible'))

  // ---- Jacob NPC (chargé en arrière-plan, visible au step 'interact') ----
  let jacobRoot   = null
  let jacobMeshes = []
  SceneLoader.ImportMeshAsync(null, '/map/mainPersonnage/', 'George.glb', scene)
    .then(result => {
      result.animationGroups?.forEach(ag => ag.stop())
      jacobRoot   = result.meshes[0]
      jacobMeshes = result.meshes
      jacobRoot.name = 'jacob_npc'
      jacobRoot.rotationQuaternion = null
      jacobRoot.rotation.set(0, Math.PI, 0)
      jacobRoot.position.set(30.41, 0.14, 306.02)
      jacobRoot.scaling.setAll(0.17)
      for (const m of jacobMeshes) m.setEnabled(false)
    })
    .catch(e => console.warn('[tutorial] Jacob load failed', e))

  // ---- Refs DOM ----
  const interactPrompt = overlay.querySelector('.tut-interact-prompt')
  const titleEl  = overlay.querySelector('[data-title]')
  const keysEl   = overlay.querySelector('[data-keys]')
  const descEl   = overlay.querySelector('[data-desc]')
  const statusEl = overlay.querySelector('[data-status]')
  const countEl  = overlay.querySelector('[data-count]')
  const card     = overlay.querySelector('.tut-card')
  const dots     = overlay.querySelectorAll('.tut-dot')

  let currentIdx     = 0
  let tutDone        = false
  let stepCleanup    = null
  let proximObserver = null

  // Suivi global des touches tenues (pour sprint)
  const heldKeys = new Set()
  const onGKD = e => heldKeys.add(e.key.toLowerCase())
  const onGKU = e => heldKeys.delete(e.key.toLowerCase())
  window.addEventListener('keydown', onGKD)
  window.addEventListener('keyup',   onGKU)

  const disposeJacob = () => {
    interactPrompt.hidden = true
    if (proximObserver) {
      scene.onBeforeRenderObservable.remove(proximObserver)
      proximObserver = null
    }
    for (const m of jacobMeshes) { try { m.dispose() } catch {} }
    jacobRoot   = null
    jacobMeshes = []
  }

  const finish = () => {
    if (tutDone) return
    tutDone = true
    stepCleanup?.(); stepCleanup = null
    window.removeEventListener('keydown', onGKD)
    window.removeEventListener('keyup',   onGKU)
    disposeJacob()
    overlay.classList.remove('tut-visible')
    overlay.classList.add('tut-closing')
    setTimeout(() => { overlay.remove(); onComplete?.() }, 600)
  }

  const numStr = (n) => n < 10 ? `0${n}` : `${n}`

  const renderStep = (idx) => {
    const step = STEPS[idx]
    titleEl.textContent  = step.title.toUpperCase()
    keysEl.innerHTML     = step.keysHTML
    descEl.textContent   = step.desc
    countEl.textContent  = `${numStr(idx + 1)} / ${numStr(STEPS.length)}`
    statusEl.textContent = 'En attente…'
    statusEl.className   = 'tut-status'

    dots.forEach((d, i) => {
      d.classList.remove('is-active', 'is-done')
      if (i < idx)        d.classList.add('is-done')
      else if (i === idx) d.classList.add('is-active')
    })
  }

  const flashCard = () => {
    card.classList.remove('step-done')
    void card.offsetWidth
    card.classList.add('step-done')
  }

  const advanceStep = () => {
    if (tutDone) return
    stepCleanup?.(); stepCleanup = null
    statusEl.textContent = '✓ Réussi !'
    statusEl.className   = 'tut-status is-done'
    flashCard()

    if (currentIdx < STEPS.length - 1) {
      setTimeout(() => {
        if (tutDone) return
        currentIdx++
        renderStep(currentIdx)
        setupStep(currentIdx)
      }, 700)
    } else {
      setTimeout(finish, 900)
    }
  }

  const setupStep = (idx) => {
    const step = STEPS[idx]

    // ---- Déplacement : toutes les 8 touches ----
    if (step.id === 'move') {
      const required = ['z','q','s','d','arrowup','arrowdown','arrowleft','arrowright']
      const pressed  = new Set()
      statusEl.textContent = `0 / ${required.length} touches validées`

      const onKey = (e) => {
        const k = e.key.toLowerCase()
        if (!required.includes(k) || pressed.has(k)) return
        pressed.add(k)
        overlay.querySelector(`[data-k="${k}"]`)?.classList.add('is-pressed')
        statusEl.textContent = `${pressed.size} / ${required.length} touches validées`
        if (pressed.size >= required.length) advanceStep()
      }
      window.addEventListener('keydown', onKey)
      stepCleanup = () => window.removeEventListener('keydown', onKey)
    }

    // ---- Caméra : mouvement souris ----
    if (step.id === 'camera') {
      let done = false
      const onMove = (e) => {
        if (done) return
        if (Math.abs(e.movementX ?? 0) + Math.abs(e.movementY ?? 0) < 4) return
        done = true
        advanceStep()
      }
      document.addEventListener('mousemove', onMove)
      stepCleanup = () => document.removeEventListener('mousemove', onMove)
    }

    // ---- Sprint : Shift + mouvement ----
    if (step.id === 'sprint') {
      const check = () => {
        if (heldKeys.has('shift') && [...MOVE_KEYS].some(k => heldKeys.has(k))) advanceStep()
      }
      const onKD = (e) => {
        const k = e.key.toLowerCase()
        if (k === 'shift') overlay.querySelector('[data-k="shift"]')?.classList.add('is-pressed')
        heldKeys.add(k)
        check()
      }
      window.addEventListener('keydown', onKD)
      stepCleanup = () => window.removeEventListener('keydown', onKD)
    }

    // ---- Mini-carte : M ----
    if (step.id === 'map') {
      const onKey = (e) => {
        if (e.key.toLowerCase() !== 'm') return
        overlay.querySelector('[data-k="m"]')?.classList.add('is-pressed')
        advanceStep()
      }
      window.addEventListener('keydown', onKey)
      stepCleanup = () => window.removeEventListener('keydown', onKey)
    }

    // ---- Contrôles : C ----
    if (step.id === 'controls') {
      const onKey = (e) => {
        if (e.key.toLowerCase() !== 'c') return
        overlay.querySelector('[data-k="c"]')?.classList.add('is-pressed')
        advanceStep()
      }
      window.addEventListener('keydown', onKey)
      stepCleanup = () => window.removeEventListener('keydown', onKey)
    }

    // ---- Téléportation : T ----
    if (step.id === 'teleport') {
      const onKey = (e) => {
        if (e.key.toLowerCase() !== 't') return
        overlay.querySelector('[data-k="t"]')?.classList.add('is-pressed')
        advanceStep()
      }
      window.addEventListener('keydown', onKey)
      stepCleanup = () => window.removeEventListener('keydown', onKey)
    }

    // ---- Tir : 3 clics minimum ----
    if (step.id === 'shoot') {
      let count = 0
      statusEl.textContent = `0 / 3 tirs effectués`

      const onMouse = (e) => {
        if (e.button !== 0) return
        count++
        statusEl.textContent = `${count} / 3 tirs effectués`
        if (count >= 3) advanceStep()
      }
      window.addEventListener('mousedown', onMouse)
      stepCleanup = () => window.removeEventListener('mousedown', onMouse)
    }

    // ---- Interaction Jacob : proximité + E ----
    if (step.id === 'interact') {
      if (jacobRoot) for (const m of jacobMeshes) m.setEnabled(true)

      const JACOB_POS = new Vector3(30.41, 0.14, 306.02)
      const RADIUS_SQ = 5 * 5
      let isNear    = false
      let eCleanup  = null

      const enableE = () => {
        if (eCleanup) return
        const onE = (e) => {
          if (e.key.toLowerCase() !== 'e') return
          overlay.querySelector('[data-k="e"]')?.classList.add('is-pressed')
          advanceStep()
        }
        window.addEventListener('keydown', onE)
        eCleanup = () => window.removeEventListener('keydown', onE)
      }

      const disableE = () => {
        eCleanup?.(); eCleanup = null
      }

      proximObserver = scene.onBeforeRenderObservable.add(() => {
        const hero = getHero?.()
        if (!hero) return
        const dx   = hero.position.x - JACOB_POS.x
        const dz   = hero.position.z - JACOB_POS.z
        const near = (dx * dx + dz * dz) < RADIUS_SQ

        if (near !== isNear) {
          isNear = near
          interactPrompt.hidden = !near
          if (near) enableE(); else disableE()
        }
      })

      stepCleanup = () => {
        disableE()
        if (proximObserver) {
          scene.onBeforeRenderObservable.remove(proximObserver)
          proximObserver = null
        }
        interactPrompt.hidden = true
      }
    }
  }

  overlay.querySelector('.tut-skip').addEventListener('click', finish)

  // Lancement première étape
  setupStep(0)

  return {
    dispose: () => finish(),
    skip:    () => finish(),
  }
}
