import test from 'node:test';
import assert from 'node:assert/strict';
import {
  UPGRADES, createState, hydrate, costOf, perClick, perSecond,
  click, buy, tick, zoomieReward, collectZoomie, formatNumber,
} from '../games/corgi-clicker/logic.js';

test('a new corgi starts at one fluff per click and none per second', () => {
  const state = createState();
  assert.equal(perClick(state), 1);
  assert.equal(perSecond(state), 0);
  assert.equal(state.fluff, 0);
});

test('clicking adds exactly the per-click rate', () => {
  const state = createState();
  const gain = click(state);
  assert.equal(gain, 1);
  assert.equal(state.fluff, 1);
  assert.equal(state.clicks, 1);
});

test('prices rise with each copy owned', () => {
  const first = costOf('belly-rub', 0);
  const second = costOf('belly-rub', 1);
  const tenth = costOf('belly-rub', 9);
  assert.equal(first, 15);
  assert.ok(second > first, 'second costs more than the first');
  assert.ok(tenth > second * 1.5, 'the tenth is meaningfully more than the second');
});

test('a purchase fails when there is not enough fluff and changes nothing', () => {
  const state = createState();
  state.fluff = 5;
  assert.equal(buy(state, 'belly-rub'), false);
  assert.equal(state.fluff, 5);
  assert.equal(perClick(state), 1);
});

test('a purchase spends the fluff and applies the effect', () => {
  const state = createState();
  state.fluff = 100;
  assert.equal(buy(state, 'belly-rub'), true);
  assert.equal(state.fluff, 85);
  assert.equal(perClick(state), 2);
});

test('buying an upgrade that does not exist is refused', () => {
  const state = createState();
  state.fluff = 1e9;
  assert.equal(buy(state, 'nonsense'), false);
  assert.equal(state.fluff, 1e9);
});

test('per-second upgrades pay out over time', () => {
  const state = createState();
  state.fluff = 1000;
  buy(state, 'squeaky');
  assert.equal(perSecond(state), 0.5);
  tick(state, 4);
  assert.equal(Math.round(state.fluff - (1000 - costOf('squeaky', 0))), 2);
});

test('every upgrade in the table is buyable and does something', () => {
  for (const upgrade of UPGRADES) {
    const state = createState();
    state.fluff = upgrade.baseCost;
    assert.equal(buy(state, upgrade.id), true, `${upgrade.id} should be buyable`);
    const helps = perClick(state) > 1 || perSecond(state) > 0;
    assert.ok(helps, `${upgrade.id} should change a rate`);
  }
});

test('a zoomie is worth at least 25 and scales with income', () => {
  const state = createState();
  assert.equal(zoomieReward(state), 25);
  state.owned = { parade: 1 };
  assert.equal(zoomieReward(state), Math.round(130 * 30));
  const before = state.fluff;
  const reward = collectZoomie(state);
  assert.equal(state.fluff, before + reward);
  assert.equal(state.zoomies, 1);
});

test('formatNumber keeps small numbers whole and shortens large ones', () => {
  assert.equal(formatNumber(0), '0');
  assert.equal(formatNumber(999), '999');
  assert.equal(formatNumber(1000), '1.00K');
  assert.equal(formatNumber(1234567), '1.23M');
  assert.equal(formatNumber(45600), '45.6K');
});

test('a corrupt save is repaired rather than trusted', () => {
  const state = hydrate({ fluff: 'banana', owned: { 'belly-rub': -4, ghost: 99 } });
  assert.equal(state.fluff, 0);
  assert.deepEqual(state.owned, {});
  assert.equal(perClick(state), 1);
});

test('a good save round-trips', () => {
  const state = hydrate({ fluff: 500, earned: 900, clicks: 12, owned: { 'belly-rub': 3 } });
  assert.equal(state.fluff, 500);
  assert.equal(state.clicks, 12);
  assert.equal(perClick(state), 4);
});
