import '@fortawesome/fontawesome-free/css/all.min.css'
import './combinationOverlay.css'

const COMBINATION = ['ArrowLeft', 'ArrowUp', 'ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp']

const DIR = {
  ArrowLeft:  { icon: 'fa-arrow-left',  label: '←', cls: 'dir-left'  },
  ArrowUp:    { icon: 'fa-arrow-up',    label: '↑', cls: 'dir-up'    },
  ArrowRight: { icon: 'fa-arrow-right', label: '→', cls: 'dir-right' },
  ArrowDown:  { icon: 'fa-arrow-down',  label: '↓', cls: 'dir-down'  },
}

export function showCombinationOverlay({ onClose, onSuccess } = {}) {
  document.getElementById('combo-overlay')?.remove()

  let step    = 0
  let locked  = false

  const overlay = document.createElement('div')
  overlay.id = 'combo-overlay'
  overlay.innerHTML = `
    <div class="cb-bg"></div>
    <div class="cb-scanlines"></div>
    <div class="cb-error-flash" id="cb-flash"></div>

    <div class="cb-window">
      <header class="cb-header">
        <div class="cb-header-icon"><i class="fa-solid fa-lock"></i></div>
        <div class="cb-header-text">
          <div class="cb-header-title">CONTRÔLE D'ACCÈS — USINE IA CENTRALE</div>
          <div class="cb-header-sub">SYSTÈME DE SÉCURITÉ NIVEAU 4 · SÉQUENCE DIRECTIONNELLE REQUISE</div>
        </div>
      </header>

      <div class="cb-body">
        <!-- Slots de combinaison -->
        <div class="cb-slots" id="cb-slots">
          ${COMBINATION.map((_, i) => `
            <div class="cb-slot" id="cb-slot-${i}">
              <div class="cb-slot-num">${i + 1}</div>
              <div class="cb-slot-icon" id="cb-slot-icon-${i}">
                <i class="fa-solid fa-question"></i>
              </div>
            </div>
          `).join('')}
        </div>

        <!-- Status -->
        <div class="cb-status" id="cb-status">
          <span class="cb-blink">■</span>
          <span id="cb-status-text">EN ATTENTE DE LA SÉQUENCE — UTILISEZ LES TOUCHES DIRECTIONNELLES</span>
        </div>

        <!-- Pad directionnel (déco) -->
        <div class="cb-dpad">
          <div class="cb-dpad-row">
            <div class="cb-dpad-empty"></div>
            <div class="cb-dpad-btn" id="cb-dpad-up"><i class="fa-solid fa-arrow-up"></i></div>
            <div class="cb-dpad-empty"></div>
          </div>
          <div class="cb-dpad-row">
            <div class="cb-dpad-btn" id="cb-dpad-left"><i class="fa-solid fa-arrow-left"></i></div>
            <div class="cb-dpad-center"><i class="fa-solid fa-circle-dot"></i></div>
            <div class="cb-dpad-btn" id="cb-dpad-right"><i class="fa-solid fa-arrow-right"></i></div>
          </div>
          <div class="cb-dpad-row">
            <div class="cb-dpad-empty"></div>
            <div class="cb-dpad-btn" id="cb-dpad-down"><i class="fa-solid fa-arrow-down"></i></div>
            <div class="cb-dpad-empty"></div>
          </div>
        </div>

        <!-- Progression -->
        <div class="cb-progress-row">
          <div class="cb-progress-track">
            <div class="cb-progress-fill" id="cb-progress-fill" style="width:0%"></div>
          </div>
          <div class="cb-progress-label" id="cb-progress-label">0 / ${COMBINATION.length}</div>
        </div>
      </div>

      <footer class="cb-footer">
        <span class="cb-bracket">[</span>
        TOUCHES DIRECTIONNELLES pour entrer la séquence · <kbd>ESC</kbd> Annuler
        <span class="cb-bracket">]</span>
      </footer>
    </div>
  `

  document.body.appendChild(overlay)
  requestAnimationFrame(() => overlay.classList.add('open'))

  const flash      = overlay.querySelector('#cb-flash')
  const statusText = overlay.querySelector('#cb-status-text')
  const progressFill  = overlay.querySelector('#cb-progress-fill')
  const progressLabel = overlay.querySelector('#cb-progress-label')

  const DPAD_MAP = {
    ArrowUp:    'cb-dpad-up',
    ArrowDown:  'cb-dpad-down',
    ArrowLeft:  'cb-dpad-left',
    ArrowRight: 'cb-dpad-right',
  }

  const fillSlot = (index, key) => {
    const d = DIR[key]
    const slotEl = overlay.querySelector(`#cb-slot-${index}`)
    const iconEl = overlay.querySelector(`#cb-slot-icon-${index}`)
    if (!slotEl || !iconEl) return
    iconEl.innerHTML = `<i class="fa-solid ${d.icon}"></i>`
    slotEl.classList.add('filled', d.cls)
  }

  const resetSlots = () => {
    for (let i = 0; i < COMBINATION.length; i++) {
      const slotEl = overlay.querySelector(`#cb-slot-${i}`)
      const iconEl = overlay.querySelector(`#cb-slot-icon-${i}`)
      if (slotEl) slotEl.className = 'cb-slot'
      if (iconEl) iconEl.innerHTML = `<i class="fa-solid fa-question"></i>`
    }
    if (progressFill)  progressFill.style.width = '0%'
    if (progressLabel) progressLabel.textContent = `0 / ${COMBINATION.length}`
  }

  const flashDpad = (key) => {
    const id = DPAD_MAP[key]
    if (!id) return
    const btn = overlay.querySelector(`#${id}`)
    if (!btn) return
    btn.classList.add('pressed')
    setTimeout(() => btn.classList.remove('pressed'), 180)
  }

  const triggerError = () => {
    locked = true
    flash.classList.add('active')
    statusText.textContent = '⚠ SÉQUENCE INCORRECTE — RÉINITIALISATION...'
    overlay.querySelector('#cb-slots')?.classList.add('error')

    setTimeout(() => {
      flash.classList.remove('active')
      overlay.querySelector('#cb-slots')?.classList.remove('error')
      resetSlots()
      step = 0
      locked = false
      statusText.textContent = 'EN ATTENTE DE LA SÉQUENCE — UTILISEZ LES TOUCHES DIRECTIONNELLES'
    }, 1200)
  }

  const triggerSuccess = () => {
    locked = true
    overlay.querySelector('#cb-slots')?.classList.add('success')
    statusText.textContent = '✓ COMBINAISON VALIDÉE — ACCÈS AUTORISÉ'

    // Affiche le succès après un court délai
    setTimeout(() => {
      renderSuccess()
    }, 900)
  }

  const renderSuccess = () => {
    overlay.querySelector('.cb-body').innerHTML = `
      <div class="cb-success">
        <div class="cb-success-icon">
          <i class="fa-solid fa-door-open"></i>
        </div>
        <div class="cb-success-title">ACCÈS AUTORISÉ</div>
        <div class="cb-success-sub">
          Séquence validée — les portes de l'usine centrale IA s'ouvrent.
        </div>
        <div class="cb-success-card">
          <div><span>SITE</span><b>Usine Centrale IA</b></div>
          <div><span>NIVEAU D'ACCÈS</span><b style="color:#4ADE80">AUTORISÉ ✓</b></div>
          <div><span>SÉQUENCE</span><b style="color:#67E8F9">← ↑ ← → ↓ ↑</b></div>
        </div>
        <button class="cb-finish-btn" id="cb-finish-btn">
          <i class="fa-solid fa-right-from-bracket"></i>
          <span>Entrer dans l'usine</span>
        </button>
      </div>
    `
    overlay.querySelector('#cb-finish-btn').addEventListener('click', doSuccess)
  }

  const onKey = (e) => {
    if (e.key === 'Escape') { doClose(); return }
    if (locked) return
    if (!DIR[e.key]) return

    e.preventDefault()
    flashDpad(e.key)

    const expected = COMBINATION[step]
    if (e.key !== expected) {
      triggerError()
      return
    }

    fillSlot(step, e.key)
    step++

    const pct = (step / COMBINATION.length * 100).toFixed(0)
    if (progressFill)  progressFill.style.width  = pct + '%'
    if (progressLabel) progressLabel.textContent = `${step} / ${COMBINATION.length}`

    if (step === COMBINATION.length) {
      triggerSuccess()
    } else {
      statusText.textContent = `${step} / ${COMBINATION.length} — CONTINUEZ...`
    }
  }
  window.addEventListener('keydown', onKey)

  const doSuccess = () => {
    doClose()
    onSuccess?.()
  }

  const doClose = () => {
    window.removeEventListener('keydown', onKey)
    overlay.classList.add('closing')
    setTimeout(() => { overlay.remove(); onClose?.() }, 380)
  }

  return { close: doClose }
}
