import test from 'node:test';
import assert from 'node:assert/strict';
import { createRng, shuffle, pick, randRange } from '../shared/rng.js';
import { formatTime } from '../shared/ui.js';
import { games, gameBySlug } from '../shared/games.js';

test('the same seed gives the same numbers', () => {
  const a = createRng(42);
  const b = createRng(42);
  for (let i = 0; i < 100; i++) assert.equal(a(), b());
});

test('different seeds diverge', () => {
  const a = createRng(1);
  const b = createRng(2);
  assert.notEqual(a(), b());
});

test('random numbers stay in range and spread out', () => {
  const rng = createRng(7);
  const buckets = new Array(10).fill(0);
  for (let i = 0; i < 10000; i++) {
    const value = rng();
    assert.ok(value >= 0 && value < 1, `${value} out of range`);
    buckets[Math.floor(value * 10)] += 1;
  }
  for (const count of buckets) {
    assert.ok(count > 700, `uneven distribution: a bucket had only ${count}`);
  }
});

test('shuffle keeps every item and leaves the original alone', () => {
  const input = [1, 2, 3, 4, 5, 6, 7, 8];
  const output = shuffle(input, createRng(3));
  assert.deepEqual(input, [1, 2, 3, 4, 5, 6, 7, 8]);
  assert.deepEqual([...output].sort((a, b) => a - b), input);
});

test('shuffle actually reorders', () => {
  const input = Array.from({ length: 30 }, (_, i) => i);
  assert.notDeepEqual(shuffle(input, createRng(11)), input);
});

test('pick returns a member of the list', () => {
  const items = ['a', 'b', 'c'];
  const rng = createRng(5);
  for (let i = 0; i < 50; i++) assert.ok(items.includes(pick(items, rng)));
});

test('randRange stays between its bounds', () => {
  const rng = createRng(6);
  for (let i = 0; i < 500; i++) {
    const value = randRange(4, 9, rng);
    assert.ok(value >= 4 && value < 9);
  }
});

test('formatTime reads as minutes, seconds and tenths', () => {
  assert.equal(formatTime(0), '0:00.0');
  assert.equal(formatTime(9.45), '0:09.4');
  assert.equal(formatTime(61.2), '1:01.2');
  assert.equal(formatTime(600), '10:00.0');
});

test('the games manifest is complete and unique', () => {
  assert.equal(games.length, 7);
  const slugs = new Set(games.map((g) => g.slug));
  assert.equal(slugs.size, games.length);
  for (const game of games) {
    assert.ok(game.title, `${game.slug} has a title`);
    assert.ok(game.blurb, `${game.slug} has a blurb`);
    assert.match(game.tint, /^#[0-9a-f]{6}$/i, `${game.slug} has a colour`);
    assert.match(game.art, /<(circle|ellipse|path|rect)/, `${game.slug} has artwork`);
    assert.equal(gameBySlug(game.slug), game);
  }
  assert.equal(gameBySlug('nope'), null);
});

test('no artwork points at an external file', () => {
  for (const game of games) {
    assert.doesNotMatch(game.art, /<image|href=|url\(/i, `${game.slug} must draw its own art`);
  }
});
