import '@fortawesome/fontawesome-free/css/all.min.css'
import './graphicsSettings.css'

const STORAGE_KEY = 'babylon-akira:gfx-scale'
const MIN_SCALE   = 1.0
const MAX_SCALE   = 2.0
const STEP        = 0.05
const DEFAULT     = 1.25

/**
 * Panneau de réglages graphiques :
 *  - slider qui pilote engine.setHardwareScalingLevel
 *  - affichage FPS live (actualisé 2 fois/s)
 *
 * @param {import('@babylonjs/core').Engine} engine
 */
export function setupGraphicsSettings(engine) {
  const stored = parseFloat(localStorage.getItem(STORAGE_KEY) ?? '')
  const initial = Number.isFinite(stored) && stored >= MIN_SCALE && stored <= MAX_SCALE
    ? stored
    : DEFAULT
  engine.setHardwareScalingLevel(initial)

  const btn = document.createElement('button')
  btn.id = 'gfx-btn'
  btn.type = 'button'
  btn.title = 'Graphismes'
  btn.innerHTML = `<i class="fa-solid fa-gauge-high"></i>`
  document.body.appendChild(btn)

  const panel = document.createElement('div')
  panel.id = 'gfx-panel'
  panel.innerHTML = `
    <div class="gfx-row">
      <span class="gfx-label">Résolution</span>
      <span class="gfx-value gfx-scale-val">${(1 / initial * 100).toFixed(0)}%</span>
    </div>
    <input class="gfx-slider gfx-scale" type="range"
           min="${MIN_SCALE}" max="${MAX_SCALE}" step="${STEP}" value="${initial}" />
    <div class="gfx-row" style="margin-top:10px">
      <span class="gfx-label">FPS</span>
      <span class="gfx-fps">--</span>
    </div>
    <div class="gfx-hint">
      Augmenter la valeur du curseur diminue la résolution interne (rendu plus rapide).
    </div>
  `
  document.body.appendChild(panel)

  const slider = panel.querySelector('.gfx-scale')
  const valEl  = panel.querySelector('.gfx-scale-val')
  const fpsEl  = panel.querySelector('.gfx-fps')

  const apply = (v) => {
    const scale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, v))
    engine.setHardwareScalingLevel(scale)
    valEl.textContent = `${Math.round(1 / scale * 100)}%`
    try { localStorage.setItem(STORAGE_KEY, String(scale)) } catch {}
  }

  slider.addEventListener('input', (e) => apply(parseFloat(e.target.value)))

  let open = false
  const setOpen = (v) => {
    open = v
    panel.classList.toggle('open', open)
  }
  btn.addEventListener('click', (e) => {
    e.stopPropagation()
    setOpen(!open)
  })
  // Ferme si on clique ailleurs
  document.addEventListener('click', (e) => {
    if (!open) return
    if (panel.contains(e.target) || btn.contains(e.target)) return
    setOpen(false)
  })

  // FPS live à 2 Hz (cheap)
  const fpsTimer = setInterval(() => {
    if (!open) return
    fpsEl.textContent = `${engine.getFps().toFixed(0)}`
  }, 500)

  return {
    setScale: apply,
    getScale: () => parseFloat(slider.value),
    open:  () => setOpen(true),
    close: () => setOpen(false),
    dispose: () => {
      clearInterval(fpsTimer)
      btn.remove()
      panel.remove()
    },
  }
}
