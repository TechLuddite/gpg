/**
 * Seedable random numbers (mulberry32).
 *
 * Games use this instead of Math.random so that shuffles and spawn patterns
 * can be replayed exactly in a test.
 */
export function createRng(seed = Date.now()) {
  let a = seed >>> 0;
  return function rng() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fisher-Yates. Returns a new array and leaves the input alone. */
export function shuffle(items, rng = Math.random) {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function pick(items, rng = Math.random) {
  return items[Math.floor(rng() * items.length)];
}

export function randRange(min, max, rng = Math.random) {
  return min + rng() * (max - min);
}
