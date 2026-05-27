import '@fortawesome/fontawesome-free/css/all.min.css'
import './mainMenu.css'

import { Engine }            from '@babylonjs/core/Engines/engine'
import { Scene }             from '@babylonjs/core/scene'
import { Vector3 }           from '@babylonjs/core/Maths/math.vector'
import { Color4 }            from '@babylonjs/core/Maths/math.color'
import { HemisphericLight }  from '@babylonjs/core/Lights/hemisphericLight'
import { DirectionalLight }  from '@babylonjs/core/Lights/directionalLight'
import { ArcRotateCamera }   from '@babylonjs/core/Cameras/arcRotateCamera'
import { SceneLoader }       from '@babylonjs/core/Loading/sceneLoader'
import '@babylonjs/loaders/glTF'

const TEAM = [
  { name: 'Akira Santhakumaran', github: 'Akira98000', email: 'akira.santhakumaran@etu.unice.fr' },
  { name: 'Jeremy Moncada', github: 'Ye4hL0w', email: 'jeremy.moncada@etu.unice.fr' },
  { name: 'Alexander Boretti', github: 'X3LAX', email: 'alexander.boretti@etu.unice.fr' },
]

const CHARACTERS = [
  {
    id: 'George',
    name: 'George',
    tagline: 'Agile · réflexe rapide',
    initial: 'G',
  },
  {
    id: 'stephane',
    name: 'Stephane',
    tagline: 'Robuste · stratégique',
    initial: 'S',
  },
]

const GAME_TIPS = [
  'Appuyez sur M pour ouvrir la carte de navigation complète.',
  'Hackez les terminaux IA pour neutraliser les ennemis à distance.',
  'Votre bouclier se régénère automatiquement hors de tout combat.',
  'Restez dans les zones sombres pour réduire votre visibilité ennemie.',
  'Les drones IA ont un angle mort dans leur dos — exploitez-le.',
  'Combinez hacking et discrétion pour traverser les zones hostiles sans alerte.',
  'Les données collectées augmentent votre score de mission finale.',
  'Gardez un œil sur votre jauge de détection : fuir vaut mieux que combattre.',
]

