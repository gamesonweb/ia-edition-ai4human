import { AdvancedDynamicTexture } from '@babylonjs/gui/2D/advancedDynamicTexture'
import { Rectangle }              from '@babylonjs/gui/2D/controls/rectangle'
import { StackPanel }             from '@babylonjs/gui/2D/controls/stackPanel'
import { Image }                  from '@babylonjs/gui/2D/controls/image'
import { TextBlock }              from '@babylonjs/gui/2D/controls/textBlock'
import { Control }                from '@babylonjs/gui/2D/controls/control'

export const RARITY = {
  common:    '#FFFFFF',
  uncommon:  '#4ADE80',
  rare:      '#60A5FA',
  epic:      '#C084FC',
  legendary: '#FBBF24',
  mythic:    '#F87171',
}

const SLOT_COUNT = 3
const isMobile   = typeof window !== 'undefined' && window.innerWidth < 768
const SLOT_SIZE  = isMobile ? 76 : 96
const SLOT_GAP   = 6
const FONT_FAMILY = '"Inter", "Segoe UI", system-ui, sans-serif'

const COLOR_BG          = 'rgba(0, 0, 0, 0.45)'
const COLOR_BG_SELECTED = 'rgba(255, 255, 255, 0.08)'
const COLOR_BORDER      = 'rgba(255, 255, 255, 0.12)'
const COLOR_BORDER_SEL  = 'rgba(255, 255, 255, 0.95)'

function makeSlot(index) {
  const card = new Rectangle(`slot-${index}`)
  card.width        = `${SLOT_SIZE}px`
  card.height       = `${SLOT_SIZE}px`
  card.thickness    = 1
  card.cornerRadius = 4
  card.color        = COLOR_BORDER
  card.background   = COLOR_BG

  const icon = new Image(`slot-icon-${index}`, '')
  icon.width   = '64%'
  icon.height  = '64%'
  icon.stretch = Image.STRETCH_UNIFORM
  icon.alpha   = 0
  card.addControl(icon)

  const number = new TextBlock(`slot-num-${index}`, String(index + 1))
  number.width      = '14px'
  number.height     = '14px'
  number.fontSize   = 10
  number.fontFamily = FONT_FAMILY
  number.fontWeight = '500'
  number.color      = 'rgba(255, 255, 255, 0.45)'
  number.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT
  number.verticalAlignment   = Control.VERTICAL_ALIGNMENT_TOP
  number.left = '5px'
  number.top  = '3px'
  card.addControl(number)

  const qty = new TextBlock(`slot-qty-${index}`, '')
  qty.fontSize   = 11
  qty.fontFamily = FONT_FAMILY
  qty.fontWeight = '600'
  qty.color      = '#FFFFFF'
  qty.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT
  qty.verticalAlignment   = Control.VERTICAL_ALIGNMENT_BOTTOM
  qty.paddingRight  = '5px'
  qty.paddingBottom = '3px'
  card.addControl(qty)

  // Nom de l'item (affiché en bas du slot)
  const nameLabel = new TextBlock(`slot-name-${index}`, '')
  nameLabel.height     = '14px'
  nameLabel.fontSize   = 10
  nameLabel.fontFamily = FONT_FAMILY
  nameLabel.fontWeight = '600'
  nameLabel.color      = 'rgba(255, 255, 255, 0.95)'
  nameLabel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER
  nameLabel.verticalAlignment   = Control.VERTICAL_ALIGNMENT_BOTTOM
  nameLabel.paddingBottom = '9px'
  card.addControl(nameLabel)

  // Fine ligne d'accent en bas → matérialise la rareté discrètement
  const accent = new Rectangle(`slot-accent-${index}`)
  accent.width        = '70%'
  accent.height       = '2px'
  accent.thickness    = 0
  accent.background   = 'transparent'
  accent.cornerRadius = 1
  accent.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER
  accent.verticalAlignment   = Control.VERTICAL_ALIGNMENT_BOTTOM
  accent.paddingBottom = '4px'
  card.addControl(accent)

  return {
    card, icon, number, qty, accent, nameLabel,
    state: { rarity: 'common', selected: false, empty: true },
  }
}

