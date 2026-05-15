import '@fortawesome/fontawesome-free/css/all.min.css'
import './adoptModal.css'

const SEQUENCE = ['UP', 'RIGHT', 'RIGHT', 'DOWN', 'UP', 'LEFT', 'DOWN', 'LEFT', 'LEFT', 'UP']
const KEY_MAP = {
  ArrowUp:    'UP',
  ArrowRight: 'RIGHT',
  ArrowDown:  'DOWN',
  ArrowLeft:  'LEFT',
}
const ARROW_ICON = { UP: 'up', RIGHT: 'right', DOWN: 'down', LEFT: 'left' }

/**
 * Affiche la modale d'adoption : le joueur doit reproduire la combinaison
 * de flèches affichée. Mauvaise touche → reset + shake.
 *
 * @param {{ onComplete?: () => void, onCancel?: () => void }} [opts]
 */
export function showAdoptModal({ onComplete, onCancel } = {}) {
  document.getElementById('adopt-modal')?.remove()

  const overlay = document.createElement('div')
  overlay.id = 'adopt-modal'

  overlay.innerHTML = `
    <div class="adopt-modal-panel">
      <div class="adopt-modal-title">
        <i class="fa-solid fa-heart"></i>
        Adopter le robot
      </div>
      <div class="adopt-modal-hint">
        Reproduisez la séquence avec les flèches du clavier.
      </div>

      <div class="adopt-modal-sequence">
        ${SEQUENCE.map((d, i) => `
          <div class="adopt-arrow" data-i="${i}">
            <i class="fa-solid fa-arrow-${ARROW_ICON[d]}"></i>
          </div>
        `).join('')}
      </div>

      <div class="adopt-modal-status"></div>

      <button class="adopt-modal-close" type="button" aria-label="Fermer">
        <i class="fa-solid fa-xmark"></i>
      </button>
    </div>
  `

  document.body.appendChild(overlay)
  requestAnimationFrame(() => overlay.classList.add('show'))

  const status = overlay.querySelector('.adopt-modal-status')
  const arrows = overlay.querySelectorAll('.adopt-arrow')

  let progress = 0
  let closed   = false
  let solved   = false

  const close = (reason) => {
    if (closed) return
    closed = true
    window.removeEventListener('keydown', onKey, true)
    overlay.classList.remove('show')
    setTimeout(() => overlay.remove(), 300)
    if (reason === 'cancel') onCancel?.()
  }

  overlay.querySelector('.adopt-modal-close')
    .addEventListener('click', () => close('cancel'))

  overlay.addEventListener('mousedown', (e) => e.stopPropagation())
  overlay.addEventListener('click',     (e) => e.stopPropagation())

  const resetSequence = () => {
    progress = 0
    arrows.forEach(a => a.classList.remove('on', 'bad'))
  }

  const onKey = (e) => {
    if (closed || solved) return

    if (e.key === 'Escape') { e.preventDefault(); close('cancel'); return }

    const key = KEY_MAP[e.key]
    if (!key) return

    e.preventDefault()
    e.stopPropagation()

    if (key === SEQUENCE[progress]) {
      const a = overlay.querySelector(`.adopt-arrow[data-i="${progress}"]`)
      a?.classList.add('on')
      progress++
      status.className = 'adopt-modal-status'
      status.textContent = `${progress} / ${SEQUENCE.length}`

      if (progress >= SEQUENCE.length) {
        solved = true
        status.className   = 'adopt-modal-status success'
        status.textContent = 'Robot adopté !'
        setTimeout(() => {
          close('success')
          onComplete?.()
        }, 900)
      }
    } else {
      // mauvaise touche → flash rouge + reset
      arrows.forEach(a => a.classList.add('bad'))
      overlay.classList.add('shake')
      status.className   = 'adopt-modal-status error'
      status.textContent = 'Mauvaise combinaison — recommencez'
      setTimeout(() => {
        overlay.classList.remove('shake')
        resetSequence()
      }, 400)
    }
  }

  // Capture phase pour intercepter avant que d'autres handlers (ex. mouvement)
  // ne réagissent aux flèches du clavier.
  window.addEventListener('keydown', onKey, true)

  return { close: () => close('cancel'), element: overlay }
}
