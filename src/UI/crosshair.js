import './crosshair.css'

export function setupCrosshair() {
  const dot = document.createElement('div')
  dot.id = 'crosshair'
  document.body.appendChild(dot)

  return {
    element: dot,
    show: () => { dot.style.display = 'block' },
    hide: () => { dot.style.display = 'none' },
    dispose: () => dot.remove(),
  }
}
