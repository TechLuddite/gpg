import test from 'node:test';
import assert from 'node:assert/strict';
import {
  WORLD, LANES, LANE_WIDTH, TRACK_LEFT, PLAYER_Y,
  createRun, laneX, speedAt, spawnIntervalAt,
  moveLeft, moveRight, moveToLane, step, spawn, overlapsPlayer, scoreOf,
} from '../games/unicorn-dash/logic.js';

test('lanes sit inside the track and are evenly spaced', () => {
  for (let lane = 0; lane < LANES; lane++) {
    const x = laneX(lane);
    assert.ok(x > TRACK_LEFT, `lane ${lane} is right of the edge`);
    assert.ok(x < TRACK_LEFT + LANE_WIDTH * LANES, `lane ${lane} is left of the edge`);
  }
  assert.equal(laneX(1) - laneX(0), LANE_WIDTH);
  assert.equal(laneX(2) - laneX(1), LANE_WIDTH);
});

test('a run starts in the middle lane going nowhere', () => {
  const run = createRun(1);
  assert.equal(run.lane, 1);
  assert.equal(run.distance, 0);
  assert.equal(run.stars, 0);
  assert.equal(run.over, false);
});

test('speed rises with distance and then stops', () => {
  assert.ok(speedAt(500) > speedAt(0));
  assert.equal(speedAt(1e9), 150);
});

test('spawns tighten with distance but never below a third of a second', () => {
  assert.ok(spawnIntervalAt(1000) < spawnIntervalAt(0));
  assert.ok(spawnIntervalAt(1e9) >= 0.34);
});

test('you cannot move off the edge of the track', () => {
  const run = createRun(1);
  assert.equal(moveLeft(run), true);
  assert.equal(run.lane, 0);
  assert.equal(moveLeft(run), false, 'no lane to the left of the first');
  assert.equal(run.lane, 0);

  assert.equal(moveRight(run), true);
  assert.equal(moveRight(run), true);
  assert.equal(run.lane, LANES - 1);
  assert.equal(moveRight(run), false, 'no lane to the right of the last');
});

test('moveToLane refuses nonsense and no-ops', () => {
  const run = createRun(1);
  assert.equal(moveToLane(run, 1), false, 'already there');
  assert.equal(moveToLane(run, -1), false);
  assert.equal(moveToLane(run, LANES), false);
  assert.equal(moveToLane(run, 0), true);
  assert.equal(run.lane, 0);
});

test('a crashed run stops accepting input and stops moving', () => {
  const run = createRun(1);
  run.over = true;
  const distance = run.distance;
  step(run, 1);
  assert.equal(run.distance, distance);
  assert.equal(moveLeft(run), false);
});

test('the unicorn slides towards its lane rather than jumping', () => {
  const run = createRun(1);
  moveLeft(run);
  const start = run.playerX;
  step(run, 0.016);
  assert.ok(run.playerX < start, 'moved towards the new lane');
  assert.ok(run.playerX > laneX(0), 'did not arrive instantly');
  for (let i = 0; i < 200; i++) step(run, 0.016);
  assert.ok(Math.abs(run.playerX - laneX(0)) < 1, 'eventually arrives');
});

test('hitting a rock ends the run', () => {
  const run = createRun(2);
  run.entities = [{ kind: 'rock', lane: run.lane, y: PLAYER_Y, variant: 0 }];
  step(run, 0.016);
  assert.equal(run.over, true);
});

test('a rock in another lane is harmless', () => {
  const run = createRun(2);
  run.lane = 0;
  run.playerX = laneX(0);
  run.entities = [{ kind: 'rock', lane: 2, y: PLAYER_Y, variant: 0 }];
  step(run, 0.016);
  assert.equal(run.over, false);
});

test('collecting a star adds one and removes it from the track', () => {
  const run = createRun(2);
  run.entities = [{ kind: 'star', lane: run.lane, y: PLAYER_Y, wobble: 0 }];
  step(run, 0.016);
  assert.equal(run.stars, 1);
  assert.equal(run.justCollected, true);
  assert.equal(run.entities.filter((e) => e.kind === 'star').length, 0);
  assert.equal(run.over, false);
});

test('entities that fall off the bottom are cleared away', () => {
  const run = createRun(2);
  run.entities = [{ kind: 'rock', lane: 0, y: WORLD.height + 25, variant: 0 }];
  run.lane = 2;
  run.playerX = laneX(2);
  step(run, 0.016);
  assert.equal(run.entities.length, 0);
});

test('a rock and a star never spawn in the same lane in the same wave', () => {
  const run = createRun(77);
  for (let i = 0; i < 3000; i++) {
    run.distance = i * 0.4;
    const wave = spawn(run);
    const rocks = wave.filter((e) => e.kind === 'rock').map((e) => e.lane);
    const stars = wave.filter((e) => e.kind === 'star').map((e) => e.lane);
    for (const lane of stars) {
      assert.ok(!rocks.includes(lane), 'a star was buried inside a rock');
    }
  }
});

test('a wave never blocks every lane, so there is always a way through', () => {
  const run = createRun(123);
  for (let i = 0; i < 5000; i++) {
    run.distance = i * 0.4;
    const wave = spawn(run);
    const blocked = new Set(wave.filter((e) => e.kind === 'rock').map((e) => e.lane));
    assert.ok(blocked.size < LANES, 'all three lanes were blocked by one wave');
  }
});

test('score is distance plus ten a star', () => {
  const run = createRun(1);
  run.distance = 240.7;
  run.stars = 3;
  assert.equal(scoreOf(run), 240 + 30);
});

test('the same seed produces the same run', () => {
  const play = (seed) => {
    const run = createRun(seed);
    for (let i = 0; i < 600 && !run.over; i++) step(run, 0.016);
    return `${Math.round(run.distance)}:${run.stars}:${run.entities.length}`;
  };
  assert.equal(play(9), play(9));
});

test('overlapsPlayer is generous with stars and strict with rocks', () => {
  const run = createRun(1);
  const offset = { lane: run.lane, y: PLAYER_Y + 20 };
  assert.equal(overlapsPlayer(run, { ...offset, kind: 'star' }), true);
  assert.equal(overlapsPlayer(run, { ...offset, kind: 'rock' }), false);
});
