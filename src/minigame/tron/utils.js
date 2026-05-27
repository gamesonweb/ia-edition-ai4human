export function fmtMs(ms) {
  const m  = Math.floor(ms / 60000);
  const s  = Math.floor((ms % 60000) / 1000);
  const cs = Math.floor((ms % 1000) / 10);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
}

export function showRaceToast(msg, duration = 2500) {
  let el = document.getElementById('tron-race-toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'tron-race-toast';
    Object.assign(el.style, {
      position:       'fixed',
      top:            '18%',
      left:           '50%',
      transform:      'translateX(-50%)',
      background:     'rgba(0, 20, 40, 0.88)',
      color:          '#ff00cc',
      fontFamily:     'monospace',
      fontSize:       '18px',
      fontWeight:     'bold',
      letterSpacing:  '2px',
      padding:        '10px 28px',
      border:         '1px solid #ff00cc',
      borderRadius:   '4px',
      zIndex:         '9999',
      pointerEvents:  'none',
      textAlign:      'center',
      transition:     'opacity 0.3s',
    });
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.style.opacity = '1';
  clearTimeout(el._hideTimer);
  el._hideTimer = setTimeout(() => { el.style.opacity = '0'; }, duration);
}

export function showCoordsToast(msg) {
  let el = document.getElementById('tron-coords-toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'tron-coords-toast';
    Object.assign(el.style, {
      position:      'fixed',
      bottom:        '80px',
      left:          '50%',
      transform:     'translateX(-50%)',
      background:    'rgba(0,20,40,0.85)',
      color:         '#00eeff',
      fontFamily:    'monospace',
      fontSize:      '14px',
      padding:       '6px 16px',
      border:        '1px solid #00eeff',
      borderRadius:  '4px',
      zIndex:        '9999',
      pointerEvents: 'none',
      letterSpacing: '1px',
    });
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.style.opacity = '1';
  clearTimeout(el._hideTimer);
  el._hideTimer = setTimeout(() => { el.style.opacity = '0'; }, 3000);
}
