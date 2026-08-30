import { $, downloadSvgAsPng } from '../../shared/ui.js';
import { load, save } from '../../shared/storage.js';
import { CATEGORIES, SKINS, BACKDROPS, optionsFor } from './parts.js';
import {
  defaultConfig, normalizeConfig, randomConfig, renderBody,
  addSticker, removeSticker,
} from './logic.js';

const CONFIG_KEY = 'emoji-maker:current';
const BOOK_KEY = 'emoji-maker:book';

let config = normalizeConfig(load(CONFIG_KEY, null) || defaultConfig());
let book = (load(BOOK_KEY, []) || []).map(normalizeConfig);
let activeTab = CATEGORIES[0].key;

const els = {
  preview: $('#preview'),
  tabs: $('#tabs'),
  options: $('#options'),
  skins: $('#skins'),
  backdrops: $('#backdrops'),
  stickers: $('#stickers'),
  bookEmpty: $('#book-empty'),
  announce: $('#announce'),
};

/* ---------- Preview ---------- */

function renderPreview() {
  els.preview.innerHTML = renderBody(config);
  save(CONFIG_KEY, config);
}

/* ---------- Tabs and options ---------- */

function renderTabs() {
  els.tabs.innerHTML = CATEGORIES.map((category) => `
    <button class="tab" role="tab" type="button"
            data-key="${category.key}"
            aria-selected="${category.key === activeTab}">${category.label}</button>
  `).join('');
  els.tabs.querySelectorAll('.tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      activeTab = tab.dataset.key;
      renderTabs();
      renderOptions();
    });
  });
}

/**
 * Each option is previewed on the current face so the choice is obvious.
 * The thumbnails show the option in place rather than in isolation.
 */
function renderOptions() {
  const options = optionsFor(activeTab);
  els.options.innerHTML = options.map((option) => {
    const preview = { ...config, [activeTab]: option.id, backdrop: 'transparent' };
    return `
      <button class="option" type="button" data-id="${option.id}"
              aria-pressed="${config[activeTab] === option.id}"
              title="${option.name}">
        <svg viewBox="0 0 200 200" aria-label="${option.name}">${renderBody(preview)}</svg>
      </button>`;
  }).join('');

  els.options.querySelectorAll('.option').forEach((button) => {
    button.addEventListener('click', () => {
      config = { ...config, [activeTab]: button.dataset.id };
      renderPreview();
      renderOptions();
    });
  });
}

/* ---------- Colours ---------- */

function renderSwatches() {
  els.skins.innerHTML = SKINS.map((colour) => `
    <button class="swatch" type="button" data-colour="${colour}"
            style="background:${colour}" aria-pressed="${config.skin === colour}"
            aria-label="Face colour ${colour}"></button>
  `).join('');
  els.skins.querySelectorAll('.swatch').forEach((button) => {
    button.addEventListener('click', () => {
      config = { ...config, skin: button.dataset.colour };
      renderPreview();
      renderSwatches();
      renderOptions();
    });
  });

  els.backdrops.innerHTML = BACKDROPS.map((colour) => {
    const transparent = colour === 'transparent';
    return `
      <button class="swatch ${transparent ? 'transparent' : ''}" type="button" data-colour="${colour}"
              style="${transparent ? '' : `background:${colour}`}"
              aria-pressed="${config.backdrop === colour}"
              aria-label="Background ${transparent ? 'none' : colour}"></button>`;
  }).join('');
  els.backdrops.querySelectorAll('.swatch').forEach((button) => {
    button.addEventListener('click', () => {
      config = { ...config, backdrop: button.dataset.colour };
      renderPreview();
      renderSwatches();
    });
  });
}

/* ---------- Sticker book ---------- */

function renderBook() {
  els.bookEmpty.hidden = book.length > 0;
  els.stickers.innerHTML = book.map((entry, index) => `
    <li class="sticker">
      <button class="load" type="button" data-index="${index}" title="Load this sticker">
        <svg viewBox="0 0 200 200" aria-label="Saved sticker ${index + 1}">${renderBody(entry)}</svg>
      </button>
      <button class="remove" type="button" data-remove="${index}" aria-label="Delete sticker ${index + 1}">&times;</button>
    </li>
  `).join('');

  els.stickers.querySelectorAll('.load').forEach((button) => {
    button.addEventListener('click', () => {
      config = normalizeConfig(book[Number(button.dataset.index)]);
      renderPreview();
      renderOptions();
      renderSwatches();
      els.announce.textContent = 'Sticker loaded.';
    });
  });
  els.stickers.querySelectorAll('.remove').forEach((button) => {
    button.addEventListener('click', () => {
      book = removeSticker(book, Number(button.dataset.remove));
      save(BOOK_KEY, book);
      renderBook();
      els.announce.textContent = 'Sticker deleted.';
    });
  });
}

/* ---------- Buttons ---------- */

$('#random').addEventListener('click', () => {
  config = randomConfig();
  renderPreview();
  renderOptions();
  renderSwatches();
  els.announce.textContent = 'New random face.';
});

$('#save').addEventListener('click', () => {
  const result = addSticker(book, config);
  book = result.book;
  save(BOOK_KEY, book);
  renderBook();
  els.announce.textContent = result.added
    ? 'Saved to your sticker book.'
    : 'That face is already in the book.';
});

$('#download').addEventListener('click', () => {
  downloadSvgAsPng(els.preview, 'my-emoji.png', 3);
  els.announce.textContent = 'Downloading your emoji.';
});

renderTabs();
renderOptions();
renderSwatches();
renderPreview();
renderBook();
