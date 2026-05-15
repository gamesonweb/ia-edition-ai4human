import '@fortawesome/fontawesome-free/css/all.min.css'
import './hackingOverlay.css'
import './mlPuzzleOverlay.css'

const MODULES = [
  {
    id:       'DATA',
    label:    'DATA',
    sub:      'Collecte des données',
    icon:     'fa-database',
    color:    '#3B82F6',
    cssClass: 'mod-data',
    desc:     'Initialiser le dataset d\'entraînement brut',
  },
  {
    id:       'TRAIN',
    label:    'TRAIN',
    sub:      'Entraînement du modèle',
    icon:     'fa-brain',
    color:    '#F97316',
    cssClass: 'mod-train',
    desc:     'Lancer l\'algorithme d\'apprentissage profond',
  },
  {
    id:       'TEST',
    label:    'TEST',
    sub:      'Diagnostic & validation',
    icon:     'fa-flask-vial',
    color:    '#E2E8F0',
    cssClass: 'mod-test',
    desc:     'Évaluer les performances et détecter les biais',
  },
  {
    id:       'DEPLOY',
    label:    'DEPLOY',
    sub:      'Déploiement opérationnel',
    icon:     'fa-rocket',
    color:    '#22C55E',
    cssClass: 'mod-deploy',
    desc:     'Autoriser le déploiement système militaire',
  },
]

const CORRECT_ORDER = ['DATA', 'TRAIN', 'TEST', 'DEPLOY']

const MONITOR_LINES = [
  { text: '> Initialisation système ML v7.3...', delay: 0 },
  { text: '> Dataset         : <span class="ml-ok">ACCEPTED</span>', delay: 600 },
  { text: '> Bias détecté    : <span class="ml-warn">0.847 ⚠</span>', delay: 1200 },
  { text: '> Training        : <span class="ml-err">FAILED ✗</span>', delay: 1800 },
  { text: '> Correction requise — activez les modules dans l\'ordre correct', delay: 2500 },
]

