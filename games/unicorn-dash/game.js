import { $, setText, pointerPos } from '../../shared/ui.js';
import { load, recordBest } from '../../shared/storage.js';
import { createLoop } from '../../shared/loop.js';
import {
  WORLD, LANES, LANE_WIDTH, TRACK_LEFT, PLAYER_Y,
  createRun, step, laneX, moveLeft, moveRight, scoreOf,
} from './logic.js';

const BEST_KEY = 'unicorn-dash:best';

const canvas = $('#canvas');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

const els = {
  distance: $('#distance'),
  stars: $('#stars'),
  score: $('#score'),
  best: $('#best'),
  overlay: $('#overlay'),
  overlayTitle: $('#overlay-title'),
  overlayText: $('#overlay-text'),
  start: $('#start'),
  announce: $('#announce'),
};

let run = createRun();
let playing = false;
let sparkles = [];
let shake = 0;

setText(els.best, load(BEST_KEY, 0));

/* ---------- Pixel drawing helpers ---------- */

function px(x, y, w, h, colour) {
  ctx.fillStyle = colour;
  ctx.fillRect(Math.round(x), Math.round(y), w, h);
}

const SKY_BANDS = ['#2a2140', '#3a2a5c', '#4b3277', '#63409b'];

function drawTrack() {
  // Night sky in bands, which is cheaper than a gradient and looks more 8-bit.
  for (let i = 0; i < SKY_BANDS.length; i++) {
    px(0, (i * WORLD.height) / SKY_BANDS.length, WORLD.width, WORLD.height / SKY_BANDS.length + 1, SKY_BANDS[i]);
  }

  // Stars in the background, parallaxing slowly.
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  for (let i = 0; i < 18; i++) {
    const sx = (i * 37) % WORLD.width;
    const sy = ((i * 53) + run.distance * 0.6) % WORLD.height;
    ctx.fillRect(sx, Math.round(sy), 2, 2);
  }

  // Track
  px(TRACK_LEFT, 0, LANE_WIDTH * LANES, WORLD.height, '#6b5a8f');
  px(TRACK_LEFT, 0, 3, WORLD.height, '#9a86c4');
  px(TRACK_LEFT + LANE_WIDTH * LANES - 3, 0, 3, WORLD.height, '#9a86c4');

  // Dashed lane lines, scrolling with the run.
  ctx.fillStyle = '#8d7ab5';
  for (let lane = 1; lane < LANES; lane++) {
    const x = TRACK_LEFT + lane * LANE_WIDTH - 1;
    for (let y = -20; y < WORLD.height; y += 24) {
      const offset = (y + ((run.distance * 10) % 24)) | 0;
      ctx.fillRect(x, offset, 2, 12);
    }
  }
}

function drawUnicorn(x, y) {
  const left = Math.round(x) - 13;
  const bob = Math.round(Math.sin(run.time * 14) * 1.5);
  const t = Math.round(y) - 15 + bob;
  const stride = Math.sin(run.time * 18) > 0 ? 1 : -1;

  // Legs, alternating so it looks like a gallop rather than a slide.
  px(left + 6, t + 24, 4, 5 + stride, '#e8e0f7');
  px(left + 16, t + 24, 4, 5 - stride, '#e8e0f7');

  // Tail, a rainbow stack at the back
  const rainbow = ['#ff5fa2', '#ffc531', '#7fd9c0', '#37a7ff'];
  rainbow.forEach((colour, i) => px(left, t + 12 + i * 3, 4, 3, colour));

  // Body and head
  px(left + 3, t + 13, 19, 12, '#ffffff');
  px(left + 15, t + 5, 9, 10, '#ffffff');
  px(left + 22, t + 10, 3, 3, '#ffb7d5');   // muzzle
  px(left + 19, t + 8, 2, 2, '#241c33');    // eye

  // Mane, between head and body
  rainbow.forEach((colour, i) => px(left + 11, t + 4 + i * 4, 5, 4, colour));

  // Horn
  px(left + 20, t + 1, 3, 4, '#ffc531');
  px(left + 21, t - 2, 2, 3, '#ffe28a');
}

