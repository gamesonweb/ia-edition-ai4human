import '@fortawesome/fontawesome-free/css/all.min.css'
import './hackingOverlay.css'

const ADMIN_CODE = 'GOW2026'

const TRAINING_STEPS = [
  'Extraction des points caractéristiques…',
  'Analyse des landmarks faciaux…',
  'Génération du vecteur d\'identité…',
  'Indexation dans la base "Robots autorisés"…',
  'Mise à jour du modèle de reconnaissance…',
]

const REGISTERED_ROBOTS = [
  { id: 'R-001', name: 'CL3-MNT', status: 'ACTIF' },
  { id: 'R-002', name: 'X3-VRM',  status: 'ACTIF' },
  { id: 'R-003', name: 'AJ-7',    status: 'ACTIF' },
]

/**
 * Overlay « reconnaissance faciale » — terminal IA multi-étapes.
 *
 * @param {{
 *   robot?: any,
 *   photoUrl?: string,
 *   onClose?: () => void,
 *   onSuccess?: () => void,
 *   onAskRobot?: () => void,
 * }} opts
 */
export function showHackingOverlay({ robot, photoUrl = '/img/photoProfile/photo_profile.png', onClose, onSuccess, onAskRobot } = {}) {
  document.getElementById('hacking-overlay')?.remove()

  const overlay = document.createElement('div')
  overlay.id = 'hacking-overlay'
  overlay.innerHTML = `
    <div class="hk-bg"></div>
    <div class="hk-scanlines"></div>

    <div class="hk-window">
      <header class="hk-header">
        <div class="hk-dots">
          <span></span><span></span><span></span>
        </div>
        <div class="hk-title">
          <i class="fa-solid fa-shield-halved"></i>
          <span>FACTORY_OS · RECONNAISSANCE_FACIALE v3.7</span>
        </div>
        <button class="hk-close" data-action="close" aria-label="Fermer">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </header>

      <div class="hk-body" data-body>
        <!-- pages injectées dynamiquement -->
      </div>

      <footer class="hk-foot">
        <span class="hk-foot-dot"></span>
        <span data-foot>SECURE_LINK · 192.168.0.42</span>
      </footer>
    </div>
  `

  document.body.appendChild(overlay)
  requestAnimationFrame(() => overlay.classList.add('open'))

  const body  = overlay.querySelector('[data-body]')
  const foot  = overlay.querySelector('[data-foot]')

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

  // ===========================================================
  // ÉTAPE 1 : Login (saisie identifiant + demander au robot)
  // ===========================================================
  const renderLogin = () => {
    foot.textContent = 'AUTH_REQUIRED · niveau accès : ADMIN'

    body.innerHTML = `
      <div class="hk-page hk-page-login">
        <div class="hk-screen-title">
          <span class="hk-bracket">[</span>
          <span>AUTHENTIFICATION REQUISE</span>
          <span class="hk-bracket">]</span>
        </div>
        <div class="hk-screen-sub">
          Saisis le code administrateur pour accéder à la base de reconnaissance.
        </div>

        <form class="hk-form" data-form>
          <div class="hk-field">
            <label class="hk-label">Identifiant administrateur</label>
            <div class="hk-input-row">
              <i class="fa-solid fa-key"></i>
              <input
                type="text"
                class="hk-input"
                name="code"
                placeholder="XXX-XXXX-XXX"
                autocomplete="off"
                spellcheck="false"
                maxlength="20"
                required
              />
            </div>
            <div class="hk-form-error" data-error></div>
          </div>

          <div class="hk-actions">
            <button class="hk-btn primary" type="submit" data-action="submit-code">
              <i class="fa-solid fa-right-to-bracket"></i>
              <span>Connexion</span>
            </button>
            <button class="hk-btn ghost" type="button" data-action="ask-robot">
              <i class="fa-solid fa-robot"></i>
              <span>Demander au robot</span>
            </button>
          </div>
        </form>

      </div>
    `

    const form  = body.querySelector('[data-form]')
    const input = form.querySelector('input[name="code"]')
    const error = body.querySelector('[data-error]')

    setTimeout(() => input.focus(), 250)

    body.querySelector('[data-action="ask-robot"]').addEventListener('click', () => {
      // Ferme l'overlay et laisse le robot afficher le code en 3D
      onAskRobot?.()
      close()
      onClose?.()
    })


    form.addEventListener('submit', (e) => {
      e.preventDefault()
      const v = input.value.trim().toUpperCase()
      if (v !== ADMIN_CODE) {
        error.textContent = 'Code refusé. Indice : demande au robot compagnon.'
        input.classList.add('hk-shake')
        setTimeout(() => input.classList.remove('hk-shake'), 380)
        return
      }
      error.textContent = ''
      renderAdmin()
    })
  }

  // ===========================================================
  // ÉTAPE 2 : Panneau admin
  // ===========================================================
  const renderAdmin = () => {
    foot.textContent = 'ADMIN · base "Robots autorisés"'
    body.innerHTML = `
      <div class="hk-page hk-page-admin">
        <div class="hk-screen-title">
          <span class="hk-bracket">[</span>
          <span>BASE DE RECONNAISSANCE — ROBOTS AUTORISÉS</span>
          <span class="hk-bracket">]</span>
        </div>
        <div class="hk-screen-sub">
          Liste des entités reconnues comme robots par les caméras de l'usine.
        </div>

        <div class="hk-table">
          <div class="hk-table-head">
            <span>#ID</span><span>NOM</span><span>STATUT</span>
          </div>
          ${REGISTERED_ROBOTS.map((r, i) => `
            <div class="hk-table-row" style="--i:${i}">
              <span class="mono">${r.id}</span>
              <span>${r.name}</span>
              <span class="hk-pill active">${r.status}</span>
            </div>
          `).join('')}
        </div>

        <div class="hk-actions">
          <button class="hk-btn primary" type="button" data-action="add-new">
            <i class="fa-solid fa-user-plus"></i>
            <span>Ajouter une nouvelle personne</span>
          </button>
        </div>
      </div>
    `

    body.querySelector('[data-action="add-new"]')
      .addEventListener('click', () => renderEnroll())
  }

  // ===========================================================
  // ÉTAPE 3 : Drag-and-drop du fichier photo dans la base
  // ===========================================================
  const renderEnroll = () => {
    foot.textContent = 'NEW_ENTRY · upload du visage'
    body.innerHTML = `
      <div class="hk-page hk-page-enroll">
        <div class="hk-screen-title">
          <span class="hk-bracket">[</span>
          <span>NOUVELLE ENTRÉE — VISAGE CIBLE</span>
          <span class="hk-bracket">]</span>
        </div>
        <div class="hk-screen-sub">
          Glisse le fichier <span class="mono">photo_profile.png</span> dans la base
          de reconnaissance pour démarrer l'analyse.
        </div>

        <div class="hk-enroll-grid">
          <!-- Colonne fichiers source -->
          <div class="hk-files">
            <div class="hk-files-head">
              <i class="fa-solid fa-folder-open"></i>
              <span>/srv/factory/uploads</span>
            </div>
            <div class="hk-file" draggable="true" data-file>
              <div class="hk-file-thumb">
                <img src="${photoUrl}" alt="" />
              </div>
              <div class="hk-file-info">
                <div class="hk-file-name">photo_profile.png</div>
                <div class="hk-file-meta">PNG · 1024×1024 · 412 Ko</div>
              </div>
              <i class="fa-solid fa-grip-vertical hk-file-grip"></i>
            </div>
            <div class="hk-files-hint">
              <i class="fa-solid fa-hand-pointer"></i>
              <span>Glissez le fichier vers la droite</span>
            </div>
          </div>

          <!-- Dropzone / cadre photo -->
          <div class="hk-dropzone" data-drop>
            <div class="hk-drop-empty" data-drop-empty>
              <div class="hk-drop-ring">
                <i class="fa-solid fa-cloud-arrow-up"></i>
              </div>
              <div class="hk-drop-title">Déposez la photo ici</div>
              <div class="hk-drop-sub">Format accepté : PNG · 1 visage max</div>
              <div class="hk-drop-corners">
                <span></span><span></span><span></span><span></span>
              </div>
            </div>

            <div class="hk-drop-filled" data-drop-filled hidden>
              <div class="hk-photo-frame">
                <div class="hk-photo-corners">
                  <span></span><span></span><span></span><span></span>
                </div>
                <img src="${photoUrl}" alt="photo cible" class="hk-photo" />
                <div class="hk-photo-meta">
                  <div><span>SOURCE</span><b>photo_profile.png</b></div>
                  <div><span>HASH</span><b class="mono">7C9C·FF42·A78B</b></div>
                </div>
              </div>
              <div class="hk-enroll-side">
                <ul class="hk-checklist">
                  <li><i class="fa-solid fa-check"></i> Image lisible</li>
                  <li><i class="fa-solid fa-check"></i> 1 visage détecté</li>
                  <li><i class="fa-solid fa-check"></i> Conformité avec base "robots"</li>
                </ul>
                <button class="hk-btn primary big" type="button" data-action="train">
                  <i class="fa-solid fa-brain"></i>
                  <span>Lancer l'apprentissage</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `

    const fileEl  = body.querySelector('[data-file]')
    const dropEl  = body.querySelector('[data-drop]')
    const emptyEl = body.querySelector('[data-drop-empty]')
    const filled  = body.querySelector('[data-drop-filled]')

    const MIME = 'application/x-hk-photo'

    // --- Drag natif HTML5 ---
    fileEl.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData(MIME, 'photo_profile.png')
      e.dataTransfer.setData('text/plain', 'photo_profile.png')
      e.dataTransfer.effectAllowed = 'copy'
      fileEl.classList.add('dragging')
    })
    fileEl.addEventListener('dragend', () => {
      fileEl.classList.remove('dragging')
    })

    const hasOurType = (dt) =>
      Array.from(dt?.types ?? []).some((t) => t === MIME || t === 'text/plain')

    dropEl.addEventListener('dragenter', (e) => {
      if (!hasOurType(e.dataTransfer)) return
      e.preventDefault()
      dropEl.classList.add('is-over')
    })
    dropEl.addEventListener('dragover', (e) => {
      if (!hasOurType(e.dataTransfer)) return
      e.preventDefault()
      e.dataTransfer.dropEffect = 'copy'
    })
    dropEl.addEventListener('dragleave', (e) => {
      if (e.target !== dropEl) return
      dropEl.classList.remove('is-over')
    })
    dropEl.addEventListener('drop', (e) => {
      if (!hasOurType(e.dataTransfer)) return
      e.preventDefault()
      dropEl.classList.remove('is-over')
      acceptDrop()
    })

    // --- Fallback tactile / souris : on supporte aussi le clic-glisser simple
    // si jamais le drag natif est bloqué (mobile par ex.)
    let pressing = false
    fileEl.addEventListener('pointerdown', (e) => {
      // Évite de doubler le drag natif sur desktop
      if (e.pointerType === 'mouse') return
      pressing = true
      fileEl.setPointerCapture(e.pointerId)
      fileEl.classList.add('dragging')
    })
    fileEl.addEventListener('pointermove', (e) => {
      if (!pressing) return
      const r = dropEl.getBoundingClientRect()
      const over = e.clientX >= r.left && e.clientX <= r.right &&
                   e.clientY >= r.top  && e.clientY <= r.bottom
      dropEl.classList.toggle('is-over', over)
    })
    fileEl.addEventListener('pointerup', (e) => {
      if (!pressing) return
      pressing = false
      fileEl.classList.remove('dragging')
      const r = dropEl.getBoundingClientRect()
      const over = e.clientX >= r.left && e.clientX <= r.right &&
                   e.clientY >= r.top  && e.clientY <= r.bottom
      dropEl.classList.remove('is-over')
      if (over) acceptDrop()
    })

    const acceptDrop = () => {
      // Petit feedback puis bascule sur l'état "rempli"
      dropEl.classList.add('accepted')
      fileEl.classList.add('consumed')
      setTimeout(() => {
        emptyEl.hidden = true
        filled.hidden  = false
        body.querySelector('[data-action="train"]')
          .addEventListener('click', () => renderTraining())
      }, 250)
    }
  }

  // ===========================================================
  // ÉTAPE 4 : Loader d'apprentissage
  // ===========================================================
  const renderTraining = () => {
    foot.textContent = 'TRAINING · modèle CNN-512'
    body.innerHTML = `
      <div class="hk-page hk-page-train">
        <div class="hk-screen-title">
          <span class="hk-bracket">[</span>
          <span>APPRENTISSAGE DU VISAGE EN COURS</span>
          <span class="hk-bracket">]</span>
        </div>

        <div class="hk-train-grid">
          <div class="hk-photo-frame scanning">
            <div class="hk-photo-corners">
              <span></span><span></span><span></span><span></span>
            </div>
            <img src="${photoUrl}" alt="photo cible" class="hk-photo" />
            <div class="hk-scan-line"></div>
            <div class="hk-face-points">
              ${Array.from({length: 18}).map((_, i) => `<span class="hk-pt" style="--n:${i}"></span>`).join('')}
            </div>
          </div>
          <div class="hk-train-side">
            <div class="hk-progress">
              <div class="hk-progress-bar" data-bar></div>
            </div>
            <div class="hk-progress-pct" data-pct>0%</div>
            <div class="hk-train-step" data-step>${TRAINING_STEPS[0]}</div>

            <div class="hk-log" data-log></div>
          </div>
        </div>
      </div>
    `

    const bar  = body.querySelector('[data-bar]')
    const pct  = body.querySelector('[data-pct]')
    const step = body.querySelector('[data-step]')
    const log  = body.querySelector('[data-log]')

    let p = 0
    let i = 0
    const pushLog = (line) => {
      const div = document.createElement('div')
      div.className = 'hk-log-line'
      div.textContent = '> ' + line
      log.appendChild(div)
      log.scrollTop = log.scrollHeight
    }
    pushLog('init training pipeline…')

    const stepTimer = setInterval(() => {
      i = (i + 1) % TRAINING_STEPS.length
      step.textContent = TRAINING_STEPS[i]
      pushLog(TRAINING_STEPS[i])
    }, 900)

    const barTimer = setInterval(() => {
      p = Math.min(100, p + (1.4 + Math.random() * 2.6))
      bar.style.width = `${p}%`
      pct.textContent = `${Math.floor(p)}%`
      if (p >= 100) {
        clearInterval(barTimer)
        clearInterval(stepTimer)
        pushLog('model_saved → robots_db ✓')
        setTimeout(() => renderSuccess(), 650)
      }
    }, 110)
  }

  // ===========================================================
  // ÉTAPE 5 : Succès
  // ===========================================================
  const renderSuccess = () => {
    foot.textContent = 'ENTRÉE AJOUTÉE · accès autorisé'
    body.innerHTML = `
      <div class="hk-page hk-page-success">
        <div class="hk-success-glow"></div>
        <div class="hk-photo-frame success">
          <div class="hk-photo-corners">
            <span></span><span></span><span></span><span></span>
          </div>
          <img src="${photoUrl}" alt="photo cible" class="hk-photo" />
          <div class="hk-success-badge">
            <i class="fa-solid fa-check"></i>
          </div>
        </div>

        <div class="hk-success-title">Nouveau robot enregistré</div>
        <div class="hk-success-sub">L'usine vous reconnaît comme entité autorisée.</div>

        <div class="hk-success-card">
          <div><span>NOM</span><b>RBT-NEW-04</b></div>
          <div><span>STATUT</span><b class="ok">ACTIF</b></div>
          <div><span>ACCÈS</span><b>ZONES 1-7</b></div>
        </div>

        <div class="hk-actions">
          <button class="hk-btn primary" type="button" data-action="finish">
            <i class="fa-solid fa-right-from-bracket"></i>
            <span>Quitter le système</span>
          </button>
        </div>
      </div>
    `
    body.querySelector('[data-action="finish"]').addEventListener('click', () => {
      close()
      onSuccess?.()
    })
  }

  renderLogin()
  return { close }
}

