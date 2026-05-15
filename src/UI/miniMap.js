import '@fortawesome/fontawesome-free/css/all.min.css'
import './miniMap.css'

const MAP = {
  centerX: 5,
  centerZ: 140,
  scaleX:  200,
  scaleZ:  240,
  flipX: true,
  flipZ: false,
}

const worldToMapPercent = (x, z) => {
  const nx = (x - MAP.centerX) / MAP.scaleX
  const nz = (z - MAP.centerZ) / MAP.scaleZ
  const px = 50 + (MAP.flipX ? -nx : nx) * 50
  const py = 50 + (MAP.flipZ ? -nz : nz) * 50
  return { px, py }
}

export const setupMiniMap = () => {
  // ── Mini-map radar (coin) ──────────────────────────────
  const container = document.createElement('div')
  container.id = 'mini-map'

  const mapImg = document.createElement('div')
  mapImg.classList.add('map-img')
  container.appendChild(mapImg)

  const player = document.createElement('div')
  player.classList.add('player')
  container.appendChild(player)

  const label = document.createElement('div')
  label.classList.add('label')
  label.textContent = 'M pour agrandir'
  container.appendChild(label)

  document.body.appendChild(container)

  // ── Carte plein écran ──────────────────────────────────
  const expanded = document.createElement('div')
  expanded.id = 'map-expanded'

  expanded.innerHTML = `
    <div class="map-aurora"></div>
    <div class="map-vignette"></div>

    <div class="map-layout">

      <!-- ── Gauche : grande carte ── -->
      <div class="map-main">
        <div class="map-header">
          <div class="map-pretitle">
            <span class="map-dot"></span>
            <span>Navigation · Grille neurale</span>
          </div>
          <div class="map-title-text">CARTE</div>
        </div>

        <div class="map-container">
          <div class="full-img"></div>
          <div class="player-mark"></div>
          <span class="map-compass map-compass-n">N</span>
          <span class="map-compass map-compass-s">S</span>
          <span class="map-compass map-compass-e">E</span>
          <span class="map-compass map-compass-w">O</span>
          <div class="map-scan-line"></div>
        </div>

        <div class="map-coords" data-coords>X : —&nbsp;&nbsp;&nbsp;Z : —</div>
      </div>

      <!-- ── Droite : légende ── -->
      <div class="map-legend">
        <div class="map-legend-head">
          <button class="map-close-btn" type="button" aria-label="Fermer la carte">
            <i class="fa-solid fa-arrow-left"></i>
            <span>Fermer</span>
          </button>
          <div class="map-legend-title">Légende</div>
        </div>

        <!-- Joueur -->
        <div class="map-legend-section">
          <div class="map-legend-section-label">Joueur</div>
          <div class="map-legend-card" style="--i:0">
            <div class="map-legend-icon">
              <div class="legend-player-icon"></div>
            </div>
            <div class="map-legend-text">
              <div class="map-legend-name">Votre position</div>
              <div class="map-legend-desc">Localisation actuelle dans la grille</div>
            </div>
          </div>
        </div>

        <hr class="map-legend-divider" />

        <!-- Objectifs -->
        <div class="map-legend-section">
          <div class="map-legend-section-label">Objectifs</div>
          <div class="map-legend-card" style="--i:1">
            <div class="map-legend-icon">
              <i class="fa-solid fa-bolt" style="color:#67E8F9"></i>
            </div>
            <div class="map-legend-text">
              <div class="map-legend-name">Terminal IA</div>
              <div class="map-legend-desc">Système neural à compromettre</div>
            </div>
          </div>
          <div class="map-legend-card" style="--i:2">
            <div class="map-legend-icon">
              <i class="fa-solid fa-door-open" style="color:#A78BFA"></i>
            </div>
            <div class="map-legend-text">
              <div class="map-legend-name">Sortie</div>
              <div class="map-legend-desc">Point d'extraction sécurisé</div>
            </div>
          </div>
          <div class="map-legend-card" style="--i:3">
            <div class="map-legend-icon">
              <i class="fa-solid fa-microchip" style="color:#7C9CFF"></i>
            </div>
            <div class="map-legend-text">
              <div class="map-legend-name">Données</div>
              <div class="map-legend-desc">Collectible de mission</div>
            </div>
          </div>
        </div>

        <hr class="map-legend-divider" />

        <!-- Menaces -->
        <div class="map-legend-section">
          <div class="map-legend-section-label">Menaces</div>
          <div class="map-legend-card" style="--i:4">
            <div class="map-legend-icon">
              <i class="fa-solid fa-shield-halved" style="color:#FCA5A5"></i>
            </div>
            <div class="map-legend-text">
              <div class="map-legend-name">Patrouille</div>
              <div class="map-legend-desc">Unité de contrôle ennemie</div>
            </div>
          </div>
          <div class="map-legend-card" style="--i:5">
            <div class="map-legend-icon">
              <i class="fa-solid fa-robot" style="color:#FDA4AF"></i>
            </div>
            <div class="map-legend-text">
              <div class="map-legend-name">Drone IA</div>
              <div class="map-legend-desc">Surveillance automatisée</div>
            </div>
          </div>
        </div>

        <hr class="map-legend-divider" />

        <!-- Zones -->
        <div class="map-legend-section">
          <div class="map-legend-section-label">Zones</div>
          <div class="map-legend-card" style="--i:6">
            <div class="map-legend-icon">
              <div class="legend-zone-dot" style="background:rgba(103,232,249,0.15);border-color:rgba(103,232,249,0.5)"></div>
            </div>
            <div class="map-legend-text">
              <div class="map-legend-name">Zone sécurisée</div>
              <div class="map-legend-desc">Aucune présence ennemie détectée</div>
            </div>
          </div>
          <div class="map-legend-card" style="--i:7">
            <div class="map-legend-icon">
              <div class="legend-zone-dot" style="background:rgba(124,156,255,0.15);border-color:rgba(124,156,255,0.5)"></div>
            </div>
            <div class="map-legend-text">
              <div class="map-legend-name">Zone neutre</div>
              <div class="map-legend-desc">Activité variable</div>
            </div>
          </div>
          <div class="map-legend-card" style="--i:8">
            <div class="map-legend-icon">
              <div class="legend-zone-dot" style="background:rgba(252,165,165,0.15);border-color:rgba(252,165,165,0.5)"></div>
            </div>
            <div class="map-legend-text">
              <div class="map-legend-name">Zone hostile</div>
              <div class="map-legend-desc">Présence ennemie dense</div>
            </div>
          </div>
        </div>

        <!-- Pied -->
        <div class="map-legend-foot">
          <div class="map-key-hint">
            <kbd>M</kbd>&nbsp;ou&nbsp;<kbd>Échap</kbd> pour fermer
          </div>
          <div class="map-legend-foot-text">Blackout · Babylon.js · GOW 2026</div>
        </div>
      </div>
    </div>
  `

  document.body.appendChild(expanded)

  const expandedMark = expanded.querySelector('.player-mark')
  const closeBtn     = expanded.querySelector('.map-close-btn')
  const coordsEl     = expanded.querySelector('[data-coords]')

  let isOpen = false
  const setOpen = (open) => {
    isOpen = open
    expanded.classList.toggle('open', isOpen)
  }
  const toggle = () => setOpen(!isOpen)

  closeBtn .addEventListener('click', () => setOpen(false))
  container.addEventListener('click', () => { if (!isOpen) setOpen(true) })

  const onKey = (e) => {
    if (e.repeat) return
    const k = e.key.toLowerCase()
    if (k === 'm') toggle()
    if (e.key === 'Escape' && isOpen) setOpen(false)
  }
  window.addEventListener('keydown', onKey)

  const update = (position, rotationY = 0) => {
    if (!position) return

    const { px, py } = worldToMapPercent(position.x, position.z)
    const deg = rotationY * 180 / Math.PI + 180
    const cx = Math.max(0, Math.min(100, px))
    const cy = Math.max(0, Math.min(100, py))

    mapImg.style.backgroundPosition = `${cx}% ${cy}%`
    player.style.transform = `rotate(${deg}deg)`

    if (isOpen) {
      expandedMark.style.left      = `${cx}%`
      expandedMark.style.top       = `${cy}%`
      expandedMark.style.transform = `rotate(${deg}deg)`
      if (coordsEl) {
        coordsEl.textContent = `X : ${position.x.toFixed(1)}   Z : ${position.z.toFixed(1)}`
      }
    }
  }

  const dispose = () => {
    window.removeEventListener('keydown', onKey)
    container.remove()
    expanded.remove()
  }

  return { element: container, update, toggle, dispose }
}
