import '@fortawesome/fontawesome-free/css/all.min.css'
import './frequencyOverlay.css'

const SLIDERS = [
  {
    id:        'data',
    label:     'DATA FREQUENCY',
    min:       0,
    max:       400,
    target:    160,
    tolerance: 18,
    unit:      'Hz',
    start:     290,
    color:     '#00FF41',
  },
  {
    id:        'voice',
    label:     'VOICE FREQUENCY',
    min:       0,
    max:       640,
    target:    320,
    tolerance: 22,
    unit:      'Hz',
    start:     95,
    color:     '#00CCFF',
  },
  {
    id:        'memory',
    label:     'MEMORY FREQUENCY',
    min:       0,
    max:       1200,
    target:    640,
    tolerance: 28,
    unit:      'Hz',
    start:     950,
    color:     '#FF9500',
  },
]

const STATUS_LEVELS = [
  { label: 'SIGNAL WEAK',             minScore: 0 },
  { label: 'SIGNAL MEDIUM',           minScore: 1 },
  { label: 'SIGNAL STABLE',           minScore: 2 },
  { label: 'SYNCHRONIZATION SUCCESS', minScore: 3 },
]

export function showFrequencyOverlay({ onClose, onSuccess } = {}) {
  document.getElementById('freq-overlay')?.remove()

  // Valeurs courantes
  const values = {}
  SLIDERS.forEach(s => { values[s.id] = s.start })

  const overlay = document.createElement('div')
  overlay.id = 'freq-overlay'
  overlay.innerHTML = `
    <div class="fq-bg"></div>
    <div class="fq-scanlines"></div>

    <div class="fq-header">
      <div class="fq-h-title">
        <span class="fq-bracket">[</span>
        <i class="fa-solid fa-wifi"></i>
        <span>AI SIGNAL DECRYPTION — FREQUENCY SYNCHRONIZATION</span>
        <span class="fq-bracket">]</span>
      </div>
      <div class="fq-h-sub" id="fq-global-status">
        <span class="fq-blink">■</span> AI SIGNAL DETECTED &nbsp;·&nbsp; FREQUENCY UNSTABLE &nbsp;·&nbsp; SYNCHRONIZATION REQUIRED
      </div>
    </div>

    <div class="fq-body">

      <!-- Robot gauche : compagnon -->
      <div class="fq-robot-panel fq-left-robot">
        <div class="fq-robot-icon">
          <i class="fa-solid fa-robot"></i>
          <div class="fq-robot-waves">
            <div class="fq-wave"></div>
            <div class="fq-wave"></div>
            <div class="fq-wave"></div>
          </div>
        </div>
        <div class="fq-robot-label">COMPANION AI</div>
        <div class="fq-robot-sub">Transmitting<br>encrypted data</div>
      </div>

      <!-- Console centrale -->
      <div class="fq-console">

        <!-- Visu signal -->
        <div class="fq-signal-viz">
          <div class="fq-waveform" id="fq-waveform"></div>
          <div class="fq-status-badge" id="fq-status-badge">SIGNAL WEAK</div>
        </div>

        <!-- Sliders -->
        <div class="fq-sliders" id="fq-sliders"></div>

        <!-- Dialogue (caché au départ) -->
        <div class="fq-dialogue" id="fq-dialogue" style="display:none"></div>

        <!-- Coords (cachées au départ) -->
        <div class="fq-coords" id="fq-coords" style="display:none">
          <div class="fq-coords-label">COORDINATES DECRYPTED</div>
          <div class="fq-coords-value">x = -46.57 &nbsp;·&nbsp; y = 0.14 &nbsp;·&nbsp; z = 15.64</div>
        </div>

        <!-- Bouton terminer (caché) -->
        <div class="fq-actions" id="fq-actions" style="display:none">
          <button class="fq-btn" id="fq-finish-btn">
            <i class="fa-solid fa-right-from-bracket"></i>
            <span>Terminer la mission</span>
          </button>
        </div>

      </div>

      <!-- Robot droit : agent IA -->
      <div class="fq-robot-panel fq-right-robot">
        <div class="fq-robot-icon fq-robot-right">
          <i class="fa-solid fa-robot"></i>
          <div class="fq-robot-waves fq-waves-right" id="fq-right-waves">
            <div class="fq-wave fq-wave-dim"></div>
            <div class="fq-wave fq-wave-dim"></div>
            <div class="fq-wave fq-wave-dim"></div>
          </div>
        </div>
        <div class="fq-robot-label">WORKER ROBOT</div>
        <div class="fq-robot-sub" id="fq-right-sub">Awaiting<br>signal</div>
      </div>

    </div>

    <div class="fq-footer">
      <span class="fq-bracket">[</span>
      <span id="fq-footer-text">ALIGNING FREQUENCIES — DRAG SLIDERS TO SYNCHRONIZE ZONES</span>
      <span class="fq-bracket">]</span>
      &nbsp;&nbsp;<kbd>ESC</kbd> Annuler
    </div>
  `

  document.body.appendChild(overlay)
  requestAnimationFrame(() => overlay.classList.add('open'))

  // Build waveform bars
  const waveform = overlay.querySelector('#fq-waveform')
  for (let i = 0; i < 40; i++) {
    const b = document.createElement('div')
    b.className = 'fq-bar'
    b.style.animationDelay = `${(i * 0.07) % 1.2}s`
    waveform.appendChild(b)
  }

  // Build sliders
  const slidersEl = overlay.querySelector('#fq-sliders')
  SLIDERS.forEach(cfg => {
    const zoneLeft  = ((cfg.target - cfg.tolerance - cfg.min) / (cfg.max - cfg.min) * 100).toFixed(2)
    const zoneWidth = ((cfg.tolerance * 2) / (cfg.max - cfg.min) * 100).toFixed(2)

    const wrapper = document.createElement('div')
    wrapper.className = 'fq-slider-row'
    wrapper.innerHTML = `
      <div class="fq-slider-label">
        <span>${cfg.label}</span>
        <span class="fq-slider-status" id="fq-ss-${cfg.id}">SIGNAL WEAK</span>
      </div>
      <div class="fq-track-wrapper">
        <div class="fq-track">
          <div class="fq-zone" style="left:${zoneLeft}%;width:${zoneWidth}%;background:rgba(0,255,65,0.2);border:1px solid rgba(0,255,65,0.5);box-shadow:0 0 8px rgba(0,255,65,0.3)"></div>
          <div class="fq-track-fill" id="fq-fill-${cfg.id}" style="width:${((cfg.start - cfg.min)/(cfg.max - cfg.min)*100).toFixed(1)}%"></div>
        </div>
        <input
          type="range"
          class="fq-input"
          min="${cfg.min}"
          max="${cfg.max}"
          value="${cfg.start}"
          step="1"
          data-id="${cfg.id}"
          style="--fq-color:${cfg.color}"
        />
      </div>
      <div class="fq-slider-footer">
        <span class="fq-min">${cfg.min} Hz</span>
        <span class="fq-current" id="fq-val-${cfg.id}">${cfg.start} Hz</span>
        <span class="fq-target">TARGET: ${cfg.target} Hz</span>
        <span class="fq-max">${cfg.max} Hz</span>
      </div>
    `
    slidersEl.appendChild(wrapper)
  })

  // Sync check
  let successTriggered = false

  const checkSync = () => {
    let score = 0
    SLIDERS.forEach(cfg => {
      const v   = values[cfg.id]
      const hit = Math.abs(v - cfg.target) <= cfg.tolerance
      if (hit) score++

      const ssEl   = overlay.querySelector(`#fq-ss-${cfg.id}`)
      const fillEl = overlay.querySelector(`#fq-fill-${cfg.id}`)
      const pct    = ((v - cfg.min) / (cfg.max - cfg.min) * 100).toFixed(1)

      if (fillEl) fillEl.style.width = pct + '%'

      if (ssEl) {
        const dist = Math.abs(v - cfg.target)
        if (hit) {
          ssEl.textContent = 'SYNCHRONIZED ✓'
          ssEl.className = 'fq-slider-status fq-ss-ok'
        } else if (dist < cfg.tolerance * 3) {
          ssEl.textContent = 'SIGNAL STABLE'
          ssEl.className = 'fq-slider-status fq-ss-stable'
        } else if (dist < cfg.tolerance * 6) {
          ssEl.textContent = 'SIGNAL MEDIUM'
          ssEl.className = 'fq-slider-status fq-ss-med'
        } else {
          ssEl.textContent = 'SIGNAL WEAK'
          ssEl.className = 'fq-slider-status fq-ss-weak'
        }
      }
    })

    // Badge global
    const badge = overlay.querySelector('#fq-status-badge')
    const st    = STATUS_LEVELS[Math.min(score, STATUS_LEVELS.length - 1)]
    if (badge) {
      badge.textContent = st.label
      badge.className = `fq-status-badge fq-status-${score}`
    }

    // Right robot receives signal
    const rightSub = overlay.querySelector('#fq-right-sub')
    const rightWaves = overlay.querySelector('#fq-right-waves')
    if (rightSub) {
      if (score === 0) { rightSub.innerHTML = 'Awaiting<br>signal'; rightWaves?.classList.remove('receiving') }
      else if (score < 3) { rightSub.innerHTML = 'Receiving<br>partial signal'; rightWaves?.classList.add('receiving') }
    }

    // Footer message
    const footer = overlay.querySelector('#fq-footer-text')
    if (footer) {
      if (score === 0) footer.textContent = 'ALIGNING FREQUENCIES — DRAG SLIDERS TO SYNCHRONIZE ZONES'
      else if (score < 3) footer.textContent = `${score}/3 FREQUENCIES SYNCHRONIZED — CONTINUE ALIGNMENT`
      else footer.textContent = 'ALL FREQUENCIES LOCKED — DECRYPTING...'
    }

    // Update waveform urgency
    if (waveform) waveform.setAttribute('data-score', score)

    if (score === 3 && !successTriggered) {
      successTriggered = true
      triggerSuccess()
    }
  }

  // Slider events
  overlay.querySelectorAll('.fq-input').forEach(input => {
    input.addEventListener('input', () => {
      const id = input.dataset.id
      values[id] = parseInt(input.value)
      const valEl = overlay.querySelector(`#fq-val-${id}`)
      if (valEl) valEl.textContent = `${values[id]} Hz`
      checkSync()
    })
  })

  const triggerSuccess = () => {
    // Glow all elements
    overlay.classList.add('synchronized')

    // Show dialogue after 0.8s
    setTimeout(() => {
      const dialogue = overlay.querySelector('#fq-dialogue')
      dialogue.style.display = 'flex'
      const lines = [
        { who: 'COMPANION AI', text: 'Connection established.' },
        { who: 'WORKER ROBOT', text: 'Identity verified.' },
        { who: 'COMPANION AI', text: 'Extracting coordinates…' },
      ]
      lines.forEach(({ who, text }, i) => {
        setTimeout(() => {
          const line = document.createElement('div')
          line.className = 'fq-dial-line'
          line.innerHTML = `<span class="fq-dial-who">${who} :</span> ${text}`
          dialogue.appendChild(line)
        }, i * 700)
      })

      // Coords after dialogue
      setTimeout(() => {
        overlay.querySelector('#fq-coords').style.display = 'block'
        setTimeout(() => {
          overlay.querySelector('#fq-actions').style.display = 'flex'
          overlay.querySelector('#fq-finish-btn').addEventListener('click', doSuccess)
        }, 600)
      }, lines.length * 700 + 500)
    }, 800)
  }

  const doSuccess = () => {
    doClose()
    onSuccess?.()
  }

  const doClose = () => {
    window.removeEventListener('keydown', onKey)
    overlay.classList.add('closing')
    setTimeout(() => { overlay.remove(); onClose?.() }, 400)
  }

  const onKey = (e) => { if (e.key === 'Escape') doClose() }
  window.addEventListener('keydown', onKey)

  // Initial check
  checkSync()

  return { close: doClose }
}
