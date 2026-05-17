import './introVideo.css'

/**
 * Affiche la vidéo d'intro en plein écran.
 * @param {string} src  - chemin de la vidéo (ex: '/videoIntro/introVideo.mp4')
 * @param {() => void} onDone - callback quand la vidéo se termine ou est skippée
 */
export function showIntroVideo(src, onDone) {
  const overlay = document.createElement('div')
  overlay.id = 'intro-video-overlay'

  overlay.innerHTML = `
    <video
      id="intro-video-el"
      src="${src}"
      autoplay
      playsinline
      preload="auto"
    ></video>
    <div class="iv-vignette"></div>
    <div class="iv-logo">BLACK<span class="iv-logo-accent">O</span>UT</div>
    <div class="iv-label">Introduction<span class="iv-label-dots"></span></div>
    <button class="iv-skip" aria-label="Passer l'intro" type="button">
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <polyline points="5 12 19 12" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <polyline points="13 6 19 12 13 18" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>
  `

  document.body.appendChild(overlay)
  requestAnimationFrame(() => overlay.classList.add('iv-visible'))

  const video = overlay.querySelector('#intro-video-el')
  const skipBtn = overlay.querySelector('.iv-skip')

  let done = false
  const finish = () => {
    if (done) return
    done = true
    overlay.classList.remove('iv-visible')
    overlay.classList.add('iv-closing')
    setTimeout(() => {
      overlay.remove()
      onDone?.()
    }, 600)
  }

  video.addEventListener('ended', finish)
  skipBtn.addEventListener('click', finish)

  video.play().catch(() => {
    // Si l'autoplay échoue (politique navigateur), on skip directement
    finish()
  })
}
