/**
 * Puppy Match - deck building and the flip rules.
 *
 * The deck is a flat array of cards. A card knows which puppy it shows and
 * whether it has been matched; which cards are face up lives on the state so
 * that the view only ever has to read, never work anything out.
 */

import { createRng, shuffle } from '../../shared/rng.js';

/**
 * Twelve puppies, each a set of drawing parameters rather than a picture.
 * The renderer turns these into SVG, so no image files are involved.
 */
export const PUPPIES = [
  { id: 'biscuit', name: 'Biscuit', coat: '#e8944a', ears: 'floppy', earCoat: '#c97a35', patch: 'none',  nose: '#3b2b2b' },
  { id: 'pepper',  name: 'Pepper',  coat: '#5b5170', ears: 'perky', earCoat: '#463d5c', patch: 'eye',   nose: '#241c33' },
  { id: 'cloud',   name: 'Cloud',   coat: '#f2efe9', ears: 'short',  earCoat: '#ddd6cb', patch: 'brow', nose: '#e0567a' },
  { id: 'mocha',   name: 'Mocha',   coat: '#8a5a3b', ears: 'floppy', earCoat: '#6b4229', patch: 'brow', nose: '#3b2b2b' },
  { id: 'sunny',   name: 'Sunny',   coat: '#ffc531', ears: 'perky', earCoat: '#e0a616', patch: 'none',  nose: '#3b2b2b' },
  { id: 'bramble', name: 'Bramble', coat: '#7fa86b', ears: 'floppy', earCoat: '#5f8550', patch: 'eye',   nose: '#3b2b2b' },
  { id: 'ruby',    name: 'Ruby',    coat: '#e05a5a', ears: 'short',  earCoat: '#b53f3f', patch: 'none',  nose: '#241c33' },
  { id: 'nimbus',  name: 'Nimbus',  coat: '#9fb6d1', ears: 'perky', earCoat: '#7e95b0', patch: 'brow', nose: '#241c33' },
  { id: 'toffee',  name: 'Toffee',  coat: '#d9a441', ears: 'short',  earCoat: '#b7861f', patch: 'eye',   nose: '#3b2b2b' },
  { id: 'violet',  name: 'Violet',  coat: '#a48cff', ears: 'floppy', earCoat: '#7f66e0', patch: 'none',  nose: '#e0567a' },
  { id: 'mint',    name: 'Mint',    coat: '#7fd9c0', ears: 'perky', earCoat: '#54b39a', patch: 'brow', nose: '#241c33' },
  { id: 'pip',     name: 'Pip',     coat: '#3b3550', ears: 'short',  earCoat: '#2a2539', patch: 'eye',   nose: '#f2efe9' },
];

export const LEVELS = {
  easy: { label: 'Easy', pairs: 6, columns: 4 },
  medium: { label: 'Medium', pairs: 8, columns: 4 },
  hard: { label: 'Hard', pairs: 12, columns: 6 },
};

export function createGame(levelKey = 'easy', seed = Date.now()) {
  const level = LEVELS[levelKey] || LEVELS.easy;
  const rng = createRng(seed);
  const chosen = shuffle(PUPPIES, rng).slice(0, level.pairs);
  const cards = shuffle(
    chosen.flatMap((puppy, index) => [
      { key: `${puppy.id}-a`, puppyId: puppy.id, pairIndex: index, matched: false },
      { key: `${puppy.id}-b`, puppyId: puppy.id, pairIndex: index, matched: false },
    ]),
    rng,
  );

  return {
    levelKey,
    level,
    cards,
    faceUp: [],
    moves: 0,
    matches: 0,
    time: 0,
    started: false,
    /** Set while a mismatched pair is still showing. */
    locked: false,
    won: false,
  };
}

export function isFaceUp(state, index) {
  return state.faceUp.includes(index) || state.cards[index].matched;
}

/**
 * Turn a card over.
 *
 * Returns one of:
 *   'ignored' - the tap did nothing (locked, already up, already matched)
 *   'flipped' - first card of a pair is now showing
 *   'match'   - the two showing cards are the same puppy
 *   'miss'    - the two showing cards differ; call resolveMiss when the
 *               player has had time to see them
 */
export function flip(state, index) {
  if (state.won || state.locked) return 'ignored';
  const card = state.cards[index];
  if (!card || card.matched || state.faceUp.includes(index)) return 'ignored';

  state.started = true;
  state.faceUp.push(index);

  if (state.faceUp.length < 2) return 'flipped';

  state.moves += 1;
  const [a, b] = state.faceUp;
  if (state.cards[a].puppyId === state.cards[b].puppyId) {
    state.cards[a].matched = true;
    state.cards[b].matched = true;
    state.faceUp = [];
    state.matches += 1;
    if (state.matches === state.level.pairs) state.won = true;
    return 'match';
  }

  state.locked = true;
  return 'miss';
}

/** Turns the mismatched pair back over. Safe to call when nothing is showing. */
export function resolveMiss(state) {
  state.faceUp = [];
  state.locked = false;
}

export function tick(state, dt) {
  if (state.started && !state.won) state.time += dt;
  return state.time;
}

/**
 * A single number for the scoreboard. Perfect play scores 1000; every extra
 * move and every ten seconds chip away at it, and it never goes below 100.
 */
export function scoreOf(state) {
  const perfectMoves = state.level.pairs;
  const movePenalty = Math.max(0, state.moves - perfectMoves) * 12;
  const timePenalty = Math.floor(state.time) * 2;
  return Math.max(100, 1000 - movePenalty - timePenalty);
}

export function puppyById(id) {
  return PUPPIES.find((p) => p.id === id) || null;
}