export function showMainMenu({ onPlay, onPlayExtra } = {}) {
  document.getElementById('main-menu')?.remove()

  const container = document.createElement('div')
  container.id = 'main-menu'

  container.innerHTML = `
    <canvas class="mm-neural"></canvas>
    <div class="mm-aurora"></div>
    <div class="mm-vignette"></div>

    <div class="mm-layout">
      <div class="mm-left">
        <canvas class="mm-stage"></canvas>
        <div class="mm-stage-name"></div>
        <div class="mm-stack">
          <section class="mm-page mm-page-home is-active">
            <div class="mm-content">
              <div class="mm-brand">
                <div class="mm-pretitle">
                  <span class="mm-dot"></span>
                  <span>GameOnWeb 2026</span>
                </div>
                <h1 class="mm-title">
                  BLACK<span class="mm-title-accent">O</span>UT
                </h1>
                <div class="mm-tag">Artificial Intelligence Edition</div>
                <div class="mm-subtitle">
                  L'IA a pris notre monde. Le virus a pris l'IA. Vous avez pris votre décision.
                </div>
              </div>

              <div class="mm-actions">
                <button class="mm-btn primary main-game-btn" type="button" data-action="play">
                  <i class="fa-solid fa-play"></i>
                  <span class="mm-btn-label">Main Game</span>
                </button>
                <button class="mm-btn" type="button" data-action="play-extra">
                  <i class="fa-solid fa-motorcycle"></i>
                  <span class="mm-btn-label">Bonus Game</span>
                </button>
                <button class="mm-btn" type="button" data-action="credits">
                  <i class="fa-solid fa-users"></i>
                  <span>Crédits</span>
                </button>
                <button class="mm-btn bts-btn" type="button" data-action="bts">
                  <i class="fa-solid fa-clapperboard"></i>
                  <span>Behind the Scene</span>
                </button>
              </div>

              <div class="mm-hint">Babylon.js - GOW</div>
            </div>
          </section>

          <section class="mm-page mm-page-name">
            <div class="mm-content">
              <div class="mm-brand">
                <div class="mm-pretitle">
                  <span class="mm-dot"></span>
                  <span>Step 01 / 02 · Identification</span>
                </div>
                <h2 class="mm-step-title">Quel est ton nom ?</h2>
                <div class="mm-subtitle">
                  Le réseau a besoin d'un identifiant pour t'enregistrer dans la grille.
                </div>
              </div>

              <form class="mm-form" data-form="name">
                <div class="mm-field">
                  <i class="fa-solid fa-user"></i>
                  <input
                    type="text"
                    name="player-name"
                    class="mm-input"
                    placeholder="ton_nom"
                    autocomplete="off"
                    maxlength="20"
                    required
                  />
                </div>
                <div class="mm-form-error" data-name-error></div>

                <div class="mm-actions">
                  <button class="mm-btn primary" type="submit" data-action="name-next">
                    <i class="fa-solid fa-arrow-right"></i>
                    <span>Suivant</span>
                  </button>
                  <button class="mm-btn" type="button" data-action="name-back">
                    <i class="fa-solid fa-arrow-left"></i>
                    <span>Retour</span>
                  </button>
                </div>
              </form>
            </div>
          </section>

          <section class="mm-page mm-page-character">
            <div class="mm-content">
              <div class="mm-brand">
                <div class="mm-pretitle">
                  <span class="mm-dot"></span>
                  <span>Step 02 / 02 · Avatar</span>
                </div>
                <h2 class="mm-step-title">Choisis ton personnage</h2>
                <div class="mm-subtitle">
                  Sélectionne l'avatar qui rejoindra la simulation.
                </div>
              </div>

              <div class="mm-char-grid">
                ${CHARACTERS.map((c, i) => `
                  <button
                    type="button"
                    class="mm-char"
                    data-character="${c.id}"
                    style="--i:${i}">
                    <div class="mm-char-info">
                      <div class="mm-char-name">${c.name}</div>
                      <div class="mm-char-tag">${c.tagline}</div>
                    </div>
                    <i class="fa-solid fa-check mm-char-check"></i>
                  </button>
                `).join('')}
              </div>

              <div class="mm-actions">
                <button class="mm-btn primary" type="button" data-action="launch" disabled>
                  <i class="fa-solid fa-play"></i>
                  <span class="mm-btn-label">Lancer la partie</span>
                </button>
                <button class="mm-btn" type="button" data-action="char-back">
                  <i class="fa-solid fa-arrow-left"></i>
                  <span>Retour</span>
                </button>
              </div>
              <div class="mm-form-error" data-launch-error></div>
            </div>
          </section>

          <section class="mm-page mm-page-credits">
            <div class="mm-credits-wrap">
              <div class="mm-credits-head">
                <button class="mm-btn mm-back-btn" type="button" data-action="back">
                  <i class="fa-solid fa-arrow-left"></i>
                  <span>Retour</span>
                </button>
                <div class="mm-credits-title">
                  Équipe
                </div>
              </div>

              <div class="mm-team">
                ${TEAM.map((p, i) => `
                  <article class="mm-card" style="--i:${i}">
                    <div class="mm-card-avatar">
                      <img
                        src="https://github.com/${p.github}.png?size=240"
                        alt="${p.name}"
                        loading="lazy"
                        onerror="this.style.display='none'"
                      />
                      <div class="mm-card-frame"></div>
                    </div>
                    <div class="mm-card-body">
                      <div class="mm-card-name">${p.name}</div>
                      <div class="mm-card-links">
                        <a class="mm-card-link gh"
                           href="https://github.com/${p.github}"
                           target="_blank"
                           rel="noopener noreferrer">
                          <i class="fa-brands fa-github"></i>
                          <span>@${p.github}</span>
                        </a>
                        ${p.email ? `
                          <a class="mm-card-link mail"
                             href="mailto:${p.email}">
                            <i class="fa-solid fa-envelope"></i>
                            <span>${p.email}</span>
                          </a>
                        ` : ''}
                      </div>
                    </div>
                  </article>
                `).join('')}
              </div>

              <div class="mm-credits-foot">
                Powered by Babylon.js 9 · Icons by Font Awesome · Inspired by Akira (1988)
              </div>
            </div>
          </section>
        </div>
      </div>

      <div class="mm-right">
        <div class="mm-poster"></div>
        <div class="mm-poster-edge"></div>
        <div class="mm-poster-line"></div>
      </div>
    </div>

    <div class="mm-loader" aria-hidden="true">
      <div class="mm-loader-layout">

        <div class="mm-loader-left">
          <div class="mm-loader-brand">
            <div class="mm-pretitle">
              <span class="mm-dot"></span>
              <span>GameOnWeb 2026 · Chargement</span>
            </div>
            <div class="mm-loader-title">BLACK<span class="mm-title-accent">O</span>UT</div>
            <div class="mm-tag">Artificial Intelligence Edition</div>
          </div>

          <div class="mm-loader-center">
            <div class="mm-loader-core">
              <div class="mm-loader-ring outer"></div>
              <div class="mm-loader-ring inner"></div>
              <div class="mm-loader-dot"></div>
            </div>
            <div class="mm-loader-status" data-loader-status>Connexion à la grille</div>
            <div class="mm-loader-sub" data-loader-sub>Authentification du nœud neural…</div>
            <div class="mm-loader-progress">
              <div class="mm-loader-bar" data-loader-bar></div>
            </div>
          </div>

          <div class="mm-loader-tip">
            <div class="mm-loader-tip-head">
              <i class="fa-solid fa-microchip"></i>
              <span>ASTUCE</span>
            </div>
            <p class="mm-loader-tip-body" data-loader-tip>…</p>
          </div>
        </div>

        <div class="mm-loader-right">
          <div class="mm-poster"></div>
          <div class="mm-poster-edge"></div>
          <div class="mm-poster-line"></div>
        </div>

      </div>
    </div>
  `

  document.body.appendChild(container)
  requestAnimationFrame(() => container.classList.add('open'))

  const pages = {
    home:      container.querySelector('.mm-page-home'),
    name:      container.querySelector('.mm-page-name'),
    character: container.querySelector('.mm-page-character'),
    credits:   container.querySelector('.mm-page-credits'),
  }

  const stageNameEl = container.querySelector('.mm-stage-name')
  const stage = startStage(container.querySelector('.mm-stage'))

  const goTo = (key) => {
    for (const [k, el] of Object.entries(pages)) {
      el.classList.toggle('is-active', k === key)
    }
    container.classList.toggle('show-stage', key === 'character')
    if (key === 'character') {
      const id = selectedCharacter ?? CHARACTERS[0].id
      stage.setCharacter(id)
      stageNameEl.textContent = CHARACTERS.find(c => c.id === id)?.name ?? ''
    }
  }

  // ---- Boutons home ----
  const playBtn      = container.querySelector('[data-action="play"]')
  const playExtraBtn = container.querySelector('[data-action="play-extra"]')
  const creditsBtn   = container.querySelector('[data-action="credits"]')
  playBtn   .addEventListener('click', () => {
    goTo('name')
    setTimeout(() => container.querySelector('input[name="player-name"]')?.focus(), 350)
  })
  playExtraBtn.addEventListener('click', async () => {
    if (starting) return
    starting = true
    playBtn.disabled = true
    playExtraBtn.disabled = true
    creditsBtn.disabled = true

    // Libère le GPU du menu pendant le chargement du jeu
    safeStop(stage, 'stage')

    showLoader()

    let postLoad = null
    try {
      postLoad = await onPlayExtra?.()
    } catch (err) {
      console.error('[mainMenu] échec du lancement Extra', err)
      hideLoader(true)
      playBtn.disabled = false
      playExtraBtn.disabled = false
      creditsBtn.disabled = false
      starting = false
      return
    }

    await hideLoader()
    finish()
    postLoad?.()
  })
  creditsBtn.addEventListener('click', () => goTo('credits'))
  container.querySelector('[data-action="bts"]')
    .addEventListener('click', () => window.open('https://js-blackout-behind-the-scene-gow.vercel.app/', '_blank', 'noopener,noreferrer'))

  // ---- Retour crédits ----
  container.querySelector('[data-action="back"]')
    .addEventListener('click', () => goTo('home'))

  // ---- Page nom ----
  let playerName = ''
  const nameForm  = container.querySelector('[data-form="name"]')
  const nameInput = nameForm.querySelector('input[name="player-name"]')
  const nameError = container.querySelector('[data-name-error]')

  container.querySelector('[data-action="name-back"]')
    .addEventListener('click', () => goTo('home'))

  nameForm.addEventListener('submit', (e) => {
    e.preventDefault()
    const v = nameInput.value.trim()
    if (v.length < 2) {
      nameError.textContent = 'Choisis un nom d\'au moins 2 caractères.'
      nameInput.focus()
      return
    }
    nameError.textContent = ''
    playerName = v
    goTo('character')
  })

  // ---- Page personnage ----
  let selectedCharacter = null
  const launchBtn   = container.querySelector('[data-action="launch"]')
  const launchLabel = launchBtn.querySelector('.mm-btn-label')
  const launchIcon  = launchBtn.querySelector('i')
  const charButtons = container.querySelectorAll('.mm-char')

  const LOCKED_CHARACTERS = ['stephane']

  charButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      charButtons.forEach((b) => b.classList.remove('is-selected'))
      btn.classList.add('is-selected')
      selectedCharacter = btn.dataset.character
      const isLocked = LOCKED_CHARACTERS.includes(selectedCharacter)
      launchBtn.disabled = isLocked
      launchLabel.textContent = isLocked ? 'Personnage verrouillé' : 'Lancer la partie'
      stage.setCharacter(selectedCharacter)
      stageNameEl.textContent = CHARACTERS.find(c => c.id === selectedCharacter)?.name ?? ''
    })
  })

  container.querySelector('[data-action="char-back"]')
    .addEventListener('click', () => goTo('name'))

  // ---- Escape ----
  const onKey = (e) => {
    if (e.key !== 'Escape') return
    if (pages.credits  .classList.contains('is-active')) goTo('home')
    if (pages.name     .classList.contains('is-active')) goTo('home')
    if (pages.character.classList.contains('is-active')) goTo('name')
  }
  window.addEventListener('keydown', onKey)

  const neural = startNeural(container.querySelector('.mm-neural'))

  const safeStop = (handle, label) => {
    try { handle?.stop?.() } catch (e) { console.warn(`[mainMenu] ${label}.stop a échoué`, e) }
  }

  const finish = () => {
    window.removeEventListener('keydown', onKey)
    safeStop(neural, 'neural')
    safeStop(stage,  'stage')
    container.classList.add('closing')
    setTimeout(() => container.remove(), 700)
  }

  // ---- Loader plein écran ----
  const loaderStatusEl = container.querySelector('[data-loader-status]')
  const loaderSubEl    = container.querySelector('[data-loader-sub]')
  const LOADER_STEPS = [
    { status: 'Connexion à la grille',       sub: 'Authentification du nœud neural…' },
    { status: 'Chargement du monde',         sub: 'Streaming des chunks de la carte…' },
    { status: 'Initialisation de l\'IA',     sub: 'Réveil des modèles d\'inférence…' },
    { status: 'Compilation des shaders',     sub: 'Optimisation GPU en cours…' },
    { status: 'Liaison de l\'avatar',        sub: 'Synchronisation synaptique…' },
    { status: 'Démarrage de la simulation',  sub: 'Préparation du protocole…' },
  ]
  let loaderTimer     = 0
  let loaderStartTime = 0

  const showLoader = () => {
    loaderStartTime = Date.now()
    container.classList.add('is-loading')

    const tipEl = container.querySelector('[data-loader-tip]')
    if (tipEl) tipEl.textContent = GAME_TIPS[Math.floor(Math.random() * GAME_TIPS.length)]

    const barEl = container.querySelector('[data-loader-bar]')
    if (barEl) {
      barEl.style.transition = 'none'
      barEl.style.width = '0%'
      requestAnimationFrame(() => requestAnimationFrame(() => {
        barEl.style.transition = 'width 5.5s cubic-bezier(0.05, 0.85, 0.3, 1)'
        barEl.style.width = '82%'
      }))
    }

    let i = 0
    const apply = () => {
      const s = LOADER_STEPS[i % LOADER_STEPS.length]
      if (loaderStatusEl) loaderStatusEl.textContent = s.status
      if (loaderSubEl)    loaderSubEl   .textContent = s.sub
      i++
    }
    apply()
    loaderTimer = window.setInterval(apply, 1700)
  }

  const hideLoader = (immediate = false) => {
    if (loaderTimer) { clearInterval(loaderTimer); loaderTimer = 0 }
    if (immediate) {
      container.classList.remove('is-loading')
      return Promise.resolve()
    }
    const elapsed  = Date.now() - loaderStartTime
    const waitLeft = Math.max(0, 5000 - elapsed)
    return new Promise(resolve => {
      setTimeout(() => {
        const barEl = container.querySelector('[data-loader-bar]')
        if (barEl) {
          barEl.style.transition = 'width 0.35s ease'
          barEl.style.width = '100%'
        }
        setTimeout(() => {
          container.classList.remove('is-loading')
          resolve()
        }, 420)
      }, waitLeft)
    })
  }

  let starting = false
  launchBtn.addEventListener('click', async () => {
    if (starting || !selectedCharacter) return
    starting = true
    launchBtn.disabled = true
    container.querySelector('[data-action="char-back"]').disabled = true
    const iconEl = launchBtn.querySelector('i')
    if (iconEl) iconEl.outerHTML = '<span class="mm-loading"></span>'
    launchLabel.textContent = 'Connexion…'

    // Libère le GPU du menu pendant le chargement du jeu
    safeStop(stage, 'stage')

    const launchError = container.querySelector('[data-launch-error]')
    if (launchError) launchError.textContent = ''

    showLoader()

    let postLoad = null
    try {
      postLoad = await onPlay?.({ name: playerName, character: selectedCharacter })
    } catch (err) {
      console.error('[mainMenu] échec du lancement', err)
      hideLoader(true)
      launchBtn.disabled = false
      container.querySelector('[data-action="char-back"]').disabled = false
      starting = false
      const spinEl = launchBtn.querySelector('.mm-loading')
      if (spinEl) spinEl.outerHTML = '<i class="fa-solid fa-play"></i>'
      launchLabel.textContent = 'Lancer la partie'
      if (launchError) {
        launchError.textContent = String(err?.message ?? err ?? 'Erreur inconnue').slice(0, 200)
      }
      return
    }
    await hideLoader()
    finish()
    postLoad?.()
  })

  return { element: container, close: finish }
}

