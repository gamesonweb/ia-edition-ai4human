import '@fortawesome/fontawesome-free/css/all.min.css'
import './miniMap.css'

const MAP = {
  centerX:  -20,
  centerZ:  135,
  scaleX:   230,
  scaleZ:   280,
  flipX:    true,
  flipZ:    false,
  minY: 0,
  maxY: 100,
}

const worldToMapPercent = (x, z) => {
  const nx = (x - MAP.centerX) / MAP.scaleX
  const nz = (z - MAP.centerZ) / MAP.scaleZ
  const px = 50 + (MAP.flipX ? -nx : nx) * 50
  const py = 50 + (MAP.flipZ ? -nz : nz) * 50
  return { px, py }
}

const LEVEL_POINTS = {
  1: [
    { name: 'Carte identité 1', icon: '🪪', worldPosition: { x: 24,   z: 355 }, color: '#67E8F9', description: 'Récupérez votre premier document' },
    { name: 'Carte identité 2', icon: '🪪', worldPosition: { x: -24,  z: 311 }, color: '#67E8F9', description: 'Récupérez votre deuxième document' },
    { name: 'Carte identité 3', icon: '🪪', worldPosition: { x: 52,   z: 307 }, color: '#67E8F9', description: 'Récupérez votre troisième document' },
    { name: 'Checkpoint',       icon: '🚧', worldPosition: { x: 89,   z: 310 }, color: '#FCA5A5', description: 'Poste de contrôle frontalier' },
  ],
  2: [
    { name: 'Soldat (passeport)', icon: '💂', worldPosition: { x: 89,   z: 310 }, color: '#FCA5A5', description: 'Présentez vos papiers' },
    { name: 'Robot infecté',      icon: '🤖', worldPosition: { x: -161, z: 196 }, color: '#FF8C00', description: 'Localisez votre compagnon IA' },
    { name: 'Zone de dépôt',      icon: '📦', worldPosition: { x: 25,   z: 310 }, color: '#7C9CFF', description: 'Déposez le robot ici' },
  ],
  3: [
    { name: 'Carte mère', icon: '🔌', worldPosition: { x: -23, z: 29  }, color: '#A78BFA', description: 'Composant 1/2' },
    { name: 'Disque de données', icon: '💾', worldPosition: { x: 149, z: 38  }, color: '#A78BFA', description: 'Composant 2/2' },
    { name: 'Robot (dépôt)',  icon: '🤖', worldPosition: { x: 25,  z: 310 }, color: '#7C9CFF', description: 'Ramenez les pièces ici' },
  ],
  4: [
    { name: 'Terminal IA', icon: '🖥️', worldPosition: { x: -115, z: 14 }, color: '#67E8F9', description: 'Enregistrez-vous comme robot autorisé' },
  ],
  5: [
    { name: 'Caméra 1/6', icon: '📷', worldPosition: { x:  95.89, z: 271.99 }, color: '#FCA5A5', description: 'Caméra N-E' },
    { name: 'Caméra 2/6', icon: '📷', worldPosition: { x: -72.10, z: 264.91 }, color: '#FCA5A5', description: 'Caméra N-O' },
    { name: 'Caméra 3/6', icon: '📷', worldPosition: { x:  17.29, z: 224.40 }, color: '#FCA5A5', description: 'Caméra Centre-N' },
    { name: 'Caméra 4/6', icon: '📷', worldPosition: { x:  97.54, z: -30.97 }, color: '#FCA5A5', description: 'Caméra S-E' },
    { name: 'Caméra 5/6', icon: '📷', worldPosition: { x: -57.50, z:  25.53 }, color: '#FCA5A5', description: 'Caméra S-O' },
    { name: 'Caméra 6/6', icon: '📷', worldPosition: { x: -93.16, z:  23.81 }, color: '#FCA5A5', description: 'Caméra Ouest' },
  ],
  6: [], // calculé dynamiquement via getLevel6Points()
  7: [
    { name: 'Jacob Martin', icon: '🧑', worldPosition: { x: 48, z: 25 }, color: '#FFD700', description: 'Obtenez l\'accréditation Sergent IA' },
  ],
  8: [
    { name: 'Robot XR-221', icon: '🤖', worldPosition: { x: -42, z: 44  }, color: '#A78BFA', description: 'Scannez avec K' },
    { name: 'Robot XR-442', icon: '🤖', worldPosition: { x: 48,  z: 137 }, color: '#A78BFA', description: 'Scannez avec K' },
    { name: 'Robot XR-???', icon: '🤖', worldPosition: { x: 10,  z: -180 }, color: '#A78BFA', description: 'Scannez avec K' },
  ],
  9: [
    { name: 'Centrale IA', icon: '🏭', worldPosition: { x: -47, z: 16 }, color: '#FF4500', description: 'Entrez la combinaison de sécurité' },
  ],
}

