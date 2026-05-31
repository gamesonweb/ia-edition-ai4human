import { FreeCamera } from '@babylonjs/core/Cameras/freeCamera'
import { Vector3 }    from '@babylonjs/core/Maths/math.vector'
import { showAllMapChunks, resumeChunkCulling } from '../scene/chunkManager'
import './cutscene.css'

const toV3 = ([x, y, z]) => new Vector3(x, y, z)

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

function animateTo(scene, cam, toPos, toTar, durationMs, onDone) {
  const fromPos = cam.position.clone()
  const fromTar = cam.target.clone()
  const t0      = performance.now()
  let   obs     = null

  obs = scene.onBeforeRenderObservable.add(() => {
    const raw = Math.min(1, (performance.now() - t0) / durationMs)
    const e   = easeInOutCubic(raw)

    cam.position.set(
      fromPos.x + (toPos.x - fromPos.x) * e,
      fromPos.y + (toPos.y - fromPos.y) * e,
      fromPos.z + (toPos.z - fromPos.z) * e,
    )
    cam.setTarget(new Vector3(
      fromTar.x + (toTar.x - fromTar.x) * e,
      fromTar.y + (toTar.y - fromTar.y) * e,
      fromTar.z + (toTar.z - fromTar.z) * e,
    ))

    if (raw >= 1) {
      scene.onBeforeRenderObservable.remove(obs)
      onDone?.()
    }
  })

  return () => { scene.onBeforeRenderObservable.remove(obs); obs = null }
}

// Orbital camera — sweeps clockwise around `center` (viewed from above)
function animateOrbit(scene, cam, center, sweepDegClockwise, durationMs, onDone) {
  const dx0        = cam.position.x - center.x
  const dz0        = cam.position.z - center.z
  const radius     = Math.sqrt(dx0 * dx0 + dz0 * dz0)
  const startAngle = Math.atan2(dz0, dx0)
  const sweepRad   = sweepDegClockwise * Math.PI / 180
  const height     = cam.position.y
  const t0         = performance.now()
  let   obs        = null

  obs = scene.onBeforeRenderObservable.add(() => {
    const raw   = Math.min(1, (performance.now() - t0) / durationMs)
    const e     = easeInOutCubic(raw)
    const angle = startAngle - e * sweepRad // minus = clockwise from above

    cam.position.set(
      center.x + radius * Math.cos(angle),
      height,
      center.z + radius * Math.sin(angle),
    )
    cam.setTarget(center)

    if (raw >= 1) {
      scene.onBeforeRenderObservable.remove(obs)
      onDone?.()
    }
  })

  return () => { scene.onBeforeRenderObservable.remove(obs); obs = null }
}

/**
 * Joue une cutscene cinématique.
 *
 * @param {Scene}  scene
 * @param {Array<{
 *   pos:      [number, number, number],   // position caméra
 *   tar:      [number, number, number],   // point visé
 *   subtitle: string,                     // texte affiché
 *   hold:     number,                     // ms de maintien sur ce plan
 *   move:     number,                     // ms de transition vers le plan suivant
 * }>} shots
 * @param {{ chapter?: string, onDone?: () => void }} opts
 */
const HUD_SELECTORS = [
  '#compass', '#crosshair', '#mini-map', '#map-expanded',
  '#player-stats', '#damage-vignette', '#damage-hit-flash',
  '#stats-bar', '#notifications', '#pause-btn', '#gfx-btn',
  '#teleport-btn', '#key-hints', '#position-display', '#game-timer',
  '#free-cam-hud', '#top-vignette',
]

function hideHUD(scene) {
  const saved = {}
  for (const sel of HUD_SELECTORS) {
    const el = document.querySelector(sel)
    if (!el) continue
    saved[sel] = el.style.display
    el.style.display = 'none'
  }
  // Inventaire Babylon GUI (AdvancedDynamicTexture)
  const invTex = scene.textures?.find(tx => tx.name === 'inventory-ui')
  if (invTex) {
    saved['__inv'] = invTex.rootContainer.isVisible
    invTex.rootContainer.isVisible = false
  }
  return saved
}

function restoreHUD(scene, saved) {
  for (const sel of HUD_SELECTORS) {
    const el = document.querySelector(sel)
    if (!el) continue
    el.style.display = saved[sel] ?? ''
  }
  const invTex = scene.textures?.find(tx => tx.name === 'inventory-ui')
  if (invTex && '__inv' in saved) invTex.rootContainer.isVisible = saved['__inv']
}