export function setupInventoryBar(scene, opts = {}) {
  const ui = AdvancedDynamicTexture.CreateFullscreenUI('inventory-ui', true, scene)
  ui.idealWidth      = 1920
  ui.useSmallestIdeal = true

  const root = new StackPanel('inv-root')
  root.isVertical            = true
  root.spacing               = 8
  root.horizontalAlignment   = Control.HORIZONTAL_ALIGNMENT_RIGHT
  root.verticalAlignment     = Control.VERTICAL_ALIGNMENT_BOTTOM
  root.paddingRight          = isMobile ? '12px' : '20px'
  root.paddingBottom         = isMobile ? '12px' : '20px'
  root.adaptWidthToChildren  = true
  root.adaptHeightToChildren = true
  ui.addControl(root)

  // ----- Ressources (ligne plate, sans fond) -----
  const resBar = new StackPanel('inv-resources')
  resBar.isVertical           = false
  resBar.height               = '18px'
  resBar.spacing              = 14
  resBar.horizontalAlignment  = Control.HORIZONTAL_ALIGNMENT_RIGHT
  resBar.adaptWidthToChildren = true
  root.addControl(resBar)

  const resources = {}

  function addResource(name, iconUrl, value = 0) {
    const row = new StackPanel(`res-${name}`)
    row.isVertical           = false
    row.spacing              = 5
    row.height               = '18px'
    row.adaptWidthToChildren = true

    const ic = new Image(`res-icon-${name}`, iconUrl ?? '')
    ic.width   = '14px'
    ic.height  = '14px'
    ic.stretch = Image.STRETCH_UNIFORM
    row.addControl(ic)

    const tx = new TextBlock(`res-text-${name}`, String(value))
    tx.width      = '36px'
    tx.height     = '18px'
    tx.fontSize   = 12
    tx.fontFamily = FONT_FAMILY
    tx.fontWeight = '500'
    tx.color      = 'rgba(255, 255, 255, 0.85)'
    tx.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT
    row.addControl(tx)

    resBar.addControl(row)
    resources[name] = { row, icon: ic, text: tx }
  }

  function setResource(name, value) {
    const r = resources[name]
    if (r) r.text.text = String(value)
  }

  // ----- Slots -----
  const slotsRow = new StackPanel('inv-slots')
  slotsRow.isVertical           = false
  slotsRow.height               = `${SLOT_SIZE}px`
  slotsRow.spacing              = SLOT_GAP
  slotsRow.horizontalAlignment  = Control.HORIZONTAL_ALIGNMENT_RIGHT
  slotsRow.adaptWidthToChildren = true
  root.addControl(slotsRow)

  const slots = []
  for (let i = 0; i < SLOT_COUNT; i++) {
    const s = makeSlot(i)
    slotsRow.addControl(s.card)
    slots.push(s)
  }

  let selectedIndex = 0

  function applyVisuals(slot) {
    const accentColor = RARITY[slot.state.rarity] ?? RARITY.common
    slot.accent.background = slot.state.empty ? 'transparent' : accentColor
    slot.accent.alpha      = slot.state.empty ? 0 : 0.85

    if (slot.state.selected) {
      slot.card.color      = COLOR_BORDER_SEL
      slot.card.background = COLOR_BG_SELECTED
      slot.card.thickness  = 1
      slot.number.color    = '#FFFFFF'
    } else {
      slot.card.color      = COLOR_BORDER
      slot.card.background = COLOR_BG
      slot.card.thickness  = 1
      slot.number.color    = 'rgba(255, 255, 255, 0.45)'
    }
  }

  function setItem(index, item) {
    const slot = slots[index]
    if (!slot) return
    if (!item) {
      slot.icon.source     = ''
      slot.icon.alpha      = 0
      slot.qty.text        = ''
      slot.nameLabel.text  = ''
      slot.state.rarity    = 'common'
      slot.state.empty     = true
      applyVisuals(slot)
      return
    }
    slot.state.empty  = false
    slot.state.rarity = item.rarity ?? 'common'
    if (item.icon) {
      slot.icon.source = item.icon
      slot.icon.alpha  = 1
    } else {
      slot.icon.alpha  = 0
    }
    slot.qty.text       = item.quantity && item.quantity > 1 ? String(item.quantity) : ''
    slot.nameLabel.text = item.name ?? ''
    applyVisuals(slot)
  }

  function setSelected(index) {
    if (index < 0 || index >= SLOT_COUNT) return
    selectedIndex = index
    slots.forEach((s, i) => {
      s.state.selected = (i === index)
      applyVisuals(s)
    })
    if (typeof opts.onSelect === 'function') opts.onSelect(index, slots[index].state)
  }

  // ----- Clavier 1-5 -----
  const onKey = (e) => {
    const n = Number(e.key)
    if (Number.isInteger(n) && n >= 1 && n <= SLOT_COUNT) {
      setSelected(n - 1)
    }
  }
  window.addEventListener('keydown', onKey)

  // ----- Clic / tap -----
  slots.forEach((s, i) => {
    s.card.isPointerBlocker = true
    s.card.onPointerClickObservable.add(() => setSelected(i))
  })

  // Init visuels
  slots.forEach(applyVisuals)
  setSelected(0)

  return {
    setItem,
    setSelected,
    addResource,
    setResource,
    getSelected: () => selectedIndex,
    dispose: () => {
      window.removeEventListener('keydown', onKey)
      ui.dispose()
    },
  }
}
