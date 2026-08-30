import { $, $$, setText, downloadSvgAsPng } from '../../shared/ui.js';
import { load, save } from '../../shared/storage.js';
import {
  FEATURES, COATS, featureById, emptyOffsets, clampOffset,
  randomOffsets, captionFor,
} from './logic.js';

const COAT_KEY = 'durpy-stretch:coat';
const STICKY_KEY = 'durpy-stretch:sticky';
const POSE_KEY = 'durpy-stretch:pose';

const svg = $('#face');
const els = {
  caption: $('#caption'),
  coats: $('#coats'),
  sticky: $('#sticky'),
  announce: $('#announce'),
};

let offsets = load(POSE_KEY, null) || emptyOffsets();
let sticky = Boolean(load(STICKY_KEY, false));
let coatId = load(COAT_KEY, COATS[0].id);
if (!COATS.some((c) => c.id === coatId)) coatId = COATS[0].id;

// Any missing feature in a saved pose gets a zero offset rather than undefined.
for (const feature of FEATURES) {
  const value = offsets[feature.id];
  if (!value || typeof value.x !== 'number' || typeof value.y !== 'number') {
    offsets[feature.id] = { x: 0, y: 0 };
  }
}

const groups = new Map();
$$('.feature', svg).forEach((group) => groups.set(group.dataset.feature, group));

/* ---------- Rendering ---------- */

function applyOffsets({ animate = false } = {}) {
  for (const feature of FEATURES) {
    const group = groups.get(feature.id);
    if (!group) continue;
    const offset = offsets[feature.id];
    group.classList.toggle('springing', animate);
    group.style.transform = `translate(${offset.x.toFixed(1)}px, ${offset.y.toFixed(1)}px)`;
  }
  setText(els.caption, captionFor(offsets));
  save(POSE_KEY, offsets);
}

function applyCoat() {
  const coat = COATS.find((c) => c.id === coatId);
  svg.style.setProperty('--coat', coat.coat);
  svg.style.setProperty('--stripe', coat.stripe);
  svg.style.setProperty('--belly', coat.belly);
  save(COAT_KEY, coatId);
}

function renderCoats() {
  els.coats.innerHTML = COATS.map((coat) => `
    <button class="swatch" type="button" data-id="${coat.id}"
            style="background:${coat.coat}; box-shadow: inset 0 -12px 0 ${coat.stripe}33"
            aria-pressed="${coat.id === coatId}" aria-label="${coat.name} fur"></button>
  `).join('');
  els.coats.querySelectorAll('.swatch').forEach((button) => {
    button.addEventListener('click', () => {
      coatId = button.dataset.id;
      applyCoat();
      renderCoats();
    });
  });
}

/* ---------- Dragging ---------- */

/** Client pixels to SVG units. The viewBox is 400 wide whatever the screen is. */
function scaleFactor() {
  const rect = svg.getBoundingClientRect();
  return rect.width === 0 ? 1 : 400 / rect.width;
}

let drag = null;

for (const [id, group] of groups) {
  group.addEventListener('pointerdown', (event) => {
    const feature = featureById(id);
    if (!feature) return;
    event.preventDefault();
    group.setPointerCapture(event.pointerId);
    group.classList.add('dragging');
    group.classList.remove('springing');
    drag = {
      id,
      feature,
      startX: event.clientX,
      startY: event.clientY,
      base: { ...offsets[id] },
    };
  });

  group.addEventListener('pointermove', (event) => {
    if (!drag || drag.id !== id) return;
    const scale = scaleFactor();
    const dx = drag.base.x + (event.clientX - drag.startX) * scale;
    const dy = drag.base.y + (event.clientY - drag.startY) * scale;
    offsets[id] = clampOffset(dx, dy, drag.feature.reach);
    applyOffsets();
  });

  const release = () => {
    if (!drag || drag.id !== id) return;
    group.classList.remove('dragging');
    if (!sticky) {
      offsets[id] = { x: 0, y: 0 };
      applyOffsets({ animate: true });
      // Take the transition class off once it has finished, or the next drag
      // lags behind the pointer.
      setTimeout(() => group.classList.remove('springing'), 560);
    }
    drag = null;
  };

  group.addEventListener('pointerup', release);
  group.addEventListener('pointercancel', release);

  // Keyboard: arrow keys nudge, Escape snaps back.
  group.addEventListener('keydown', (event) => {
    const feature = featureById(id);
    const stepSize = event.shiftKey ? 24 : 8;
    const current = offsets[id];
    let dx = current.x;
    let dy = current.y;
    if (event.key === 'ArrowLeft') dx -= stepSize;
    else if (event.key === 'ArrowRight') dx += stepSize;
    else if (event.key === 'ArrowUp') dy -= stepSize;
    else if (event.key === 'ArrowDown') dy += stepSize;
    else if (event.key === 'Escape') { dx = 0; dy = 0; }
    else return;
    event.preventDefault();
    offsets[id] = clampOffset(dx, dy, feature.reach);
    applyOffsets();
  });
}

/* ---------- Buttons ---------- */

$('#scramble').addEventListener('click', () => {
  offsets = randomOffsets();
  applyOffsets({ animate: true });
  els.announce.textContent = captionFor(offsets);
});

$('#reset').addEventListener('click', () => {
  offsets = emptyOffsets();
  applyOffsets({ animate: true });
  els.announce.textContent = 'Durpy is back to normal.';
});

function renderSticky() {
  els.sticky.textContent = `Sticky: ${sticky ? 'on' : 'off'}`;
  els.sticky.setAttribute('aria-pressed', String(sticky));
}

els.sticky.addEventListener('click', () => {
  sticky = !sticky;
  save(STICKY_KEY, sticky);
  renderSticky();
});

$('#save').addEventListener('click', () => {
  downloadSvgAsPng(svg, 'durpy.png', 2);
  els.announce.textContent = 'Saving a photo of Durpy.';
});

renderCoats();
applyCoat();
renderSticky();
applyOffsets();
