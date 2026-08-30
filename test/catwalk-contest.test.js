import test from 'node:test';
import assert from 'node:assert/strict';
import { SLOTS, itemIn } from '../games/catwalk-contest/wardrobe.js';
import { renderModel } from '../games/catwalk-contest/model.js';
import {
  THEMES, ROUNDS, MAX_ROUND_SCORE,
  createContest, currentTheme, randomOutfit, scoreOutfit, starsFor,
  submit, totalScore,
} from '../games/catwalk-contest/logic.js';

const themeById = (id) => THEMES.find((t) => t.id === id);

test('every slot has items with unique ids and a draw function', () => {
  for (const slot of SLOTS) {
    assert.ok(slot.items.length > 0, `${slot.key} has items`);
    const ids = new Set(slot.items.map((i) => i.id));
    assert.equal(ids.size, slot.items.length, `${slot.key} ids are unique`);
    for (const item of slot.items) {
      assert.equal(typeof item.draw, 'function');
      assert.ok(Array.isArray(item.tags), `${item.id} has tags`);
    }
  }
});

test('every theme tag is wearable by at least one garment', () => {
  const worn = new Set();
  for (const slot of SLOTS) {
    for (const item of slot.items) item.tags.forEach((tag) => worn.add(tag));
  }
  for (const theme of THEMES) {
    for (const tag of theme.tags) {
      assert.ok(worn.has(tag), `no garment carries the tag "${tag}" needed by ${theme.name}`);
    }
  }
});

test('a themed outfit scores far better than a wrong one', () => {
  const beach = themeById('beach');
  const right = { hair: 'bunches', top: 'swim', bottom: 'shorts', shoes: 'flipflops', accessory: 'sunhat' };
  const wrong = { hair: 'bob', top: 'jumper', bottom: 'snowpants', shoes: 'boots', accessory: 'scarf' };
  assert.ok(scoreOutfit(beach, right).total > scoreOutfit(beach, wrong).total + 30);
});

test('an outfit judged against its own theme beats every other theme', () => {
  const snow = themeById('snow');
  const snowOutfit = { hair: 'bob', top: 'jumper', bottom: 'snowpants', shoes: 'boots', accessory: 'scarf' };
  const home = scoreOutfit(snow, snowOutfit).total;
  for (const theme of THEMES) {
    if (theme.id === 'snow') continue;
    assert.ok(home > scoreOutfit(theme, snowOutfit).total, `snow outfit should not win ${theme.name}`);
  }
});

test('missing a required slot costs the completeness bonus', () => {
  const beach = themeById('beach');
  const full = { hair: 'bunches', top: 'swim', bottom: 'shorts', shoes: 'flipflops', accessory: 'none' };
  const bare = { ...full, shoes: null };
  assert.ok(scoreOutfit(beach, full).completeBonus > 0);
  assert.equal(scoreOutfit(beach, bare).completeBonus, 0);
});

test('a matching colour family pays a bonus', () => {
  const party = themeById('party');
  const coherent = { hair: 'rainbow', top: 'disco', bottom: 'skirt', shoes: 'flipflops', accessory: 'boa' };
  const result = scoreOutfit(party, coherent);
  assert.ok(result.harmonyBonus > 0, 'all-bright outfit should earn harmony');
  assert.equal(result.harmonyFamily, 'bright');
});

test('scores never exceed the round cap', () => {
  for (const theme of THEMES) {
    for (let seed = 0; seed < 200; seed++) {
      const total = scoreOutfit(theme, randomOutfit(() => (seed % 7) / 7)).total;
      assert.ok(total <= MAX_ROUND_SCORE, `${theme.name} scored ${total}`);
      assert.ok(total >= 0);
    }
  }
});

test('an empty outfit scores nothing but does not throw', () => {
  const result = scoreOutfit(themeById('ball'), {});
  assert.equal(result.total, 0);
  assert.equal(result.stars, 1);
});

test('stars step up with the score', () => {
  assert.equal(starsFor(0), 1);
  assert.equal(starsFor(30), 2);
  assert.equal(starsFor(50), 3);
  assert.equal(starsFor(70), 4);
  assert.equal(starsFor(100), 5);
});

test('a contest runs exactly five rounds with distinct themes', () => {
  const contest = createContest(11);
  assert.equal(contest.themes.length, ROUNDS);
  assert.equal(new Set(contest.themes.map((t) => t.id)).size, ROUNDS);

  for (let i = 0; i < ROUNDS; i++) {
    assert.ok(currentTheme(contest), `round ${i + 1} has a theme`);
    const result = submit(contest);
    assert.ok(result, `round ${i + 1} scores`);
    assert.equal(typeof result.remark, 'string');
  }
  assert.equal(contest.finished, true);
  assert.equal(currentTheme(contest), null);
  assert.equal(submit(contest), null, 'a finished contest takes no more entries');
  assert.equal(totalScore(contest), contest.scores.reduce((s, r) => s + r.total, 0));
});

test('a random outfit fills every slot with a real garment', () => {
  for (let seed = 0; seed < 30; seed++) {
    const outfit = randomOutfit(() => (seed * 0.037) % 1);
    for (const slot of SLOTS) {
      assert.ok(itemIn(slot.key, outfit[slot.key]), `${slot.key} got a real item`);
    }
  }
});

test('the model renders SVG for any outfit, including an empty one', () => {
  assert.match(renderModel(randomOutfit(), '#f7d9bb'), /<ellipse/);
  assert.match(renderModel({}, '#f7d9bb'), /<ellipse/);
});
