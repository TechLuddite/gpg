/**
 * Unicorn Dash - a three lane runner.
 *
 * The world is 160 by 240 units, which is also the canvas size in pixels. The
 * canvas is then scaled up with image-rendering: pixelated, so the chunky look
 * is the real resolution rather than a filter over a smooth one.
 */

import { createRng, randRange } from '../../shared/rng.js';

export const WORLD = { width: 160, height: 240 };
export const LANES = 3;
export const LANE_WIDTH = 40;
export const TRACK_LEFT = 20;
export const PLAYER_Y = 186;
export const PLAYER_SIZE = { width: 26, height: 30 };

export function laneX(lane) {
  return TRACK_LEFT + lane * LANE_WIDTH + LANE_WIDTH / 2;
}

export function createRun(seed = Date.now()) {
  return {
    rng: createRng(seed),
    lane: 1,
    playerX: laneX(1),
    distance: 0,
    stars: 0,
    entities: [],
    spawnTimer: 0.8,
    time: 0,
    over: false,
    /** Set for one step on a pickup so the view can sparkle. */
    justCollected: false,
  };
}

/** Metres per second. Climbs steadily and then stops at double the start. */
export function speedAt(distance) {
  return Math.min(150, 62 + distance * 0.09);
}

/** Seconds between spawns, tightening as the run goes on. */
export function spawnIntervalAt(distance) {
  return Math.max(0.34, 0.9 - distance * 0.0006);
}

export function moveLeft(state) {
  if (state.over || state.lane === 0) return false;
  state.lane -= 1;
  return true;
}

export function moveRight(state) {
  if (state.over || state.lane === LANES - 1) return false;
  state.lane += 1;
  return true;
}

export function moveToLane(state, lane) {
  if (state.over || lane < 0 || lane >= LANES || lane === state.lane) return false;
  state.lane = lane;
  return true;
}

/**
 * Spawns one wave.
 *
 * The rules that keep it fair: a star is never put in a lane that a rock is
 * taking, and a second rock is only added when there is no star in the wave,
 * so with three lanes there is always at least one gap to aim at.
 *
 * Returns the entities it created, which is what the test inspects.
 */
export function spawn(state) {
  const created = [];
  const rockLane = Math.floor(state.rng() * LANES);
  created.push({ kind: 'rock', lane: rockLane, y: -16, variant: Math.floor(state.rng() * 3) });

  const wantsStar = state.rng() < 0.28;
  if (wantsStar) {
    const starLane = (rockLane + 1 + Math.floor(state.rng() * (LANES - 1))) % LANES;
    created.push({ kind: 'star', lane: starLane, y: -14, wobble: state.rng() * 6.28 });
  } else if (state.distance > 350 && state.rng() < 0.34) {
    const second = (rockLane + 1 + Math.floor(state.rng() * (LANES - 1))) % LANES;
    created.push({
      kind: 'rock',
      lane: second,
      y: -16 - randRange(10, 30, state.rng),
      variant: Math.floor(state.rng() * 3),
    });
  }

  state.entities.push(...created);
  return created;
}

export function step(state, dt) {
  if (state.over) return state;
  state.time += dt;
  state.justCollected = false;

  const speed = speedAt(state.distance);
  state.distance += speed * dt * 0.1;

  // Ease the unicorn across rather than teleporting it.
  const target = laneX(state.lane);
  state.playerX += (target - state.playerX) * Math.min(1, dt * 14);

  state.spawnTimer -= dt;
  if (state.spawnTimer <= 0) {
    spawn(state);
    state.spawnTimer = spawnIntervalAt(state.distance) * randRange(0.85, 1.2, state.rng);
  }

  for (const entity of state.entities) entity.y += speed * dt;

  const kept = [];
  for (const entity of state.entities) {
    if (entity.y > WORLD.height + 20) continue;
    if (overlapsPlayer(state, entity)) {
      if (entity.kind === 'star') {
        state.stars += 1;
        state.justCollected = true;
        continue;
      }
      state.over = true;
    }
    kept.push(entity);
  }
  state.entities = kept;
  return state;
}

/** Hit test against the player. Generous by a couple of pixels on the star. */
export function overlapsPlayer(state, entity) {
  const pad = entity.kind === 'star' ? 4 : -3;
  const dx = Math.abs(laneX(entity.lane) - state.playerX);
  const dy = Math.abs(entity.y - PLAYER_Y);
  return dx < LANE_WIDTH / 2 + pad && dy < PLAYER_SIZE.height / 2 + 8 + pad;
}

export function scoreOf(state) {
  return Math.floor(state.distance) + state.stars * 10;
}
