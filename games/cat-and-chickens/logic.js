/**
 * Don't Let the Cat Eat the Chickens - the rules.
 *
 * Everything here works on a plain state object in a fixed 800x460 world, with
 * no reference to a canvas or the DOM. game.js scales that world to whatever
 * space the screen has and draws it; this file decides what happens.
 */

import { createRng, randRange } from '../../shared/rng.js';

export const WORLD = { width: 800, height: 460 };

/** Cats walk in from the left and are dangerous once they touch the coop. */
export const COOP_X = 636;
export const GRASS_TOP = 150;
export const GRASS_BOTTOM = 404;

export const START_CHICKENS = 3;

/** Rounds tick over every six cats shooed, and stop climbing at twelve. */
export const CATS_PER_ROUND = 6;
export const MAX_ROUND = 12;

const CAT_SIZES = {
  normal: { width: 88, height: 56, health: 1, points: 10 },
  big: { width: 116, height: 74, health: 2, points: 30 },
};

export function createGame(seed = Date.now()) {
  return {
    rng: createRng(seed),
    time: 0,
    score: 0,
    shooed: 0,
    chickens: START_CHICKENS,
    cats: [],
    spawnTimer: 1.2,
    nextId: 1,
    over: false,
    /** Set for one step when a chicken is taken, so the view can flash. */
    justLost: false,
  };
}

export function round(state) {
  return Math.min(MAX_ROUND, 1 + Math.floor(state.shooed / CATS_PER_ROUND));
}

/** Pixels per second. Round 1 is a stroll, round 12 is a problem. */
export function catSpeed(roundNumber) {
  return 44 + roundNumber * 11;
}

/** Seconds between spawns. Never drops below half a second. */
export function spawnInterval(roundNumber) {
  return Math.max(0.5, 2.3 - roundNumber * 0.14);
}

/** Big cats need two shoos and only start showing up from round four. */
export function bigCatChance(roundNumber) {
  return roundNumber < 4 ? 0 : Math.min(0.35, (roundNumber - 3) * 0.06);
}

export function spawnCat(state) {
  const r = round(state);
  const kind = state.rng() < bigCatChance(r) ? 'big' : 'normal';
  const size = CAT_SIZES[kind];
  const y = randRange(GRASS_TOP, GRASS_BOTTOM - size.height, state.rng);
  const speed = catSpeed(r) * randRange(0.85, 1.15, state.rng);
  const cat = {
    id: state.nextId++,
    kind,
    x: -size.width,
    y,
    width: size.width,
    height: size.height,
    speed,
    health: size.health,
    points: size.points,
    fleeing: false,
    /** Phase offset so the cats do not all bob in unison. */
    wobble: state.rng() * Math.PI * 2,
  };
  state.cats.push(cat);
  return cat;
}

export function step(state, dt) {
  if (state.over) return state;
  state.time += dt;
  state.justLost = false;

  state.spawnTimer -= dt;
  if (state.spawnTimer <= 0) {
    spawnCat(state);
    const r = round(state);
    state.spawnTimer = spawnInterval(r) * randRange(0.75, 1.3, state.rng);
  }

  for (const cat of state.cats) {
    if (cat.fleeing) {
      cat.x -= cat.speed * 2.6 * dt;
    } else {
      cat.x += cat.speed * dt;
      if (cat.x + cat.width >= COOP_X) {
        cat.reachedCoop = true;
      }
    }
  }

  const survivors = [];
  for (const cat of state.cats) {
    if (cat.reachedCoop) {
      state.chickens -= 1;
      state.justLost = true;
      continue;
    }
    if (cat.fleeing && cat.x + cat.width < 0) continue;
    survivors.push(cat);
  }
  state.cats = survivors;

  if (state.chickens <= 0) {
    state.chickens = 0;
    state.over = true;
  }
  return state;
}

/** Cat under the point, nearest the coop first, so the urgent one is hit. */
export function catAt(state, x, y) {
  let found = null;
  for (const cat of state.cats) {
    if (cat.fleeing) continue;
    const pad = 8; // fingers are not precise
    const inside =
      x >= cat.x - pad &&
      x <= cat.x + cat.width + pad &&
      y >= cat.y - pad &&
      y <= cat.y + cat.height + pad;
    if (inside && (!found || cat.x > found.x)) found = cat;
  }
  return found;
}

/**
 * Shoo at a point. Returns { cat, shooed, points } or null when the tap
 * missed, so the view can decide between a puff of dust and nothing.
 */
export function shooAt(state, x, y) {
  if (state.over) return null;
  const cat = catAt(state, x, y);
  if (!cat) return null;

  cat.health -= 1;
  if (cat.health > 0) {
    // A big cat backs off a little on the first hit but keeps coming.
    cat.x -= 42;
    return { cat, shooed: false, points: 0 };
  }

  cat.fleeing = true;
  const points = cat.points + round(state) * 2;
  state.score += points;
  state.shooed += 1;
  return { cat, shooed: true, points };
}
