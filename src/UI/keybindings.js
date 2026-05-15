import './keybindings.css'

const GROUPS = [
  {
    title: 'Déplacement',
    rows: [
      { desc: 'Avancer',     keys: ['Z'], alt: ['↑'] },
      { desc: 'Reculer',     keys: ['S'], alt: ['↓'] },
      { desc: 'Gauche',      keys: ['Q'], alt: ['←'] },
      { desc: 'Droite',      keys: ['D'], alt: ['→'] },
      { desc: 'Sprint',      keys: ['Shift'] },
    ],
  },
  {
    title: 'Interface',
    rows: [
      { desc: 'Carte',          keys: ['M'] },
      { desc: 'Liste touches',  keys: ['C'] },
      { desc: 'Téléportation',  keys: ['T'] },
      { desc: 'Coordonnées',    keys: ['B'] },
      { desc: 'Inspecteur',     keys: ['I'] },
    ],
  },
  {
    title: 'Inventaire',
    rows: [
      { desc: 'Slot 1 → 5', keys: ['1','2','3','4','5'] },
    ],
  },
]

export const setupKeybindings = () => {
  const overlay = document.createElement('div')
  overlay.id = 'keybindings-overlay'
  document.body.appendChild(overlay)

  const panel = document.createElement('div')
  panel.id = 'keybindings-panel'

  const renderRow = (row) => {
    const keys = row.keys.map(k => `<span class="cap">${k}</span>`).join('')
    const alt  = row.alt
      ? `<span class="sep">/</span>${row.alt.map(k => `<span class="cap">${k}</span>`).join('')}`
      : ''
    return `
      <div class="row">
        <span class="desc">${row.desc}</span>
        <span class="keys">${keys}${alt}</span>
      </div>`
  }

  const renderGroup = (g) => `
    <div class="group-title">${g.title}</div>
    ${g.rows.map(renderRow).join('')}
  `

  panel.innerHTML = `
    <div class="header">
      <span class="title">Touches</span>
      <button class="close" type="button" aria-label="Fermer">×</button>
    </div>
    <div class="list">
      ${GROUPS.map(renderGroup).join('')}
    </div>
  `
  document.body.appendChild(panel)

  const closeBtn = panel.querySelector('.close')

  let isOpen = false
  const setOpen = (open) => {
    isOpen = open
    overlay.classList.toggle('open', isOpen)
    panel.classList.toggle('open', isOpen)
  }
  const toggle = () => setOpen(!isOpen)

  closeBtn.addEventListener('click', () => setOpen(false))
  overlay .addEventListener('click', () => setOpen(false))

  const onKey = (e) => {
    if (e.repeat) return
    if (e.key.toLowerCase() === 'c') toggle()
    if (e.key === 'Escape' && isOpen) setOpen(false)
  }
  window.addEventListener('keydown', onKey)

  return {
    element: panel,
    toggle,
    open:  () => setOpen(true),
    close: () => setOpen(false),
    dispose: () => {
      window.removeEventListener('keydown', onKey)
      overlay.remove()
      panel.remove()
    },
  }
}
