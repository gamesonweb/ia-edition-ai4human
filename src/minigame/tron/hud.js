export function setupTronHUD() {
  document.getElementById('tron-hud')?.remove();

  const hud = document.createElement('div');
  hud.id = 'tron-hud';
  hud.className = 'tron-hud';

  hud.innerHTML = `
    <!-- Corners -->
    <div class="tron-corner tl"></div>
    <div class="tron-corner tr"></div>
    <div class="tron-corner bl"></div>
    <div class="tron-corner br"></div>

    <!-- Header bar -->
    <header class="tron-header">
      <h2 class="tron-title">BLACKOUT RACING</h2>
      <div class="tron-status">
        <span class="tron-status-dot"></span>
        <span>SIMULATOR STATUS: ACTIVE</span>
      </div>
      <div class="tron-rec" id="tron-rec">● REC</div>
    </header>

    <!-- Race info -->
    <section class="tron-race">
      <div class="tron-race-row">
        <span class="tron-race-label">TOUR</span>
        <span class="tron-race-val" id="tron-lap">1 / 3</span>
      </div>
      <div class="tron-race-row">
        <span class="tron-race-label">TEMPS</span>
        <span class="tron-race-val" id="tron-timer">00:00.00</span>
      </div>
      <div class="tron-race-row">
        <span class="tron-race-label">MEILLEUR</span>
        <span class="tron-race-val" id="tron-best">--:--.--</span>
      </div>
    </section>

    <!-- Classement pilotes -->
    <div class="tron-standings" id="tron-standings">
      <div class="tron-standings-title">CLASSEMENT</div>
      <div class="tron-standings-list" id="tron-standings-list"></div>
    </div>

    <!-- Countdown overlay -->
    <div class="tron-countdown" id="tron-countdown"></div>

    <!-- Finish overlay -->
    <div class="tron-finish" id="tron-finish">
      <div class="tron-finish-title" id="tron-finish-title">RÉSULTAT</div>
      <div class="tron-finish-row"><span>TEMPS TOTAL</span><span id="tron-finish-total">00:00.00</span></div>
      <div class="tron-finish-row"><span>MEILLEUR TOUR</span><span id="tron-finish-best">--:--.--</span></div>
      <button class="tron-finish-btn" id="tron-finish-btn">↩ RETOUR AU MENU</button>
    </div>

    <!-- Speedometer analogique -->
    <div class="tron-speedo">
      <svg viewBox="0 0 200 200" class="tron-gauge">
        <defs>
          <radialGradient id="tron-gauge-bg" cx="50%" cy="50%" r="50%">
            <stop offset="0%"  stop-color="rgba(0,30,50,0.55)"/>
            <stop offset="100%" stop-color="rgba(0,5,15,0.85)"/>
          </radialGradient>
        </defs>
        <circle cx="100" cy="100" r="92" fill="url(#tron-gauge-bg)" stroke="rgba(0,240,255,0.35)" stroke-width="1.2"/>
        <circle cx="100" cy="100" r="80" fill="none" stroke="rgba(0,240,255,0.18)" stroke-width="0.7"/>
        <g id="tron-gauge-ticks"></g>
        <g id="tron-gauge-labels" fill="rgba(0,240,255,0.75)" font-family="'Share Tech Mono', monospace" font-size="11" text-anchor="middle"></g>
        <line id="tron-gauge-needle" x1="100" y1="100" x2="100" y2="28"
              stroke="#00f0ff" stroke-width="2.5" stroke-linecap="round"
              style="filter: drop-shadow(0 0 6px #00f0ff); transform-origin: 100px 100px; transform: rotate(-135deg);"/>
        <circle cx="100" cy="100" r="7" fill="#00f0ff" style="filter: drop-shadow(0 0 8px #00f0ff);"/>
        <circle cx="100" cy="100" r="3" fill="#001b22"/>
      </svg>
      <div class="tron-speedo-val" id="tron-speed-val">0</div>
      <div class="tron-speedo-unit">KM/H</div>
    </div>

    <!-- Flèche directionnelle checkpoint -->
    <div class="tron-nav" id="tron-nav">
      <svg class="tron-nav-arrow" id="tron-nav-svg" viewBox="0 0 60 60">
        <polygon points="30,4 52,52 30,40 8,52" fill="#ff00cc" style="filter:drop-shadow(0 0 6px #ff00cc)"/>
      </svg>
      <div class="tron-nav-label" id="tron-nav-dist">-- m</div>
    </div>

    <!-- Lower instruction dashboard -->
    <footer class="tron-controls">
      <div class="tron-controls-title">SYSTEM COMMANDS</div>
      <div id="tron-ctrl-fwdbwd"></div>
      <div id="tron-ctrl-turn"></div>
      <div>SORTIR : <span class="tron-key">ESC</span></div>
    </footer>
  `;

  document.body.appendChild(hud);

  const SPEED_MAX_KMH = 220;
  const ANGLE_MIN     = -135;
  const ANGLE_MAX     = 135;
  const ticksEl  = hud.querySelector('#tron-gauge-ticks');
  const labelsEl = hud.querySelector('#tron-gauge-labels');
  const cx = 100, cy = 100;
  for (let s = 0; s <= SPEED_MAX_KMH; s += 10) {
    const t   = s / SPEED_MAX_KMH;
    const ang = (ANGLE_MIN + t * (ANGLE_MAX - ANGLE_MIN) - 90) * Math.PI / 180;
    const major  = s % 20 === 0;
    const rOuter = 88;
    const rInner = major ? 76 : 82;
    const x1 = cx + Math.cos(ang) * rInner;
    const y1 = cy + Math.sin(ang) * rInner;
    const x2 = cx + Math.cos(ang) * rOuter;
    const y2 = cy + Math.sin(ang) * rOuter;
    const stroke = major ? 'rgba(0,240,255,0.9)' : 'rgba(0,240,255,0.35)';
    const width  = major ? 2 : 1;
    ticksEl.insertAdjacentHTML(
      'beforeend',
      `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${width}" stroke-linecap="round"/>`,
    );
    if (major) {
      const rLabel = 66;
      const lx = cx + Math.cos(ang) * rLabel;
      const ly = cy + Math.sin(ang) * rLabel + 4;
      labelsEl.insertAdjacentHTML('beforeend', `<text x="${lx}" y="${ly}">${s}</text>`);
    }
  }

  const speedEl  = hud.querySelector('#tron-speed-val');
  const needleEl = hud.querySelector('#tron-gauge-needle');
  hud.setSpeed = (kmh) => {
    const v = Math.max(0, Math.min(SPEED_MAX_KMH, kmh));
    speedEl.textContent = v;
    const ang = ANGLE_MIN + (v / SPEED_MAX_KMH) * (ANGLE_MAX - ANGLE_MIN);
    needleEl.style.transform = `rotate(${ang}deg)`;
  };

  const lapEl         = hud.querySelector('#tron-lap');
  const timerEl       = hud.querySelector('#tron-timer');
  const bestEl        = hud.querySelector('#tron-best');
  const finishEl      = hud.querySelector('#tron-finish');
  const finishTitleEl = hud.querySelector('#tron-finish-title');
  const finishTotalEl = hud.querySelector('#tron-finish-total');
  const finishBestEl  = hud.querySelector('#tron-finish-best');
  const finishBtnEl   = hud.querySelector('#tron-finish-btn');
  const recEl         = hud.querySelector('#tron-rec');
  const navSvg        = hud.querySelector('#tron-nav-svg');
  const navDist       = hud.querySelector('#tron-nav-dist');
  const standingList  = hud.querySelector('#tron-standings-list');
  const ctrlFwdEl     = hud.querySelector('#tron-ctrl-fwdbwd');
  const ctrlTurnEl    = hud.querySelector('#tron-ctrl-turn');

  const fmt = (ms) => {
    if (ms == null) return '--:--.--';
    const total = Math.max(0, ms);
    const m  = Math.floor(total / 60000);
    const s  = Math.floor((total % 60000) / 1000);
    const cs = Math.floor((total % 1000) / 10);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
  };

  const key = (k) => `<span class="tron-key">${k.toUpperCase()}</span>`;
  hud.setLayout = (layout) => {
    const isQwerty = layout === 'QWERTY';
    const fwd = isQwerty ? 'W' : 'Z';
    const lft = isQwerty ? 'A' : 'Q';
    ctrlFwdEl.innerHTML = `ACCÉLÉRER / FREINER : ${key(fwd)} ${key('S')} / ${key('↑↓')}`;
    ctrlTurnEl.innerHTML = `VIRER : ${key(lft)} ${key('D')} / ${key('←→')}`;
  };

  hud.setLap       = (lap, total) => { lapEl.textContent = `${lap} / ${total}`; };
  hud.setTimer     = (ms) => { timerEl.textContent = fmt(ms); };
  hud.setBestLap   = (ms) => { bestEl.textContent  = fmt(ms); };
  hud.setRecording = (on) => { recEl.style.display = on ? 'flex' : 'none'; };
  hud.setStandings = (racers) => {
    standingList.innerHTML = racers.map((r, i) => {
      const isYou = r.label === 'VOUS';
      return `<div class="tron-srow${isYou ? ' tron-srow-you' : ''}">`
        + `<span class="tron-spos">${i + 1}</span>`
        + `<span class="tron-sname">${r.label}</span>`
        + (r.finished ? '<span class="tron-sdone">✓</span>' : '')
        + '</div>';
    }).join('');
  };
  hud.setArrow = (angleDeg, distM) => {
    navSvg.style.transform = `rotate(${angleDeg}deg)`;
    navDist.textContent    = distM < 1000
      ? `${Math.round(distM)} m`
      : `${(distM / 1000).toFixed(1)} km`;
  };
  hud.showFinish = (totalMs, bestMs, isVictory = true, onBack) => {
    finishTitleEl.textContent = isVictory ? 'VICTOIRE' : 'DÉFAITE';
    finishTitleEl.className   = 'tron-finish-title ' + (isVictory ? 'tron-finish-victory' : 'tron-finish-defeat');
    finishTotalEl.textContent = fmt(totalMs);
    finishBestEl.textContent  = fmt(bestMs);
    finishBtnEl.onclick       = () => onBack?.();
    finishEl.classList.add('show');
  };

  return hud;
}
