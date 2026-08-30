/**
 * Durpy the Tiger Stretch Face - the maths behind the pulling.
 *
 * Each feature can be dragged away from its home position, up to a limit that
 * differs per part: ears travel further than eyes because there is more face
 * for them to travel across. A real mesh warp would look better and is a much
 * larger job, so this version moves whole parts instead.
 */

import { createRng, randRange } from '../../shared/rng.js';

export const FEATURES = [
  { id: 'ear-left', name: 'Left ear', reach: 110 },
  { id: 'ear-right', name: 'Right ear', reach: 110 },
  { id: 'eye-left', name: 'Left eye', reach: 78 },
  { id: 'eye-right', name: 'Right eye', reach: 78 },
  { id: 'nose', name: 'Nose', reach: 70 },
  { id: 'mouth', name: 'Mouth', reach: 82 },
  { id: 'cheek-left', name: 'Left cheek', reach: 66 },
  { id: 'cheek-right', name: 'Right cheek', reach: 66 },
];

export const COATS = [
  { id: 'orange', name: 'Orange', coat: '#ff9f1c', stripe: '#241c33', belly: '#fff6ec' },
  { id: 'white', name: 'Snow', coat: '#f2efe9', stripe: '#5b5170', belly: '#ffffff' },
  { id: 'pink', name: 'Bubblegum', coat: '#ff8ab0', stripe: '#7a2f4e', belly: '#fff0f6' },
  { id: 'mint', name: 'Mint', coat: '#7fd9c0', stripe: '#1f5a4c', belly: '#f0fffb' },
  { id: 'purple', name: 'Grape', coat: '#a48cff', stripe: '#3b2b6b', belly: '#f4f0ff' },
  { id: 'gold', name: 'Sunshine', coat: '#ffc531', stripe: '#7a5a00', belly: '#fffbe8' },
];

export function featureById(id) {
  return FEATURES.find((f) => f.id === id) || null;
}

export function emptyOffsets() {
  return Object.fromEntries(FEATURES.map((f) => [f.id, { x: 0, y: 0 }]));
}

/**
 * Keeps a drag inside the feature's reach. Past the limit the offset is
 * scaled back onto the circle, so pulling further just slides it around the
 * edge rather than stopping dead.
 */
export function clampOffset(dx, dy, reach) {
  const distance = Math.hypot(dx, dy);
  if (distance <= reach || distance === 0) return { x: dx, y: dy };
  const scale = reach / distance;
  return { x: dx * scale, y: dy * scale };
}

export function randomOffsets(seed = Date.now(), intensity = 0.85) {
  const rng = createRng(seed);
  const offsets = {};
  for (const feature of FEATURES) {
    const angle = rng() * Math.PI * 2;
    const distance = randRange(0.35, 1, rng) * feature.reach * intensity;
    offsets[feature.id] = {
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance,
    };
  }
  return offsets;
}

/** How far the face has been pulled about, 0 to 1. Drives the silly caption. */
export function silliness(offsets) {
  let total = 0;
  let max = 0;
  for (const feature of FEATURES) {
    const offset = offsets[feature.id] || { x: 0, y: 0 };
    total += Math.hypot(offset.x, offset.y);
    max += feature.reach;
  }
  return max === 0 ? 0 : total / max;
}

const CAPTIONS = [
  { at: 0.02, text: 'Durpy is fine. Nothing is wrong with Durpy.' },
  { at: 0.18, text: 'Durpy looks slightly concerned.' },
  { at: 0.36, text: 'Durpy has questions.' },
  { at: 0.55, text: 'Durpy is no longer a normal tiger.' },
  { at: 0.72, text: 'Durpy has left the building.' },
  { at: 0.88, text: 'This is the durpiest Durpy has ever been.' },
];

export function captionFor(offsets) {
  const value = silliness(offsets);
  let caption = CAPTIONS[0].text;
  for (const entry of CAPTIONS) {
    if (value >= entry.at) caption = entry.text;
  }
  return caption;
}
