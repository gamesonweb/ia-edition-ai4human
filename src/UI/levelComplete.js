import './levelComplete.css'

const CONFETTI_COLORS = [
  '#67E8F9', '#7C9CFF', '#A78BFA',
  '#F472B6', '#34D399', '#FBBF24',
  '#fff',
]

function startConfetti(canvas) {
  const ctx    = canvas.getContext('2d')
  let running  = true
  let raf      = 0
  let W = 0, H = 0
  const particles = []

  const resize = () => {
    W = canvas.width  = window.innerWidth
    H = canvas.height = window.innerHeight
  }
  resize()
  window.addEventListener('resize', resize)

  const spawn = (n) => {
    for (let i = 0; i < n; i++) {
      particles.push({
        x:    Math.random() * W,
        y:    -10 - Math.random() * H * 0.3,
        vx:   (Math.random() - 0.5) * 3,
        vy:   2.5 + Math.random() * 3.5,
        w:    6 + Math.random() * 8,
        h:    4 + Math.random() * 5,
        rot:  Math.random() * Math.PI * 2,
        dRot: (Math.random() - 0.5) * 0.18,
        color: CONFETTI_COLORS[(Math.random() * CONFETTI_COLORS.length) | 0],
        alpha: 0.85 + Math.random() * 0.15,
      })
    }
  }
  spawn(160)

  let last = performance.now()
  const step = (t) => {
    if (!running) return
    const dt = Math.min(40, t - last) / 16.67
    last = t

    ctx.clearRect(0, 0, W, H)

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i]
      p.x   += p.vx * dt
      p.y   += p.vy * dt
      p.rot += p.dRot * dt
      p.vx  += (Math.random() - 0.5) * 0.15 * dt

      if (p.y > H + 20) { particles.splice(i, 1); continue }

      ctx.save()
      ctx.globalAlpha = p.alpha
      ctx.translate(p.x, p.y)
      ctx.rotate(p.rot)
      ctx.fillStyle = p.color
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h)
      ctx.restore()
    }

    raf = requestAnimationFrame(step)
  }
  raf = requestAnimationFrame(step)

  return () => {
    running = false
    cancelAnimationFrame(raf)
    window.removeEventListener('resize', resize)
  }
}

/**
 * Affiche l'overlay "manche terminée" avec confetti.
 * @param {{ title?: string, subtitle?: string, duration?: number }} opts
 */
export function showLevelComplete({ label = 'Manche', title = 'Manche terminée', subtitle = '', duration = 3500 } = {}) {
  document.getElementById('level-complete-overlay')?.remove()

  const overlay = document.createElement('div')
  overlay.id = 'level-complete-overlay'

  overlay.innerHTML = `
    <canvas class="lc-confetti"></canvas>
    <div class="lc-content">
      ${label ? `<div class="lc-label">${label}</div>` : ''}
      <div class="lc-title">${title}</div>
      ${subtitle ? `<div class="lc-subtitle">${subtitle}</div>` : ''}
      <div class="lc-next">Chargement de la prochaine manche…</div>
    </div>
  `

  document.body.appendChild(overlay)
  requestAnimationFrame(() => overlay.classList.add('open'))

  const stopConfetti = startConfetti(overlay.querySelector('.lc-confetti'))

  setTimeout(() => {
    stopConfetti()
    overlay.classList.add('closing')
    setTimeout(() => overlay.remove(), 650)
  }, duration)
}
