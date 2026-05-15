import './miniMap.css'

const MAP = {
  centerX: 5,
  centerZ: 140,
  scaleX:  200,
  scaleZ:  240,
  flipX: true,
  flipZ: false,
}

const worldToMapPercent = (x, z) => {
  const nx = (x - MAP.centerX) / MAP.scaleX
  const nz = (z - MAP.centerZ) / MAP.scaleZ
  const px = 50 + (MAP.flipX ? -nx : nx) * 50
  const py = 50 + (MAP.flipZ ? -nz : nz) * 50
  return { px, py }
}

export const setupMiniMap = () => {
  const container = document.createElement('div')
  container.id = 'mini-map'

  const mapImg = document.createElement('div')
  mapImg.classList.add('map-img')
  container.appendChild(mapImg)

  const player = document.createElement('div')
  player.classList.add('player')
  container.appendChild(player)

  const label = document.createElement('div')
  label.classList.add('label')
  label.textContent = 'M pour agrandir'
  container.appendChild(label)

  document.body.appendChild(container)

  const overlay = document.createElement('div')
  overlay.id = 'map-overlay'
  document.body.appendChild(overlay)

  const expanded = document.createElement('div')
  expanded.id = 'map-expanded'
  expanded.innerHTML = `
    <div class="full-img"></div>
    <div class="player-mark"></div>
    <div class="title">Carte</div>
    <button class="close" type="button" aria-label="Fermer">×</button>
  `
  document.body.appendChild(expanded)

  const expandedMark = expanded.querySelector('.player-mark')
  const closeBtn     = expanded.querySelector('.close')

  let isOpen = false
  const setOpen = (open) => {
    isOpen = open
    overlay.classList.toggle('open', isOpen)
    expanded.classList.toggle('open', isOpen)
  }
  const toggle = () => setOpen(!isOpen)

  closeBtn.addEventListener('click', () => setOpen(false))
  overlay .addEventListener('click', () => setOpen(false))
  container.addEventListener('click', () => { if (!isOpen) setOpen(true) })

  const onKey = (e) => {
    if (e.repeat) return
    const k = e.key.toLowerCase()
    if (k === 'm')      toggle()
    if (e.key === 'Escape' && isOpen) setOpen(false)
  }
  window.addEventListener('keydown', onKey)

  const update = (position, rotationY = 0) => {
    if (!position) return

    const { px, py } = worldToMapPercent(position.x, position.z)
    const deg = rotationY * 180 / Math.PI +180 
    const cx = Math.max(0, Math.min(100, px))
    const cy = Math.max(0, Math.min(100, py))
    mapImg.style.backgroundPosition = `${cx}% ${cy}%`
    player.style.transform = `rotate(${deg}deg)`

    if (isOpen) {
      expandedMark.style.left = `${cx}%`
      expandedMark.style.top  = `${cy}%`
      expandedMark.style.transform = `rotate(${deg}deg)`
    }
  }

  const dispose = () => {
    window.removeEventListener('keydown', onKey)
    container.remove()
    overlay.remove()
    expanded.remove()
  }

  return { element: container, update, toggle, dispose }
}
