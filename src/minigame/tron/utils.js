export function fmtMs(ms) {
  const m  = Math.floor(ms / 60000);
  const s  = Math.floor((ms % 60000) / 1000);
  const cs = Math.floor((ms % 1000) / 10);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
}

const TOAST_TYPES = {
  danger:     { color: '#ff1a1a', icon: 'fa-solid fa-skull' },
  success:    { color: '#00ff88', icon: 'fa-solid fa-circle-check' },
  checkpoint: { color: '#cc44ff', icon: 'fa-solid fa-flag-checkered' },
  lap:        { color: '#ffcc00', icon: 'fa-solid fa-stopwatch' },
  record:     { color: '#ff8c00', icon: 'fa-solid fa-circle-dot' },
  info:       { color: '#00f0ff', icon: 'fa-solid fa-chevron-right' },
}

function detectType(msg) {
  const m = msg.toUpperCase()
  if (m.includes('ÉLIMINÉ') || m.includes('DÉFAITE') || m.includes('TROP COURT') || m.includes('ANNULÉ')) return 'danger'
  if (m.includes('VICTOIRE') || m.includes('RESPAWN') || m.includes('SAUVEGARDÉ') || m.startsWith('✓')) return 'success'
  if (m.includes('CHECKPOINT')) return 'checkpoint'
  if (m.includes('TOUR ') || m.includes('MEILLEUR')) return 'lap'
  if (m.startsWith('⏺')) return 'record'
  return 'info'
}

// Toast container — unique, creates itself on first use
function getContainer() {
  let c = document.getElementById('tron-toast-container')
  if (!c) {
    c = document.createElement('div')
    c.id = 'tron-toast-container'
    document.body.appendChild(c)
  }
  return c
}

export function showRaceToast(msg, duration = 2500) {
  const container = getContainer()

  // If a toast with the same message is already showing, reset its timer
  for (const existing of container.children) {
    if (existing.dataset.msg === msg) {
      clearTimeout(existing._hideTimer)
      existing._hideTimer = setTimeout(() => dismissToast(existing), duration)
      existing.classList.remove('trt-exit')
      void existing.offsetWidth
      existing.classList.add('trt-bounce')
      setTimeout(() => existing.classList.remove('trt-bounce'), 400)
      return
    }
  }

  const type  = detectType(msg)
  const meta  = TOAST_TYPES[type]
  const toast = document.createElement('div')
  toast.className  = 'trt'
  toast.dataset.type = type
  toast.dataset.msg  = msg
  toast.innerHTML = `
    <span class="trt-accent"></span>
    <span class="trt-icon"><i class="${meta.icon}"></i></span>
    <span class="trt-text">${msg}</span>
  `
  toast.style.setProperty('--trt-color', meta.color)

  container.appendChild(toast)
  requestAnimationFrame(() => toast.classList.add('trt-show'))

  toast._hideTimer = setTimeout(() => dismissToast(toast), duration)
}

function dismissToast(toast) {
  if (!toast.isConnected) return
  toast.classList.add('trt-exit')
  toast.addEventListener('animationend', () => toast.remove(), { once: true })
  // Fallback if animationend doesn't fire
  setTimeout(() => toast.remove(), 600)
}

export function showCoordsToast(msg) {
  let el = document.getElementById('tron-coords-toast')
  if (!el) {
    el = document.createElement('div')
    el.id = 'tron-coords-toast'
    document.body.appendChild(el)
  }
  el.textContent = msg
  el.classList.remove('tct-hide')
  el.classList.add('tct-show')
  clearTimeout(el._hideTimer)
  el._hideTimer = setTimeout(() => {
    el.classList.remove('tct-show')
    el.classList.add('tct-hide')
  }, 3000)
}
