import '@fortawesome/fontawesome-free/css/all.min.css'
import './deathScreen.css'

export const setupDeathScreen = ({ onRespawn } = {}) => {
  const overlay = document.createElement('div')
  overlay.id = 'death-screen'
  overlay.innerHTML = `
    <div class="label">Statut</div>
    <div class="title">Éliminé</div>
    <div class="subtitle">Vous avez succombé à vos blessures</div>
    <button class="respawn" type="button">
      <i class="fa-solid fa-rotate-right"></i>
      <span>Réapparaître</span>
    </button>
  `
  document.body.appendChild(overlay)

  const respawnBtn = overlay.querySelector('.respawn')

  let isOpen = false
  let onRespawnCb = onRespawn

  const setOpen = (open) => {
    isOpen = open
    overlay.classList.toggle('open', isOpen)
  }

  respawnBtn.addEventListener('click', () => {
    setOpen(false)
    onRespawnCb?.()
  })

  return {
    element: overlay,
    show: () => setOpen(true),
    hide: () => setOpen(false),
    isOpen: () => isOpen,
    setOnRespawn: (fn) => { onRespawnCb = fn },
    dispose: () => overlay.remove(),
  }
}
