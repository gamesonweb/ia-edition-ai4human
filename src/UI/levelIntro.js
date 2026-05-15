import '@fortawesome/fontawesome-free/css/all.min.css'
import './levelIntro.css'

/**
 * Affiche un overlay minimaliste d'intro de niveau.
 * Auto-fade après `duration` ms.
 *
 * @param {{
 *   label?: string,
 *   title: string,
 *   subtitle?: string,
 *   dangers?: Array<{ icon: string, text: string }>,
 *   duration?: number,
 * }} opts
 */
export function showLevelIntro(opts = {}) {
  const {
    label    = '',
    title    = '',
    subtitle = '',
    dangers  = [],
    duration = 7000,
  } = opts

  document.getElementById('level-intro')?.remove()

  const container = document.createElement('div')
  container.id = 'level-intro'

  const dangersHTML = dangers.length
    ? `<div class="accent"></div>
       <div class="dangers">${dangers.map(d => `
         <div class="danger">
           <i class="icon fa-solid ${d.icon}"></i>
           <span>${d.text}</span>
         </div>`).join('')}</div>`
    : ''

  container.innerHTML = `
    ${label    ? `<div class="label">${label}</div>` : ''}
    <div class="title">${title}</div>
    ${subtitle ? `<div class="subtitle">${subtitle}</div>` : ''}
    ${dangersHTML}
  `

  document.body.appendChild(container)
  requestAnimationFrame(() => container.classList.add('show'))

  let timer
  const close = () => {
    clearTimeout(timer)
    container.classList.remove('show')
    setTimeout(() => container.remove(), 500)
  }
  timer = setTimeout(close, duration)

  return { element: container, close }
}
