import '@fortawesome/fontawesome-free/css/all.min.css'
import './mainMenu.css'
import { t } from '../minigame/tron/i18n.js'
import { GAME_CONFIG } from '../config/gameConfig.js'

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
  { id: 'George',   name: 'George',   tagKey: 'mm.char_george_tag',   initial: 'G' },
  { id: 'stephane', name: 'Stephane', tagKey: 'mm.char_stephane_tag', initial: 'S' },
]

export function showMainMenu({ onPlay, onPlayExtra } = {}) {
  document.getElementById('main-menu')?.remove()

  const container = document.createElement('div')
  container.id = 'main-menu'

  const _spKb      = localStorage.getItem('babylon-akira:keyboard') ?? 'AZERTY'
  const _spQuality = localStorage.getItem('babylon-akira:quality')  ?? 'mid'

  container.innerHTML = `
    <canvas class="mm-neural"></canvas>
    <div class="mm-aurora"></div>
    <div class="mm-vignette"></div>
    <div class="mm-hero-expand" aria-hidden="true"></div>
    <div class="mm-hero-expand mm-hero-expand-bonus" aria-hidden="true"></div>
    <div class="mm-hero-expand mm-hero-expand-credits" aria-hidden="true"></div>
    <div class="mm-hero-expand mm-hero-expand-bts" aria-hidden="true"></div>

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
                <div class="mm-tag" data-i18n="mm.tag">${t('mm.tag')}</div>
                <div class="mm-subtitle" data-i18n="mm.subtitle">${t('mm.subtitle')}</div>
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
                  <span data-i18n="mm.btn_credits">${t('mm.btn_credits')}</span>
                </button>
                <button class="mm-btn bts-btn" type="button" data-action="bts">
                  <i class="fa-solid fa-clapperboard"></i>
                  <span>Behind the Scene</span>
                </button>
              </div>

              <div class="mm-hint">Babylon.js - GOW</div>
            </div>
          </section>

          <section class="mm-page mm-page-moto">
            <div class="mm-content">
              <div class="mm-brand">
                <div class="mm-pretitle">
                  <span class="mm-dot"></span>
                  <span data-i18n="mm.moto_pre">${t('mm.moto_pre')}</span>
                </div>
                <h2 class="mm-step-title" data-i18n="mm.moto_title">${t('mm.moto_title')}</h2>
                <div class="mm-subtitle" data-i18n="mm.moto_sub">${t('mm.moto_sub')}</div>
              </div>

              <div class="mm-actions">
                <button class="mm-btn primary" type="button" data-action="moto-launch">
                  <i class="fa-solid fa-play"></i>
                  <span data-i18n="mm.moto_launch">${t('mm.moto_launch')}</span>
                </button>
                <button class="mm-btn" type="button" data-action="moto-back">
                  <i class="fa-solid fa-arrow-left"></i>
                  <span data-i18n="mm.btn_back">${t('mm.btn_back')}</span>
                </button>
              </div>
            </div>
          </section>

          <section class="mm-page mm-page-plate">
            <div class="mm-content">
              <div class="mm-brand">
                <div class="mm-pretitle">
                  <span class="mm-dot"></span>
                  <span data-i18n="mm.plate_pre">${t('mm.plate_pre')}</span>
                </div>
                <h2 class="mm-step-title" data-i18n="mm.plate_title">${t('mm.plate_title')}</h2>
                <div class="mm-subtitle" data-i18n="mm.plate_sub">${t('mm.plate_sub')}</div>
              </div>

              <div class="mm-actions">
                <button class="mm-btn primary" type="button" data-action="plate-launch">
                  <i class="fa-solid fa-flag-checkered"></i>
                  <span data-i18n="mm.plate_launch">${t('mm.plate_launch')}</span>
                </button>
                <button class="mm-btn" type="button" data-action="plate-back">
                  <i class="fa-solid fa-arrow-left"></i>
                  <span data-i18n="mm.btn_back">${t('mm.btn_back')}</span>
                </button>
              </div>
            </div>
          </section>

          <section class="mm-page mm-page-name">
            <div class="mm-content">
              <div class="mm-brand">
                <div class="mm-pretitle">
                  <span class="mm-dot"></span>
                  <span data-i18n="mm.step1_pre">${t('mm.step1_pre')}</span>
                </div>
                <h2 class="mm-step-title" data-i18n="mm.step1_title">${t('mm.step1_title')}</h2>
                <div class="mm-subtitle" data-i18n="mm.step1_sub">${t('mm.step1_sub')}</div>
              </div>

              <form class="mm-form" data-form="name">
                <div class="mm-field">
                  <i class="fa-solid fa-user"></i>
                  <input
                    type="text"
                    name="player-name"
                    class="mm-input"
                    data-i18n-placeholder="mm.name_ph"
                    placeholder="${t('mm.name_ph')}"
                    autocomplete="off"
                    maxlength="20"
                    required
                  />
                </div>
                <div class="mm-form-error" data-name-error></div>

                <div class="mm-actions">
                  <button class="mm-btn primary" type="submit" data-action="name-next">
                    <i class="fa-solid fa-arrow-right"></i>
                    <span data-i18n="mm.btn_next">${t('mm.btn_next')}</span>
                  </button>
                  <button class="mm-btn" type="button" data-action="name-back">
                    <i class="fa-solid fa-arrow-left"></i>
                    <span data-i18n="mm.btn_back">${t('mm.btn_back')}</span>
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
                  <span data-i18n="mm.step2_pre">${t('mm.step2_pre')}</span>
                </div>
                <h2 class="mm-step-title" data-i18n="mm.step2_title">${t('mm.step2_title')}</h2>
                <div class="mm-subtitle" data-i18n="mm.step2_sub">${t('mm.step2_sub')}</div>
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
                      <div class="mm-char-tag" data-i18n="${c.tagKey}">${t(c.tagKey)}</div>
                    </div>
                    <i class="fa-solid fa-check mm-char-check"></i>
                  </button>
                `).join('')}
              </div>

              <div class="mm-actions">
                <button class="mm-btn primary" type="button" data-action="launch" disabled>
                  <i class="fa-solid fa-play"></i>
                  <span class="mm-btn-label" data-i18n="mm.btn_launch">${t('mm.btn_launch')}</span>
                </button>
                <button class="mm-btn" type="button" data-action="char-back">
                  <i class="fa-solid fa-arrow-left"></i>
                  <span data-i18n="mm.btn_back">${t('mm.btn_back')}</span>
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
                  <span data-i18n="mm.btn_back">${t('mm.btn_back')}</span>
                </button>
                <div class="mm-credits-title" data-i18n="mm.credits_title">${t('mm.credits_title')}</div>
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

              <div class="mm-credits-foot" data-i18n="mm.credits_foot">${t('mm.credits_foot')}</div>
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

    <div class="mm-sp">
      <div class="mm-sp-header">
        <span class="mm-sp-title"><i class="fa-solid fa-gear"></i> <span data-i18n="mm.sp_title">${t('mm.sp_title')}</span></span>
        <button class="mm-sp-close" type="button"><i class="fa-solid fa-xmark"></i></button>
      </div>
      <div class="mm-sp-section">
        <div class="mm-sp-label"><i class="fa-solid fa-keyboard"></i> <span data-i18n="mm.sp_keyboard">${t('mm.sp_keyboard')}</span></div>
        <div class="mm-sp-toggle" id="mm-sp-kb">
          <button class="mm-sp-btn ${_spKb === 'AZERTY' ? 'active' : ''}" data-value="AZERTY">AZERTY</button>
          <button class="mm-sp-btn ${_spKb === 'QWERTY' ? 'active' : ''}" data-value="QWERTY">QWERTY</button>
        </div>
      </div>
      <div class="mm-sp-section">
        <div class="mm-sp-label"><i class="fa-solid fa-display"></i> Graphisme</div>
        <div class="mm-sp-toggle" id="mm-sp-quality">
          <button class="mm-sp-btn ${_spQuality === 'low'   ? 'active' : ''}" data-value="low">LOW</button>
          <button class="mm-sp-btn ${_spQuality === 'mid'   ? 'active' : ''}" data-value="mid">MID</button>
          <button class="mm-sp-btn ${_spQuality === 'high'  ? 'active' : ''}" data-value="high">HIGH</button>
          <button class="mm-sp-btn ${_spQuality === 'extra' ? 'active' : ''}" data-value="extra">EXTRA</button>
        </div>
      </div>
    </div>

    <div class="mm-settings-hint">
      <button class="mm-sh-icon" type="button" data-i18n-aria="mm.sp_aria" aria-label="${t('mm.sp_aria')}">
        <i class="fa-solid fa-gear"></i>
      </button>
      <svg class="mm-sh-arrow" viewBox="0 0 82 38" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M74,19 C58,4 26,34 12,19"
              stroke="rgba(255,255,255,0.52)"
              stroke-width="1.5"
              stroke-dasharray="5,3.5"
              stroke-linecap="round"/>
        <polygon points="10,19 18,14 18,24" fill="rgba(255,255,255,0.52)"/>
      </svg>
      <div class="mm-sh-label">Settings</div>
    </div>

    <div class="mm-loader" aria-hidden="true">
      <div class="mm-ldr-scan"></div>
      <div class="mm-ldr-grid"></div>

      <div class="mm-ldr-corner mm-ldr-tl"></div>
      <div class="mm-ldr-corner mm-ldr-tr"></div>
      <div class="mm-ldr-corner mm-ldr-bl"></div>
      <div class="mm-ldr-corner mm-ldr-br"></div>

      <div class="mm-ldr-body">
        <div class="mm-ldr-eyebrow" data-i18n="mm.ldr_eyebrow">
          <span class="mm-ldr-dot"></span>
          ${t('mm.ldr_eyebrow')}
        </div>

        <div class="mm-ldr-title">BLACK<span>O</span>UT</div>
        <div class="mm-ldr-edition">A·I &nbsp; RACING EDITION</div>

        <div class="mm-ldr-divider"></div>

        <div class="mm-ldr-terminal">
          <span class="mm-ldr-prompt">&gt;</span>
          <span data-loader-status>${t('mm.ldr_s1_status')}</span>
          <span class="mm-ldr-cursor"></span>
        </div>
        <div class="mm-ldr-sub" data-loader-sub>${t('mm.ldr_s1_sub')}</div>

        <div class="mm-ldr-progress-wrap">
          <div class="mm-ldr-progress">
            <div class="mm-ldr-bar" data-loader-bar></div>
          </div>
        </div>

        <div class="mm-ldr-tip-line">
          <i class="fa-solid fa-bolt"></i>
          <span data-loader-tip>…</span>
        </div>
      </div>
    </div>
  `

  document.body.appendChild(container)
  requestAnimationFrame(() => container.classList.add('open'))

  const pages = {
    home:      container.querySelector('.mm-page-home'),
    moto:      container.querySelector('.mm-page-moto'),
    plate:     container.querySelector('.mm-page-plate'),
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
    container.classList.toggle('show-stage', key === 'character' || key === 'moto' || key === 'plate')
    if (key === 'character') {
      const id = selectedCharacter ?? CHARACTERS[0].id
      stage.setCharacter(id)
      stageNameEl.textContent = CHARACTERS.find(c => c.id === id)?.name ?? ''
    }
    if (key === 'moto') {
      if (pages.plate.classList.contains('is-active')) {
        stage.backToMoto()
      } else {
        stage.setMoto()
      }
      stageNameEl.textContent = ''
    }
    if (key === 'plate') {
      stage.zoomToPlate()
      stageNameEl.textContent = ''
      setTimeout(() => container.querySelector('input[name="plate"]')?.focus(), 1500)
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
  playExtraBtn.addEventListener('click', () => goTo('moto'))

  // ---- Page moto ----
  container.querySelector('[data-action="moto-back"]').addEventListener('click', () => goTo('home'))
  container.querySelector('[data-action="moto-launch"]').addEventListener('click', () => goTo('plate'))

  // ---- Page plaque ----
  container.querySelector('[data-action="plate-back"]').addEventListener('click', () => goTo('moto'))

  container.querySelector('[data-action="plate-launch"]').addEventListener('click', async () => {
    if (starting) return
    starting = true

    safeStop(stage, 'stage')
    showLoader()

    let postLoad = null
    try {
      postLoad = await onPlayExtra?.()
    } catch (err) {
      console.error('[mainMenu] échec du lancement Extra', err)
      hideLoader(true)
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
      nameError.textContent = t('mm.name_err')
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
      launchLabel.textContent = isLocked ? t('mm.char_locked') : t('mm.btn_launch')
      stage.setCharacter(selectedCharacter)
      stageNameEl.textContent = CHARACTERS.find(c => c.id === selectedCharacter)?.name ?? ''
    })
  })

  container.querySelector('[data-action="char-back"]')
    .addEventListener('click', () => goTo('name'))

  // ---- Settings panel ----
  const settingsBtn   = container.querySelector('.mm-sh-icon')
  const settingsPanel = container.querySelector('.mm-sp')
  const spClose       = settingsPanel.querySelector('.mm-sp-close')

  let spOpen = false
  const closeSP  = () => { spOpen = false; settingsPanel.classList.remove('open') }
  const toggleSP = () => { spOpen = !spOpen; settingsPanel.classList.toggle('open', spOpen) }

  settingsBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleSP() })
  spClose    .addEventListener('click', (e) => { e.stopPropagation(); closeSP()  })
  container  .addEventListener('click', (e) => {
    if (spOpen && !settingsPanel.contains(e.target) && !settingsBtn.contains(e.target)) closeSP()
  })

  settingsPanel.querySelector('#mm-sp-kb').addEventListener('click', (e) => {
    const btn = e.target.closest('.mm-sp-btn')
    if (!btn) return
    settingsPanel.querySelectorAll('#mm-sp-kb .mm-sp-btn').forEach(b => b.classList.remove('active'))
    btn.classList.add('active')
    GAME_CONFIG.KEYBOARD.LAYOUT = btn.dataset.value
    try { localStorage.setItem('babylon-akira:keyboard', btn.dataset.value) } catch {}
  })

  settingsPanel.querySelector('#mm-sp-quality').addEventListener('click', (e) => {
    const btn = e.target.closest('.mm-sp-btn')
    if (!btn) return
    settingsPanel.querySelectorAll('#mm-sp-quality .mm-sp-btn').forEach(b => b.classList.remove('active'))
    btn.classList.add('active')
    try { localStorage.setItem('babylon-akira:quality', btn.dataset.value) } catch {}
  })

  // ---- Escape ----
  const onKey = (e) => {
    if (e.key !== 'Escape') return
    if (spOpen) { closeSP(); return }
    if (pages.plate    .classList.contains('is-active')) { goTo('moto'); return }
    if (pages.moto     .classList.contains('is-active')) { goTo('home'); return }
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
  const getLoaderSteps = () => [
    { status: t('mm.ldr_s1_status'), sub: t('mm.ldr_s1_sub') },
    { status: t('mm.ldr_s2_status'), sub: t('mm.ldr_s2_sub') },
    { status: t('mm.ldr_s3_status'), sub: t('mm.ldr_s3_sub') },
    { status: t('mm.ldr_s4_status'), sub: t('mm.ldr_s4_sub') },
    { status: t('mm.ldr_s5_status'), sub: t('mm.ldr_s5_sub') },
    { status: t('mm.ldr_s6_status'), sub: t('mm.ldr_s6_sub') },
  ]
  let loaderTimer     = 0
  let loaderStartTime = 0

  const showCurtain = () => {
    const curtain = document.createElement('div')
    curtain.className = 'mm-curtain'
    document.body.appendChild(curtain)
    requestAnimationFrame(() => curtain.classList.add('mm-curtain-go'))
    setTimeout(() => {
      curtain.classList.add('mm-curtain-out')
      setTimeout(() => curtain.remove(), 420)
    }, 560)
  }

  const showLoader = () => {
    loaderStartTime = Date.now()
    showCurtain()

    const tipEl = container.querySelector('[data-loader-tip]')
    const tips = Array.from({ length: 8 }, (_, i) => t(`mm.tip${i + 1}`))
    if (tipEl) tipEl.textContent = tips[Math.floor(Math.random() * tips.length)]

    setTimeout(() => {
      container.classList.add('is-loading')

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
      const steps = getLoaderSteps()
      const apply = () => {
        const s = steps[i % steps.length]
        if (loaderStatusEl) loaderStatusEl.textContent = s.status
        if (loaderSubEl)    loaderSubEl   .textContent = s.sub
        i++
      }
      apply()
      loaderTimer = window.setInterval(apply, 1700)
    }, 230)
  }

  const hideLoader = (immediate = false) => {
    if (loaderTimer) { clearInterval(loaderTimer); loaderTimer = 0 }
    document.querySelectorAll('.mm-curtain').forEach(el => el.remove())
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

  const CAM_CHAR  = { alpha: Math.PI / 2,      beta: Math.PI / 2.15, radius: 4.6, target: new Vector3(1,    1.05, 0) }
  const CAM_MOTO  = { alpha: -Math.PI / 4,     beta: Math.PI / 2.4,  radius: 3.8, target: new Vector3(-0.6, 0.3,  0) }
  const CAM_PLATE = { alpha: Math.PI * 0.9,    beta: Math.PI / 2.35, radius: 1.5, target: new Vector3(0, 0.15, 0) }

  const applyCamera = (preset) => {
    camera.alpha  = preset.alpha
    camera.beta   = preset.beta
    camera.radius = preset.radius
    camera.target.copyFrom(preset.target)
  }

  let animObs = null
  const animateTo = (preset, durationMs, onDone) => {
    if (animObs) { scene.onBeforeRenderObservable.remove(animObs); animObs = null }
    const s = {
      alpha: camera.alpha, beta: camera.beta, radius: camera.radius,
      tx: camera.target.x, ty: camera.target.y, tz: camera.target.z,
    }
    let elapsed = 0
    animObs = scene.onBeforeRenderObservable.add(() => {
      elapsed += engine.getDeltaTime()
      const p = Math.min(elapsed / durationMs, 1)
      const e = p < 0.5 ? 2 * p * p : -1 + (4 - 2 * p) * p
      camera.alpha  = s.alpha  + (preset.alpha  - s.alpha)  * e
      camera.beta   = s.beta   + (preset.beta   - s.beta)   * e
      camera.radius = s.radius + (preset.radius - s.radius) * e
      camera.target.set(
        s.tx + (preset.target.x - s.tx) * e,
        s.ty + (preset.target.y - s.ty) * e,
        s.tz + (preset.target.z - s.tz) * e,
      )
      if (p >= 1) {
        scene.onBeforeRenderObservable.remove(animObs)
        animObs = null
        onDone?.()
      }
    })
  }

  const characters = Object.create(null)
  let current = null
  let motoData = null
  let currentMoto = null
  let motoFrozen = false
  let autoRot = 0
  let motoTime = 0

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
      const groups = result.animationGroups
      groups.forEach((g) => g.stop())
      const anim = findFightIdle(groups)
      for (const m of result.meshes) m.setEnabled(false)
      characters[id] = { root, meshes: result.meshes, anim }
      if (pending === id) { pending = null; applyCharacter(id) }
    } catch (e) {
      console.warn('[mm-stage] échec chargement', file, e)
    }
  }

  const loadMoto = async () => {
    try {
      const result = await SceneLoader.ImportMeshAsync(null, '/extragame/', 'motorbike.glb', scene)
      const root = result.meshes[0]
      root.name = 'mm-moto'
      root.position.set(0, 0, 0)
      root.rotationQuaternion = null
      root.rotation.set(0, 0, 0)
      root.scaling.setAll(0.55)
      const groups = result.animationGroups
      groups.forEach(g => g.stop())
      const anim = groups.find(g => g.name.toLowerCase() === 'action')
                ?? groups.find(g => g.name.toLowerCase().includes('action'))
                ?? groups[0]
      for (const m of result.meshes) m.setEnabled(false)
      motoData = { root, meshes: result.meshes, anim }
      if (pendingMoto) { pendingMoto = false; applyMoto() }
    } catch (e) {
      console.warn('[mm-stage] échec chargement motorbike.glb', e)
    }
  }

  let pending = null
  const applyCharacter = (id) => {
    const c = characters[id]
    if (!c) return false
    // Cacher la moto si active
    if (currentMoto) {
      currentMoto.anim?.stop()
      for (const m of currentMoto.meshes) m.setEnabled(false)
      currentMoto = null
    }
    if (current && current !== c) {
      current.anim?.stop()
      for (const m of current.meshes) m.setEnabled(false)
    }
    for (const m of c.meshes) m.setEnabled(true)
    c.anim?.start(true, 1.0)
    current = c
    applyCamera(CAM_CHAR)
    return true
  }

  let pendingMoto = false
  const applyMoto = () => {
    if (!motoData) return false
    // Cacher le personnage actif
    if (current) {
      current.anim?.stop()
      for (const m of current.meshes) m.setEnabled(false)
      current = null
    }
    for (const m of motoData.meshes) m.setEnabled(true)
    motoData.anim?.start(true, 1.0)
    currentMoto = motoData
    applyCamera(CAM_MOTO)
    return true
  }

  const setCharacter = (id) => {
    if (!applyCharacter(id)) pending = id
  }

  const setMoto = () => {
    if (!applyMoto()) pendingMoto = true
  }

  // Pré-charge les personnages et la moto
  loadCharacter('George',   'George.glb')
  loadCharacter('stephane', 'stephane.glb')
  loadMoto()

  const zoomToPlate = () => {
    motoFrozen = true
    animateTo(CAM_PLATE, 1400)
  }

  const backToMoto = () => {
    motoFrozen = false
    animateTo(CAM_MOTO, 900)
  }

  // Rotation continue (figée pendant la vue plaque)
  scene.onBeforeRenderObservable.add(() => {
    const dt = engine.getDeltaTime()
    if (currentMoto && !motoFrozen) {
      motoTime += dt * 0.00035
      currentMoto.root.rotation.y = Math.sin(motoTime) * 0.55
    } else if (current) {
      autoRot += dt * 0.0006
      current.root.rotation.y = autoRot
    }
  })

  engine.runRenderLoop(() => scene.render())
  const onResize = () => engine.resize()
  window.addEventListener('resize', onResize)

  let disposed = false
  return {
    setCharacter,
    setMoto,
    zoomToPlate,
    backToMoto,
    stop() {
      if (disposed) return
      disposed = true
      if (animObs) scene.onBeforeRenderObservable.remove(animObs)
      window.removeEventListener('resize', onResize)
      engine.stopRenderLoop()
      scene.dispose()
      engine.dispose()
    },
  }
}
