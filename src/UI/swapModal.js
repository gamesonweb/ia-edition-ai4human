import '@fortawesome/fontawesome-free/css/all.min.css'
import './swapModal.css'

/**
 * Affiche une modale de drag-and-drop pour échanger les pièces du robot.
 * Le joueur fait glisser les nouvelles pièces sur les emplacements des anciennes.
 *
 * @param {{
 *   onComplete?: () => void,
 *   onCancel?: () => void,
 * }} [opts]
 */
export function showSwapModal({ onComplete, onCancel } = {}) {
  document.getElementById('swap-modal')?.remove()

  const overlay = document.createElement('div')
  overlay.id = 'swap-modal'

  overlay.innerHTML = `
    <div class="swap-modal-panel">
      <div class="swap-modal-title">
        <i class="fa-solid fa-screwdriver-wrench"></i>
        Remplacer les pièces du robot
      </div>

      <div class="swap-modal-grid">
        <div class="swap-modal-column">
          <div class="swap-modal-section-title">Vieilles pièces</div>
          <div class="swap-drop" data-type="motherboard">
            <i class="fa-solid fa-microchip swap-zone-icon"></i>
            <span class="swap-zone-label">Carte mère</span>
          </div>
          <div class="swap-drop" data-type="disk">
            <i class="fa-solid fa-compact-disc swap-zone-icon"></i>
            <span class="swap-zone-label">Disque</span>
          </div>
        </div>

        <div class="swap-modal-arrow"><i class="fa-solid fa-arrow-left"></i></div>

        <div class="swap-modal-column">
          <div class="swap-modal-section-title">Nouvelles pièces</div>
          <div class="swap-drag" draggable="true" data-type="motherboard">
            <i class="fa-solid fa-microchip"></i>
            <span>Carte mère</span>
          </div>
          <div class="swap-drag" draggable="true" data-type="disk">
            <i class="fa-solid fa-compact-disc"></i>
            <span>Disque</span>
          </div>
        </div>
      </div>

      <div class="swap-modal-hint">Glissez chaque nouvelle pièce sur l'ancienne.</div>

      <button class="swap-modal-close" type="button" aria-label="Fermer">
        <i class="fa-solid fa-xmark"></i>
      </button>
    </div>
  `

  document.body.appendChild(overlay)
  requestAnimationFrame(() => overlay.classList.add('show'))

  let closed = false
  const close = (reason) => {
    if (closed) return
    closed = true
    overlay.classList.remove('show')
    setTimeout(() => overlay.remove(), 300)
    if (reason === 'cancel') onCancel?.()
  }

  overlay.querySelector('.swap-modal-close')
    .addEventListener('click', () => close('cancel'))

  // Empêcher la propagation d'événements vers le canvas Babylon
  overlay.addEventListener('mousedown', (e) => e.stopPropagation())
  overlay.addEventListener('click',     (e) => e.stopPropagation())

  // ----- Drag & drop -----
  const drags = overlay.querySelectorAll('.swap-drag')
  const drops = overlay.querySelectorAll('.swap-drop')
  let placedCount = 0

  drags.forEach((drag) => {
    drag.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', drag.dataset.type)
      e.dataTransfer.effectAllowed = 'move'
      drag.classList.add('dragging')
    })
    drag.addEventListener('dragend', () => {
      drag.classList.remove('dragging')
    })
  })

  drops.forEach((drop) => {
    drop.addEventListener('dragover', (e) => {
      if (drop.classList.contains('filled')) return
      e.preventDefault()
      e.dataTransfer.dropEffect = 'move'
      drop.classList.add('hover')
    })
    drop.addEventListener('dragleave', () => drop.classList.remove('hover'))
    drop.addEventListener('drop', (e) => {
      e.preventDefault()
      drop.classList.remove('hover')
      if (drop.classList.contains('filled')) return

      const type = e.dataTransfer.getData('text/plain')
      if (type !== drop.dataset.type) return

      drop.classList.add('filled')
      const src = overlay.querySelector(`.swap-drag[data-type="${type}"]`)
      if (src) src.classList.add('placed')

      placedCount++
      if (placedCount >= 2) {
        // petit délai pour que le joueur voie la transition,
        // puis passe à la phase d'apprentissage
        setTimeout(() => showTrainingPhase(), 600)
      }
    })
  })

  // ----- Phase 2 : courbe d'apprentissage IA -----
  const showTrainingPhase = () => {
    const panel = overlay.querySelector('.swap-modal-panel')
    panel.innerHTML = `
      <div class="swap-modal-title">
        <i class="fa-solid fa-brain"></i>
        <span class="swap-title-text">Apprentissage de l'IA…</span>
      </div>

      <div class="swap-training-wrap">
        <canvas class="swap-training-graph" width="560" height="220"></canvas>
        <div class="swap-training-axes">
          <span class="ax y">Précision</span>
          <span class="ax x">Itérations</span>
        </div>
      </div>

      <div class="swap-training-stats">
        <div><span class="lbl">Epoch</span><span class="val swap-train-epoch">0 / 100</span></div>
        <div><span class="lbl">Loss</span> <span class="val swap-train-loss">1.000</span></div>
        <div><span class="lbl">Précision</span> <span class="val swap-train-acc">0%</span></div>
      </div>

      <div class="swap-training-progress">
        <div class="swap-training-progress-fill"></div>
      </div>
    `

    const canvas = panel.querySelector('.swap-training-graph')
    const ctx    = canvas.getContext('2d')
    const fillEl = panel.querySelector('.swap-training-progress-fill')
    const accEl  = panel.querySelector('.swap-train-acc')
    const lossEl = panel.querySelector('.swap-train-loss')
    const epochEl= panel.querySelector('.swap-train-epoch')
    const titleText = panel.querySelector('.swap-title-text')

    const W = canvas.width
    const H = canvas.height
    const PAD = 16

    const drawGrid = () => {
      ctx.clearRect(0, 0, W, H)
      // Grille
      ctx.strokeStyle = 'rgba(255,255,255,0.08)'
      ctx.lineWidth = 1
      for (let i = 0; i <= 10; i++) {
        const x = PAD + ((W - PAD * 2) / 10) * i
        ctx.beginPath(); ctx.moveTo(x, PAD); ctx.lineTo(x, H - PAD); ctx.stroke()
        const y = PAD + ((H - PAD * 2) / 10) * i
        ctx.beginPath(); ctx.moveTo(PAD, y); ctx.lineTo(W - PAD, y); ctx.stroke()
      }
      // Axes
      ctx.strokeStyle = 'rgba(255,255,255,0.25)'
      ctx.beginPath()
      ctx.moveTo(PAD, PAD); ctx.lineTo(PAD, H - PAD); ctx.lineTo(W - PAD, H - PAD)
      ctx.stroke()
    }

    // Sigmoid pour simuler une courbe d'apprentissage
    const accuracyAt = (t) => 1 / (1 + Math.exp(-((t * 12) - 6)))
    const lossAt     = (t) => Math.max(0, 1 - accuracyAt(t)) + 0.01

    const drawCurve = (progress) => {
      drawGrid()
      // Courbe accuracy
      ctx.strokeStyle = '#4ADE80'
      ctx.lineWidth = 2.5
      ctx.beginPath()
      const N = 120
      for (let i = 0; i <= N; i++) {
        const t = (i / N) * progress
        const x = PAD + (W - PAD * 2) * (i / N) * progress
        const y = (H - PAD) - (H - PAD * 2) * accuracyAt(t)
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y)
      }
      ctx.stroke()
      // Courbe loss (décroissante)
      ctx.strokeStyle = '#F87171'
      ctx.lineWidth = 1.5
      ctx.setLineDash([4, 4])
      ctx.beginPath()
      for (let i = 0; i <= N; i++) {
        const t = (i / N) * progress
        const x = PAD + (W - PAD * 2) * (i / N) * progress
        const y = (H - PAD) - (H - PAD * 2) * lossAt(t)
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y)
      }
      ctx.stroke()
      ctx.setLineDash([])
    }

    const DURATION = 3500
    const startTs = performance.now()
    let done = false
    const tick = () => {
      if (closed) return
      const elapsed = performance.now() - startTs
      const progress = Math.min(1, elapsed / DURATION)
      const acc  = accuracyAt(progress)
      const loss = lossAt(progress)
      const pct  = Math.floor(progress * 100)
      drawCurve(progress)
      fillEl.style.width = `${pct}%`
      accEl.textContent  = `${Math.floor(acc * 100)}%`
      lossEl.textContent = loss.toFixed(3)
      epochEl.textContent= `${Math.floor(progress * 100)} / 100`

      if (progress < 1) {
        requestAnimationFrame(tick)
      } else if (!done) {
        done = true
        titleText.textContent = 'Apprentissage terminé'
        panel.querySelector('.swap-modal-title i').className = 'fa-solid fa-circle-check'
        setTimeout(() => {
          close('success')
          onComplete?.()
        }, 1400)
      }
    }
    requestAnimationFrame(tick)
  }

  return { close: () => close('cancel'), element: overlay }
}
