import '@fortawesome/fontawesome-free/css/all.min.css'
import './hackingOverlay.css'
import './wantedOverlay.css'

const WANTED_PERSONS = [
  {
    id:      'R-7X2',
    name:    'SENTINEL-7',
    type:    'ia',
    threat:  'critique',
    photo:   null,
  },
  {
    id:      'J-001',
    name:    'Jacob Martin',
    type:    'human',
    threat:  'haute',
    photo:   '/img/photoProfile/jacob.jpg',
    details: {
      poste:  'Développeur — Université Nice Côte d\'Azur',
      motif:  'Résistance au protocole IA-CONTROL-7 · Sabotage du réseau de surveillance',
      statut: 'RECHERCHÉ · PRIORITÉ HAUTE',
      zone:   'Dernière position : Secteur B / Zone industrielle',
    },
  },
  {
    id:     'R-4A1',
    name:   'UNIT-TRACKER',
    type:   'ia',
    threat: 'moderee',
    photo:  null,
  },
  {
    id:      'G-002',
    name:    'George A.J',
    type:    'human',
    threat:  'haute',
    photo:   '/img/photoProfile/george.png',
    details: {
      poste:  'Ingénieur réseau — Université Nice Côte d\'Azur',
      motif:  'Complicité avec J-001 · Intrusion dans les serveurs IA-CONTROL',
      statut: 'RECHERCHÉ · PRIORITÉ HAUTE',
      zone:   'Dernière position : Secteur C / District universitaire',
    },
  },
  {
    id:     'R-9Z3',
    name:   'DROID-9',
    type:   'ia',
    threat: 'critique',
    photo:  null,
  },
]

const THREAT_LABEL = { critique: 'CRITIQUE', haute: 'HAUTE', moderee: 'MODÉRÉE' }
const HUMANS = WANTED_PERSONS.filter(p => p.type === 'human')

