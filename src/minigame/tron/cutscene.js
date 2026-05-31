import { t } from './i18n.js'

export function showCutscene(totalLaps, countdownMs, onGo) {
  return new Promise(resolve => {
    const el = document.createElement('div')
    el.id = 'tron-cutscene'
    el.innerHTML = `
      <div class="tc-bar tc-bar-top"></div>
      <div class="tc-bar tc-bar-bot"></div>
      <div class="tc-scanline"></div>
      <div class="tc-content">
        <div class="tc-location">${t('cs.location')}</div>
        <div class="tc-title">${t('cs.title')}</div>
        <div class="tc-divider"></div>
        <div class="tc-laps">${totalLaps} ${t('cs.laps')}</div>
        <div class="tc-objective">
          <span class="tc-objective-label">${t('cs.obj_label')}</span>
          ${t('cs.obj1')}<br>
          ${t('cs.obj2')}<br>
          ${t('cs.obj3')}
          <span class="tc-ai-tip">${t('cs.ai_tip')}</span>
        </div>
        <div class="tc-ready" id="tc-ready">${t('cs.ready')}</div>
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
