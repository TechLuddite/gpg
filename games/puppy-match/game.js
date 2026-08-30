import { $, $$, setText, formatTime } from '../../shared/ui.js';
import { load, save } from '../../shared/storage.js';
import { createLoop } from '../../shared/loop.js';
import { createGame, flip, resolveMiss, tick, scoreOf, puppyById, LEVELS } from './logic.js';
import { puppySvgBody } from './puppy-art.js';

const BEST_KEY = 'puppy-match:best';
const LEVEL_KEY = 'puppy-match:level';

const els = {
  board: $('#board'),
  moves: $('#moves'),
  time: $('#time'),
  pairs: $('#pairs'),
  best: $('#best'),
  overlay: $('#overlay'),
  overlayTitle: $('#overlay-title'),
  overlayText: $('#overlay-text'),
  again: $('#again'),
  newGame: $('#new-game'),
  announce: $('#announce'),
};

let levelKey = load(LEVEL_KEY, 'easy');
if (!LEVELS[levelKey]) levelKey = 'easy';
let game = createGame(levelKey);
let buttons = [];

/* ---------- Board ---------- */

const PAW = `
  <svg viewBox="0 0 100 100" aria-hidden="true">
    <ellipse cx="50" cy="66" rx="24" ry="20" fill="#fff"/>
    <circle cx="28" cy="40" r="9" fill="#fff"/>
    <circle cx="44" cy="30" r="9" fill="#fff"/>
    <circle cx="62" cy="30" r="9" fill="#fff"/>
    <circle cx="76" cy="42" r="9" fill="#fff"/>
  </svg>`;

function buildBoard() {
  els.board.style.setProperty('--columns', game.level.columns);
  els.board.innerHTML = '';
  buttons = game.cards.map((card, index) => {
    const puppy = puppyById(card.puppyId);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'card';
    button.setAttribute('aria-label', `Card ${index + 1}, face down`);
    button.innerHTML = `
      <span class="card-inner">
        <span class="face face-back">${PAW}</span>
        <span class="face face-front">
          <svg viewBox="0 0 100 100" aria-hidden="true">${puppySvgBody(puppy)}</svg>
        </span>
      </span>`;
    button.addEventListener('click', () => onFlip(index));
    els.board.appendChild(button);
    return button;
  });
  renderCards();
}

function renderCards() {
  game.cards.forEach((card, index) => {
    const button = buttons[index];
    const up = card.matched || game.faceUp.includes(index);
    button.classList.toggle('up', up);
    button.classList.toggle('matched', card.matched);
    const puppy = puppyById(card.puppyId);
    button.setAttribute(
      'aria-label',
      up ? `${puppy.name}${card.matched ? ', matched' : ''}` : `Card ${index + 1}, face down`,
    );
    button.disabled = card.matched;
  });
}

function onFlip(index) {
  const result = flip(game, index);
  if (result === 'ignored') return;
  renderCards();
  updateHud();

  if (result === 'match') {
    const puppy = puppyById(game.cards[index].puppyId);
    els.announce.textContent = `Matched ${puppy.name}.`;
    if (game.won) win();
    return;
  }

  if (result === 'miss') {
    const [a, b] = game.faceUp;
    buttons[a].classList.add('wrong');
    buttons[b].classList.add('wrong');
    setTimeout(() => {
      buttons[a].classList.remove('wrong');
      buttons[b].classList.remove('wrong');
      resolveMiss(game);
      renderCards();
    }, 780);
  }
}

/* ---------- HUD ---------- */

function bestFor(key) {
  const all = load(BEST_KEY, {});
  return all && typeof all === 'object' ? all[key] ?? null : null;
}

function updateHud() {
  setText(els.moves, game.moves);
  setText(els.time, formatTime(game.time));
  setText(els.pairs, `${game.matches} / ${game.level.pairs}`);
  const best = bestFor(game.levelKey);
  setText(els.best, best === null ? '-' : best);
}

function win() {
  loop.stop();
  const score = scoreOf(game);
  const all = load(BEST_KEY, {}) || {};
  const previous = all[game.levelKey] ?? null;
  const isBest = previous === null || score > previous;
  if (isBest) {
    all[game.levelKey] = score;
    save(BEST_KEY, all);
  }
  updateHud();

  els.overlayTitle.textContent = 'Every puppy found';
  els.overlayText.textContent =
    `${game.moves} moves in ${formatTime(game.time)}. Score ${score}.` +
    (isBest ? ' A new best.' : ` Your best on ${game.level.label} is ${previous}.`);
  els.overlay.hidden = false;
  els.announce.textContent = `You won with ${game.moves} moves.`;
}

/* ---------- Controls ---------- */

function newGame(key = levelKey) {
  levelKey = key;
  save(LEVEL_KEY, levelKey);
  game = createGame(levelKey);
  buildBoard();
  updateHud();
  els.overlay.hidden = true;
  syncLevelButtons();
  loop.start();
}

function syncLevelButtons() {
  $$('.levels .btn').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.level === levelKey));
  });
}

$$('.levels .btn').forEach((button) => {
  button.addEventListener('click', () => newGame(button.dataset.level));
});
els.newGame.addEventListener('click', () => newGame());
els.again.addEventListener('click', () => newGame());

const loop = createLoop((dt) => {
  tick(game, dt);
}, () => setText(els.time, formatTime(game.time)));

newGame(levelKey);
