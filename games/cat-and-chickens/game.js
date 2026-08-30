import { $, setText, fitCanvas, pointerPos } from '../../shared/ui.js';
import { load, recordBest } from '../../shared/storage.js';
import { createLoop } from '../../shared/loop.js';
import {
  WORLD, COOP_X, GRASS_TOP, GRASS_BOTTOM, START_CHICKENS,
  createGame, step, shooAt, round,
} from './logic.js';

const BEST_KEY = 'cat-and-chickens:best';

const canvas = $('#canvas');
const ctx = canvas.getContext('2d');
const els = {
  score: $('#score'),
  round: $('#round'),
  chickens: $('#chickens'),
  best: $('#best'),
  overlay: $('#overlay'),
  overlayTitle: $('#overlay-title'),
  overlayText: $('#overlay-text'),
  start: $('#start'),
  pause: $('#pause'),
  stage: document.querySelector('.stage'),
  announce: $('#announce'),
};

let game = createGame();
let puffs = [];
let labels = [];
let scale = 1;
let playing = false;

setText(els.best, load(BEST_KEY, 0));

fitCanvas(canvas, (width) => {
  scale = width / WORLD.width;
  draw();
});

/* ---------- Drawing ---------- */

const CAT_COATS = [
  { body: '#8a7bb8', belly: '#c9bfe6' },
  { body: '#5b5170', belly: '#a79dc0' },
  { body: '#e8944a', belly: '#f7d0a5' },
  { body: '#3f3a52', belly: '#7e7793' },
  { body: '#c2c7d6', belly: '#eef0f6' },
];

function coatFor(cat) {
  return CAT_COATS[cat.id % CAT_COATS.length];
}

function drawBackground() {
  // Sky
  const sky = ctx.createLinearGradient(0, 0, 0, GRASS_TOP + 40);
  sky.addColorStop(0, '#a8ddff');
  sky.addColorStop(1, '#e4f4ff');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, WORLD.width, GRASS_TOP + 40);

  // Sun
  ctx.fillStyle = '#ffd766';
  ctx.beginPath();
  ctx.arc(84, 62, 34, 0, Math.PI * 2);
  ctx.fill();

  // Hills
  ctx.fillStyle = '#7fcf9a';
  ctx.beginPath();
  ctx.moveTo(0, GRASS_TOP + 6);
  ctx.quadraticCurveTo(150, 74, 320, GRASS_TOP + 6);
  ctx.quadraticCurveTo(500, 60, 800, GRASS_TOP + 6);
  ctx.lineTo(800, GRASS_TOP + 40);
  ctx.lineTo(0, GRASS_TOP + 40);
  ctx.closePath();
  ctx.fill();

  // Grass
  ctx.fillStyle = '#8fd97f';
  ctx.fillRect(0, GRASS_TOP + 20, WORLD.width, WORLD.height - GRASS_TOP - 20);
  ctx.fillStyle = 'rgba(255,255,255,0.16)';
  for (let x = 0; x < WORLD.width; x += 46) {
    ctx.fillRect(x, GRASS_TOP + 26, 24, 4);
  }
}

function drawCoop() {
  const x = COOP_X;
  // Barn body
  ctx.fillStyle = '#e05a5a';
  ctx.fillRect(x, 168, 148, 210);
  // Roof
  ctx.fillStyle = '#b53f3f';
  ctx.beginPath();
  ctx.moveTo(x - 14, 172);
  ctx.lineTo(x + 74, 108);
  ctx.lineTo(x + 162, 172);
  ctx.closePath();
  ctx.fill();
  // Doorway
  ctx.fillStyle = '#3b2b2b';
  ctx.beginPath();
  ctx.moveTo(x + 44, 378);
  ctx.lineTo(x + 44, 268);
  ctx.quadraticCurveTo(x + 75, 236, x + 106, 268);
  ctx.lineTo(x + 106, 378);
  ctx.closePath();
  ctx.fill();
  // Hay
  ctx.fillStyle = '#ffd766';
  ctx.fillRect(x + 8, 196, 40, 30);
  ctx.strokeStyle = '#d8ab2e';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x + 8, 210);
  ctx.lineTo(x + 48, 210);
  ctx.stroke();
}

