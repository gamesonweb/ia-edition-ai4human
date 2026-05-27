import { PATH_STORAGE_KEY } from './config.js';

export function saveIdealPath(path) {
  localStorage.setItem(PATH_STORAGE_KEY, JSON.stringify(path));
}

export function loadIdealPath() {
  try {
    const raw = localStorage.getItem(PATH_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function findNearestForward(path, fromIdx, pos, window = 100) {
  let best = fromIdx, bestD = Infinity;
  const end = Math.min(fromIdx + window, path.length);
  for (let i = fromIdx; i < end; i++) {
    const p = path[i];
    const d = (pos.x - p.x) ** 2 + (pos.z - p.z) ** 2;
    if (d < bestD) { bestD = d; best = i; }
  }
  if (fromIdx + window >= path.length) {
    const wrapEnd = Math.min(window - (path.length - fromIdx), path.length);
    for (let i = 0; i < wrapEnd; i++) {
      const p = path[i];
      const d = (pos.x - p.x) ** 2 + (pos.z - p.z) ** 2;
      if (d < bestD) { bestD = d; best = i; }
    }
  }
  return best;
}

export function getLookaheadPoint(path, fromIdx, distM) {
  let acc = 0;
  let i   = fromIdx;
  const n = path.length;
  while (i < n - 1) {
    const p1 = path[i], p2 = path[(i + 1) % n];
    const d  = Math.sqrt((p2.x - p1.x) ** 2 + (p2.z - p1.z) ** 2);
    if (acc + d >= distM) {
      const t = (distM - acc) / Math.max(d, 0.001);
      return {
        x:     p1.x + (p2.x - p1.x) * t,
        y:     p1.y + (p2.y - p1.y) * t,
        z:     p1.z + (p2.z - p1.z) * t,
        speed: p1.speed + (p2.speed - p1.speed) * t,
      };
    }
    acc += d;
    i = (i + 1) % n;
    if (i === fromIdx) break;
  }
  return path[(fromIdx + 1) % n];
}