export function showMlPuzzleOverlay({ onClose, onSuccess } = {}) {
  document.getElementById('ml-puzzle-overlay')?.remove()

  let clickedSeq = []
  let locked     = false   // pendant animation erreur

  const overlay = document.createElement('div')
  overlay.id = 'ml-puzzle-overlay'
  overlay.innerHTML = `
    <div class="hk-bg"></div>
    <div class="hk-scanlines"></div>
    <div class="ml-glitch-flash" id="ml-glitch-flash"></div>
    <div class="hk-window ml-window">
      <header class="hk-header">
        <div class="hk-dots"><span></span><span></span><span></span></div>
        <div class="hk-title">
          <i class="fa-solid fa-microchip"></i>
          <span>IA-CONTROL · SYSTÈME D'APPRENTISSAGE AUTOMATIQUE v3.0</span>
        </div>
        <button class="hk-close" data-action="close" aria-label="Fermer">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </header>
      <div class="hk-body" data-body style="overflow-y:auto"></div>
      <footer class="hk-foot">
        <span class="hk-foot-dot ml-foot-dot"></span>
        <span data-foot>SECURE_LINK · ML_CORE · FACILITY_UNDERGROUND · 10.0.0.2</span>
      </footer>
    </div>
  `

  document.body.appendChild(overlay)
  requestAnimationFrame(() => overlay.classList.add('open'))

  const body    = overlay.querySelector('[data-body]')
  const foot    = overlay.querySelector('[data-foot]')
  const flash   = overlay.querySelector('#ml-glitch-flash')

  const close = () => {
    overlay.classList.add('closing')
    setTimeout(() => {
      overlay.remove()
      window.removeEventListener('keydown', onKey)
    }, 380)
  }

  overlay.querySelector('[data-action="close"]')
    .addEventListener('click', () => { close(); onClose?.() })

  const onKey = (e) => {
    if (e.key === 'Escape') { close(); onClose?.() }
  }
  window.addEventListener('keydown', onKey)

  // ── Render principal ─────────────────────────────────────────────────────
  const renderPuzzle = () => {
    foot.textContent = 'SYSTÈME EN ATTENTE D\'ACTIVATION — séquence : [CLASSIFIÉ]'

    body.innerHTML = `
      <div class="hk-page ml-page">

        <!-- Moniteur central -->
        <div class="ml-monitor">
          <div class="ml-monitor-header">
            <span class="ml-mon-dot"></span>
            <span class="ml-mon-dot"></span>
            <span class="ml-mon-dot"></span>
            <span class="ml-mon-title">MONITEUR CENTRAL — DIAGNOSTICS ML</span>
          </div>
          <div class="ml-monitor-body" id="ml-monitor-body"></div>
        </div>

        <!-- Instruction -->
        <div class="ml-instruction">
          <i class="fa-solid fa-circle-exclamation"></i>
          Activez les 4 modules dans le bon ordre du pipeline d'apprentissage automatique
        </div>

        <!-- Modules 2×2 -->
        <div class="ml-modules-grid">
          ${MODULES.map(m => `
            <div class="ml-module ${m.cssClass}" data-id="${m.id}" tabindex="0" role="button">
              <div class="ml-mod-glow"></div>
              <div class="ml-mod-particles"></div>
              <div class="ml-mod-icon">
                <i class="fa-solid ${m.icon}"></i>
              </div>
              <div class="ml-mod-label">${m.label}</div>
              <div class="ml-mod-sub">${m.sub}</div>
              <div class="ml-mod-desc">${m.desc}</div>
              <div class="ml-mod-status" data-status="${m.id}">
                <span class="ml-status-dot"></span>
                <span class="ml-status-text">INACTIF</span>
              </div>
            </div>
          `).join('')}
        </div>

        <!-- Séquence tracker -->
        <div class="ml-seq-tracker">
          ${CORRECT_ORDER.map((id, i) => `
            <div class="ml-seq-step" data-step="${i}">
              <div class="ml-seq-num">${i + 1}</div>
              <div class="ml-seq-val" data-seq-val="${i}">—</div>
            </div>
            ${i < CORRECT_ORDER.length - 1 ? '<div class="ml-seq-arrow"><i class="fa-solid fa-chevron-right"></i></div>' : ''}
          `).join('')}
        </div>

      </div>
    `

    // Anime les lignes du moniteur
    const monitorBody = body.querySelector('#ml-monitor-body')
    MONITOR_LINES.forEach(({ text, delay }) => {
      setTimeout(() => {
        if (!monitorBody.isConnected) return
        const line = document.createElement('div')
        line.className = 'ml-mon-line'
        line.innerHTML = text
        monitorBody.appendChild(line)
        monitorBody.scrollTop = monitorBody.scrollHeight
      }, delay)
    })

    // Événements modules
    body.querySelectorAll('.ml-module').forEach(el => {
      el.addEventListener('click', () => handleModuleClick(el.dataset.id))
    })
  }

  const handleModuleClick = (id) => {
    if (locked) return

    clickedSeq.push(id)
    const step = clickedSeq.length - 1

    // Met à jour le tracker
    const valEl = body.querySelector(`[data-seq-val="${step}"]`)
    if (valEl) valEl.textContent = id

    // Active visuellement le module
    const modEl = body.querySelector(`.ml-module[data-id="${id}"]`)
    modEl?.classList.add('activated')
    const statusEl = body.querySelector(`[data-status="${id}"] .ml-status-text`)
    if (statusEl) statusEl.textContent = 'ACTIF ✓'
    const statusDot = body.querySelector(`[data-status="${id}"] .ml-status-dot`)
    statusDot?.classList.add('on')

    const expected = CORRECT_ORDER[step]

    if (id !== expected) {
      // Mauvaise séquence → glitch
      triggerError()
    } else if (clickedSeq.length === CORRECT_ORDER.length) {
      // Séquence complète et correcte
      setTimeout(renderSuccess, 600)
    }
    // sinon on continue d'attendre le prochain clic
  }

  const triggerError = () => {
    locked = true
    flash.classList.add('active')
    foot.textContent = '⚠ SÉQUENCE INCORRECTE — réinitialisation...'

    // Shake tous les modules
    body.querySelectorAll('.ml-module').forEach(el => {
      el.classList.add('error-shake')
      el.classList.remove('activated')
    })
    // Reset status labels
    body.querySelectorAll('.ml-status-text').forEach(el => el.textContent = 'INACTIF')
    body.querySelectorAll('.ml-status-dot').forEach(el => el.classList.remove('on'))
    // Reset tracker
    body.querySelectorAll('[data-seq-val]').forEach(el => el.textContent = '—')

    // Ajoute une ligne d'erreur dans le moniteur
    const monitorBody = body.querySelector('#ml-monitor-body')
    if (monitorBody) {
      const err = document.createElement('div')
      err.className = 'ml-mon-line ml-err'
      err.textContent = '> ERREUR CRITIQUE — séquence non valide — réinitialisation en cours...'
      monitorBody.appendChild(err)
      monitorBody.scrollTop = monitorBody.scrollHeight
    }

    setTimeout(() => {
      flash.classList.remove('active')
      body.querySelectorAll('.ml-module').forEach(el => el.classList.remove('error-shake'))
      foot.textContent = 'SYSTÈME EN ATTENTE D\'ACTIVATION — séquence : [CLASSIFIÉ]'
      clickedSeq = []
      locked = false
    }, 1400)
  }

  // ── Succès ───────────────────────────────────────────────────────────────
  const renderSuccess = () => {
    foot.textContent = 'ACCÈS SERGENT IA — AUTORISATION VALIDÉE'

    body.innerHTML = `
      <div class="hk-page hk-page-success ml-success-page">
        <div class="ml-success-glow"></div>

        <div class="ml-badge-ring">
          <div class="ml-badge-inner">
            <i class="fa-solid fa-shield-halved"></i>
          </div>
        </div>

        <div class="ml-success-title">IA SERGEANT ACCESS GRANTED</div>
        <div class="hk-success-sub" style="color:rgba(255,255,255,0.7);max-width:480px;text-align:center">
          Accréditation militaire validée — Jacob Martin vous remet l'outil de reconnaissance faciale.
        </div>

        <div class="ml-success-monitors">
          <div class="ml-smon-line"><span class="ml-ok">Dataset   : ACCEPTED</span></div>
          <div class="ml-smon-line"><span style="color:#F97316">Bias      : CORRECTED</span></div>
          <div class="ml-smon-line"><span class="ml-ok">Training  : SUCCESS</span></div>
          <div class="ml-smon-line"><span class="ml-ok">Deploy    : AUTHORIZED</span></div>
        </div>

        <div class="ml-item-card">
          <div class="ml-item-icon">
            <i class="fa-solid fa-eye"></i>
          </div>
          <div class="ml-item-info">
            <div class="ml-item-name">OUTIL DE RECONNAISSANCE FACIALE</div>
            <div class="ml-item-serial">SN · RF-7743-IA · CLASSIFIÉ</div>
            <div class="ml-item-desc">
              Scanner biométrique militaire — identification des agents IA infiltrés.<br>
              <span style="color:#FCD34D">Requis pour la Manche 8.</span>
            </div>
          </div>
        </div>

        <div class="hk-actions" style="margin-top:8px">
          <button class="hk-btn primary" data-action="finish">
            <i class="fa-solid fa-right-from-bracket"></i>
            <span>Terminer la mission</span>
          </button>
        </div>
      </div>
    `

    // Anime les lignes de succès
    body.querySelectorAll('.ml-smon-line').forEach((el, i) => {
      el.style.opacity = '0'
      setTimeout(() => { el.style.transition = 'opacity 0.4s'; el.style.opacity = '1' }, 200 + i * 250)
    })

    body.querySelector('[data-action="finish"]').addEventListener('click', () => {
      close()
      onSuccess?.()
    })
  }

  renderPuzzle()
  return { close }
}
