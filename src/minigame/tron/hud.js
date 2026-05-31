import { t } from './i18n.js'

// Mapping interne des labels IA → clé i18n
const LEVEL_KEY = { 'FACILE': 'level.easy', 'MOYEN': 'level.medium', 'DIFFICILE': 'level.hard' }

export function setupTronHUD() {
  document.getElementById('tron-hud')?.remove()

  const hud = document.createElement('div')
  hud.id = 'tron-hud'
  hud.className = 'tron-hud'

  hud.innerHTML = `
    <div class="tron-corner tl"></div>
    <div class="tron-corner tr"></div>
    <div class="tron-corner bl"></div>
    <div class="tron-corner br"></div>

    <header class="tron-header">
      <h2 class="tron-title" data-i18n="hud.title">${t('hud.title')}</h2>
      <div class="tron-status">
        <span class="tron-status-dot"></span>
        <span data-i18n="hud.status">${t('hud.status')}</span>
      </div>
      <div class="tron-rec" id="tron-rec">● REC</div>
    </header>

    <section class="tron-race">
      <div class="tron-race-row">
        <span class="tron-race-label" data-i18n="hud.lap">${t('hud.lap')}</span>
        <span class="tron-race-val" id="tron-lap">1 / 3</span>
      </div>
      <div class="tron-race-row">
        <span class="tron-race-label" data-i18n="hud.time">${t('hud.time')}</span>
        <span class="tron-race-val" id="tron-timer">00:00.00</span>
      </div>
      <div class="tron-race-row">
        <span class="tron-race-label" data-i18n="hud.best">${t('hud.best')}</span>
        <span class="tron-race-val" id="tron-best">--:--.--</span>
      </div>
    </section>

    <div class="tron-standings" id="tron-standings">
      <div class="tron-standings-title" data-i18n="hud.standings">${t('hud.standings')}</div>
      <div class="tron-standings-list" id="tron-standings-list"></div>
    </div>

    <div class="tron-countdown" id="tron-countdown"></div>

    <div class="tron-finish" id="tron-finish">
      <div class="tron-finish-title" id="tron-finish-title">${t('hud.result')}</div>
      <div class="tron-finish-row">
        <span data-i18n="hud.total_time">${t('hud.total_time')}</span>
        <span id="tron-finish-total">00:00.00</span>
      </div>
      <div class="tron-finish-row">
        <span data-i18n="hud.best_lap">${t('hud.best_lap')}</span>
        <span id="tron-finish-best">--:--.--</span>
      </div>
      <button class="tron-finish-btn" id="tron-finish-btn" data-i18n="hud.back">${t('hud.back')}</button>
    </div>

    <div class="tron-speedo">
      <svg viewBox="0 0 200 200" class="tron-gauge">
        <defs>
          <radialGradient id="tron-gauge-bg" cx="50%" cy="50%" r="50%">
            <stop offset="0%"  stop-color="rgba(0,30,50,0.55)"/>
            <stop offset="100%" stop-color="rgba(0,5,15,0.85)"/>
          </radialGradient>
        </defs>
        <circle cx="100" cy="100" r="92" fill="url(#tron-gauge-bg)" stroke="rgba(0,240,255,0.35)" stroke-width="1.2"/>
        <circle cx="100" cy="100" r="80" fill="none" stroke="rgba(0,240,255,0.18)" stroke-width="0.7"/>
        <g id="tron-gauge-ticks"></g>
        <g id="tron-gauge-labels" fill="rgba(0,240,255,0.75)" font-family="'Share Tech Mono', monospace" font-size="11" text-anchor="middle"></g>
        <line id="tron-gauge-needle" x1="100" y1="100" x2="100" y2="28"
              stroke="#00f0ff" stroke-width="2.5" stroke-linecap="round"
              style="filter: drop-shadow(0 0 6px #00f0ff); transform-origin: 100px 100px; transform: rotate(-135deg);"/>
        <circle cx="100" cy="100" r="7" fill="#00f0ff" style="filter: drop-shadow(0 0 8px #00f0ff);"/>
        <circle cx="100" cy="100" r="3" fill="#001b22"/>
      </svg>
      <div class="tron-speedo-val" id="tron-speed-val">0</div>
      <div class="tron-speedo-unit">KM/H</div>
    </div>

    <div class="tron-nav" id="tron-nav">
      <svg class="tron-nav-arrow" id="tron-nav-svg" viewBox="0 0 60 60">
        <polygon points="30,4 52,52 30,40 8,52" fill="#ff00cc" style="filter:drop-shadow(0 0 6px #ff00cc)"/>
      </svg>
      <div class="tron-nav-label" id="tron-nav-dist">-- m</div>
    </div>

    <footer class="tron-controls">
      <div class="tron-controls-title" data-i18n="hud.system">${t('hud.system')}</div>
      <div id="tron-ctrl-fwdbwd"></div>
      <div id="tron-ctrl-turn"></div>
      <div data-i18n="hud.trail_key">${t('hud.trail_key').replace('ESPACE', '<span class="tron-key">ESPACE</span>').replace('SPACE', '<span class="tron-key">SPACE</span>')}</div>
      <div data-i18n="hud.quit_key">${t('hud.quit_key').replace('ESC', '<span class="tron-key">ESC</span>')}</div>
    </footer>

    <div id="tron-trail-badge" data-i18n="hud.trail_badge">${t('hud.trail_badge')}</div>

    <div id="tron-death-overlay">
      <div class="tron-death-title" data-i18n="hud.eliminated">${t('hud.eliminated')}</div>
      <div class="tron-death-timer" id="tron-death-timer"></div>
    </div>
  `

  document.body.appendChild(hud)

  // Jauge vitesse
  const SPEED_MAX_KMH = 220
  const ANGLE_MIN     = -135
  const ANGLE_MAX     = 135
  const ticksEl  = hud.querySelector('#tron-gauge-ticks')
  const labelsEl = hud.querySelector('#tron-gauge-labels')
  const cx = 100, cy = 100
  for (let s = 0; s <= SPEED_MAX_KMH; s += 10) {
    const t_   = s / SPEED_MAX_KMH
    const ang  = (ANGLE_MIN + t_ * (ANGLE_MAX - ANGLE_MIN) - 90) * Math.PI / 180
    const major  = s % 20 === 0
    const rOuter = 88
    const rInner = major ? 76 : 82
    const x1 = cx + Math.cos(ang) * rInner
    const y1 = cy + Math.sin(ang) * rInner
    const x2 = cx + Math.cos(ang) * rOuter
    const y2 = cy + Math.sin(ang) * rOuter
    const stroke = major ? 'rgba(0,240,255,0.9)' : 'rgba(0,240,255,0.35)'
    const width  = major ? 2 : 1
    ticksEl.insertAdjacentHTML('beforeend',
      `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${width}" stroke-linecap="round"/>`)
    if (major) {
      const rLabel = 66
      const lx = cx + Math.cos(ang) * rLabel
      const ly = cy + Math.sin(ang) * rLabel + 4
      labelsEl.insertAdjacentHTML('beforeend', `<text x="${lx}" y="${ly}">${s}</text>`)
    }
  }

  const speedEl  = hud.querySelector('#tron-speed-val')
  const needleEl = hud.querySelector('#tron-gauge-needle')
  hud.setSpeed = (kmh) => {
    const v = Math.max(0, Math.min(SPEED_MAX_KMH, kmh))
    speedEl.textContent = v
    const ang = ANGLE_MIN + (v / SPEED_MAX_KMH) * (ANGLE_MAX - ANGLE_MIN)
    needleEl.style.transform = `rotate(${ang}deg)`
  }

  const lapEl         = hud.querySelector('#tron-lap')
  const timerEl       = hud.querySelector('#tron-timer')
  const bestEl        = hud.querySelector('#tron-best')
  const finishEl      = hud.querySelector('#tron-finish')
  const finishTitleEl = hud.querySelector('#tron-finish-title')
  const finishTotalEl = hud.querySelector('#tron-finish-total')
  const finishBestEl  = hud.querySelector('#tron-finish-best')
  const finishBtnEl   = hud.querySelector('#tron-finish-btn')
  const recEl         = hud.querySelector('#tron-rec')
  const navSvg        = hud.querySelector('#tron-nav-svg')
  const navDist       = hud.querySelector('#tron-nav-dist')
  const standingList  = hud.querySelector('#tron-standings-list')
  const ctrlFwdEl     = hud.querySelector('#tron-ctrl-fwdbwd')
  const ctrlTurnEl    = hud.querySelector('#tron-ctrl-turn')
  const trailBadge    = hud.querySelector('#tron-trail-badge')
  const deathOverlay  = hud.querySelector('#tron-death-overlay')
  const deathTimer    = hud.querySelector('#tron-death-timer')

  const fmt = (ms) => {
    if (ms == null) return '--:--.--'
    const total = Math.max(0, ms)
    const m  = Math.floor(total / 60000)
    const s  = Math.floor((total % 60000) / 1000)
    const cs = Math.floor((total % 1000) / 10)
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`
  }

  const key = (k) => `<span class="tron-key">${k.toUpperCase()}</span>`

  hud.setLayout = (layout) => {
    hud._layout = layout
    const isQwerty = layout === 'QWERTY'
    const fwd = isQwerty ? 'W' : 'Z'
    const lft = isQwerty ? 'A' : 'Q'
    ctrlFwdEl.innerHTML = `${t('hud.accel')} : ${key(fwd)} ${key('S')} / ${key('↑↓')}`
    ctrlTurnEl.innerHTML = `${t('hud.steer')} : ${key(lft)} ${key('D')} / ${key('←→')}`
  }

  // Met à jour tous les labels statiques traduits
  hud.refreshLang = (layout) => {
    for (const el of hud.querySelectorAll('[data-i18n]')) {
      const k = el.dataset.i18n
      if (k === 'hud.trail_key') {
        el.innerHTML = t(k).replace('ESPACE', key('ESPACE')).replace('SPACE', key('SPACE'))
      } else if (k === 'hud.quit_key') {
        el.innerHTML = t(k).replace('ESC', key('ESC'))
      } else {
        el.textContent = t(k)
      }
    }
    if (layout) hud.setLayout(layout)
  }

  hud.setLap       = (lap, total) => { lapEl.textContent = `${lap} / ${total}` }
  hud.setTimer     = (ms) => { timerEl.textContent = fmt(ms) }
  hud.setBestLap   = (ms) => { bestEl.textContent  = fmt(ms) }
  hud.setRecording = (on) => { recEl.style.display = on ? 'flex' : 'none' }

  hud.setStandings = (racers) => {
    standingList.innerHTML = racers.map((r, i) => {
      const isYou      = r.label === '__YOU__'
      const labelKey   = isYou ? 'hud.you' : (LEVEL_KEY[r.label] ?? null)
      const displayLbl = labelKey ? t(labelKey) : r.label
      return `<div class="tron-srow${isYou ? ' tron-srow-you' : ''}">`
        + `<span class="tron-spos">${i + 1}</span>`
        + `<span class="tron-sname">${displayLbl}</span>`
        + (r.finished ? '<span class="tron-sdone">✓</span>' : '')
        + '</div>'
    }).join('')
  }

  hud.setArrow = (angleDeg, distM) => {
    navSvg.style.transform = `rotate(${angleDeg}deg)`
    navDist.textContent    = distM < 1000
      ? `${Math.round(distM)} m`
      : `${(distM / 1000).toFixed(1)} km`
  }

  hud.showFinish = (totalMs, bestMs, isVictory = true, onBack) => {
    finishTitleEl.textContent = t(isVictory ? 'hud.victory' : 'hud.defeat')
    finishTitleEl.className   = 'tron-finish-title ' + (isVictory ? 'tron-finish-victory' : 'tron-finish-defeat')
    finishTotalEl.textContent = fmt(totalMs)
    finishBestEl.textContent  = fmt(bestMs)
    finishBtnEl.onclick       = () => onBack?.()
    finishEl.classList.add('show')
  }

  hud.setTrailActive = (active) => {
    trailBadge.classList.toggle('active', active)
  }

  hud.showDeath = (remainingSec) => {
    deathOverlay.classList.add('show')
    deathTimer.textContent = `RESPAWN ${remainingSec.toFixed(1)}s`
  }

  hud.hideDeath = () => { deathOverlay.classList.remove('show') }

  hud.dispose = () => {
    hud.remove()
  }

  return hud
}