/**
 * Animation : réseau neuronal — nœuds qui flottent, connexions
 * qui apparaissent quand ils sont proches, impulsions le long des
 * connexions. Calmé pour ne pas distraire.
 */
function startNeural(canvas) {
  const ctx = canvas.getContext('2d')
  let nodes = []
  let pulses = []
  let running = true
  let raf = 0
  let dpr = 1
  let W = 0, H = 0

  const COLORS = {
    node: 'rgba(167, 139, 250, 0.85)',  // violet
    line: 'rgba(124, 156, 255, 0.22)',  // bleu IA
    glow: 'rgba(103, 232, 249, 0.9)',   // cyan
  }
  const MAX_DIST = 150
  const NODE_COUNT_BASE = 70

  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2)
    W = window.innerWidth
    H = window.innerHeight
    canvas.width = Math.floor(W * dpr)
    canvas.height = Math.floor(H * dpr)
    canvas.style.width = W + 'px'
    canvas.style.height = H + 'px'
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    const target = Math.round(NODE_COUNT_BASE * Math.min(1.6, (W * H) / (1280 * 720)))
    nodes = []
    for (let i = 0; i < target; i++) {
      nodes.push({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        r: 1 + Math.random() * 1.8,
        phase: Math.random() * Math.PI * 2,
      })
    }
  }
  resize()
  window.addEventListener('resize', resize)

  const spawnPulse = () => {
    if (nodes.length < 2) return
    const a = (Math.random() * nodes.length) | 0
    let b = (Math.random() * nodes.length) | 0
    if (b === a) b = (b + 1) % nodes.length
    pulses.push({ a, b, t: 0, speed: 0.012 + Math.random() * 0.012 })
  }

  let last = performance.now()
  let pulseTimer = 0

  const step = (t) => {
    if (!running) return
    const dt = Math.min(40, t - last) / 16.67
    last = t

    // Fond translucide pour traîne légère
    ctx.fillStyle = 'rgba(6, 8, 18, 0.18)'
    ctx.fillRect(0, 0, W, H)

    // Update nodes
    for (const n of nodes) {
      n.x += n.vx * dt
      n.y += n.vy * dt
      n.phase += 0.02 * dt
      if (n.x < -20) n.x = W + 20
      if (n.x > W + 20) n.x = -20
      if (n.y < -20) n.y = H + 20
      if (n.y > H + 20) n.y = -20
    }

    // Connexions
    ctx.lineWidth = 1
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j]
        const dx = a.x - b.x, dy = a.y - b.y
        const d2 = dx * dx + dy * dy
        if (d2 < MAX_DIST * MAX_DIST) {
          const alpha = 1 - Math.sqrt(d2) / MAX_DIST
          ctx.strokeStyle = `rgba(124, 156, 255, ${alpha * 0.28})`
          ctx.beginPath()
          ctx.moveTo(a.x, a.y)
          ctx.lineTo(b.x, b.y)
          ctx.stroke()
        }
      }
    }

    // Pulses (impulsions le long de connexions)
    pulseTimer += dt
    if (pulseTimer > 6) {
      pulseTimer = 0
      if (pulses.length < 10) spawnPulse()
    }
    for (let i = pulses.length - 1; i >= 0; i--) {
      const p = pulses[i]
      p.t += p.speed * dt
      if (p.t >= 1) { pulses.splice(i, 1); continue }
      const a = nodes[p.a], b = nodes[p.b]
      if (!a || !b) { pulses.splice(i, 1); continue }
      const x = a.x + (b.x - a.x) * p.t
      const y = a.y + (b.y - a.y) * p.t
      const fade = Math.sin(p.t * Math.PI)
      ctx.fillStyle = `rgba(103, 232, 249, ${0.9 * fade})`
      ctx.shadowColor = COLORS.glow
      ctx.shadowBlur = 12 * fade
      ctx.beginPath()
      ctx.arc(x, y, 2.2, 0, Math.PI * 2)
      ctx.fill()
      ctx.shadowBlur = 0
    }

    // Nodes
    for (const n of nodes) {
      const breathe = 0.7 + Math.sin(n.phase) * 0.3
      ctx.fillStyle = COLORS.node
      ctx.beginPath()
      ctx.arc(n.x, n.y, n.r * breathe, 0, Math.PI * 2)
      ctx.fill()
    }

    raf = requestAnimationFrame(step)
  }
  raf = requestAnimationFrame(step)

  return {
    stop() {
      running = false
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    },
  }
}