function drawRock(entity) {
  const x = laneX(entity.lane);
  const y = entity.y;
  const shades = [['#7a6a58', '#5b4d3f'], ['#6c7a58', '#4f5b3f'], ['#7a5868', '#5b3f4b']][entity.variant % 3];
  px(x - 9, y - 6, 18, 12, shades[0]);
  px(x - 6, y - 10, 12, 6, shades[0]);
  px(x - 9, y + 2, 18, 4, shades[1]);
  px(x - 4, y - 7, 4, 4, 'rgba(255,255,255,0.22)');
}

function drawStar(entity) {
  const x = Math.round(laneX(entity.lane));
  const y = Math.round(entity.y + Math.sin(run.time * 6 + entity.wobble) * 2);
  px(x - 2, y - 8, 4, 16, '#ffc531');
  px(x - 8, y - 2, 16, 4, '#ffc531');
  px(x - 4, y - 4, 8, 8, '#ffe28a');
  px(x - 1, y - 1, 2, 2, '#ffffff');
}

function drawSparkles() {
  for (const s of sparkles) {
    ctx.globalAlpha = Math.max(0, s.life / s.max);
    px(s.x, s.y, 2, 2, '#ffe28a');
  }
  ctx.globalAlpha = 1;
}

function draw() {
  ctx.save();
  if (shake > 0) {
    ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
  }
  drawTrack();
  for (const entity of run.entities) {
    if (entity.kind === 'rock') drawRock(entity);
    else drawStar(entity);
  }
  drawUnicorn(run.playerX, PLAYER_Y);
  drawSparkles();
  ctx.restore();
}

/* ---------- HUD ---------- */

function updateHud() {
  setText(els.distance, `${Math.floor(run.distance)} m`);
  setText(els.stars, run.stars);
  setText(els.score, scoreOf(run));
}

/* ---------- Flow ---------- */

function startRun() {
  run = createRun();
  sparkles = [];
  shake = 0;
  playing = true;
  els.overlay.hidden = true;
  updateHud();
  loop.start();
  els.announce.textContent = 'Dash started.';
}

function endRun() {
  playing = false;
  loop.stop();
  const score = scoreOf(run);
  const best = recordBest(BEST_KEY, score);
  setText(els.best, best);
  els.overlayTitle.textContent = 'Crash';
  els.overlayText.textContent =
    `${Math.floor(run.distance)} metres and ${run.stars} stars. Score ${score}.` +
    (score >= best ? ' A new best.' : ` Your best is ${best}.`);
  els.start.textContent = 'Go again';
  els.overlay.hidden = false;
  els.announce.textContent = `Crashed. Score ${score}.`;
  draw();
}

const loop = createLoop((dt) => {
  step(run, dt);

  if (run.justCollected) {
    for (let i = 0; i < 8; i++) {
      sparkles.push({
        x: run.playerX + (Math.random() - 0.5) * 20,
        y: PLAYER_Y + (Math.random() - 0.5) * 20,
        life: 0.4, max: 0.4,
      });
    }
  }
  for (const s of sparkles) { s.life -= dt; s.y -= dt * 30; }
  sparkles = sparkles.filter((s) => s.life > 0);

  if (shake > 0) shake = Math.max(0, shake - dt * 30);

  updateHud();
  if (run.over) {
    shake = 6;
    endRun();
  }
}, draw);

/* ---------- Input ---------- */

document.addEventListener('keydown', (event) => {
  if (!playing) {
    if (event.key === 'Enter' || event.key === ' ') startRun();
    return;
  }
  if (event.key === 'ArrowLeft' || event.key === 'a' || event.key === 'A') {
    moveLeft(run);
    event.preventDefault();
  }
  if (event.key === 'ArrowRight' || event.key === 'd' || event.key === 'D') {
    moveRight(run);
    event.preventDefault();
  }
});

canvas.addEventListener('pointerdown', (event) => {
  if (!playing) return;
  const pos = pointerPos(event, canvas);
  if (pos.x < canvas.clientWidth / 2) moveLeft(run);
  else moveRight(run);
});

$('#pad-left').addEventListener('click', () => playing && moveLeft(run));
$('#pad-right').addEventListener('click', () => playing && moveRight(run));
els.start.addEventListener('click', startRun);

document.addEventListener('visibilitychange', () => {
  if (document.hidden && playing) {
    playing = false;
    loop.stop();
    els.overlayTitle.textContent = 'Paused';
    els.overlayText.textContent = 'You left the track. Start again when you are ready.';
    els.start.textContent = 'Restart';
    els.overlay.hidden = false;
  }
});

updateHud();
draw();
