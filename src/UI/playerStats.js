import '@fortawesome/fontawesome-free/css/all.min.css'
import './playerStats.css'

const ICONS = {
  shield: 'fa-solid fa-shield-halved',
  health: 'fa-solid fa-heart',
}

const clamp = (v, min, max) => Math.max(min, Math.min(max, v))

export const setupPlayerStats = ({ maxHealth = 100, maxShield = 100 } = {}) => {
  const container = document.createElement('div')
  container.id = 'player-stats'

  const makeRow = (kind) => {
    const row = document.createElement('div')
    row.classList.add('stat-row', kind)

    const icon = document.createElement('i')
    icon.className = `bar-icon ${ICONS[kind]}`

    const track = document.createElement('div')
    track.classList.add('bar-track')

    const fill = document.createElement('div')
    fill.classList.add('bar-fill')
    track.appendChild(fill)

    const value = document.createElement('div')
    value.classList.add('bar-value')
    value.textContent = '100'

    row.appendChild(icon)
    row.appendChild(track)
    row.appendChild(value)
    return { row, fill, value }
  }

  // Shield au-dessus, vie en dessous (ordre Fortnite)
  const shield = makeRow('shield')
  const health = makeRow('health')
  container.appendChild(shield.row)
  container.appendChild(health.row)
  document.body.appendChild(container)

  // Vignette rouge pleine-écran pour l'alerte dégâts (persistante — police)
  const vignette = document.createElement('div')
  vignette.id = 'damage-vignette'
  document.body.appendChild(vignette)

  // Flash one-shot quand le joueur reçoit des dégâts
  const hitFlash = document.createElement('div')
  hitFlash.id = 'damage-hit-flash'
  document.body.appendChild(hitFlash)

  let hitFlashTimer = null
  const triggerHitFlash = () => {
    hitFlash.classList.remove('active')
    void hitFlash.offsetWidth             // force reflow pour relancer l'animation
    hitFlash.classList.add('active')
    ;[health.value, shield.value].forEach(el => {
      el.classList.remove('hit')
      void el.offsetWidth
      el.classList.add('hit')
    })
    if (hitFlashTimer) clearTimeout(hitFlashTimer)
    hitFlashTimer = setTimeout(() => {
      hitFlash.classList.remove('active')
      health.value.classList.remove('hit')
      shield.value.classList.remove('hit')
    }, 400)
  }

  let h = maxHealth
  let s = maxShield
  let dead = false
  let invincible = false
  const callbacks = {}

  const renderHealth = () => {
    const pct = (h / maxHealth) * 100
    health.fill.style.width = `${pct}%`
    health.value.textContent = String(Math.round(h))
    health.row.classList.toggle('low', pct <= 25)
    health.row.classList.toggle('mid', pct > 25 && pct <= 50)

    if (h <= 0 && !dead) {
      dead = true
      callbacks.onDeath?.()
    } else if (h > 0 && dead) {
      dead = false
    }
  }

  const renderShield = () => {
    const pct = (s / maxShield) * 100
    shield.fill.style.width  = `${pct}%`
    shield.value.textContent = String(Math.round(s))
    shield.row.style.opacity = s <= 0 ? '0.45' : '1'
  }

  renderHealth()
  renderShield()

  return {
    element: container,
    setHealth: (v) => { h = clamp(v, 0, maxHealth); renderHealth() },
    setShield: (v) => { s = clamp(v, 0, maxShield); renderShield() },
    setInvincible: (v) => { invincible = v },
    damage:    (amount) => {
      if (invincible || amount <= 0) return
      let dmg = amount
      if (s > 0) { const absorbed = Math.min(s, dmg); s -= absorbed; dmg -= absorbed; renderShield() }
      if (dmg > 0) { h = clamp(h - dmg, 0, maxHealth); renderHealth() }
      triggerHitFlash()
    },
    heal:    (amount) => { h = clamp(h + amount, 0, maxHealth); renderHealth() },
    recharge:(amount) => { s = clamp(s + amount, 0, maxShield); renderShield() },
    setAlert: (active) => {
      vignette.classList.toggle('active', active)
      health.value.classList.toggle('alert', active)
      shield.value.classList.toggle('alert', active && s > 0)
    },
    setOnDeath: (fn) => { callbacks.onDeath = fn },
    isDead: () => dead,
    getHealth: () => h,
    getShield: () => s,
    dispose:   () => { container.remove(); vignette.remove(); hitFlash.remove() },
  }
}
