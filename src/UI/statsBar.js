import '@fortawesome/fontawesome-free/css/all.min.css'
import './statsBar.css'

const formatTime = (ms) => {
  const totalSec = Math.floor(ms / 1000)
  const min = Math.floor(totalSec / 60)
  const sec = totalSec % 60
  return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

export const setupStatsBar = () => {
  const container = document.createElement('div')
  container.id = 'stats-bar'

  const stats = [
    { iconClass: 'fa-solid fa-clock',  value: '00:00' },
    { iconClass: 'fa-solid fa-trophy', value: 1       },
    { iconClass: 'fa-solid fa-users',  value: 1       }
  ]

  const valueEls = []

  stats.forEach(stat => {
    const item = document.createElement('div')
    item.classList.add('stat-item')

    const circle = document.createElement('div')
    circle.classList.add('stat-circle')

    const icon = document.createElement('i')
    icon.className = stat.iconClass
    circle.appendChild(icon)

    const value = document.createElement('span')
    value.classList.add('stat-value')
    value.textContent = stat.value.toString()

    item.appendChild(circle)
    item.appendChild(value)
    container.appendChild(item)

    valueEls.push(value)
  })

  document.body.appendChild(container)

  // Démarre le compteur de temps dès que la barre est créée
  const startTime = Date.now()
  const timerId = setInterval(() => {
    valueEls[0].textContent = formatTime(Date.now() - startTime)
  }, 1000)

  return {
    element: container,
    setValue: (index, val) => {
      if (valueEls[index]) valueEls[index].textContent = val.toString()
    },
    stopTimer: () => clearInterval(timerId)
  }
}
