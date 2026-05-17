import '@fortawesome/fontawesome-free/css/all.min.css'
import './pauseButton.css'
import { FxaaPostProcess } from '@babylonjs/core/PostProcesses/fxaaPostProcess'
import { GAME_CONFIG } from '../config/gameConfig.js'

const STORAGE = {
  VOLUME:   'babylon-akira:volume',
  KEYBOARD: 'babylon-akira:keyboard',
  QUALITY:  'babylon-akira:quality',
}

export const setupPauseButton = (scene, { engine, camera, onQuit } = {}) => {
  const savedVolume   = parseFloat(localStorage.getItem(STORAGE.VOLUME)  ?? '40')
  const savedKeyboard = localStorage.getItem(STORAGE.KEYBOARD) ?? 'AZERTY'
  const savedQuality  = localStorage.getItem(STORAGE.QUALITY)  ?? 'quality'

  GAME_CONFIG.KEYBOARD.LAYOUT = savedKeyboard

  let fxaaProcess = null
  const setFxaa = (enabled) => {
    if (enabled) {
      if (!fxaaProcess && camera) fxaaProcess = new FxaaPostProcess('fxaa', 1.0, camera)
    } else {
      fxaaProcess?.dispose()
      fxaaProcess = null
    }
  }
  setFxaa(savedQuality === 'quality')

  let audioEl = null
  const setAudio = (bgm) => {
    audioEl = bgm
    audioEl.volume = savedVolume / 100
  }

  const btn = document.createElement('button')
  btn.id = 'pause-btn'
  btn.type = 'button'
  btn.title = 'Pause (Échap)'
  btn.innerHTML = `<i class="icon fa-solid fa-pause"></i>`
  document.body.appendChild(btn)

  const overlay = document.createElement('div')
  overlay.id = 'pause-overlay'
  overlay.innerHTML = `
    <div class="pause-main">
      <div class="title">Pause</div>
      <button class="pause-action resume" type="button">
        <i class="fa-solid fa-play"></i><span>Reprendre</span>
      </button>
      <button class="pause-action settings-open" type="button">
        <i class="fa-solid fa-gear"></i><span>Réglages</span>
      </button>
      <button class="pause-action quit" type="button">
        <i class="fa-solid fa-door-open"></i><span>Quitter</span>
      </button>
    </div>

    <div class="pause-settings">
      <button class="settings-back" type="button">
        <i class="fa-solid fa-arrow-left"></i><span>Retour</span>
      </button>
      <div class="settings-title">Réglages</div>

      <div class="settings-section">
        <div class="settings-label"><i class="fa-solid fa-volume-high"></i> Son</div>
        <div class="settings-row">
          <input class="settings-slider" id="s-volume" type="range" min="0" max="100" value="${Math.round(savedVolume)}" />
          <span class="settings-val" id="s-volume-val">${Math.round(savedVolume)}%</span>
        </div>
      </div>

      <div class="settings-section">
        <div class="settings-label"><i class="fa-solid fa-keyboard"></i> Clavier</div>
        <div class="settings-toggle" id="s-keyboard">
          <button class="toggle-btn ${savedKeyboard === 'AZERTY' ? 'active' : ''}" data-value="AZERTY">AZERTY</button>
          <button class="toggle-btn ${savedKeyboard === 'QWERTY' ? 'active' : ''}" data-value="QWERTY">QWERTY</button>
        </div>
      </div>

      <div class="settings-section">
        <div class="settings-label"><i class="fa-solid fa-display"></i> Rendu</div>
        <div class="settings-toggle" id="s-quality">
          <button class="toggle-btn ${savedQuality === 'quality' ? 'active' : ''}" data-value="quality">Qualité</button>
          <button class="toggle-btn ${savedQuality === 'performance' ? 'active' : ''}" data-value="performance">Performance</button>
        </div>
      </div>
    </div>
  `
  document.body.appendChild(overlay)

  const iconEl        = btn.querySelector('.icon')
  const resumeBtn     = overlay.querySelector('.resume')
  const quitBtn       = overlay.querySelector('.quit')
  const settingsOpenBtn = overlay.querySelector('.settings-open')
  const settingsBackBtn = overlay.querySelector('.settings-back')
  const mainPanel     = overlay.querySelector('.pause-main')
  const settingsPanel = overlay.querySelector('.pause-settings')
  const volSlider     = overlay.querySelector('#s-volume')
  const volVal        = overlay.querySelector('#s-volume-val')
  const keyboardGrp   = overlay.querySelector('#s-keyboard')
  const qualityGrp    = overlay.querySelector('#s-quality')

  const showSettings = (v) => {
    mainPanel.classList.toggle('hidden', v)
    settingsPanel.classList.toggle('visible', v)
  }

  settingsOpenBtn.addEventListener('click', () => showSettings(true))
  settingsBackBtn.addEventListener('click', () => showSettings(false))

  volSlider.addEventListener('input', () => {
    const v = parseInt(volSlider.value, 10)
    volVal.textContent = `${v}%`
    if (audioEl) audioEl.volume = v / 100
    try { localStorage.setItem(STORAGE.VOLUME, String(v)) } catch {}
  })

  keyboardGrp.addEventListener('click', (e) => {
    const t = e.target.closest('.toggle-btn')
    if (!t) return
    keyboardGrp.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'))
    t.classList.add('active')
    GAME_CONFIG.KEYBOARD.LAYOUT = t.dataset.value
    try { localStorage.setItem(STORAGE.KEYBOARD, t.dataset.value) } catch {}
  })

  qualityGrp.addEventListener('click', (e) => {
    const t = e.target.closest('.toggle-btn')
    if (!t) return
    qualityGrp.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'))
    t.classList.add('active')
    setFxaa(t.dataset.value === 'quality')
    try { localStorage.setItem(STORAGE.QUALITY, t.dataset.value) } catch {}
  })

  if (!scene.metadata) scene.metadata = {}

  let paused = false
  const setPaused = (p) => {
    if (p === paused) return
    paused = p
    scene.metadata.paused = paused
    scene.animationsEnabled = !paused

    iconEl.classList.toggle('fa-pause', !paused)
    iconEl.classList.toggle('fa-play',  paused)
    overlay.classList.toggle('open', paused)

    if (!paused) showSettings(false)
    if (paused && document.pointerLockElement) document.exitPointerLock()
  }
  const toggle = () => setPaused(!paused)

  btn.addEventListener('click', toggle)
  resumeBtn.addEventListener('click', () => setPaused(false))
  quitBtn.addEventListener('click', () => {
    if (window.confirm('Quitter la partie et retourner au menu principal ?')) {
      onQuit ? onQuit() : location.reload()
    }
  })

  const onKey = (e) => {
    if (e.repeat) return
    if (e.key !== 'Escape') return
    e.preventDefault()
    if (paused && settingsPanel.classList.contains('visible')) {
      showSettings(false)
    } else {
      toggle()
    }
  }
  window.addEventListener('keydown', onKey)

  return {
    element: btn,
    toggle,
    pause:    () => setPaused(true),
    resume:   () => setPaused(false),
    isPaused: () => paused,
    setAudio,
    dispose: () => {
      window.removeEventListener('keydown', onKey)
      fxaaProcess?.dispose()
      btn.remove()
      overlay.remove()
    },
  }
}
