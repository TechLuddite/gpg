/**
 * Corgi Butt Clicker - all of the rules, none of the drawing.
 *
 * Kept separate from game.js so the numbers can be tested in node and so that
 * balancing the game means editing one table rather than hunting through the
 * rendering code.
 */

export const UPGRADES = [
  { id: 'belly-rub',   name: 'Belly Rub',      blurb: 'He rolls over. Fluff happens.',        baseCost: 15,     growth: 1.15, perClick: 1,  perSecond: 0 },
  { id: 'squeaky',     name: 'Squeaky Toy',    blurb: 'Squeak. Squeak. Squeak. Squeak.',      baseCost: 50,     growth: 1.16, perClick: 0,  perSecond: 0.5 },
  { id: 'friend',      name: 'Corgi Friend',   blurb: 'Two butts are better than one.',       baseCost: 320,    growth: 1.17, perClick: 0,  perSecond: 3 },
  { id: 'brush',       name: 'Fluff Brush',    blurb: 'Every stroke is worth five.',          baseCost: 1400,   growth: 1.18, perClick: 5,  perSecond: 0 },
  { id: 'salon',       name: 'Grooming Salon', blurb: 'Appointments all day long.',           baseCost: 6000,   growth: 1.18, perClick: 0,  perSecond: 20 },
  { id: 'parade',      name: 'Corgi Parade',   blurb: 'Short legs, long line.',               baseCost: 52000,  growth: 1.20, perClick: 0,  perSecond: 130 },
  { id: 'factory',     name: 'Fluff Factory',  blurb: 'Industrial quantities of floof.',      baseCost: 460000, growth: 1.22, perClick: 0,  perSecond: 900 },
];

export const UPGRADE_BY_ID = Object.fromEntries(UPGRADES.map((u) => [u.id, u]));

export function createState() {
  return { fluff: 0, earned: 0, clicks: 0, owned: {}, zoomies: 0 };
}

/** Prices climb geometrically, which is what stops the game ending. */
export function costOf(upgradeId, owned) {
  const upgrade = UPGRADE_BY_ID[upgradeId];
  if (!upgrade) return Infinity;
  return Math.ceil(upgrade.baseCost * Math.pow(upgrade.growth, owned));
}

export function ownedCount(state, upgradeId) {
  return state.owned[upgradeId] || 0;
}

export function perClick(state) {
  return UPGRADES.reduce(
    (total, u) => total + u.perClick * ownedCount(state, u.id),
    1,
  );
}

export function perSecond(state) {
  return UPGRADES.reduce(
    (total, u) => total + u.perSecond * ownedCount(state, u.id),
    0,
  );
}

export function canAfford(state, upgradeId) {
  return state.fluff >= costOf(upgradeId, ownedCount(state, upgradeId));
}

/** Returns the amount added, so the caller can float a "+N" over the corgi. */
export function click(state) {
  const gain = perClick(state);
  state.fluff += gain;
  state.earned += gain;
  state.clicks += 1;
  return gain;
}

/** Buys one. Returns true only if it actually happened. */
export function buy(state, upgradeId) {
  if (!UPGRADE_BY_ID[upgradeId]) return false;
  const owned = ownedCount(state, upgradeId);
  const cost = costOf(upgradeId, owned);
  if (state.fluff < cost) return false;
  state.fluff -= cost;
  state.owned[upgradeId] = owned + 1;
  return true;
}

export function tick(state, dt) {
  const gain = perSecond(state) * dt;
  state.fluff += gain;
  state.earned += gain;
  return gain;
}

/**
 * A zoomie is the bonus corgi that runs across the screen. It pays whichever
 * is larger: thirty seconds of income, or a flat amount that keeps it worth
 * catching in the first minute of a new game.
 */
export function zoomieReward(state) {
  return Math.max(25, Math.round(perSecond(state) * 30));
}

export function collectZoomie(state) {
  const reward = zoomieReward(state);
  state.fluff += reward;
  state.earned += reward;
  state.zoomies += 1;
  return reward;
}

const SUFFIXES = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi'];

/** 1234567 becomes "1.23M". Small numbers stay whole. */
export function formatNumber(value) {
  if (!isFinite(value)) return '∞';
  const n = Math.floor(value);
  if (n < 1000) return String(n);
  let tier = 0;
  let scaled = n;
  while (scaled >= 1000 && tier < SUFFIXES.length - 1) {
    scaled /= 1000;
    tier += 1;
  }
  const decimals = scaled < 10 ? 2 : scaled < 100 ? 1 : 0;
  return scaled.toFixed(decimals) + SUFFIXES[tier];
}

/** Older saves are missing fields. Merge rather than trust what is on disk. */
export function hydrate(raw) {
  const state = createState();
  if (!raw || typeof raw !== 'object') return state;
  state.fluff = Number(raw.fluff) || 0;
  state.earned = Number(raw.earned) || state.fluff;
  state.clicks = Number(raw.clicks) || 0;
  state.zoomies = Number(raw.zoomies) || 0;
  if (raw.owned && typeof raw.owned === 'object') {
    for (const upgrade of UPGRADES) {
      const count = Number(raw.owned[upgrade.id]);
      if (Number.isFinite(count) && count > 0) {
        state.owned[upgrade.id] = Math.floor(count);
      }
    }
  }
  return state;
}
