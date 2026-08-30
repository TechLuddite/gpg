/**
 * Structural checks on the site itself.
 *
 * GitHub Pages serves these files straight from the branch, so a typo in a
 * path is a broken page in production with nothing in between to catch it.
 * These tests are that something.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { games } from '../shared/games.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function htmlFiles() {
  const files = ['index.html'];
  for (const game of games) files.push(join('games', game.slug, 'index.html'));
  return files;
}

test('every game in the manifest has a folder with the files it needs', () => {
  for (const game of games) {
    const dir = join(root, 'games', game.slug);
    assert.ok(existsSync(dir), `games/${game.slug} exists`);
    for (const file of ['index.html', 'game.js', 'style.css', 'logic.js']) {
      assert.ok(existsSync(join(dir, file)), `games/${game.slug}/${file} exists`);
    }
  }
});

test('every game folder is in the manifest', () => {
  const folders = readdirSync(join(root, 'games'), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
  const slugs = new Set(games.map((g) => g.slug));
  for (const folder of folders) {
    assert.ok(slugs.has(folder), `games/${folder} is missing from shared/games.js`);
  }
});

test('every local href and src in the HTML points at a file that exists', () => {
  for (const file of htmlFiles()) {
    const html = readFileSync(join(root, file), 'utf8');
    const base = dirname(join(root, file));
    const refs = [...html.matchAll(/(?:href|src)="([^"]+)"/g)].map((m) => m[1]);

    for (const ref of refs) {
      if (/^(https?:|data:|mailto:|#)/.test(ref)) continue;
      if (ref.includes('${')) continue; // built at runtime by an inline script
      const target = ref.endsWith('/') ? join(base, ref, 'index.html') : join(base, ref);
      assert.ok(existsSync(target), `${file} points at ${ref}, which does not exist`);
    }
  }
});

test('every import in the JavaScript resolves to a real file', () => {
  const scripts = [];
  for (const name of readdirSync(join(root, 'shared'))) {
    if (name.endsWith('.js')) scripts.push(join('shared', name));
  }
  for (const game of games) {
    for (const name of readdirSync(join(root, 'games', game.slug))) {
      if (name.endsWith('.js')) scripts.push(join('games', game.slug, name));
    }
  }

  for (const script of scripts) {
    const source = readFileSync(join(root, script), 'utf8');
    const imports = [...source.matchAll(/from\s+'([^']+)'/g)].map((m) => m[1]);
    for (const specifier of imports) {
      if (!specifier.startsWith('.')) continue;
      const target = resolve(dirname(join(root, script)), specifier);
      assert.ok(existsSync(target), `${script} imports ${specifier}, which does not exist`);
    }
  }
});

test('no page loads anything from another site', () => {
  for (const file of htmlFiles()) {
    const html = readFileSync(join(root, file), 'utf8');
    const external = [...html.matchAll(/(?:href|src)="(https?:\/\/[^"]+)"/g)].map((m) => m[1]);
    assert.deepEqual(external, [], `${file} reaches out to ${external.join(', ')}`);
  }
});

test('every page has a title, a viewport and a link back to the playground', () => {
  for (const file of htmlFiles()) {
    const html = readFileSync(join(root, file), 'utf8');
    assert.match(html, /<title>[^<]+<\/title>/, `${file} has a title`);
    assert.match(html, /name="viewport"/, `${file} is set up for phones`);
    assert.match(html, /<html lang="en">/, `${file} declares its language`);
    if (file !== 'index.html') {
      assert.match(html, /class="back" href="\.\.\/\.\.\/"/, `${file} links home`);
    }
  }
});

test('.nojekyll is present so GitHub Pages serves the files as they are', () => {
  assert.ok(existsSync(join(root, '.nojekyll')));
});

test('the licence is MIT and the year and holder are filled in', () => {
  const licence = readFileSync(join(root, 'LICENSE'), 'utf8');
  assert.match(licence, /MIT License/);
  assert.doesNotMatch(licence, /\[year\]|\[fullname\]|YOUR NAME/i);
});