/**
 * Scène Babylon dédiée à la sélection de personnage :
 * charge George + Stephane, joue l'anim "fight_idle", expose
 * setCharacter(id) pour basculer.
 */
function startStage(canvas) {
  const engine = new Engine(canvas, true, {
    alpha: true,
    preserveDrawingBuffer: false,
    powerPreference: 'low-power',
  })
  const scene = new Scene(engine)
  scene.clearColor = new Color4(0, 0, 0, 0)

  const camera = new ArcRotateCamera(
    'mm-cam',
    Math.PI / 2,        // alpha : de face
    Math.PI / 2.15,     // beta  : légèrement plongée
    4.6,                // radius
    new Vector3(1, 1.05, 0), // décalé vers la droite de l'écran
    scene,
  )
  camera.minZ = 0.1

  const hemi = new HemisphericLight('mm-hemi', new Vector3(0, 1, 0), scene)
  hemi.intensity = 0.85
  hemi.groundColor.set(0.25, 0.28, 0.45)

  const key = new DirectionalLight('mm-key', new Vector3(-0.4, -1, -0.6), scene)
  key.intensity = 1.0

  const characters = Object.create(null)
  let current = null
  let autoRot = 0

  const findFightIdle = (groups) => {
    const lc = (g) => g.name.toLowerCase()
    return groups.find((g) => lc(g) === 'fight_idle')
        ?? groups.find((g) => lc(g).includes('fight_idle'))
        ?? groups.find((g) => lc(g).includes('fight') && !lc(g).includes('walk') && !lc(g).includes('run'))
        ?? groups.find((g) => lc(g).includes('idle'))
        ?? groups[0]
        ?? null
  }

  const loadCharacter = async (id, file) => {
    try {
      const result = await SceneLoader.ImportMeshAsync(null, '/map/mainPersonnage/', file, scene)
      const root = result.meshes[0]
      root.name = `mm-${id}`
      root.position.set(0, 0, 0)
      root.rotationQuaternion = null
      root.rotation.set(0, 0, 0)
      root.scaling.setAll(id === 'George' ? 0.17 : 1)
      // Désactiver toutes les anims, puis trouver fight_idle
      const groups = result.animationGroups
      groups.forEach((g) => g.stop())
      const anim = findFightIdle(groups)

      // Masquer tant que pas sélectionné
      for (const m of result.meshes) m.setEnabled(false)

      characters[id] = { root, meshes: result.meshes, anim }

      // Si on avait demandé ce perso avant la fin du chargement
      if (pending === id) {
        pending = null
        applyCharacter(id)
      }
    } catch (e) {
      console.warn('[mm-stage] échec chargement', file, e)
    }
  }

  let pending = null
  const applyCharacter = (id) => {
    const c = characters[id]
    if (!c) return false
    if (current && current !== c) {
      current.anim?.stop()
      for (const m of current.meshes) m.setEnabled(false)
    }
    for (const m of c.meshes) m.setEnabled(true)
    c.anim?.start(true, 1.0)
    current = c
    return true
  }

  const setCharacter = (id) => {
    if (!applyCharacter(id)) pending = id
  }

  // Pré-charge les deux personnages
  loadCharacter('George',   'George.glb')
  loadCharacter('stephane', 'stephane.glb')

  // Rotation continue
  scene.onBeforeRenderObservable.add(() => {
    if (!current) return
    autoRot += engine.getDeltaTime() * 0.0006
    current.root.rotation.y = autoRot
  })

  engine.runRenderLoop(() => scene.render())
  const onResize = () => engine.resize()
  window.addEventListener('resize', onResize)

  let disposed = false
  return {
    setCharacter,
    stop() {
      if (disposed) return
      disposed = true
      window.removeEventListener('resize', onResize)
      engine.stopRenderLoop()
      scene.dispose()
      engine.dispose()
    },
  }
}