export function playCutscene(scene, shots, { chapter = '', onDone } = {}) {
  if (!shots?.length) { onDone?.(); return { skip: () => onDone?.() } }

  // ---- Pause joueur + masquage HUD ----
  const wasPaused = scene.metadata?.paused ?? false
  if (scene.metadata) scene.metadata.paused = true
  const savedHUD = hideHUD(scene)
  showAllMapChunks()

  // ---- Caméra cinématique ----
  const prevCamera = scene.activeCamera
  const cineCam    = new FreeCamera('__cs_cam', toV3(shots[0].pos), scene)
  cineCam.minZ = 0.1
  cineCam.maxZ = 2000
  cineCam.setTarget(toV3(shots[0].tar))
  scene.activeCamera = cineCam

  // ---- Split chapter → titre principal + sous-titre ----
  const chapterParts = chapter.split(' — ')
  const titleMain    = chapterParts[0] ?? ''
  const titleSub     = chapterParts[1] ?? ''

  // ---- Overlay DOM ----
  const overlay = document.createElement('div')
  overlay.id = 'cutscene-overlay'
  overlay.innerHTML = `
    <div class="cs-bar cs-bar-top"></div>
    <div class="cs-mid">
      <div class="cs-vignette"></div>
      ${chapter ? `<div class="cs-chapter">${chapter}</div>` : ''}
      ${chapter ? `
        <div class="cs-title-card" data-title>
          <div class="cs-title-main">${titleMain}</div>
          <div class="cs-title-separator"></div>
          ${titleSub ? `<div class="cs-title-sub">${titleSub}</div>` : ''}
        </div>
      ` : ''}
      <p class="cs-subtitle" data-sub></p>
    </div>
    <div class="cs-bar cs-bar-bottom">
      <button class="cs-skip" type="button">
        Passer
        <svg viewBox="0 0 24 24" fill="none">
          <polyline points="5 12 19 12" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <polyline points="13 6 19 12 13 18" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </div>
  `
  document.body.appendChild(overlay)
  requestAnimationFrame(() => overlay.classList.add('cs-visible'))

  const subEl   = overlay.querySelector('[data-sub]')
  const titleEl = overlay.querySelector('[data-title]')

  let done           = false
  let cancelAnim     = null
  let holdTimer      = null
  let subTimer       = null
  let titleShowTimer = null
  let titleHideTimer = null

  const clearAll = () => {
    cancelAnim?.(); cancelAnim = null
    clearTimeout(holdTimer);      holdTimer      = null
    clearTimeout(subTimer);       subTimer       = null
    clearTimeout(titleShowTimer); titleShowTimer = null
    clearTimeout(titleHideTimer); titleHideTimer = null
  }

  const finish = () => {
    if (done) return
    done = true
    clearAll()
    scene.activeCamera = prevCamera
    cineCam.dispose()
    if (scene.metadata) scene.metadata.paused = wasPaused
    restoreHUD(scene, savedHUD)
    resumeChunkCulling()
    overlay.classList.remove('cs-visible')
    overlay.classList.add('cs-closing')
    setTimeout(() => { overlay.remove(); onDone?.() }, 500)
  }

  const showSubtitle = (text) => {
    if (!subEl) return
    subEl.classList.remove('cs-sub-visible')
    clearTimeout(subTimer)
    subTimer = setTimeout(() => {
      subEl.textContent = text ?? ''
      subEl.classList.toggle('cs-sub-visible', !!text)
    }, 300)
  }

  const playShot = (idx) => {
    if (done || idx >= shots.length) { finish(); return }
    const shot = shots[idx]
    const next = shots[idx + 1]

    // Teleport flash: quick cyan-white burst to mask an instant camera jump
    if (shot.teleport) {
      const flash = document.createElement('div')
      flash.className = 'cs-teleport-flash'
      overlay.appendChild(flash)
      setTimeout(() => flash.remove(), 750)
    }

    showSubtitle(shot.subtitle ?? '')

    const move = shot.move ?? 1800

    const advanceToNext = () => {
      if (done) return
      cancelAnim = null
      if (!next) { finish(); return }
      if (next.cut) {
        // Instant jump cut to next position
        cineCam.position.copyFrom(toV3(next.pos))
        cineCam.setTarget(toV3(next.tar))
        playShot(idx + 1)
      } else {
        cancelAnim = animateTo(scene, cineCam, toV3(next.pos), toV3(next.tar), move, () => playShot(idx + 1))
      }
    }

    if (shot.orbit) {
      // Replace static hold with clockwise orbital sweep around tar
      cancelAnim = animateOrbit(scene, cineCam, toV3(shot.tar), shot.orbit.deg, shot.hold ?? 2500, advanceToNext)
    } else {
      holdTimer = setTimeout(advanceToNext, shot.hold ?? 2500)
    }
  }

  overlay.querySelector('.cs-skip').addEventListener('click', finish)

  // ---- Titre card avant le premier plan ----
  if (titleEl) {
    requestAnimationFrame(() => titleEl.classList.add('cs-title-visible'))
    titleShowTimer = setTimeout(() => {
      titleEl.classList.remove('cs-title-visible')
      titleHideTimer = setTimeout(() => { if (!done) playShot(0) }, 500)
    }, 2200)
  } else {
    playShot(0)
  }

  return { skip: finish }
}
