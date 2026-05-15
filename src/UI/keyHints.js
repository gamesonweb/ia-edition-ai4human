import '@fortawesome/fontawesome-free/css/all.min.css'
import './keyHints.css'

export const setupKeyHints = ({ onMap, onKeys } = {}) => {
  const container = document.createElement('div')
  container.id = 'key-hints'

  const makeHint = (key, iconClass, label, onClick) => {
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.className = 'key-hint'
    btn.title = label
    btn.innerHTML = `<span class="cap">${key}</span><i class="icon ${iconClass}"></i>`
    if (onClick) btn.addEventListener('click', onClick)
    return btn
  }

  container.appendChild(makeHint('M', 'fa-solid fa-map',      'Carte',   onMap))
  container.appendChild(makeHint('C', 'fa-solid fa-keyboard', 'Touches', onKeys))

  document.body.appendChild(container)

  return { element: container, dispose: () => container.remove() }
}