function drawChicken(x, y, bob) {
  ctx.save();
  ctx.translate(x, y + Math.sin(bob) * 3);
  // Body
  ctx.fillStyle = '#fffaf2';
  ctx.beginPath();
  ctx.ellipse(0, 0, 22, 18, 0, 0, Math.PI * 2);
  ctx.fill();
  // Head
  ctx.beginPath();
  ctx.arc(-16, -18, 12, 0, Math.PI * 2);
  ctx.fill();
  // Comb
  ctx.fillStyle = '#e05a5a';
  ctx.beginPath();
  ctx.arc(-20, -29, 5, 0, Math.PI * 2);
  ctx.arc(-13, -31, 5, 0, Math.PI * 2);
  ctx.fill();
  // Beak
  ctx.fillStyle = '#ffb02e';
  ctx.beginPath();
  ctx.moveTo(-28, -17);
  ctx.lineTo(-38, -13);
  ctx.lineTo(-28, -10);
  ctx.closePath();
  ctx.fill();
  // Eye
  ctx.fillStyle = '#241c33';
  ctx.beginPath();
  ctx.arc(-19, -20, 2.2, 0, Math.PI * 2);
  ctx.fill();
  // Legs
  ctx.strokeStyle = '#ffb02e';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-4, 16); ctx.lineTo(-4, 26);
  ctx.moveTo(8, 16); ctx.lineTo(8, 26);
  ctx.stroke();
  ctx.restore();
}

function drawChickens() {
  const spots = [
    { x: COOP_X + 42, y: 348 },
    { x: COOP_X + 92, y: 366 },
    { x: COOP_X + 128, y: 332 },
  ];
  for (let i = 0; i < game.chickens; i++) {
    drawChicken(spots[i].x, spots[i].y, game.time * 3 + i * 1.7);
  }
}

