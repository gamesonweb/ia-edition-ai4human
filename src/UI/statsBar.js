import '@fortawesome/fontawesome-free/css/all.min.css'
import './statsBar.css'

const formatTime = (ms) => {
  const totalSec = Math.floor(ms / 1000)
  const min = Math.floor(totalSec / 60)
  const sec = totalSec % 60
  return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

export const setupStatsBar = ({ playerName = '' } = {}) => {
  const container = document.createElement('div')
  container.id = 'stats-bar'
  container.innerHTML = `
    <div class="stat-timer-row">
      <i class="fa-solid fa-clock stat-timer-icon"></i>
      <span class="stat-timer-value">00:00</span>
    </div>
    ${playerName ? `<div class="stat-player-name">${playerName}</div>` : ''}
  `
  document.body.appendChild(container)

  const valueEl = container.querySelector('.stat-timer-value')

  const startTime = Date.now()
  const timerId = setInterval(() => {
    valueEl.textContent = formatTime(Date.now() - startTime)
  }, 1000)

  return {
    element: container,
    setValue: () => {},
    getTime:  () => Date.now() - startTime,
    stopTimer: () => clearInterval(timerId),
  }
}