const injectMarkerStyles = () => {
  if (document.getElementById('map-marker-styles')) return
  const s = document.createElement('style')
  s.id = 'map-marker-styles'
  s.textContent = `
    .map-obj-marker {
      position: absolute;
      transform: translate(-50%, -50%);
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      border: 1.5px solid rgba(255,255,255,0.7);
      font-size: 11px;
      width: 20px;
      height: 20px;
      z-index: 1004;
      cursor: default;
      animation: map-marker-pulse 2.2s ease-in-out infinite;
      transition: transform 0.15s ease, box-shadow 0.15s ease;
    }
    .map-obj-marker:hover {
      transform: translate(-50%, -50%) scale(1.4);
      z-index: 1005;
    }
    @keyframes map-marker-pulse {
      0%, 100% { opacity: 1;   }
      50%       { opacity: 0.6; }
    }
    .map-zone-marker {
      position: absolute;
      transform: translate(-50%, -50%);
      border-radius: 6px;
      opacity: 0.25;
      border: 2px solid;
      z-index: 1002;
      pointer-events: none;
      animation: map-zone-glow 3s ease-in-out infinite;
    }
    @keyframes map-zone-glow {
      0%, 100% { opacity: 0.25; }
      50%       { opacity: 0.45; }
    }
    .map-obj-tooltip {
      position: absolute;
      bottom: calc(100% + 6px);
      left: 50%;
      transform: translateX(-50%);
      background: rgba(7,9,26,0.92);
      border: 1px solid rgba(124,156,255,0.35);
      border-radius: 6px;
      padding: 5px 10px;
      white-space: nowrap;
      font-size: 11px;
      color: #f3f6ff;
      letter-spacing: 0.3px;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.15s ease;
      z-index: 1006;
    }
    .map-obj-marker:hover .map-obj-tooltip { opacity: 1; }
  `
  document.head.appendChild(s)
}

// Centres des 3 zones du level 6 (doivent correspondre à ZONES dans level6/index.js)
const L6_ZONES = [
  { x:  15.27,  z: 185.44, label: '1/3' },
  { x: 164.67,  z:  34.77, label: '2/3' },
  { x: -191.64, z: 132.37, label: '3/3' },
]
const L6_COMPUTER = { x: 15.27, z: 185.44 }

const getLevel6Points = () => {
  const meta = window.__scene__?.metadata ?? {}
  const cleared  = meta.level6ZonesCleared   ?? []
  const keysGot  = meta.level6KeysCollected  ?? 0
  const computer = meta.level6ComputerActive ?? false

  // Ordinateur disponible → affiche uniquement l'ordinateur
  if (computer) {
    return [
      { name: 'Ordinateur central', icon: '🖥️', worldPosition: L6_COMPUTER, color: '#67E8F9', description: 'Accédez au système' },
    ]
  }

  const pts = []
  L6_ZONES.forEach((zone, i) => {
    if (cleared.includes(i)) {
      // Zone libérée mais clé pas encore ramassée → affiche la clé
      const keysTakenFromPrevZones = cleared.filter(ci => ci < i).length
      if (keysTakenFromPrevZones >= keysGot) {
        pts.push({ name: `Clé ${zone.label}`, icon: '🗝️', worldPosition: { x: zone.x, z: zone.z }, color: '#FDE047', description: 'Ramassez la clé (E)' })
      }
      // Clé ramassée → rien pour cette zone
    } else {
      // Zone encore active
      pts.push({ name: `Zone ${zone.label}`, icon: '⚔️', worldPosition: { x: zone.x, z: zone.z }, color: '#ff4040', description: `Libérez le quartier (${zone.label})` })
    }
  })
  return pts
}

