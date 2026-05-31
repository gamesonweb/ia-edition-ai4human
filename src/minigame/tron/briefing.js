import './briefing.css'
import { t } from './i18n.js'

export function showBriefing(totalLaps, onReady) {
  const spaceKey = 'ESPACE'

  const el = document.createElement('div')
  el.id = 'tron-briefing'
  el.innerHTML = `
    <div class="tb-corner tb-tl"></div>
    <div class="tb-corner tb-tr"></div>
    <div class="tb-corner tb-bl"></div>
    <div class="tb-corner tb-br"></div>

    <div class="tb-scanline"></div>

    <div class="tb-inner">
      <div class="tb-header">
        <div class="tb-pretitle">${t('br.pretitle')}</div>
        <div class="tb-title">${t('br.title')}</div>
        <div class="tb-divider"></div>
      </div>

      <div class="tb-body">

        <div class="tb-col">
          <div class="tb-section">
            <div class="tb-section-label">${t('br.obj_label')}</div>
            <ul class="tb-list">
              <li>${t('br.obj1', { laps: totalLaps })}</li>
              <li>${t('br.obj2')}</li>
              <li>${t('br.obj3')}</li>
            </ul>
          </div>

          <div class="tb-section">
            <div class="tb-section-label">${t('br.opp_label')}</div>
            <div class="tb-ai-list">
              <div class="tb-ai-row">
                <span class="tb-ai-dot easy"></span>
                <span class="tb-ai-name">${t('level.easy')}</span>
                <span class="tb-ai-bar"><span style="width:55%"></span></span>
              </div>
              <div class="tb-ai-row">
                <span class="tb-ai-dot medium"></span>
                <span class="tb-ai-name">${t('level.medium')}</span>
                <span class="tb-ai-bar"><span style="width:78%"></span></span>
              </div>
              <div class="tb-ai-row">
                <span class="tb-ai-dot hard"></span>
                <span class="tb-ai-name">${t('level.hard')}</span>
                <span class="tb-ai-bar"><span style="width:100%"></span></span>
              </div>
            </div>
          </div>
        </div>

        <div class="tb-vsep"></div>

        <div class="tb-col">
          <div class="tb-section">
            <div class="tb-section-label">${t('br.ctrl_label')}</div>
            <div class="tb-controls">
              <div class="tb-ctrl-row">
                <div class="tb-keys">
                  <kbd>Z</kbd><kbd>Q</kbd><kbd>S</kbd><kbd>D</kbd>
                  <span class="tb-ctrl-or">${t('br.ctrl_or')}</span>
                  <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd>
                </div>
                <span class="tb-ctrl-label">${t('br.ctrl_ride')}</span>
              </div>
              <div class="tb-ctrl-row">
                <div class="tb-keys">
                  <kbd class="tb-key-space">${spaceKey}</kbd>
                </div>
                <span class="tb-ctrl-label">${t('br.ctrl_trail')}</span>
              </div>
              <div class="tb-ctrl-row">
                <div class="tb-keys">
                  <kbd>K</kbd>
                </div>
                <span class="tb-ctrl-label">${t('br.ctrl_ai')}</span>
              </div>
              <div class="tb-ctrl-row">
                <div class="tb-keys">
                  <kbd>T</kbd>
                </div>
                <span class="tb-ctrl-label">${t('br.ctrl_tp')}</span>
              </div>
            </div>
          </div>

          <div class="tb-section">
            <div class="tb-section-label">${t('br.trail_label')}</div>
            <p class="tb-trail-desc">${t('br.trail_desc')}</p>
          </div>
        </div>

      </div>

      <div class="tb-footer">
        <button class="tb-start-btn" id="tb-start" type="button">
          ${t('br.start')}
        </button>
      </div>
    </div>
  `

  document.body.appendChild(el)
  requestAnimationFrame(() => el.classList.add('tb-open'))

  el.querySelector('#tb-start').addEventListener('click', () => {
    el.classList.add('tb-exit')
    setTimeout(() => { el.remove(); onReady?.() }, 500)
  })
}
