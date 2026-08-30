/**
 * Catwalk Contest - themes, judging and the round structure.
 *
 * The judging is deliberately transparent: matching tags, a bonus for a
 * coherent colour family, and a bonus for wearing something in every slot.
 * A player who looks at the breakdown can work out how to do better, which is
 * the difference between a game and a slot machine.
 */

import { createRng, shuffle, pick } from '../../shared/rng.js';
import { SLOTS, itemIn } from './wardrobe.js';

export const THEMES = [
  { id: 'beach', name: 'Beach Day', blurb: 'Sun, sand and something you can swim in.', tags: ['beach', 'summer', 'bright'] },
  { id: 'space', name: 'Space Explorer', blurb: 'Somewhere with no air and a lot of stars.', tags: ['space', 'futuristic', 'outdoors'] },
  { id: 'party', name: 'Rainbow Party', blurb: 'As many colours as you can stand.', tags: ['rainbow', 'party', 'playful'] },
  { id: 'snow', name: 'Snow Day', blurb: 'Cold outside. Very cold.', tags: ['winter', 'cosy', 'warm'] },
  { id: 'sports', name: 'Sports Day', blurb: 'Ready to run about.', tags: ['sport', 'active', 'summer'] },
  { id: 'ball', name: 'Fancy Ball', blurb: 'The grandest thing in the wardrobe.', tags: ['fancy', 'elegant', 'sparkle'] },
  { id: 'jungle', name: 'Jungle Trek', blurb: 'Mud, vines and a long walk.', tags: ['jungle', 'outdoors', 'active'] },
  { id: 'disco', name: 'Retro Disco', blurb: 'Straight out of 1978.', tags: ['retro', 'party', 'sparkle'] },
];

export const ROUNDS = 5;

/** Points per matching tag, and the most a single garment can earn. */
const POINTS_PER_TAG = 9;
const MAX_TAGS_PER_ITEM = 2;
const COMPLETE_BONUS = 14;
const HARMONY_BONUS = 12;
export const MAX_ROUND_SCORE = 100;

export function createContest(seed = Date.now()) {
  const rng = createRng(seed);
  return {
    rng,
    themes: shuffle(THEMES, rng).slice(0, ROUNDS),
    round: 0,
    scores: [],
    outfit: randomOutfit(rng),
    finished: false,
  };
}

export function currentTheme(contest) {
  return contest.themes[contest.round] || null;
}

export function randomOutfit(rng = Math.random) {
  const outfit = {};
  for (const slot of SLOTS) outfit[slot.key] = pick(slot.items, rng).id;
  return outfit;
}

/**
 * Judges an outfit against a theme.
 *
 * Returns the total plus the parts it is made of, so the results screen can
 * show its working rather than just a number.
 */
export function scoreOutfit(theme, outfit) {
  const items = [];
  let tagPoints = 0;

  for (const slot of SLOTS) {
    const item = itemIn(slot.key, outfit[slot.key]);
    if (!item) continue;
    const matched = item.tags.filter((tag) => theme.tags.includes(tag));
    const counted = Math.min(matched.length, MAX_TAGS_PER_ITEM);
    tagPoints += counted * POINTS_PER_TAG;
    items.push({ slot: slot.key, item, matched, points: counted * POINTS_PER_TAG });
  }

  const requiredSlots = SLOTS.filter((slot) => slot.required);
  const complete = requiredSlots.every((slot) => {
    const item = itemIn(slot.key, outfit[slot.key]);
    return item && item.id !== 'none';
  });

  const families = {};
  for (const entry of items) {
    if (entry.item.family === 'neutral' || entry.item.id === 'none') continue;
    families[entry.item.family] = (families[entry.item.family] || 0) + 1;
  }
  const topFamily = Object.entries(families).sort((a, b) => b[1] - a[1])[0];
  const harmonious = Boolean(topFamily && topFamily[1] >= 3);

  const total = Math.min(
    MAX_ROUND_SCORE,
    tagPoints + (complete ? COMPLETE_BONUS : 0) + (harmonious ? HARMONY_BONUS : 0),
  );

  return {
    total,
    tagPoints,
    completeBonus: complete ? COMPLETE_BONUS : 0,
    harmonyBonus: harmonious ? HARMONY_BONUS : 0,
    harmonyFamily: harmonious ? topFamily[0] : null,
    items,
    stars: starsFor(total),
  };
}

export function starsFor(total) {
  if (total >= 85) return 5;
  if (total >= 68) return 4;
  if (total >= 48) return 3;
  if (total >= 28) return 2;
  return 1;
}

const REMARKS = {
  5: ['The judges are on their feet.', 'Nobody has ever worn it better.', 'That is the whole theme, head to toe.'],
  4: ['Very close to perfect.', 'The judges are nodding.', 'One more matching piece and that is full marks.'],
  3: ['A solid outfit with a couple of odd choices.', 'Half of that belongs at a different event.', 'Respectable. Not memorable.'],
  2: ['Brave. Not right, but brave.', 'The judges are confused.', 'Somebody came to the wrong contest.'],
  1: ['That is not the theme at all.', 'The judges have questions.', 'Bold. Entirely wrong, but bold.'],
};

export function remarkFor(stars, rng = Math.random) {
  return pick(REMARKS[stars] || REMARKS[1], rng);
}

/** Locks in the current outfit and moves to the next round. */
export function submit(contest) {
  const theme = currentTheme(contest);
  if (!theme || contest.finished) return null;
  const result = scoreOutfit(theme, contest.outfit);
  result.remark = remarkFor(result.stars, contest.rng);
  result.theme = theme;
  contest.scores.push(result);
  contest.round += 1;
  if (contest.round >= contest.themes.length) contest.finished = true;
  return result;
}

export function totalScore(contest) {
  return contest.scores.reduce((sum, result) => sum + result.total, 0);
}