export function showWantedOverlay({ onClose, onSuccess } = {}) {
  document.getElementById('wanted-overlay')?.remove()

  // Suivi des déverrouillages pour cette session
  const unlockedIds = new Set()

  const overlay = document.createElement('div')
  overlay.id = 'wanted-overlay'
  overlay.innerHTML = `
    <div class="hk-bg"></div>
    <div class="hk-scanlines"></div>
    <div class="hk-window">
      <header class="hk-header">
        <div class="hk-dots"><span></span><span></span><span></span></div>
        <div class="hk-title">
          <i class="fa-solid fa-triangle-exclamation"></i>
          <span>IA-CONTROL · PERSONNES RECHERCHÉES v2.1</span>
        </div>
        <button class="hk-close" data-action="close" aria-label="Fermer">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </header>
      <div class="hk-body" data-body></div>
      <footer class="hk-foot">
        <span class="hk-foot-dot"></span>
        <span data-foot>SECURE_LINK · SURVEILLANCE_NET · 10.0.0.1</span>
      </footer>
    </div>
  `

  document.body.appendChild(overlay)
  requestAnimationFrame(() => overlay.classList.add('open'))

  const body = overlay.querySelector('[data-body]')
  const foot = overlay.querySelector('[data-foot]')

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

  // ── Page 1 : liste ───────────────────────────────────────────────────────
  const renderList = () => {
    const remaining = HUMANS.filter(p => !unlockedIds.has(p.id)).length
    foot.textContent = `ACCÈS · base "Personnes recherchées" · ${WANTED_PERSONS.length} entrées · ${remaining} humain(s) à déverrouiller`

    body.innerHTML = `
      <div class="hk-page">
        <div class="hk-screen-title">
          <span class="hk-bracket">[</span>
          <span>BASE DE SURVEILLANCE — INDIVIDUS CIBLÉS</span>
          <span class="hk-bracket">]</span>
        </div>
        <div class="hk-screen-sub">
          Déverrouillez les ${HUMANS.length} individus humains pour terminer l'opération.
        </div>
        <div class="wd-list">
          ${WANTED_PERSONS.map((p, i) => {
            const unlocked = unlockedIds.has(p.id)
            return `
              <div class="wd-card ${p.type === 'human' ? 'human' : ''} ${unlocked ? 'unlocked' : ''}" style="--i:${i}" data-id="${p.id}">
                <div class="wd-avatar">
                  ${p.photo
                    ? `<img src="${p.photo}" alt="${p.name}" />`
                    : `<i class="fa-solid fa-robot"></i>`}
                </div>
                <div class="wd-info">
                  <div class="wd-id">${p.id}</div>
                  <div class="wd-name">${p.name}</div>
                  <div class="wd-badges">
                    ${unlocked
                      ? '<span class="wd-badge unlocked-tag"><i class="fa-solid fa-lock-open"></i> DÉVERROUILLÉ</span>'
                      : `<span class="wd-badge ${p.threat}">${THREAT_LABEL[p.threat]}</span>
                         ${p.type === 'human' ? '<span class="wd-badge human-tag">⚠ HUMAIN</span>' : '<span class="wd-badge moderee" style="opacity:0.55">IA</span>'}`
                    }
                  </div>
                </div>
                ${p.type === 'human' && !unlocked
                  ? `<button class="hk-btn primary details-btn" data-id="${p.id}">
                       <i class="fa-solid fa-eye"></i>
                       <span>Détails</span>
                     </button>`
                  : p.type === 'human'
                    ? `<span class="wd-done-badge"><i class="fa-solid fa-circle-check"></i></span>`
                    : `<button class="hk-btn ghost details-btn" data-id="${p.id}">
                         <i class="fa-solid fa-eye"></i>
                         <span>Détails</span>
                       </button>`
                }
              </div>
            `
          }).join('')}
        </div>
      </div>
    `
    body.querySelectorAll('.details-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const person = WANTED_PERSONS.find(p => p.id === btn.dataset.id)
        if (person) renderDetail(person)
      })
    })
  }

  // ── Page 2 : fiche détaillée ─────────────────────────────────────────────
  const renderDetail = (person) => {
    foot.textContent = `FICHE DÉTAILLÉE · ${person.id} · ${person.name.toUpperCase()}`

    if (person.type !== 'human') {
      body.innerHTML = `
        <div class="hk-page">
          <div class="hk-screen-title">
            <span class="hk-bracket">[</span>
            <span>FICHE — ${person.id}</span>
            <span class="hk-bracket">]</span>
          </div>
          <div class="hk-screen-sub">Unité IA — aucune action de déverrouillage disponible.</div>
          <div class="hk-actions" style="margin-top:16px">
            <button class="hk-btn ghost" data-action="back">
              <i class="fa-solid fa-arrow-left"></i><span>Retour</span>
            </button>
          </div>
        </div>
      `
      body.querySelector('[data-action="back"]').addEventListener('click', renderList)
      return
    }

    const d = person.details
    body.innerHTML = `
      <div class="hk-page">
        <div class="hk-screen-title">
          <span class="hk-bracket">[</span>
          <span>FICHE DÉTAILLÉE — ${person.id}</span>
          <span class="hk-bracket">]</span>
        </div>

        <div class="wd-detail-grid">
          <div class="wd-detail-photo">
            <img src="${person.photo}" alt="${person.name}" />
            <div class="wd-scan-line"></div>
          </div>

          <div class="wd-detail-fields">
            <div class="wd-field">
              <div class="wd-field-label">Nom complet</div>
              <div class="wd-field-value">${person.name}</div>
            </div>
            <div class="wd-field">
              <div class="wd-field-label">Statut</div>
              <div class="wd-field-value danger">${d.statut}</div>
            </div>
            <div class="wd-field">
              <div class="wd-field-label">Ancien poste</div>
              <div class="wd-field-value university">${d.poste}</div>
            </div>
            <div class="wd-field">
              <div class="wd-field-label">Motif de recherche</div>
              <div class="wd-field-value" style="color:rgba(255,255,255,0.75);font-size:12px">${d.motif}</div>
            </div>
            <div class="wd-field">
              <div class="wd-field-label">Localisation</div>
              <div class="wd-field-value" style="color:rgba(199,210,254,0.7);font-size:12px">${d.zone}</div>
            </div>
          </div>
        </div>

        <div class="hk-actions" style="margin-top: 8px">
          <button class="hk-btn ghost" data-action="back">
            <i class="fa-solid fa-arrow-left"></i><span>Retour</span>
          </button>
          <button class="hk-btn primary" data-action="unlock">
            <i class="fa-solid fa-lock-open"></i>
            <span>Déverrouiller du système</span>
          </button>
        </div>
      </div>
    `

    body.querySelector('[data-action="back"]').addEventListener('click', renderList)
    body.querySelector('[data-action="unlock"]').addEventListener('click', () => {
      unlockedIds.add(person.id)
      renderUnlockSuccess(person)
    })
  }

  // ── Page 3 : confirmation déverrouillage ──────────────────────────────────
  const renderUnlockSuccess = (person) => {
    const allDone = HUMANS.every(p => unlockedIds.has(p.id))
    foot.textContent = allDone
      ? 'OPÉRATION TERMINÉE · tous les individus déverrouillés'
      : `DÉVERROUILLAGE · ${person.name} retiré · ${HUMANS.length - unlockedIds.size} restant(s)`

    body.innerHTML = `
      <div class="hk-page hk-page-success">
        <div class="hk-success-glow" style="background:radial-gradient(closest-side,rgba(251,191,36,0.2),transparent 70%)"></div>
        <div class="wd-success-icon">
          <i class="fa-solid fa-lock-open"></i>
        </div>
        <div class="hk-success-title" style="color:#FCD34D;text-shadow:0 0 18px rgba(251,191,36,0.4)">
          ${person.name} déverrouillé
        </div>
        <div class="hk-success-sub">
          Retiré de la liste de surveillance du système IA-CONTROL.
        </div>
        <div class="hk-success-card" style="border-color:rgba(251,191,36,0.3);max-width:380px">
          <div><span>INDIVIDU</span><b>${person.name} · ${person.id}</b></div>
          <div><span>ANCIEN POSTE</span><b style="color:#67E8F9">${person.details.poste}</b></div>
          <div><span>STATUT</span><b class="ok">DÉVERROUILLÉ ✓</b></div>
        </div>
        ${allDone ? `
        <div class="wd-all-done">
          <i class="fa-solid fa-circle-check"></i>
          <span>Tous les individus ont été déverrouillés du système.</span>
        </div>` : `
        <div class="wd-remaining">
          <i class="fa-solid fa-hourglass-half"></i>
          <span>${HUMANS.length - unlockedIds.size} individu(s) encore dans le système — retournez à la liste.</span>
        </div>`}
        <div class="hk-actions">
          ${allDone
            ? `<button class="hk-btn primary" data-action="finish">
                 <i class="fa-solid fa-right-from-bracket"></i>
                 <span>Quitter le système</span>
               </button>`
            : `<button class="hk-btn ghost" data-action="back-list">
                 <i class="fa-solid fa-arrow-left"></i>
                 <span>Retour à la liste</span>
               </button>`
          }
        </div>
      </div>
    `

    if (allDone) {
      body.querySelector('[data-action="finish"]').addEventListener('click', () => {
        close()
        onSuccess?.()
      })
    } else {
      body.querySelector('[data-action="back-list"]').addEventListener('click', renderList)
    }
  }

  renderList()
  return { close }
}
