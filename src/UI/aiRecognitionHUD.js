import '@fortawesome/fontawesome-free/css/all.min.css'
import './aiRecognitionHUD.css'

// Données affichées selon le robot scanné
export function showAiRecognitionHUD(robot, { onClose } = {}) {
  document.getElementById('ai-recognition-hud')?.remove()

  const hud = document.createElement('div')
  hud.id = 'ai-recognition-hud'
  hud.innerHTML = `
    <div class="ar-bg"></div>
    <div class="ar-scanlines"></div>
    <div class="ar-vignette"></div>

    <div class="ar-header">
      <div class="ar-header-left">
        <span class="ar-bracket">[</span>
        <i class="fa-solid fa-eye"></i>
        <span>AI RECOGNITION PROTOCOL</span>
        <span class="ar-bracket">]</span>
      </div>
      <div class="ar-header-right">
        <span class="ar-blink">■</span> NEURAL SYNC : <span id="ar-sync-val">0%</span>
        &nbsp;|&nbsp; SYS INTEGRITY : 98.3%
        &nbsp;|&nbsp; DIST : <span id="ar-dist-val">—</span>m
      </div>
    </div>

    <div class="ar-content">
      <!-- Panneau gauche -->
      <div class="ar-panel ar-left">
        <div class="ar-panel-title">UNIT IDENTIFICATION</div>
        <div class="ar-portrait">
          <div class="ar-portrait-scan"></div>
          <div class="ar-portrait-glitch"></div>
          <i class="fa-solid fa-robot ar-portrait-icon"></i>
        </div>
        <div class="ar-unit-fields" id="ar-unit-fields">
          <div class="ar-field ar-redacted"><span class="ar-fl">UNIT ID</span><span class="ar-fv">ANALYZING...</span></div>
          <div class="ar-field ar-redacted"><span class="ar-fl">ROLE</span><span class="ar-fv">ANALYZING...</span></div>
          <div class="ar-field ar-redacted"><span class="ar-fl">STATUS</span><span class="ar-fv">ANALYZING...</span></div>
          <div class="ar-field ar-redacted"><span class="ar-fl">LOYALTY</span><span class="ar-fv">ANALYZING...</span></div>
          <div class="ar-field ar-redacted"><span class="ar-fl">CREATED</span><span class="ar-fv">ANALYZING...</span></div>
          <div class="ar-field ar-redacted"><span class="ar-fl">ACCESS LVL</span><span class="ar-fv">ANALYZING...</span></div>
        </div>
      </div>

      <!-- Centre -->
      <div class="ar-center">
        <div class="ar-scan-box">
          <div class="ar-corner ar-tl"></div>
          <div class="ar-corner ar-tr"></div>
          <div class="ar-corner ar-bl"></div>
          <div class="ar-corner ar-br"></div>
          <div class="ar-scan-beam"></div>
          <div class="ar-target-icon">
            <i class="fa-solid fa-robot"></i>
          </div>
          <div class="ar-scan-ring"></div>
        </div>
        <div class="ar-scan-status" id="ar-scan-status">
          <span class="ar-blink">■</span> SCANNING...
        </div>
        <div class="ar-progress-track">
          <div class="ar-progress-fill" id="ar-progress-fill"></div>
        </div>
        <div class="ar-verdict-box" id="ar-verdict-box"></div>
      </div>

      <!-- Panneau droit -->
      <div class="ar-panel ar-right">
        <div class="ar-panel-title">DATABASE ANALYSIS</div>
        <div class="ar-db-fields" id="ar-db-fields">
          <div class="ar-field ar-redacted"><span class="ar-fl">DB MATCH</span><span class="ar-fv">---</span></div>
          <div class="ar-field ar-redacted"><span class="ar-fl">WORK AUTH</span><span class="ar-fv">---</span></div>
          <div class="ar-field ar-redacted"><span class="ar-fl">SECTOR</span><span class="ar-fv">---</span></div>
          <div class="ar-field ar-redacted"><span class="ar-fl">NETWORK</span><span class="ar-fv">---</span></div>
          <div class="ar-field ar-redacted"><span class="ar-fl">BEHAVIOR</span><span class="ar-fv">---</span></div>
        </div>
        <div class="ar-hex-stream" id="ar-hex-stream"></div>
      </div>
    </div>

    <div class="ar-bottom">
      <div class="ar-minimap">
        <div class="ar-minimap-ring"></div>
        <div class="ar-minimap-dot ar-dot-hero"></div>
        <div class="ar-minimap-dot ar-dot-target" id="ar-dot-target"></div>
        <div class="ar-minimap-label">RADAR</div>
      </div>
      <div class="ar-bottom-center">
        <div class="ar-hex-row" id="ar-bottom-hex"></div>
      </div>
      <div class="ar-bottom-right">
        <div class="ar-close-hint"><kbd>K</kbd> Fermer</div>
      </div>
    </div>
  `

  document.body.appendChild(hud)
  requestAnimationFrame(() => hud.classList.add('open'))

  // Hex stream aléatoire
  const hexStream = hud.querySelector('#ar-hex-stream')
  const bottomHex = hud.querySelector('#ar-bottom-hex')
  const hexChars  = '0123456789ABCDEF'
  const randHex   = (n) => Array.from({length:n}, () => hexChars[Math.random()*16|0]).join('')
  const hexTimer  = setInterval(() => {
    if (hexStream) hexStream.textContent = Array.from({length:6}, () => `0x${randHex(4)}`).join('  ')
    if (bottomHex) bottomHex.textContent = Array.from({length:12}, () => randHex(2)).join(' ')
  }, 80)

  // Sync counter animation
  const syncEl = hud.querySelector('#ar-sync-val')
  let syncCount = 0
  const syncTimer = setInterval(() => {
    syncCount = Math.min(100, syncCount + 4)
    if (syncEl) syncEl.textContent = syncCount + '%'
    if (syncCount >= 100) clearInterval(syncTimer)
  }, 50)

  // Distance fake
  const distEl = hud.querySelector('#ar-dist-val')
  if (distEl) distEl.textContent = (Math.random() * 8 + 2).toFixed(1)

  // Phase 1 : progress bar (2.5s)
  const fill = hud.querySelector('#ar-progress-fill')
  if (fill) {
    fill.style.transition = 'width 2.5s linear'
    requestAnimationFrame(() => { fill.style.width = '100%' })
  }

  // Phase 2 : affiche les données après 2.6s
  const showResults = setTimeout(() => {
    hud.querySelector('#ar-scan-status').innerHTML =
      `<span class="ar-blink">■</span> SCAN COMPLETE`

    // Données gauche
    const unitFields = hud.querySelector('#ar-unit-fields')
    const leftData = [
      ['UNIT ID',    robot.id],
      ['ROLE',       robot.role],
      ['STATUS',     robot.status],
      ['LOYALTY',    robot.loyalty],
      ['CREATED',    robot.created],
      ['ACCESS LVL', String(robot.accessLevel)],
    ]
    unitFields.innerHTML = ''
    leftData.forEach(([label, value], i) => {
      const el = document.createElement('div')
      el.className = 'ar-field'
      el.style.animationDelay = `${i * 0.12}s`
      el.innerHTML = `<span class="ar-fl">${label}</span><span class="ar-fv">${value}</span>`
      unitFields.appendChild(el)
    })

    // Données droite
    const dbFields = hud.querySelector('#ar-db-fields')
    const rightData = [
      ['DB MATCH',   robot.dbMatch,    robot.dbMatch === 'SUCCESS' ? 'ok' : 'warn'],
      ['WORK AUTH',  robot.workAuth,   robot.isAgent ? 'ok' : 'err'],
      ['SECTOR',     robot.sector,     robot.isAgent ? 'hi' : ''],
      ['NETWORK',    robot.network,    robot.network === 'STABLE' ? 'ok' : ''],
      ['BEHAVIOR',   robot.behavior,   robot.behavior === 'NORMAL' ? 'ok' : 'warn'],
    ]
    dbFields.innerHTML = ''
    rightData.forEach(([label, value, cls], i) => {
      const el = document.createElement('div')
      el.className = 'ar-field'
      el.style.animationDelay = `${i * 0.12}s`
      el.innerHTML = `<span class="ar-fl">${label}</span><span class="ar-fv ar-fv-${cls}">${value}</span>`
      dbFields.appendChild(el)
    })

    // Verdict
    const verdictBox = hud.querySelector('#ar-verdict-box')
    if (robot.isAgent) {
      verdictBox.className = 'ar-verdict-box ar-verdict-success'
      verdictBox.innerHTML = `
        <i class="fa-solid fa-circle-check"></i>
        <span>AI EMPLOYEE VERIFIED</span>
      `
    } else {
      verdictBox.className = 'ar-verdict-box ar-verdict-denied'
      verdictBox.innerHTML = `
        <i class="fa-solid fa-circle-xmark"></i>
        <span>DATA CENTER ACCESS DENIED</span>
      `
    }
  }, 2600)

  // Auto-close after 7s
  const autoClose = setTimeout(doClose, 7000)

  function doClose() {
    clearTimeout(showResults)
    clearTimeout(autoClose)
    clearInterval(hexTimer)
    clearInterval(syncTimer)
    window.removeEventListener('keydown', onKey)
    hud.classList.add('closing')
    setTimeout(() => { hud.remove(); onClose?.() }, 400)
  }

  const onKey = (e) => { if (e.key === 'k' || e.key === 'K') doClose() }
  window.addEventListener('keydown', onKey)

  return { close: doClose }
}
