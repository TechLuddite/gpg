/**
 * Stretchamabobber - the maths behind the stretching.
 *
 * The photo is a rubber sheet pinned at its edges. Grabbing it anywhere puts
 * a "pull" on the sheet: every point nearby moves with the finger, and the
 * effect fades out smoothly with distance, so the picture stretches rather
 * than tears. Nothing here touches the DOM or the canvas; the renderer in
 * game.js asks this file where each vertex of a grid should be and draws
 * the photo across it.
 *
 * Every coordinate in this file is a fraction of the picture, 0 to 1 on both
 * axes, so the same pull looks the same on a phone and on a monitor.
 */

import { createRng, randRange } from '../../shared/rng.js';

/** Grid divisions per side. More is smoother and slower. */
export const MESH = 32;

/** How far a pull reaches, as a fraction of the picture. */
export const PULL_RADIUS = 0.34;

/** The furthest a point can be dragged, as a fraction of the picture. */
export const MAX_STRETCH = 0.32;

/** Width of the band along each edge that stays pinned in place. */
export const EDGE_MARGIN = 0.1;

/** Sticky pulls beyond this many drop off the oldest first. */
export const MAX_PULLS = 24;

/**
 * Colours are applied to the picture itself, so each is a hue turn plus a
 * saturation and brightness tweak rather than a set of paint colours.
 */
export const COATS = [
  { id: 'natural', name: 'Natural', swatch: '#ff9f1c', hue: 0, saturation: 1, brightness: 1 },
  { id: 'snow', name: 'Snow', swatch: '#f2efe9', hue: 0, saturation: 0.05, brightness: 1.18 },
  { id: 'pink', name: 'Bubblegum', swatch: '#ff8ab0', hue: 300, saturation: 0.8, brightness: 1.12 },
  { id: 'mint', name: 'Mint', swatch: '#7fd9c0', hue: 130, saturation: 0.95, brightness: 1.05 },
  { id: 'purple', name: 'Grape', swatch: '#a48cff', hue: 235, saturation: 1.05, brightness: 1 },
  { id: 'gold', name: 'Sunshine', swatch: '#ffc531', hue: 20, saturation: 1.35, brightness: 1.1 },
];

export function coatById(id) {
  return COATS.find((c) => c.id === id) || COATS[0];
}

/**
 * Keeps a drag inside the stretch limit. Past the limit the offset is scaled
 * back onto the circle, so pulling further just slides the point around the
 * edge rather than stopping dead.
 */
export function clampStretch(dx, dy, limit = MAX_STRETCH) {
  const distance = Math.hypot(dx, dy);
  if (distance <= limit || distance === 0) return { x: dx, y: dy };
  const scale = limit / distance;
  return { x: dx * scale, y: dy * scale };
}

/** A pull: grab the sheet at (x, y) and drag it by (dx, dy). */
export function makePull(x, y, dx = 0, dy = 0, radius = PULL_RADIUS) {
  const clamped = clampStretch(dx, dy);
  return { x, y, dx: clamped.x, dy: clamped.y, radius, strength: 1 };
}

/**
 * How much a pull affects a point at distance `t` radii from its centre:
 * 1 at the centre, 0 at the edge of the radius, and smooth in between so
 * the stretch never shows a crease.
 */
export function falloff(t) {
  if (t >= 1) return 0;
  const k = 1 - t * t;
  return k * k;
}

/**
 * Points near the border stay put, so the photo always fills its frame no
 * matter how hard the middle is pulled. 0 on the edge, 1 past the margin.
 */
export function edgeWeight(x, y, margin = EDGE_MARGIN) {
  const distance = Math.min(x, y, 1 - x, 1 - y);
  if (distance <= 0) return 0;
  if (distance >= margin) return 1;
  const t = distance / margin;
  return t * t * (3 - 2 * t);
}

/** Where a rest point (x, y) ends up once every pull has had its say. */
export function displace(x, y, pulls) {
  let ox = 0;
  let oy = 0;
  for (const pull of pulls) {
    const strength = pull.strength === undefined ? 1 : pull.strength;
    if (strength === 0) continue;
    const distance = Math.hypot(x - pull.x, y - pull.y) / pull.radius;
    const k = falloff(distance) * strength;
    if (k === 0) continue;
    ox += pull.dx * k;
    oy += pull.dy * k;
  }
  const w = edgeWeight(x, y);
  return { x: x + ox * w, y: y + oy * w };
}

