import '@fortawesome/fontawesome-free/css/all.min.css'
import './notification.css'

export const setupNotifications = () => {
  const container = document.createElement('div')
  container.id = 'notifications'
  document.body.appendChild(container)

  const items = []

  /**
   * @param {{
   *   id?: string,
   *   title?: string,
   *   message: string,
   *   icon?: string,
   *   variant?: 'info' | 'warning' | 'success',
   *   duration?: number,
   *   persistent?: boolean,
   * }} opts
   */
  const show = (opts = {}) => {
    const {
      id, title = '', message = '', icon, variant = 'info',
      duration = 6000, persistent = false,
    } = opts

    if (id) {
      const idx = items.findIndex(it => it.id === id)
      if (idx >= 0) {
        items[idx].element.remove()
        items.splice(idx, 1)
      }
    }

    const el = document.createElement('div')
    el.className = `notif ${variant}`
    el.innerHTML = `
      ${icon ? `<i class="notif-icon fa-solid ${icon}"></i>` : ''}
      <div class="notif-body">
        ${title ? `<div class="notif-title">${title}</div>` : ''}
        <div class="notif-message">${message}</div>
      </div>
    `
    container.appendChild(el)
    requestAnimationFrame(() => el.classList.add('show'))

    const item = { id, element: el }
    items.push(item)

    let timer
    const dismiss = () => {
      clearTimeout(timer)
      el.classList.remove('show')
      setTimeout(() => {
        el.remove()
        const idx = items.indexOf(item)
        if (idx >= 0) items.splice(idx, 1)
      }, 300)
    }

    if (!persistent) timer = setTimeout(dismiss, duration)

    return { dismiss }
  }

  const dismiss = (id) => {
    const idx = items.findIndex(it => it.id === id)
    if (idx < 0) return
    const item = items[idx]
    item.element.classList.remove('show')
    setTimeout(() => {
      item.element.remove()
      const i = items.indexOf(item)
      if (i >= 0) items.splice(i, 1)
    }, 300)
  }

  const dismissAll = () => {
    while (items.length) {
      items[0].element.remove()
      items.shift()
    }
  }

  return { show, dismiss, dismissAll, element: container }
}
