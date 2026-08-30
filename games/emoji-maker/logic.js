/**
 * Emoji Maker - the config, not the drawing.
 *
 * A face is just a small object naming one option per category plus two
 * colours. That makes a sticker book a list of those objects, which is small
 * enough to keep in localStorage without thinking about it.
 */

import { createRng, pick } from '../../shared/rng.js';
import { CATEGORIES, SKINS, BACKDROPS, optionsFor } from './parts.js';

export function defaultConfig() {
  return {
    face: 'round',
    eyes: 'shiny',
    brows: 'none',
    mouth: 'smile',
    extra: 'blush',
    skin: SKINS[0],
    backdrop: 'transparent',
  };
}

/**
 * Anything loaded from storage goes through here first. An option that no
 * longer exists falls back to the first one rather than rendering nothing.
 */
export function normalizeConfig(raw) {
  const config = defaultConfig();
  if (!raw || typeof raw !== 'object') return config;
  for (const category of CATEGORIES) {
    const value = raw[category.key];
    if (category.options.some((option) => option.id === value)) {
      config[category.key] = value;
    }
  }
  if (SKINS.includes(raw.skin)) config.skin = raw.skin;
  if (BACKDROPS.includes(raw.backdrop)) config.backdrop = raw.backdrop;
  return config;
}

export function randomConfig(seed = Date.now()) {
  const rng = createRng(seed);
  const config = {};
  for (const category of CATEGORIES) {
    config[category.key] = pick(category.options, rng).id;
  }
  config.skin = pick(SKINS, rng);
  config.backdrop = pick(BACKDROPS, rng);
  return config;
}

/** Stable identity for a face, used to spot duplicates in the sticker book. */
export function configKey(config) {
  const normalized = normalizeConfig(config);
  return CATEGORIES.map((c) => normalized[c.key])
    .concat(normalized.skin, normalized.backdrop)
    .join('|');
}

/** Builds the SVG body for a config. Order matters: backdrop first, extras last. */
export function renderBody(rawConfig) {
  const config = normalizeConfig(rawConfig);
  const layers = [];

  if (config.backdrop !== 'transparent') {
    layers.push(`<rect width="200" height="200" rx="28" fill="${config.backdrop}"/>`);
  }
  for (const category of CATEGORIES) {
    const option = optionsFor(category.key).find((o) => o.id === config[category.key]);
    if (option) layers.push(option.draw(config));
  }
  return layers.join('');
}

export function renderSvg(config, size = 200) {
  return `<svg viewBox="0 0 200 200" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">${renderBody(config)}</svg>`;
}

export const MAX_STICKERS = 24;

/** Adds to the book, refusing exact duplicates and trimming the oldest away. */
export function addSticker(book, config) {
  const key = configKey(config);
  if (book.some((entry) => configKey(entry) === key)) return { book, added: false };
  const next = [normalizeConfig(config), ...book].slice(0, MAX_STICKERS);
  return { book: next, added: true };
}

export function removeSticker(book, index) {
  return book.filter((_, i) => i !== index);
}
