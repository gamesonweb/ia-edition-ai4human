import './gameTimer.css'

let el        = null
let barFill   = null
let valueEl   = null
let totalSecs = 60

function ensure() {
  if (el) return
  el = document.createElement('div')
  el.id = 'game-timer'
  el.innerHTML = `
    <div class="gt-label">Temps restant</div>
    <div class="gt-value">1:00</div>
    <div class="gt-bar-track"><div class="gt-bar-fill"></div></div>
  `
  document.body.appendChild(el)
  valueEl = el.querySelector('.gt-value')
  barFill = el.querySelector('.gt-bar-fill')
}

function fmt(secs) {
  const s = Math.max(0, secs)
  const m = Math.floor(s / 60)
  const r = s % 60
  return m > 0
    ? `${m}:${String(r).padStart(2, '0')}`
    : `${r}s`
}

/**
 * Affiche et démarre le compteur.
 * @param {{ total?: number, label?: string }} opts
 */
export function showGameTimer({ total = 60, label = 'Temps restant' } = {}) {
  ensure()
  totalSecs = total
  el.querySelector('.gt-label').textContent = label
  valueEl.textContent = fmt(total)
  barFill.style.width = '100%'
  el.classList.remove('warning', 'danger')
  el.classList.add('visible')
}

/**
 * Met à jour le compteur avec les secondes restantes.
 * @param {number} remainSec
 */
export function updateGameTimer(remainSec) {
  if (!el) return
  valueEl.textContent = fmt(remainSec)
  const pct = Math.max(0, remainSec / totalSecs) * 100
  barFill.style.width = pct + '%'

  el.classList.toggle('warning', remainSec <= 15 && remainSec > 5)
  el.classList.toggle('danger',  remainSec <= 5)
}

/**
 * Cache et supprime le compteur.
 */
export function hideGameTimer() {
  if (!el) return
  el.classList.remove('visible')
  setTimeout(() => {
    el?.remove()
    el = null
    barFill = null
    valueEl = null
  }, 350)
}
