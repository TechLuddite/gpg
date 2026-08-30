import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PUPPIES, LEVELS, createGame, flip, resolveMiss, tick, scoreOf, puppyById,
} from '../games/puppy-match/logic.js';

const indicesOfPair = (game) => {
  const first = 0;
  const match = game.cards.findIndex(
    (card, i) => i !== first && card.puppyId === game.cards[first].puppyId,
  );
  const mismatch = game.cards.findIndex(
    (card) => card.puppyId !== game.cards[first].puppyId,
  );
  return { first, match, mismatch };
};

test('every level has enough puppies to fill it', () => {
  for (const level of Object.values(LEVELS)) {
    assert.ok(level.pairs <= PUPPIES.length, `${level.label} needs ${level.pairs} puppies`);
  }
});

test('puppy ids are unique', () => {
  const ids = new Set(PUPPIES.map((p) => p.id));
  assert.equal(ids.size, PUPPIES.length);
});

test('a deck has two of each puppy and nothing else', () => {
  const game = createGame('medium', 1);
  assert.equal(game.cards.length, LEVELS.medium.pairs * 2);
  const counts = {};
  for (const card of game.cards) counts[card.puppyId] = (counts[card.puppyId] || 0) + 1;
  assert.equal(Object.keys(counts).length, LEVELS.medium.pairs);
  assert.ok(Object.values(counts).every((n) => n === 2));
});

test('the same seed deals the same deck and a different seed does not', () => {
  const keys = (seed) => createGame('easy', seed).cards.map((c) => c.key).join(',');
  assert.equal(keys(5), keys(5));
  assert.notEqual(keys(5), keys(6));
});

test('an unknown level falls back to easy rather than breaking', () => {
  const game = createGame('impossible', 1);
  assert.equal(game.level.pairs, LEVELS.easy.pairs);
});

test('a matching pair stays face up and counts', () => {
  const game = createGame('easy', 2);
  const { first, match } = indicesOfPair(game);
  assert.equal(flip(game, first), 'flipped');
  assert.equal(flip(game, match), 'match');
  assert.equal(game.matches, 1);
  assert.equal(game.moves, 1);
  assert.ok(game.cards[first].matched && game.cards[match].matched);
  assert.deepEqual(game.faceUp, []);
});

test('a mismatch locks the board until it is resolved', () => {
  const game = createGame('easy', 2);
  const { first, mismatch } = indicesOfPair(game);
  flip(game, first);
  assert.equal(flip(game, mismatch), 'miss');
  assert.equal(game.locked, true);

  const other = game.cards.findIndex((_, i) => i !== first && i !== mismatch);
  assert.equal(flip(game, other), 'ignored', 'no third card while locked');

  resolveMiss(game);
  assert.equal(game.locked, false);
  assert.deepEqual(game.faceUp, []);
  assert.equal(flip(game, other), 'flipped');
});

test('the same card cannot be flipped twice', () => {
  const game = createGame('easy', 3);
  assert.equal(flip(game, 0), 'flipped');
  assert.equal(flip(game, 0), 'ignored');
  assert.equal(game.moves, 0);
});

test('a matched card cannot be flipped again', () => {
  const game = createGame('easy', 4);
  const { first, match } = indicesOfPair(game);
  flip(game, first);
  flip(game, match);
  assert.equal(flip(game, first), 'ignored');
});

test('matching every pair wins', () => {
  const game = createGame('easy', 8);
  const seen = new Map();
  game.cards.forEach((card, index) => {
    const partner = seen.get(card.puppyId);
    if (partner === undefined) seen.set(card.puppyId, index);
    else {
      flip(game, partner);
      flip(game, index);
    }
  });
  assert.equal(game.won, true);
  assert.equal(game.matches, LEVELS.easy.pairs);
  assert.equal(flip(game, 0), 'ignored', 'a won board takes no more flips');
});

test('the clock only runs once the first card is turned', () => {
  const game = createGame('easy', 9);
  tick(game, 5);
  assert.equal(game.time, 0);
  flip(game, 0);
  tick(game, 5);
  assert.equal(game.time, 5);
});

test('scores reward fewer moves and less time, and never go below 100', () => {
  const perfect = createGame('easy', 1);
  perfect.moves = perfect.level.pairs;
  perfect.time = 0;
  assert.equal(scoreOf(perfect), 1000);

  const sloppy = createGame('easy', 1);
  sloppy.moves = perfect.level.pairs + 10;
  sloppy.time = 30;
  assert.ok(scoreOf(sloppy) < 1000);

  const terrible = createGame('easy', 1);
  terrible.moves = 500;
  terrible.time = 9999;
  assert.equal(scoreOf(terrible), 100);
});

test('every card in a deck maps back to a real puppy', () => {
  const game = createGame('hard', 12);
  for (const card of game.cards) {
    assert.ok(puppyById(card.puppyId), `${card.puppyId} should exist`);
  }
});
