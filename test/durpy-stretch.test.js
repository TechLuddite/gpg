import test from 'node:test';
import assert from 'node:assert/strict';
import {
  FEATURES, COATS, featureById, emptyOffsets, clampOffset,
  randomOffsets, silliness, captionFor,
} from '../games/durpy-stretch/logic.js';

test('every feature has a unique id and a reach', () => {
  const ids = new Set(FEATURES.map((f) => f.id));
  assert.equal(ids.size, FEATURES.length);
  for (const feature of FEATURES) {
    assert.ok(feature.reach > 0, `${feature.id} can move`);
    assert.equal(featureById(feature.id), feature);
  }
  assert.equal(featureById('tail'), null);
});

test('every coat has the three colours the face needs', () => {
  for (const coat of COATS) {
    assert.match(coat.coat, /^#[0-9a-f]{6}$/i);
    assert.match(coat.stripe, /^#[0-9a-f]{6}$/i);
    assert.match(coat.belly, /^#[0-9a-f]{6}$/i);
  }
});

test('a fresh face has every feature at home', () => {
  const offsets = emptyOffsets();
  assert.equal(Object.keys(offsets).length, FEATURES.length);
  for (const feature of FEATURES) {
    assert.deepEqual(offsets[feature.id], { x: 0, y: 0 });
  }
});

test('a short drag is left alone', () => {
  assert.deepEqual(clampOffset(10, 10, 100), { x: 10, y: 10 });
});

test('a long drag is pulled back onto the limit circle', () => {
  const result = clampOffset(300, 400, 50);
  assert.ok(Math.abs(Math.hypot(result.x, result.y) - 50) < 1e-9);
  // Direction is kept: a 3-4-5 drag stays pointing the same way.
  assert.ok(Math.abs(result.x / result.y - 300 / 400) < 1e-9);
});

test('clamping a zero drag does not divide by zero', () => {
  assert.deepEqual(clampOffset(0, 0, 60), { x: 0, y: 0 });
});

test('clamping is exactly on the boundary at the limit', () => {
  const result = clampOffset(0, 70, 70);
  assert.deepEqual(result, { x: 0, y: 70 });
});

test('random offsets stay within every feature reach', () => {
  for (let seed = 0; seed < 50; seed++) {
    const offsets = randomOffsets(seed);
    for (const feature of FEATURES) {
      const offset = offsets[feature.id];
      const distance = Math.hypot(offset.x, offset.y);
      assert.ok(distance <= feature.reach + 1e-9, `${feature.id} went ${distance} past ${feature.reach}`);
      assert.ok(distance > 0, `${feature.id} actually moved`);
    }
  }
});

test('silliness runs from zero to about one', () => {
  assert.equal(silliness(emptyOffsets()), 0);
  const maxed = Object.fromEntries(FEATURES.map((f) => [f.id, { x: f.reach, y: 0 }]));
  assert.equal(silliness(maxed), 1);
  const scrambled = silliness(randomOffsets(3));
  assert.ok(scrambled > 0 && scrambled < 1);
});

test('silliness copes with a missing feature', () => {
  assert.equal(silliness({}), 0);
});

test('the caption gets sillier as the face does', () => {
  const calm = captionFor(emptyOffsets());
  const maxed = Object.fromEntries(FEATURES.map((f) => [f.id, { x: f.reach, y: 0 }]));
  const wild = captionFor(maxed);
  assert.notEqual(calm, wild);
  assert.equal(typeof calm, 'string');
  assert.ok(wild.length > 0);
});
