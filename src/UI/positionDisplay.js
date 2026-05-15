import './positionDisplay.css'

export const setupPositionDisplay = () => {
  const container = document.createElement('div')
  container.id = 'position-display'
  container.style.display = 'none'

  const makeRow = (axis) => {
    const row = document.createElement('div')
    row.classList.add('position-row')
    const label = document.createElement('span')
    label.classList.add('position-label')
    label.textContent = axis.toUpperCase()
    const value = document.createElement('span')
    value.classList.add('position-value')
    value.dataset.axis = axis
    value.textContent = '0.00'
    row.appendChild(label)
    row.appendChild(value)
    container.appendChild(row)
    return value
  }

  const xValue = makeRow('x')
  const yValue = makeRow('y')
  const zValue = makeRow('z')
  document.body.appendChild(container)

  let visible = false
  const toggle = () => {
    visible = !visible
    container.style.display = visible ? 'block' : 'none'
  }

  window.addEventListener('keydown', e => {
    if (e.repeat) return
    // P (debug position) — B est réservé aux interactions in-game (pickup/adopt/swap)
    if (e.key.toLowerCase() === 'p') toggle()
  })

  const update = (position) => {
    if (!visible) return
    xValue.textContent = position.x.toFixed(2)
    yValue.textContent = position.y.toFixed(2)
    zValue.textContent = position.z.toFixed(2)
  }

  return { update, toggle, element: container }
}
