import '@fortawesome/fontawesome-free/css/all.min.css'
import './combinationOverlay.css'

const CIRCUMFERENCE   = 2 * Math.PI * 90  // r=90 → ≈ 565.5
const CLICK_INCREMENT = 4.5               // % par clic
const DECAY_PER_SEC   = 10               // % par seconde de décroissance
const DECAY_DELAY_MS  = 180              // délai avant que la décroissance commence

export function showCombinationOverlay({ onClose, onSuccess } = {}) {
  document.getElementById('combo-overlay')?.remove()

  let progress  = 0
  let completed = false
  let rafId     = null
  let lastTime  = performance.now()
  let lastClick = 0

  const overlay = document.createElement('div')
  overlay.id = 'combo-overlay'
  overlay.innerHTML = `
    <div class="cb-bg"></div>
    <div class="cb-scanlines"></div>
    <div class="cb-error-flash" id="cb-flash"></div>

    <div class="cb-window">
      <header class="cb-header">
        <div class="cb-header-icon"><i class="fa-solid fa-bolt"></i></div>
        <div class="cb-header-text">
          <div class="cb-header-title">CONTRÔLE D'ACCÈS — USINE IA CENTRALE</div>
          <div class="cb-header-sub">SURCHARGEZ LE PANNEAU — CLIQUEZ AUSSI VITE QUE POSSIBLE</div>
        </div>
      </header>

      <div class="cb-body">
        <div class="cb-ring-wrap">
          <svg class="cb-ring-svg" viewBox="0 0 220 220" xmlns="http://www.w3.org/2000/svg">
            <circle class="cb-ring-track" cx="110" cy="110" r="90"/>
            <circle class="cb-ring-fill"  cx="110" cy="110" r="90" id="cb-ring-fill"/>
          </svg>
          <button class="cb-ring-btn" id="cb-ring-btn" type="button">
            <i class="fa-solid fa-bolt cb-ring-icon" id="cb-ring-icon"></i>
            <span class="cb-ring-cta">CLIQUEZ !</span>
            <span class="cb-ring-pct" id="cb-ring-pct">0%</span>
          </button>
        </div>

        <div class="cb-status">
          <span class="cb-blink">■</span>
          <span id="cb-status-text">SURCHARGEZ LE SYSTÈME — MAINTENEZ LA CADENCE</span>
        </div>
      </div>

      <footer class="cb-footer">
        <span class="cb-bracket">[</span>
        CLIQUEZ RAPIDEMENT sur le panneau · <kbd>ESC</kbd> Annuler
        <span class="cb-bracket">]</span>
      </footer>
    </div>
  `

  document.body.appendChild(overlay)
  requestAnimationFrame(() => overlay.classList.add('open'))

  const ringFill  = overlay.querySelector('#cb-ring-fill')
  const ringBtn   = overlay.querySelector('#cb-ring-btn')
  const ringPct   = overlay.querySelector('#cb-ring-pct')
  const ringIcon  = overlay.querySelector('#cb-ring-icon')
  const statusTxt = overlay.querySelector('#cb-status-text')

  const updateRing = () => {
    const offset = CIRCUMFERENCE * (1 - progress / 100)
    ringFill.style.strokeDashoffset = offset

    // Couleur : rouge → orange → vert selon le remplissage
    let stroke, glow
    if (progress < 40) {
      stroke = '#EF4444'; glow = 'rgba(239,68,68,0.5)'
    } else if (progress < 75) {
      stroke = '#F59E0B'; glow = 'rgba(245,158,11,0.5)'
    } else {
      stroke = '#4ADE80'; glow = 'rgba(74,222,128,0.55)'
    }
    ringFill.style.stroke = stroke
    ringFill.style.filter = `drop-shadow(0 0 8px ${glow})`
    ringPct.textContent   = `${Math.round(progress)}%`

    overlay.querySelector('.cb-ring-wrap').style.setProperty('--ring-color', stroke)
  }

  const triggerSuccess = () => {
    completed = true
    cancelAnimationFrame(rafId)

    ringBtn.classList.add('success')
    statusTxt.textContent = '✓ SYSTÈME SURCHARGÉ — ACCÈS FORCÉ'

    setTimeout(() => renderSuccess(), 700)
  }

  const renderSuccess = () => {
    overlay.querySelector('.cb-body').innerHTML = `
      <div class="cb-success">
        <div class="cb-success-icon"><i class="fa-solid fa-door-open"></i></div>
        <div class="cb-success-title">ACCÈS AUTORISÉ</div>
        <div class="cb-success-sub">
          Panneau de sécurité surchargé — les portes de l'usine centrale IA s'ouvrent.
        </div>
        <div class="cb-success-card">
          <div><span>SITE</span><b>Usine Centrale IA</b></div>
          <div><span>NIVEAU D'ACCÈS</span><b style="color:#4ADE80">FORCÉ ✓</b></div>
          <div><span>MÉTHODE</span><b style="color:#67E8F9">SURCHARGE ÉLECTRIQUE</b></div>
        </div>
        <button class="cb-finish-btn" id="cb-finish-btn">
          <i class="fa-solid fa-right-from-bracket"></i>
          <span>Entrer dans l'usine</span>
        </button>
      </div>
    `
    overlay.querySelector('#cb-finish-btn').addEventListener('click', doSuccess)
  }

  // ── Boucle de décroissance (rAF) ──────────────────────────────────────────
  const gameLoop = (now) => {
    if (completed) return
    const dt = (now - lastTime) / 1000
    lastTime = now

    const timeSinceClick = now - lastClick
    if (timeSinceClick > DECAY_DELAY_MS && progress > 0) {
      progress = Math.max(0, progress - DECAY_PER_SEC * dt)
      updateRing()
    }

    rafId = requestAnimationFrame(gameLoop)
  }
  rafId = requestAnimationFrame(gameLoop)

  // ── Clic sur le bouton ────────────────────────────────────────────────────
  ringBtn.addEventListener('click', () => {
    if (completed) return
    lastClick = performance.now()
    progress  = Math.min(100, progress + CLICK_INCREMENT)
    updateRing()

    // Feedback visuel du clic
    ringBtn.classList.add('pulse')
    setTimeout(() => ringBtn.classList.remove('pulse'), 100)

    if (progress >= 100) triggerSuccess()
  })

  // ── Clavier ───────────────────────────────────────────────────────────────
  const onKey = (e) => { if (e.key === 'Escape') doClose() }
  window.addEventListener('keydown', onKey)

  const doSuccess = () => { doClose(); onSuccess?.() }

  const doClose = () => {
    completed = true
    cancelAnimationFrame(rafId)
    window.removeEventListener('keydown', onKey)
    overlay.classList.add('closing')
    setTimeout(() => { overlay.remove(); onClose?.() }, 380)
  }

  updateRing()
  return { close: doClose }
}
