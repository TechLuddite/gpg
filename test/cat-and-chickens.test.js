import test from 'node:test';
import assert from 'node:assert/strict';
import {
  COOP_X, GRASS_TOP, GRASS_BOTTOM, START_CHICKENS, CATS_PER_ROUND, MAX_ROUND,
  createGame, round, catSpeed, spawnInterval, bigCatChance,
  spawnCat, step, catAt, shooAt,
} from '../games/cat-and-chickens/logic.js';

test('a new game has three chickens and no cats', () => {
  const game = createGame(1);
  assert.equal(game.chickens, START_CHICKENS);
  assert.equal(game.cats.length, 0);
  assert.equal(game.over, false);
});

test('rounds climb with cats shooed and then stop', () => {
  const game = createGame(1);
  assert.equal(round(game), 1);
  game.shooed = CATS_PER_ROUND;
  assert.equal(round(game), 2);
  game.shooed = 10000;
  assert.equal(round(game), MAX_ROUND);
});

test('later rounds are faster and spawn more often', () => {
  assert.ok(catSpeed(5) > catSpeed(1));
  assert.ok(spawnInterval(5) < spawnInterval(1));
  assert.ok(spawnInterval(50) >= 0.5, 'spawn interval never drops below half a second');
});

test('big cats only appear from round four', () => {
  assert.equal(bigCatChance(1), 0);
  assert.equal(bigCatChance(3), 0);
  assert.ok(bigCatChance(6) > 0);
  assert.ok(bigCatChance(30) <= 0.35);
});

test('a spawned cat starts off the left edge inside the grass', () => {
  const game = createGame(7);
  const cat = spawnCat(game);
  assert.ok(cat.x < 0, 'starts off screen');
  assert.ok(cat.y >= GRASS_TOP, 'below the horizon');
  assert.ok(cat.y + cat.height <= GRASS_BOTTOM, 'above the bottom edge');
  assert.equal(cat.fleeing, false);
});

test('a cat that reaches the coop takes a chicken and leaves', () => {
  const game = createGame(3);
  const cat = spawnCat(game);
  cat.x = COOP_X - cat.width + 1;
  step(game, 0.1);
  assert.equal(game.chickens, START_CHICKENS - 1);
  assert.equal(game.cats.length, 0);
  assert.equal(game.justLost, true);
});

test('losing the last chicken ends the game', () => {
  const game = createGame(3);
  game.chickens = 1;
  const cat = spawnCat(game);
  cat.x = COOP_X;
  step(game, 0.05);
  assert.equal(game.chickens, 0);
  assert.equal(game.over, true);
});

test('a normal cat is shooed in one tap and scores', () => {
  const game = createGame(11);
  const cat = spawnCat(game);
  cat.kind = 'normal';
  cat.health = 1;
  cat.x = 200;
  cat.y = 200;

  const result = shooAt(game, cat.x + cat.width / 2, cat.y + cat.height / 2);
  assert.ok(result, 'the tap should hit');
  assert.equal(result.shooed, true);
  assert.ok(result.points > 0);
  assert.equal(game.score, result.points);
  assert.equal(game.shooed, 1);
  assert.equal(cat.fleeing, true);
});

test('a big cat needs two taps', () => {
  const game = createGame(11);
  const cat = spawnCat(game);
  cat.kind = 'big';
  cat.health = 2;
  cat.x = 300;
  cat.y = 200;
  const mid = () => [cat.x + cat.width / 2, cat.y + cat.height / 2];

  const first = shooAt(game, ...mid());
  assert.equal(first.shooed, false);
  assert.equal(game.score, 0);

  const second = shooAt(game, ...mid());
  assert.equal(second.shooed, true);
  assert.ok(game.score > 0);
});

test('a tap on empty grass hits nothing', () => {
  const game = createGame(2);
  assert.equal(shooAt(game, 10, 10), null);
  assert.equal(game.score, 0);
});

test('a fleeing cat cannot be hit again and is harmless', () => {
  const game = createGame(5);
  const cat = spawnCat(game);
  cat.x = 300;
  cat.y = 200;
  shooAt(game, cat.x + cat.width / 2, cat.y + cat.height / 2);
  const scoreAfterFirst = game.score;

  assert.equal(catAt(game, cat.x + cat.width / 2, cat.y + cat.height / 2), null);
  for (let i = 0; i < 200; i++) step(game, 0.05);
  assert.equal(game.score, scoreAfterFirst);
  assert.ok(game.chickens > 0 || game.over, 'the fleeing cat did not eat anything');
});

test('when cats overlap the one nearest the coop is hit first', () => {
  const game = createGame(9);
  const behind = spawnCat(game);
  behind.x = 200; behind.y = 200; behind.width = 88; behind.height = 56;
  const ahead = spawnCat(game);
  ahead.x = 230; ahead.y = 200; ahead.width = 88; ahead.height = 56;

  const hit = catAt(game, 250, 220);
  assert.equal(hit.id, ahead.id);
});

test('the game does not step once it is over', () => {
  const game = createGame(4);
  game.over = true;
  const snapshot = game.time;
  step(game, 1);
  assert.equal(game.time, snapshot);
  assert.equal(shooAt(game, 0, 0), null);
});

test('the same seed produces the same run', () => {
  const play = (seed) => {
    const game = createGame(seed);
    for (let i = 0; i < 400; i++) step(game, 0.05);
    return game.cats.map((cat) => `${cat.kind}:${Math.round(cat.x)}:${Math.round(cat.y)}`);
  };
  assert.deepEqual(play(42), play(42));
  assert.notDeepEqual(play(42), play(43));
});
