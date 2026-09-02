import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MESH, PULL_RADIUS, MAX_STRETCH, EDGE_MARGIN, MAX_PULLS, COATS, coatById,
  clampStretch, makePull, falloff, edgeWeight, displace, buildMesh, warpMesh,
  addPull, randomPulls, silliness, captionFor, isPull,
} from '../games/stretchamabobber/logic.js';

test('every coat has a swatch colour and sensible adjustments', () => {
  const ids = new Set(COATS.map((c) => c.id));
  assert.equal(ids.size, COATS.length);
  for (const coat of COATS) {
    assert.match(coat.swatch, /^#[0-9a-f]{6}$/i);
    assert.ok(coat.hue >= 0 && coat.hue < 360, `${coat.id} hue is a turn`);
    assert.ok(coat.saturation >= 0, `${coat.id} saturation is not negative`);
    assert.ok(coat.brightness > 0, `${coat.id} brightness is positive`);
    assert.equal(coatById(coat.id), coat);
  }
  assert.equal(coatById('nonsense'), COATS[0]);
});

test('the first coat leaves the picture as it is', () => {
  assert.deepEqual(
    [COATS[0].hue, COATS[0].saturation, COATS[0].brightness],
    [0, 1, 1],
  );
});

test('a short drag is left alone', () => {
  assert.deepEqual(clampStretch(0.1, 0.1, 0.5), { x: 0.1, y: 0.1 });
});

test('a long drag is pulled back onto the limit circle, keeping its direction', () => {
  const result = clampStretch(3, 4, 0.5);
  assert.ok(Math.abs(Math.hypot(result.x, result.y) - 0.5) < 1e-9);
  assert.ok(Math.abs(result.x / result.y - 3 / 4) < 1e-9);
});

test('clamping a zero drag does not divide by zero', () => {
  assert.deepEqual(clampStretch(0, 0), { x: 0, y: 0 });
});

test('makePull clamps the stretch and fills in the defaults', () => {
  const pull = makePull(0.5, 0.5, 10, 0);
  assert.ok(Math.abs(pull.dx - MAX_STRETCH) < 1e-12);
  assert.equal(pull.dy, 0);
  assert.equal(pull.radius, PULL_RADIUS);
  assert.equal(pull.strength, 1);
});

test('falloff is full at the centre, nothing at the edge, and never rises', () => {
  assert.equal(falloff(0), 1);
  assert.equal(falloff(1), 0);
  assert.equal(falloff(5), 0);
  let previous = 1;
  for (let t = 0.05; t <= 1; t += 0.05) {
    const value = falloff(t);
    assert.ok(value <= previous, `falloff falls at ${t}`);
    assert.ok(value >= 0);
    previous = value;
  }
});

test('the border of the picture is pinned and the middle is free', () => {
  assert.equal(edgeWeight(0, 0.5), 0);
  assert.equal(edgeWeight(0.5, 1), 0);
  assert.equal(edgeWeight(0.5, 0.5), 1);
  assert.equal(edgeWeight(EDGE_MARGIN, 0.5), 1);
  const half = edgeWeight(EDGE_MARGIN / 2, 0.5);
  assert.ok(half > 0 && half < 1);
});

test('a point under the finger goes exactly where the finger went', () => {
  const pull = makePull(0.5, 0.5, 0.2, -0.1);
  assert.deepEqual(displace(0.5, 0.5, [pull]), { x: 0.7, y: 0.4 });
});

test('a point outside the pull radius does not move', () => {
  const pull = makePull(0.5, 0.5, 0.3, 0.3);
  assert.deepEqual(displace(0.5, 0.5 + PULL_RADIUS + 0.01, [pull]), { x: 0.5, y: 0.5 + PULL_RADIUS + 0.01 });
});

test('a point on the border never moves, however hard the pull', () => {
  const pull = makePull(0.05, 0.5, MAX_STRETCH, MAX_STRETCH);
  assert.deepEqual(displace(0, 0.5, [pull]), { x: 0, y: 0.5 });
});

test('a pull at zero strength does nothing, and a missing strength counts as full', () => {
  const pull = makePull(0.5, 0.5, 0.2, 0);
  assert.deepEqual(displace(0.5, 0.5, [{ ...pull, strength: 0 }]), { x: 0.5, y: 0.5 });
  const bare = { x: 0.5, y: 0.5, dx: 0.2, dy: 0, radius: PULL_RADIUS };
  assert.deepEqual(displace(0.5, 0.5, [bare]), { x: 0.7, y: 0.5 });
});

test('two pulls add up', () => {
  const left = makePull(0.5, 0.5, 0.1, 0);
  const down = makePull(0.5, 0.5, 0, 0.1);
  const moved = displace(0.5, 0.5, [left, down]);
  assert.ok(Math.abs(moved.x - 0.6) < 1e-9);
  assert.ok(Math.abs(moved.y - 0.6) < 1e-9);
});

test('the mesh covers the picture corner to corner with well formed triangles', () => {
  const mesh = buildMesh(4);
  assert.equal(mesh.side, 5);
  assert.equal(mesh.rest.length, 25 * 2);
  assert.equal(mesh.triangles.length, 4 * 4 * 6);
  assert.deepEqual([mesh.rest[0], mesh.rest[1]], [0, 0]);
  assert.deepEqual([mesh.rest[48], mesh.rest[49]], [1, 1]);
  for (const index of mesh.triangles) {
    assert.ok(index >= 0 && index < 25, 'every index points at a vertex');
  }
});

test('the default mesh fits in 16-bit indices', () => {
  const mesh = buildMesh(MESH);
  assert.ok(mesh.side * mesh.side <= 65535);
  assert.ok(mesh.triangles instanceof Uint16Array);
});

test('warping with no pulls leaves the mesh at rest', () => {
  const mesh = buildMesh(6);
  const out = warpMesh(mesh, []);
  assert.deepEqual(Array.from(out), Array.from(mesh.rest));
});

test('warping moves the middle and leaves the corners', () => {
  const mesh = buildMesh(8);
  const out = warpMesh(mesh, [makePull(0.5, 0.5, 0.2, 0.2)]);
  const centre = (4 * 9 + 4) * 2;
  assert.ok(out[centre] > 0.5 && out[centre + 1] > 0.5);
  assert.deepEqual([out[0], out[1]], [0, 0]);
  const last = mesh.rest.length - 2;
  assert.deepEqual([out[last], out[last + 1]], [1, 1]);
});

test('sticky pulls drop the oldest once the list is full', () => {
  let pulls = [];
  for (let i = 0; i < MAX_PULLS + 5; i++) {
    pulls = addPull(pulls, makePull(0.5, 0.5, i / 1000, 0));
  }
  assert.equal(pulls.length, MAX_PULLS);
  assert.equal(pulls[0].dx, 5 / 1000);
});

test('random pulls stay on the picture and inside the stretch limit', () => {
  for (let seed = 0; seed < 50; seed++) {
    const pulls = randomPulls(seed);
    assert.equal(pulls.length, 4);
    for (const pull of pulls) {
      assert.ok(isPull(pull));
      assert.ok(Math.hypot(pull.dx, pull.dy) <= MAX_STRETCH + 1e-9);
      assert.ok(Math.hypot(pull.dx, pull.dy) > 0, 'it actually pulls');
    }
  }
  assert.deepEqual(randomPulls(7), randomPulls(7), 'the same seed gives the same scramble');
});

test('silliness runs from zero to one', () => {
  assert.equal(silliness([]), 0);
  const maxed = [0, 1, 2].map(() => makePull(0.5, 0.5, MAX_STRETCH, 0));
  assert.equal(silliness(maxed), 1);
  const way = [0, 1, 2, 3, 4, 5].map(() => makePull(0.5, 0.5, MAX_STRETCH, 0));
  assert.equal(silliness(way), 1);
  const bit = silliness([makePull(0.5, 0.5, 0.1, 0)]);
  assert.ok(bit > 0 && bit < 1);
});

test('the caption gets sillier as the face does', () => {
  const calm = captionFor([]);
  const wild = captionFor([0, 1, 2].map(() => makePull(0.5, 0.5, MAX_STRETCH, 0)));
  assert.notEqual(calm, wild);
  assert.equal(typeof calm, 'string');
  assert.ok(wild.length > 0);
});

test('isPull rejects anything a corrupt save could contain', () => {
  assert.ok(isPull(makePull(0.2, 0.3, 0.1, 0.1)));
  assert.ok(!isPull(null));
  assert.ok(!isPull('pull'));
  assert.ok(!isPull({ x: 0.5, y: 0.5 }));
  assert.ok(!isPull({ x: 2, y: 0.5, dx: 0, dy: 0, radius: 0.3 }));
  assert.ok(!isPull({ x: 0.5, y: 0.5, dx: NaN, dy: 0, radius: 0.3 }));
  assert.ok(!isPull({ x: 0.5, y: 0.5, dx: 0, dy: 0, radius: 0 }));
});
