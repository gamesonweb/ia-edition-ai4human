import '@fortawesome/fontawesome-free/css/all.min.css'
import './teleport.css'

const DEFAULT_SPAWN = { x: 29.28, y: 0.14, z: 322.42 }

export const setupTeleport = ({ getHero, spawn = DEFAULT_SPAWN } = {}) => {
  const btn = document.createElement('button')
  btn.id = 'teleport-btn'
  btn.type = 'button'
  btn.title = 'Téléportation (T)'
  btn.innerHTML = `<i class="icon fa-solid fa-location-arrow"></i>`
  document.body.appendChild(btn)

  const target = { ...spawn }

  const teleport = () => {
    const hero = getHero?.()
    if (!hero) return
    hero.position.set(target.x, target.y, target.z)
    btn.classList.remove('flash')
    void btn.offsetWidth // force reflow → relance l'anim
    btn.classList.add('flash')
  }

  btn.addEventListener('click', teleport)

  const onKey = (e) => {
    if (e.repeat) return
    if (e.key.toLowerCase() === 't') teleport()
  }
  window.addEventListener('keydown', onKey)

  return {
    element: btn,
    teleport,
    setTarget: (pos) => { target.x = pos.x; target.y = pos.y; target.z = pos.z },
    dispose: () => {
      window.removeEventListener('keydown', onKey)
      btn.remove()
    },
  }
}