/**
 * A regular grid over the picture: rest positions (also the texture
 * coordinates) and the triangle list that joins them.
 */
export function buildMesh(divisions = MESH) {
  const side = divisions + 1;
  const rest = new Float32Array(side * side * 2);
  for (let row = 0; row < side; row++) {
    for (let col = 0; col < side; col++) {
      const i = (row * side + col) * 2;
      rest[i] = col / divisions;
      rest[i + 1] = row / divisions;
    }
  }
  const triangles = new Uint16Array(divisions * divisions * 6);
  let t = 0;
  for (let row = 0; row < divisions; row++) {
    for (let col = 0; col < divisions; col++) {
      const a = row * side + col;
      const b = a + 1;
      const c = a + side;
      const d = c + 1;
      triangles[t++] = a; triangles[t++] = c; triangles[t++] = b;
      triangles[t++] = b; triangles[t++] = c; triangles[t++] = d;
    }
  }
  return { divisions, side, rest, triangles };
}

/** Fills `out` with the displaced position of every vertex in `mesh`. */
export function warpMesh(mesh, pulls, out = new Float32Array(mesh.rest.length)) {
  const { rest } = mesh;
  for (let i = 0; i < rest.length; i += 2) {
    const p = displace(rest[i], rest[i + 1], pulls);
    out[i] = p.x;
    out[i + 1] = p.y;
  }
  return out;
}

/** Adds a pull, dropping the oldest once the list is full. Returns a new list. */
export function addPull(pulls, pull, limit = MAX_PULLS) {
  const next = pulls.concat([pull]);
  return next.length > limit ? next.slice(next.length - limit) : next;
}

/** A handful of random pulls, mostly around the middle where the face is. */
export function randomPulls(seed = Date.now(), count = 4, intensity = 0.85) {
  const rng = createRng(seed);
  const pulls = [];
  for (let i = 0; i < count; i++) {
    const x = randRange(0.22, 0.78, rng);
    const y = randRange(0.22, 0.78, rng);
    const angle = rng() * Math.PI * 2;
    const distance = randRange(0.35, 1, rng) * MAX_STRETCH * intensity;
    const radius = randRange(0.8, 1.2, rng) * PULL_RADIUS;
    pulls.push(makePull(x, y, Math.cos(angle) * distance, Math.sin(angle) * distance, radius));
  }
  return pulls;
}

/**
 * How far the face has been pulled about, 0 to 1. Three full-strength pulls
 * at the limit count as completely silly. Drives the caption.
 */
export function silliness(pulls) {
  let total = 0;
  for (const pull of pulls) {
    const strength = pull.strength === undefined ? 1 : pull.strength;
    total += Math.hypot(pull.dx, pull.dy) * strength;
  }
  return Math.min(1, total / (3 * MAX_STRETCH));
}

const CAPTIONS = [
  { at: 0.02, text: 'Perfectly normal. Nothing to see here.' },
  { at: 0.12, text: 'Something is not quite right.' },
  { at: 0.28, text: 'That face has questions.' },
  { at: 0.48, text: 'That is no longer a normal face.' },
  { at: 0.7, text: 'It has left the building.' },
  { at: 0.9, text: 'This is the stretchiest it has ever been.' },
];

export function captionFor(pulls) {
  const value = silliness(pulls);
  let caption = CAPTIONS[0].text;
  for (const entry of CAPTIONS) {
    if (value >= entry.at) caption = entry.text;
  }
  return caption;
}

/** True if a saved pull has the shape the renderer needs. */
export function isPull(value) {
  if (!value || typeof value !== 'object') return false;
  for (const key of ['x', 'y', 'dx', 'dy', 'radius']) {
    if (typeof value[key] !== 'number' || !Number.isFinite(value[key])) return false;
  }
  return value.radius > 0 && value.x >= 0 && value.x <= 1 && value.y >= 0 && value.y <= 1;
}
