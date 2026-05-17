import '@fortawesome/fontawesome-free/css/all.min.css'
import './endScreen.css'

const CREATORS = [
  { name: 'Akira',     timeMs: 11 * 60 * 1000 + 37 * 1000 }, // 11:37
  { name: 'Jeremy',   timeMs: 14 * 60 * 1000 + 21 * 1000 }, // 14:21
  { name: 'Alexander', timeMs: 17 * 60 * 1000 + 59 * 1000 }, // 17:59
]

const fmt = (ms) => {
  const s = Math.floor(ms / 1000)
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

const HUD_SELECTORS = [
  '#compass', '#crosshair', '#mini-map', '#map-expanded',
  '#player-stats', '#damage-vignette', '#damage-hit-flash',
  '#stats-bar', '#notifications', '#pause-btn', '#gfx-btn',
  '#teleport-btn', '#key-hints', '#position-display', '#game-timer', '#top-vignette',
]

export function showEndScreen({ playerTimeMs = 0, scene } = {}) {
  const playerName = scene?.metadata?.playerName ?? 'Joueur'
  if (scene?.metadata) scene.metadata.paused = true

  HUD_SELECTORS.forEach(sel => {
    const el = document.querySelector(sel)
    if (el) el.style.display = 'none'
  })

  // Classement : créateurs + joueur, triés par temps croissant
  const entries = [
    ...CREATORS.map(c => ({ ...c, isCreator: true })),
    { name: playerName, timeMs: playerTimeMs, isCreator: false },
  ].sort((a, b) => a.timeMs - b.timeMs)

  const rows = entries.map((entry, i) => {
    const rankClass  = i === 0 ? 'es-row-rank--gold' : i === 1 ? 'es-row-rank--silver' : i === 2 ? 'es-row-rank--bronze' : ''
    const rowClass   = entry.isCreator ? 'es-row--creator' : 'es-row--player'
    const badge      = entry.isCreator ? `<span class="es-row-badge">Créateur</span>` : ''
    return `
      <div class="es-row ${rowClass}">
        <span class="es-row-rank ${rankClass}">${i + 1}</span>
        <span class="es-row-name">${entry.name}${badge}</span>
        <span class="es-row-time">${fmt(entry.timeMs)}</span>
      </div>`
  }).join('')

  const bestCreator = CREATORS.reduce((a, b) => a.timeMs < b.timeMs ? a : b)
  const faster      = playerTimeMs < bestCreator.timeMs
  const diff        = Math.abs(playerTimeMs - bestCreator.timeMs)
  const diffStr     = fmt(diff)

  const diffLabel = faster
    ? `<i class="fa-solid fa-bolt"></i> ${diffStr} plus rapide que tous les créateurs !`
    : playerTimeMs === bestCreator.timeMs
      ? `<i class="fa-solid fa-handshake"></i> Même temps que le meilleur créateur !`
      : `<i class="fa-solid fa-clock"></i> ${diffStr} de plus que le meilleur créateur`

  const overlay = document.createElement('div')
  overlay.id = 'end-screen-overlay'
  overlay.innerHTML = `
    <div class="es-bar es-bar-top"></div>
    <div class="es-mid">
      <div class="es-title-card" data-title>
        <div class="es-title-main">Fin de jeu</div>
        <div class="es-title-sep"></div>
        <div class="es-title-sub">Merci d'avoir joué à notre jeu</div>
      </div>
      <div class="es-board" data-board>
        <div class="es-board-header">
          <i class="fa-solid fa-ranking-star"></i>
          Classement final
        </div>
        <div class="es-board-rows">${rows}</div>
        <div class="es-board-diff ${faster ? 'es-diff--win' : 'es-diff--lose'}">${diffLabel}</div>
      </div>
      <button class="es-home-btn" data-home-btn>
        <i class="fa-solid fa-house"></i>
        Retour au menu
      </button>
    </div>
    <div class="es-bar es-bar-bottom"></div>
  `
  document.body.appendChild(overlay)

  requestAnimationFrame(() => {
    overlay.classList.add('es-visible')
    const titleEl = overlay.querySelector('[data-title]')
    if (titleEl) requestAnimationFrame(() => titleEl.classList.add('es-title-visible'))

    const boardEl  = overlay.querySelector('[data-board]')
    const homeBtnEl = overlay.querySelector('[data-home-btn]')
    setTimeout(() => {
      boardEl?.classList.add('es-board-visible')
      homeBtnEl?.classList.add('es-home-btn--visible')
    }, 2800)

    homeBtnEl?.addEventListener('click', () => {
      for (let i = 1; i <= 9; i++) sessionStorage.removeItem(`cs_done_${i}`)
      window.location.reload()
    })
  })
}