export const setupMiniMap = ({ scene } = {}) => {
  injectMarkerStyles()

  const container = document.createElement('div')
  container.id = 'mini-map'

  const mapImg = document.createElement('img')
  mapImg.classList.add('map-img')
  mapImg.src = '/img/map/map.png'
  mapImg.draggable = false
  container.appendChild(mapImg)

  const player = document.createElement('div')
  player.classList.add('player')
  container.appendChild(player)

  const label = document.createElement('div')
  label.classList.add('label')
  label.textContent = 'M pour agrandir'
  container.appendChild(label)

  document.body.appendChild(container)

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
          <img class="full-img" src="/img/map/map.png" draggable="false" />
          <div class="map-markers-layer"></div>
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

  const expandedMark  = expanded.querySelector('.player-mark')
  const closeBtn      = expanded.querySelector('.map-close-btn')
  const coordsEl      = expanded.querySelector('[data-coords]')
  const markersLayer  = expanded.querySelector('.map-markers-layer')
  const fullImg       = expanded.querySelector('.full-img')
  const mapContainer  = expanded.querySelector('.map-container')

  // Calcule les vraies dimensions de l'image rendue dans le conteneur (contain = letterbox possible)
  const getImgBounds = () => {
    const nw = fullImg.naturalWidth
    const nh = fullImg.naturalHeight
    if (!nw || !nh) return { ol: 0, ot: 0, sw: 1, sh: 1 }
    const { width: cw, height: ch } = mapContainer.getBoundingClientRect()
    if (!cw || !ch) return { ol: 0, ot: 0, sw: 1, sh: 1 }
    const iAR = nw / nh
    const cAR = cw / ch
    let iw, ih
    if (cAR > iAR) { ih = ch; iw = ih * iAR }
    else            { iw = cw; ih = iw / iAR }
    return {
      ol: (cw - iw) / 2 / cw,  // offset gauche en fraction du conteneur
      ot: (ch - ih) / 2 / ch,  // offset haut
      sw: iw / cw,              // largeur image / largeur conteneur
      sh: ih / ch,
    }
  }

  // Convertit un % image-space → % container-space
  const imgToContainer = (px, py) => {
    const { ol, ot, sw, sh } = getImgBounds()
    return {
      left: (ol + px / 100 * sw) * 100,
      top:  (ot + py / 100 * sh) * 100,
    }
  }

  // ── Marqueurs objectifs ────────────────────────────────
  let activeMarkers = []

  const clearMarkers = () => {
    activeMarkers.forEach(el => el.remove())
    activeMarkers = []
  }

  const renderMarkers = () => {
    clearMarkers()
    if (!scene) return

    const level = scene.metadata?.currentLevel
    if (!level || !LEVEL_POINTS[level]) return

    const points = level === 6
      ? getLevel6Points()
      : Array.isArray(LEVEL_POINTS[level])
        ? LEVEL_POINTS[level]
        : [LEVEL_POINTS[level]]

    points.forEach(pt => {
      const { px, py } = worldToMapPercent(pt.worldPosition.x, pt.worldPosition.z)
      const cx = Math.max(1, Math.min(99, px))
      const cy = Math.max(MAP.minY, Math.min(MAP.maxY, py))
      const pos = imgToContainer(cx, cy)

      if (pt.type === 'zone') {
        const { ol, sw, sh } = getImgBounds()
        const imgW = markersLayer.offsetWidth  * sw
        const imgH = markersLayer.offsetHeight * sh
        const zone = document.createElement('div')
        zone.className = 'map-zone-marker'
        zone.style.left            = `${pos.left}%`
        zone.style.top             = `${pos.top}%`
        zone.style.borderColor     = pt.color
        zone.style.backgroundColor = pt.color
        zone.style.width           = `${(pt.zoneSize.w / (MAP.scaleX * 2)) * imgW}px`
        zone.style.height          = `${(pt.zoneSize.h / (MAP.scaleZ * 2)) * imgH}px`
        markersLayer.appendChild(zone)
        activeMarkers.push(zone)
      }

      if (pt.type !== 'zone' || pt.icon) {
        const marker = document.createElement('div')
        marker.className = 'map-obj-marker'
        marker.style.left            = `${pos.left}%`
        marker.style.top             = `${pos.top}%`
        marker.style.backgroundColor = pt.color + '33'
        marker.style.boxShadow       = `0 0 8px 2px ${pt.color}88`
        marker.textContent           = pt.icon ?? '●'

        const tooltip = document.createElement('div')
        tooltip.className   = 'map-obj-tooltip'
        tooltip.textContent = `${pt.name} — ${pt.description}`
        marker.appendChild(tooltip)

        markersLayer.appendChild(marker)
        activeMarkers.push(marker)
      }
    })
  }

  // ── Ouverture / fermeture ──────────────────────────────
  let isOpen = false
  const setOpen = (open) => {
    isOpen = open
    expanded.classList.toggle('open', isOpen)
    if (isOpen) renderMarkers()
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

  // ── Suivi état level 6 pour rebuild marqueurs ─────────
  let _lastLevel    = -1
  let _lastL6State  = ''

  const getL6StateKey = () => {
    const m = window.__scene__?.metadata ?? {}
    return `${(m.level6ZonesCleared ?? []).join(',')}_${m.level6KeysCollected ?? 0}_${m.level6ComputerActive ?? false}`
  }

  // ── Mise à jour position ──────────────────────────────
  const update = (position, rotationY = 0) => {
    if (!position) return

    const { px, py } = worldToMapPercent(position.x, position.z)
    const deg = rotationY * 180 / Math.PI + 180
    const cx = Math.max(0, Math.min(100, px))
    const cy = Math.max(MAP.minY, Math.min(MAP.maxY, py))

    // Zoom sur la même image que la grande carte, centré sur le joueur
    const ZOOM = 4
    const cW = container.offsetWidth
    const cH = container.offsetHeight
    if (cW > 0 && mapImg.naturalWidth) {
      const ar = mapImg.naturalWidth / mapImg.naturalHeight
      const imgW = cW * ZOOM
      const imgH = imgW / ar
      mapImg.style.width  = `${imgW}px`
      mapImg.style.height = `${imgH}px`
      mapImg.style.left   = `${cW / 2 - cx / 100 * imgW}px`
      mapImg.style.top    = `${cH / 2 - cy / 100 * imgH}px`
    }
    player.style.transform = `rotate(${deg}deg)`

    // Rebuild marqueurs si changement de niveau ou d'état level6
    const curLevel = scene?.metadata?.currentLevel ?? -1
    const curL6Key = curLevel === 6 ? getL6StateKey() : ''
    if (curLevel !== _lastLevel || (curLevel === 6 && curL6Key !== _lastL6State)) {
      _lastLevel   = curLevel
      _lastL6State = curL6Key
      renderMarkers()
    }

    if (isOpen) {
      const ePos = imgToContainer(cx, cy)
      expandedMark.style.left      = `${ePos.left}%`
      expandedMark.style.top       = `${ePos.top}%`
      expandedMark.style.transform = `rotate(${deg}deg)`
      if (coordsEl) {
        coordsEl.textContent = `X : ${position.x.toFixed(1)}   Z : ${position.z.toFixed(1)}`
      }
    }
  }

  const dispose = () => {
    window.removeEventListener('keydown', onKey)
    clearMarkers()
    container.remove()
    expanded.remove()
  }

  return { element: container, update, toggle, dispose }
}
