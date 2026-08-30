import { $, setText } from '../../shared/ui.js';
import { load, save, recordBest } from '../../shared/storage.js';
import { SKINS, SLOTS, itemIn } from './wardrobe.js';
import { renderModel, renderItemThumb } from './model.js';
import {
  createContest, currentTheme, randomOutfit, submit, totalScore, ROUNDS,
} from './logic.js';

const BEST_KEY = 'catwalk-contest:best';
const SKIN_KEY = 'catwalk-contest:skin';

let contest = createContest();
let skin = load(SKIN_KEY, SKINS[0]);
if (!SKINS.includes(skin)) skin = SKINS[0];
let activeSlot = 'top';

const els = {
  model: $('#model'),
  tabs: $('#tabs'),
  items: $('#items'),
  skins: $('#skins'),
  round: $('#round'),
  total: $('#total'),
  best: $('#best'),
  themeName: $('#theme-name'),
  themeBlurb: $('#theme-blurb'),
  themeTags: $('#theme-tags'),
  overlay: $('#overlay'),
  overlayTitle: $('#overlay-title'),
  overlayText: $('#overlay-text'),
  overlayDetail: $('#overlay-detail'),
  continue: $('#continue'),
  announce: $('#announce'),
};

setText(els.best, load(BEST_KEY, null) ?? '-');

/* ---------- Rendering ---------- */

function renderFigure() {
  els.model.innerHTML = renderModel(contest.outfit, skin, { stage: true });
}

function renderTheme() {
  const theme = currentTheme(contest);
  if (!theme) return;
  setText(els.themeName, theme.name);
  setText(els.themeBlurb, theme.blurb);
  els.themeTags.innerHTML = theme.tags.map((tag) => `<span>${tag}</span>`).join('');
  setText(els.round, `${contest.round + 1} / ${ROUNDS}`);
  setText(els.total, totalScore(contest));
}

function renderTabs() {
  els.tabs.innerHTML = SLOTS.map((slot) => `
    <button class="tab" role="tab" type="button" data-slot="${slot.key}"
            aria-selected="${slot.key === activeSlot}">${slot.label}</button>
  `).join('');
  els.tabs.querySelectorAll('.tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      activeSlot = tab.dataset.slot;
      renderTabs();
      renderItems();
    });
  });
}

function renderItems() {
  const slot = SLOTS.find((s) => s.key === activeSlot);
  els.items.innerHTML = slot.items.map((item) => `
    <button class="item" type="button" data-id="${item.id}"
            aria-pressed="${contest.outfit[activeSlot] === item.id}">
      <svg viewBox="0 0 200 340" aria-label="${item.name}">${renderItemThumb(activeSlot, item.id, skin)}</svg>
      <span class="name">${item.name}</span>
    </button>
  `).join('');

  els.items.querySelectorAll('.item').forEach((button) => {
    button.addEventListener('click', () => {
      contest.outfit = { ...contest.outfit, [activeSlot]: button.dataset.id };
      renderFigure();
      renderItems();
    });
  });
}

function renderSkins() {
  els.skins.innerHTML = SKINS.map((colour) => `
    <button class="swatch" type="button" data-colour="${colour}" style="background:${colour}"
            aria-pressed="${skin === colour}" aria-label="Skin ${colour}"></button>
  `).join('');
  els.skins.querySelectorAll('.swatch').forEach((button) => {
    button.addEventListener('click', () => {
      skin = button.dataset.colour;
      save(SKIN_KEY, skin);
      renderFigure();
      renderSkins();
      renderItems();
    });
  });
}

/* ---------- Judging ---------- */

function showResult(result) {
  const bits = result.items
    .filter((entry) => entry.matched.length > 0)
    .map((entry) => `<li>${entry.item.name}: ${entry.matched.join(', ')} (+${entry.points})</li>`);
  if (result.completeBonus) bits.push(`<li>Wearing something in every slot (+${result.completeBonus})</li>`);
  if (result.harmonyBonus) bits.push(`<li>Colours work together, ${result.harmonyFamily} (+${result.harmonyBonus})</li>`);
  if (bits.length === 0) bits.push('<li>Nothing matched the theme at all.</li>');

  els.overlayTitle.innerHTML =
    `${result.total} points<br><span class="stars">${'★'.repeat(result.stars)}${'☆'.repeat(5 - result.stars)}</span>`;
  els.overlayText.textContent = result.remark;
  els.overlayDetail.innerHTML = `<ul>${bits.join('')}</ul>`;
  els.continue.textContent = contest.finished ? 'See the final score' : 'Next round';
  els.overlay.hidden = false;
  els.announce.textContent = `${result.total} points, ${result.stars} stars.`;
}

function showFinal() {
  const total = totalScore(contest);
  const best = recordBest(BEST_KEY, total);
  setText(els.best, best);
  const perfect = ROUNDS * 100;

  els.overlayTitle.textContent = 'Contest over';
  els.overlayText.textContent =
    `${total} out of ${perfect}.` + (total >= best ? ' A new best total.' : ` Your best is ${best}.`);
  els.overlayDetail.innerHTML = `<ul>${contest.scores
    .map((r) => `<li>${r.theme.name}: ${r.total} (${'★'.repeat(r.stars)})</li>`)
    .join('')}</ul>`;
  els.continue.textContent = 'Play again';
  els.overlay.hidden = false;
}

let awaitingFinal = false;

els.continue.addEventListener('click', () => {
  if (awaitingFinal) {
    awaitingFinal = false;
    contest = createContest();
    els.overlay.hidden = true;
    renderTheme();
    renderFigure();
    renderItems();
    return;
  }
  if (contest.finished) {
    awaitingFinal = true;
    showFinal();
    return;
  }
  els.overlay.hidden = true;
  renderTheme();
});

$('#submit').addEventListener('click', () => {
  if (contest.finished) return;
  const result = submit(contest);
  if (result) showResult(result);
  setText(els.total, totalScore(contest));
});

$('#shuffle').addEventListener('click', () => {
  contest.outfit = randomOutfit();
  renderFigure();
  renderItems();
  els.announce.textContent = 'New random outfit.';
});

renderTabs();
renderItems();
renderSkins();
renderTheme();
renderFigure();
