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

test('nothing is linked from the site root, so the site works under /gpg/', () => {
  // GitHub Pages serves a project site from a subpath, not the domain root.
  // A leading slash on any href, src or import would 404 in production while
  // working perfectly on a local server started at the repo root.
  const files = [...htmlFiles(), '404.html'];
  for (const file of files) {
    const html = readFileSync(join(root, file), 'utf8');
    const rooted = [...html.matchAll(/(?:href|src)="(\/[^\/][^"]*)"/g)].map((m) => m[1]);
    assert.deepEqual(rooted, [], `${file} links ${rooted.join(', ')} from the domain root`);
  }
});

test('the 404 page is self contained', () => {
  // Pages serves this file for any missing path but leaves the address bar on
  // the URL that was asked for, so every relative reference in it resolves
  // against a directory that does not exist. It must load nothing.
  const html = readFileSync(join(root, '404.html'), 'utf8');
  assert.match(html, /<title>[^<]+<\/title>/);

  const refs = [...html.matchAll(/(?:href|src)="([^"]+)"/g)]
    .map((m) => m[1])
    .filter((ref) => !ref.startsWith('data:') && !ref.startsWith('#') && ref !== '/');
  assert.deepEqual(refs, [], `404.html loads ${refs.join(', ')}, which will 404 in turn`);
  assert.doesNotMatch(html, /<link rel="stylesheet"/, '404.html must inline its own styles');
});

test('the 404 page links home correctly at a domain root and under a subpath', () => {
  // The address bar stays on the URL that was asked for, so this link is the
  // one thing on the page that cannot be a fixed relative path. Pull the real
  // function out of the inline script and run it.
  const html = readFileSync(join(root, '404.html'), 'utf8');
  const source = html.match(/function siteRoot\(pathname\) \{[\s\S]*?\n  \}/);
  assert.ok(source, '404.html still defines siteRoot');
  const siteRoot = new Function(`${source[0]}; return siteRoot;`)();

  // Custom domain, served from the root.
  assert.equal(siteRoot('/games/typo/'), '/');
  assert.equal(siteRoot('/games/'), '/');
  assert.equal(siteRoot('/typo'), '/');
  assert.equal(siteRoot('/'), '/');
  // github.io project site, served from /<repo>/.
  assert.equal(siteRoot('/gpg/games/typo/'), '/gpg/');
  assert.equal(siteRoot('/gpg/games/stretchamabobber/typo'), '/gpg/');
});

test('.nojekyll is present so GitHub Pages serves the files as they are', () => {
  assert.ok(existsSync(join(root, '.nojekyll')));
});

test('the licence is MIT and the year and holder are filled in', () => {
  const licence = readFileSync(join(root, 'LICENSE'), 'utf8');
  assert.match(licence, /MIT License/);
  assert.doesNotMatch(licence, /\[year\]|\[fullname\]|YOUR NAME/i);
});
