/**
 * Tiny wrapper over localStorage. Every game keeps its scores on the device;
 * GitHub Pages has no server, so there is nowhere else for them to go.
 *
 * Every call is guarded: private browsing and "block site data" both make
 * localStorage throw rather than return null, and a thrown error there must
 * never stop a game from starting.
 */

const PREFIX = 'graces-playground:';

export function load(key, fallback) {
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    if (raw === null) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function save(key, value) {
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function clear(key) {
  try {
    window.localStorage.removeItem(PREFIX + key);
    return true;
  } catch {
    return false;
  }
}

/** Keeps a "best" value, only writing when the new one wins. */
export function recordBest(key, value, { lowerIsBetter = false } = {}) {
  const current = load(key, null);
  const better =
    current === null ||
    (lowerIsBetter ? value < current : value > current);
  if (better) save(key, value);
  return better ? value : current;
}
