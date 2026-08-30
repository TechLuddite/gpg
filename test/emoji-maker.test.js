import test from 'node:test';
import assert from 'node:assert/strict';
import { CATEGORIES, SKINS, BACKDROPS } from '../games/emoji-maker/parts.js';
import {
  defaultConfig, normalizeConfig, randomConfig, configKey, renderBody,
  addSticker, removeSticker, MAX_STICKERS,
} from '../games/emoji-maker/logic.js';

test('every category has options and every option has a unique id', () => {
  for (const category of CATEGORIES) {
    assert.ok(category.options.length > 0, `${category.key} has options`);
    const ids = new Set(category.options.map((o) => o.id));
    assert.equal(ids.size, category.options.length, `${category.key} ids are unique`);
  }
});

test('every option draws something, or nothing on purpose', () => {
  const config = defaultConfig();
  for (const category of CATEGORIES) {
    for (const option of category.options) {
      const svg = option.draw(config);
      assert.equal(typeof svg, 'string', `${category.key}/${option.id} returns a string`);
      if (option.id !== 'none') {
        assert.ok(svg.trim().length > 0, `${category.key}/${option.id} draws something`);
      }
    }
  }
});

test('the default config is valid', () => {
  assert.deepEqual(normalizeConfig(defaultConfig()), defaultConfig());
});

test('junk falls back to the default rather than rendering nothing', () => {
  const config = normalizeConfig({ face: 'triangle', skin: 'not-a-colour', eyes: null });
  assert.deepEqual(config, defaultConfig());
});

test('normalize keeps the parts that are real and fixes the parts that are not', () => {
  const config = normalizeConfig({ face: 'blob', eyes: 'ghost', skin: SKINS[3] });
  assert.equal(config.face, 'blob');
  assert.equal(config.eyes, defaultConfig().eyes);
  assert.equal(config.skin, SKINS[3]);
});

test('normalize is not fooled by a null or a string', () => {
  assert.deepEqual(normalizeConfig(null), defaultConfig());
  assert.deepEqual(normalizeConfig('face'), defaultConfig());
});

test('a random config is always valid', () => {
  for (let seed = 0; seed < 60; seed++) {
    const config = randomConfig(seed);
    assert.deepEqual(normalizeConfig(config), config, `seed ${seed} produced a valid face`);
  }
});

test('random configs are not all the same face', () => {
  const keys = new Set();
  for (let seed = 0; seed < 40; seed++) keys.add(configKey(randomConfig(seed)));
  assert.ok(keys.size > 20, `expected variety, got ${keys.size} distinct faces`);
});

test('rendering produces SVG and honours the backdrop', () => {
  const withBackdrop = renderBody({ ...defaultConfig(), backdrop: BACKDROPS[1] });
  assert.match(withBackdrop, /<rect width="200"/);
  const without = renderBody({ ...defaultConfig(), backdrop: 'transparent' });
  assert.doesNotMatch(without, /<rect width="200"/);
});

test('the same face always has the same key, whatever order it was built in', () => {
  const a = { face: 'blob', eyes: 'dots', brows: 'flat', mouth: 'o', extra: 'none', skin: SKINS[0], backdrop: 'transparent' };
  const b = { backdrop: 'transparent', skin: SKINS[0], extra: 'none', mouth: 'o', brows: 'flat', eyes: 'dots', face: 'blob' };
  assert.equal(configKey(a), configKey(b));
});

test('saving a sticker adds it once', () => {
  const first = addSticker([], defaultConfig());
  assert.equal(first.added, true);
  assert.equal(first.book.length, 1);

  const again = addSticker(first.book, defaultConfig());
  assert.equal(again.added, false);
  assert.equal(again.book.length, 1);
});

test('the sticker book is capped and keeps the newest', () => {
  let book = [];
  for (let seed = 0; seed < MAX_STICKERS + 12; seed++) {
    book = addSticker(book, randomConfig(seed)).book;
  }
  assert.ok(book.length <= MAX_STICKERS);
});

test('removing a sticker takes out the right one', () => {
  const a = randomConfig(1);
  const b = randomConfig(2);
  const c = randomConfig(3);
  const book = [a, b, c].map((config) => normalizeConfig(config));
  const after = removeSticker(book, 1);
  assert.equal(after.length, 2);
  assert.equal(configKey(after[0]), configKey(a));
  assert.equal(configKey(after[1]), configKey(c));
});

test('removing an index that is not there changes nothing', () => {
  const book = [normalizeConfig(defaultConfig())];
  assert.equal(removeSticker(book, 9).length, 1);
});
