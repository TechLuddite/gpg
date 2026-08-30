import { $, setText } from '../../shared/ui.js';
import { load, save, clear } from '../../shared/storage.js';
import { createLoop } from '../../shared/loop.js';
import {
  UPGRADES, createState, hydrate, costOf, ownedCount, perClick, perSecond,
  click, buy, tick, collectZoomie, formatNumber,
} from './logic.js';

const SAVE_KEY = 'corgi-clicker';

let state = hydrate(load(SAVE_KEY, null));

const els = {
  fluff: $('#fluff'),
  perClick: $('#per-click'),
  perSecond: $('#per-second'),
  corgi: $('#corgi'),
  floaters: $('#floaters'),
  upgrades: $('#upgrades'),
  reset: $('#reset'),
  zoomie: $('#zoomie'),
  lifetime: $('#lifetime'),
  announce: $('#announce'),
};

/* ---------- Shop ---------- */

const rows = new Map();

for (const upgrade of UPGRADES) {
  const li = document.createElement('li');
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'upgrade';
  button.innerHTML = `
    <span class="name"></span>
    <span class="cost"></span>
    <span class="blurb"></span>
    <span class="count"></span>
  `;
  button.querySelector('.name').textContent = upgrade.name;
  button.querySelector('.blurb').textContent = upgrade.blurb;
  button.addEventListener('click', () => {
    if (buy(state, upgrade.id)) {
      announce(`Bought ${upgrade.name}.`);
      render();
      persist();
    }
  });
  li.appendChild(button);
  els.upgrades.appendChild(li);
  rows.set(upgrade.id, {
    button,
    cost: button.querySelector('.cost'),
    count: button.querySelector('.count'),
  });
}

/* ---------- Rendering ---------- */

function render() {
  setText(els.fluff, formatNumber(state.fluff));
  setText(els.perClick, formatNumber(perClick(state)));
  const rate = perSecond(state);
  setText(els.perSecond, rate < 10 ? rate.toFixed(1) : formatNumber(rate));
  setText(
    els.lifetime,
    `Pats: ${state.clicks.toLocaleString()} · Zoomies caught: ${state.zoomies}`,
  );

  for (const upgrade of UPGRADES) {
    const row = rows.get(upgrade.id);
    const owned = ownedCount(state, upgrade.id);
    const cost = costOf(upgrade.id, owned);
    const affordable = state.fluff >= cost;
    setText(row.cost, formatNumber(cost));
    setText(row.count, owned ? `owned ${owned}` : '');
    row.button.disabled = !affordable;
    row.button.classList.toggle('affordable', affordable);
  }
}

function floatGain(amount, x, y) {
  const span = document.createElement('span');
  span.className = 'floater';
  span.textContent = `+${formatNumber(amount)}`;
  span.style.left = `${x}px`;
  span.style.top = `${y}px`;
  els.floaters.appendChild(span);
  span.addEventListener('animationend', () => span.remove());
}

function announce(message) {
  els.announce.textContent = message;
}

/* ---------- Input ---------- */

els.corgi.addEventListener('pointerdown', (event) => {
  const gain = click(state);
  const rect = els.floaters.getBoundingClientRect();
  const x = event.clientX ? event.clientX - rect.left : rect.width / 2;
  const y = event.clientY ? event.clientY - rect.top : rect.height / 2;
  floatGain(gain, x, y);
  render();
});

// A keyboard press fires `click` but not `pointerdown`, so keep them separate
// or a mouse user gets counted twice.
els.corgi.addEventListener('click', (event) => {
  if (event.detail !== 0) return; // real pointer clicks already handled above
  const gain = click(state);
  floatGain(gain, els.floaters.clientWidth / 2, els.floaters.clientHeight / 2);
  render();
});

els.reset.addEventListener('click', () => {
  const ok = window.confirm('Start again from zero fluff? This cannot be undone.');
  if (!ok) return;
  state = createState();
  clear(SAVE_KEY);
  hideZoomie();
  render();
  announce('Started again.');
});

/* ---------- Zoomies ---------- */

let zoomieTimer = randomZoomieDelay();
let zoomieHideAt = 0;

function randomZoomieDelay() {
  return 45 + Math.random() * 60;
}

function showZoomie() {
  els.zoomie.hidden = false;
  // Restart the run animation from the left each time.
  els.zoomie.style.animation = 'none';
  void els.zoomie.offsetWidth;
  els.zoomie.style.animation = '';
  zoomieHideAt = 6;
}

function hideZoomie() {
  els.zoomie.hidden = true;
  zoomieHideAt = 0;
}

els.zoomie.addEventListener('click', () => {
  const reward = collectZoomie(state);
  floatGain(reward, els.floaters.clientWidth / 2, els.floaters.clientHeight / 3);
  announce(`Zoomie caught, ${formatNumber(reward)} fluff.`);
  hideZoomie();
  zoomieTimer = randomZoomieDelay();
  render();
  persist();
});

/* ---------- Loop and saving ---------- */

let sinceSave = 0;

function persist() {
  save(SAVE_KEY, state);
  sinceSave = 0;
}

const loop = createLoop((dt) => {
  tick(state, dt);

  sinceSave += dt;
  if (sinceSave > 5) persist();

  if (els.zoomie.hidden) {
    zoomieTimer -= dt;
    if (zoomieTimer <= 0) showZoomie();
  } else {
    zoomieHideAt -= dt;
    if (zoomieHideAt <= 0) {
      hideZoomie();
      zoomieTimer = randomZoomieDelay();
    }
  }
}, render);

window.addEventListener('pagehide', persist);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) persist();
});

render();
loop.start();