function drawCat(cat) {
  const coat = coatFor(cat);
  const w = cat.width;
  const h = cat.height;
  const bob = Math.sin(game.time * 9 + cat.wobble) * 2.5;

  ctx.save();
  ctx.translate(cat.x, cat.y + bob);
  if (cat.fleeing) {
    // Flip so a fleeing cat faces the way it is running.
    ctx.translate(w, 0);
    ctx.scale(-1, 1);
  }

  // Shadow
  ctx.fillStyle = 'rgba(36,28,51,0.16)';
  ctx.beginPath();
  ctx.ellipse(w * 0.5, h + 4, w * 0.42, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Tail
  ctx.strokeStyle = coat.body;
  ctx.lineWidth = h * 0.16;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(w * 0.1, h * 0.6);
  ctx.quadraticCurveTo(
    -w * 0.22,
    h * (0.5 + Math.sin(game.time * 6 + cat.wobble) * 0.25),
    -w * 0.02,
    h * 0.06,
  );
  ctx.stroke();

  // Body
  ctx.fillStyle = coat.body;
  ctx.beginPath();
  ctx.ellipse(w * 0.44, h * 0.62, w * 0.36, h * 0.3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = coat.belly;
  ctx.beginPath();
  ctx.ellipse(w * 0.46, h * 0.72, w * 0.27, h * 0.16, 0, 0, Math.PI * 2);
  ctx.fill();

  // Legs
  ctx.strokeStyle = coat.body;
  ctx.lineWidth = h * 0.12;
  const stride = Math.sin(game.time * 11 + cat.wobble) * w * 0.05;
  ctx.beginPath();
  ctx.moveTo(w * 0.26 + stride, h * 0.8); ctx.lineTo(w * 0.26 + stride, h);
  ctx.moveTo(w * 0.62 - stride, h * 0.8); ctx.lineTo(w * 0.62 - stride, h);
  ctx.stroke();

  // Head
  const hx = w * 0.78;
  const hy = h * 0.36;
  const hr = h * 0.28;
  ctx.fillStyle = coat.body;
  ctx.beginPath();
  ctx.arc(hx, hy, hr, 0, Math.PI * 2);
  ctx.fill();

  // Ears
  ctx.beginPath();
  ctx.moveTo(hx - hr * 0.85, hy - hr * 0.55);
  ctx.lineTo(hx - hr * 1.05, hy - hr * 1.75);
  ctx.lineTo(hx - hr * 0.05, hy - hr * 1.0);
  ctx.closePath();
  ctx.moveTo(hx + hr * 0.85, hy - hr * 0.55);
  ctx.lineTo(hx + hr * 1.05, hy - hr * 1.75);
  ctx.lineTo(hx + hr * 0.05, hy - hr * 1.0);
  ctx.closePath();
  ctx.fill();

  // Face
  ctx.fillStyle = '#241c33';
  const eyeY = hy - hr * 0.12;
  ctx.beginPath();
  ctx.arc(hx + hr * 0.18, eyeY, hr * 0.16, 0, Math.PI * 2);
  ctx.arc(hx + hr * 0.72, eyeY, hr * 0.16, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#241c33';
  ctx.lineWidth = Math.max(1.5, hr * 0.07);
  ctx.beginPath();
  ctx.moveTo(hx + hr * 0.45, hy + hr * 0.3);
  ctx.lineTo(hx + hr * 0.28, hy + hr * 0.5);
  ctx.moveTo(hx + hr * 0.45, hy + hr * 0.3);
  ctx.lineTo(hx + hr * 0.62, hy + hr * 0.5);
  // Whiskers
  ctx.moveTo(hx + hr * 0.6, hy + hr * 0.34); ctx.lineTo(hx + hr * 1.5, hy + hr * 0.2);
  ctx.moveTo(hx + hr * 0.6, hy + hr * 0.44); ctx.lineTo(hx + hr * 1.5, hy + hr * 0.62);
  ctx.stroke();

  if (cat.kind === 'big' && cat.health > 1) {
    // A crown of grumpiness so the two-tap cat reads as different.
    ctx.strokeStyle = '#241c33';
    ctx.lineWidth = Math.max(2, hr * 0.1);
    ctx.beginPath();
    ctx.moveTo(hx - hr * 0.1, hy - hr * 0.52);
    ctx.lineTo(hx + hr * 0.42, hy - hr * 0.34);
    ctx.moveTo(hx + hr * 1.0, hy - hr * 0.52);
    ctx.lineTo(hx + hr * 0.5, hy - hr * 0.34);
    ctx.stroke();
  }

  ctx.restore();
}

function drawPuffs() {
  for (const puff of puffs) {
    const life = puff.life / puff.maxLife;
    ctx.globalAlpha = Math.max(0, life);
    ctx.fillStyle = puff.color;
    ctx.beginPath();
    ctx.arc(puff.x, puff.y, puff.r * (1.6 - life), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  ctx.fillStyle = '#241c33';
  ctx.font = '700 22px "Trebuchet MS", sans-serif';
  ctx.textAlign = 'center';
  for (const label of labels) {
    ctx.globalAlpha = Math.max(0, label.life / label.maxLife);
    ctx.fillText(label.text, label.x, label.y);
  }
  ctx.globalAlpha = 1;
}

function draw() {
  ctx.save();
  ctx.scale(scale, scale);
  drawBackground();
  drawCoop();
  drawChickens();
  const ordered = [...game.cats].sort((a, b) => a.y - b.y);
  for (const cat of ordered) drawCat(cat);
  drawPuffs();
  ctx.restore();
}

/* ---------- Effects ---------- */

function addPuff(x, y) {
  for (let i = 0; i < 12; i++) {
    puffs.push({
      x: x + (Math.random() - 0.5) * 40,
      y: y + (Math.random() - 0.5) * 30,
      r: 6 + Math.random() * 10,
      color: 'rgba(255,255,255,0.85)',
      life: 0.5,
      maxLife: 0.5,
    });
  }
}

function addLabel(text, x, y) {
  labels.push({ text, x, y, life: 0.9, maxLife: 0.9 });
}

function stepEffects(dt) {
  for (const puff of puffs) {
    puff.life -= dt;
    puff.y -= dt * 20;
  }
  puffs = puffs.filter((p) => p.life > 0);
  for (const label of labels) {
    label.life -= dt;
    label.y -= dt * 40;
  }
  labels = labels.filter((l) => l.life > 0);
}

/* ---------- Game flow ---------- */

function updateHud() {
  setText(els.score, game.score);
  setText(els.round, round(game));
  setText(els.chickens, '🐔'.repeat(game.chickens) || 'none');
}

function startGame() {
  game = createGame();
  puffs = [];
  labels = [];
  playing = true;
  els.overlay.hidden = true;
  els.pause.textContent = 'Pause';
  updateHud();
  loop.start();
  els.announce.textContent = 'Game started.';
}

function endGame() {
  playing = false;
  loop.stop();
  const best = recordBest(BEST_KEY, game.score);
  setText(els.best, best);
  els.overlayTitle.textContent = 'The cats won';
  els.overlayText.textContent =
    `Every chicken is gone. You scored ${game.score} and reached round ${round(game)}.` +
    (game.score >= best ? ' That is your best yet.' : ` Your best is ${best}.`);
  els.start.textContent = 'Play again';
  els.overlay.hidden = false;
  els.announce.textContent = `Game over. Score ${game.score}.`;
  draw();
}

function pauseGame() {
  if (!playing) return;
  playing = false;
  loop.stop();
  els.overlayTitle.textContent = 'Paused';
  els.overlayText.textContent = 'The cats are waiting. So are the chickens.';
  els.start.textContent = 'Keep going';
  els.overlay.hidden = false;
  els.pause.textContent = 'Resume';
}

function resumeGame() {
  playing = true;
  els.overlay.hidden = true;
  els.pause.textContent = 'Pause';
  loop.start();
}

const loop = createLoop((dt) => {
  const before = game.chickens;
  step(game, dt);
  stepEffects(dt);
  if (game.chickens < before) {
    els.stage.classList.remove('flash');
    void els.stage.offsetWidth;
    els.stage.classList.add('flash');
    els.announce.textContent = `A chicken was taken. ${game.chickens} left.`;
  }
  updateHud();
  if (game.over) endGame();
}, draw);

/* ---------- Input ---------- */

canvas.addEventListener('pointerdown', (event) => {
  if (!playing) return;
  event.preventDefault();
  const pos = pointerPos(event, canvas);
  const x = pos.x / scale;
  const y = pos.y / scale;
  const hit = shooAt(game, x, y);
  if (hit) {
    addPuff(hit.cat.x + hit.cat.width / 2, hit.cat.y + hit.cat.height / 2);
    if (hit.shooed) addLabel(`+${hit.points}`, hit.cat.x + hit.cat.width / 2, hit.cat.y);
    updateHud();
  } else {
    addPuff(x, y);
  }
});

els.start.addEventListener('click', () => {
  if (els.start.textContent === 'Keep going') resumeGame();
  else startGame();
});

els.pause.addEventListener('click', () => {
  if (playing) pauseGame();
  else if (els.start.textContent === 'Keep going') resumeGame();
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'p' || event.key === 'P') {
    if (playing) pauseGame();
    else if (els.start.textContent === 'Keep going') resumeGame();
  }
  if (event.key === 'Enter' && !playing && els.start.textContent !== 'Keep going') {
    startGame();
  }
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden) pauseGame();
});

updateHud();
draw();
