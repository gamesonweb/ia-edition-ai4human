import './outroVideo.css'

const HUD_SELECTORS = [
  '#compass', '#crosshair', '#mini-map', '#map-expanded',
  '#player-stats', '#damage-vignette', '#damage-hit-flash',
  '#stats-bar', '#notifications', '#pause-btn', '#gfx-btn',
  '#teleport-btn', '#key-hints', '#position-display', '#game-timer', '#top-vignette',
]

export function showOutroVideo(src, onDone) {
  HUD_SELECTORS.forEach(sel => {
    const el = document.querySelector(sel)
    if (el) el.style.display = 'none'
  })

  const overlay = document.createElement('div')
  overlay.id = 'outro-video-overlay'
  overlay.innerHTML = `
    <video
      id="outro-video-el"
      src="${src}"
      autoplay
      playsinline
      preload="auto"
    ></video>
    <div class="ov-vignette"></div>
    <div class="ov-logo">BLACK<span class="ov-logo-accent">O</span>UT</div>
    <div class="ov-label">Épilogue<span class="ov-label-dots"></span></div>
    <button class="ov-skip" aria-label="Passer l'épilogue" type="button">
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <polyline points="5 12 19 12" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <polyline points="13 6 19 12 13 18" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>
  `
  document.body.appendChild(overlay)
  requestAnimationFrame(() => overlay.classList.add('ov-visible'))

  const video  = overlay.querySelector('#outro-video-el')
  const skipBtn = overlay.querySelector('.ov-skip')

  let done = false
  const finish = () => {
    if (done) return
    done = true
    overlay.classList.remove('ov-visible')
    overlay.classList.add('ov-closing')
    setTimeout(() => { overlay.remove(); onDone?.() }, 600)
  }

  video.addEventListener('ended', finish)
  skipBtn.addEventListener('click', finish)
  video.play().catch(() => finish())
}
