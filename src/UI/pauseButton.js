import '@fortawesome/fontawesome-free/css/all.min.css'
import './pauseButton.css'

export const setupPauseButton = (scene) => {
  const btn = document.createElement('button')
  btn.id = 'pause-btn'
  btn.type = 'button'
  btn.title = 'Pause (Échap)'
  btn.innerHTML = `<i class="icon fa-solid fa-pause"></i>`
  document.body.appendChild(btn)

  const overlay = document.createElement('div')
  overlay.id = 'pause-overlay'
  overlay.innerHTML = `
    <div class="title">Pause</div>
    <button class="resume" type="button">
      <i class="fa-solid fa-play"></i>
      <span>Reprendre</span>
    </button>
  `
  document.body.appendChild(overlay)

  const iconEl   = btn.querySelector('.icon')
  const resumeBtn = overlay.querySelector('.resume')

  if (!scene.metadata) scene.metadata = {}

  let paused = false
  const setPaused = (p) => {
    if (p === paused) return
    paused = p
    scene.metadata.paused = paused
    scene.animationsEnabled = !paused

    iconEl.classList.toggle('fa-pause', !paused)
    iconEl.classList.toggle('fa-play',  paused)
    overlay.classList.toggle('open', paused)

    if (paused && document.pointerLockElement) document.exitPointerLock()
  }
  const toggle = () => setPaused(!paused)

  btn.addEventListener('click', toggle)
  resumeBtn.addEventListener('click', () => setPaused(false))

  const onKey = (e) => {
    if (e.repeat) return
    if (e.key === 'Escape') {
      e.preventDefault()
      toggle()
    }
  }
  window.addEventListener('keydown', onKey)

  return {
    element: btn,
    toggle,
    pause:  () => setPaused(true),
    resume: () => setPaused(false),
    isPaused: () => paused,
    dispose: () => {
      window.removeEventListener('keydown', onKey)
      btn.remove()
      overlay.remove()
    },
  }
}
