export function showCutscene(totalLaps, countdownMs, onGo) {
  return new Promise(resolve => {
    const el = document.createElement('div')
    el.id = 'tron-cutscene'
    el.innerHTML = `
      <div class="tc-bar tc-bar-top"></div>
      <div class="tc-bar tc-bar-bot"></div>
      <div class="tc-scanline"></div>
      <div class="tc-content">
        <div class="tc-location">Neo Akiirran &nbsp;·&nbsp; Grille Sigma-7</div>
        <div class="tc-title">Course Principale</div>
        <div class="tc-divider"></div>
        <div class="tc-laps">${totalLaps} Tours</div>
        <div class="tc-objective">
          <span class="tc-objective-label">— Objectif —</span>
          Devance les robots IA sur leur scooter avec ta moto<br>
          Sois le premier à franchir la ligne d'arrivée<br>
          Réalise le meilleur chrono
          <span class="tc-ai-tip">⚡ <kbd>K</kbd> &mdash; IA INTÉGRÉE &mdash; SUPERPOUVOIR ACTIVABLE</span>
        </div>
        <div class="tc-ready" id="tc-ready">Préparez-vous</div>
        <div class="tc-cd" id="tc-cd"></div>
      </div>
      <div class="tc-fade-overlay" id="tc-fade"></div>
    `
    document.body.appendChild(el)
    requestAnimationFrame(() => el.classList.add('tc-open'))

    setTimeout(() => {
      const readyEl = el.querySelector('#tc-ready')
      const cdEl    = el.querySelector('#tc-cd')
      readyEl.classList.add('tc-ready-hide')

      const steps  = ['10', '9', '8', '7', '6', '5', '4', '3', '2', '1', 'GO']
      const stepMs = countdownMs / steps.length
      let i = 0

      const showNext = () => {
        if (i >= steps.length) {
          el.querySelector('#tc-fade').classList.add('tc-fading')
          el.classList.add('tc-exit')
          setTimeout(() => { el.remove(); resolve(); }, 650)
          return
        }
        const isGo = steps[i] === 'GO'
        cdEl.textContent = steps[i]
        cdEl.className = 'tc-cd' + (isGo ? ' tc-cd-go' : '')
        void cdEl.offsetWidth
        cdEl.className = 'tc-cd tc-cd-show' + (isGo ? ' tc-cd-go' : '')
        if (isGo) onGo?.()
        i++
        setTimeout(showNext, stepMs)
      }
      showNext()
    }, 3500)
  })
}
