# Grace's Playground

Seven small browser games, one for each idea on Grace's birthday list. They run
as plain HTML, CSS and JavaScript with no build step, no dependencies and no
server, which is what makes them a good fit for GitHub Pages.

**[Play the playground](https://techluddite.github.io/gpg/)** once Pages is turned on.

## The games

| Game | What you do |
| --- | --- |
| [Don't Let the Cat Eat the Chickens](games/cat-and-chickens/) | Tap the cats before they reach the coop. It gets faster every round. |
| [Corgi Butt Clicker](games/corgi-clicker/) | Click a corgi. Buy helpers. Click a corgi more efficiently. |
| [Puppy Match](games/puppy-match/) | Find the matching pairs in as few moves as you can. |
| [Emoji Maker](games/emoji-maker/) | Build a face out of parts and save it to a sticker book. |
| [Unicorn Dash](games/unicorn-dash/) | An 8-bit three lane runner. Dodge rocks, collect stars. |
| [Catwalk Contest](games/catwalk-contest/) | Five rounds, five themes, one outfit each. |
| [Stretchamabobber](games/stretchamabobber/) | Put your own picture in, grab it anywhere, stretch it like rubber. |

## The names

Four of the ideas on the original list were named after things somebody else
owns: **Bluey**, **Barbie**, **Unicorn Academy** and **Derpy Tiger**, who is a
character from the Netflix film *KPop Demon Hunters*. The mechanics underneath
were always original, so only the names needed changing before this could be
public:

| Grace's name | Name here |
| --- | --- |
| Bluey memory card game | Puppy Match |
| Barbie fashion contest game | Catwalk Contest |
| Unicorn Academy 8-bit race game | Unicorn Dash |
| Durpy the Tiger stretch face | Stretchamabobber |

These are placeholders. Grace picks the real ones.

The same rule decides what the stretch game is stretching: no picture of
anybody else's character is in this repository. See
[The picture](#the-picture) below.

## Artwork

Every drawing in this repository is code: SVG paths and canvas calls written by
hand. Nothing is downloaded, traced or embedded from anywhere else, so there is
no licence to track and no attribution file to keep up to date.

Stretchamabobber is the exception, because it stretches a photograph rather
than a drawing, and the repository ships no photograph. It uses whichever
picture you give it:

1. **On the device.** Press *Pick a picture* in the game, or drop an image on
   the page, and choose any picture saved on that phone or tablet. It is
   squared off, kept in the browser's storage, and comes back next time.
   Nothing leaves the device and nothing goes into the repository, so this
   route stays clear of anybody else's copyright whatever Grace picks.
2. **In the repository.** Save an image as
   `games/stretchamabobber/picture.png` (or `.jpg`) and commit it. It becomes
   the default for everyone who opens the game, so it needs to be a picture
   that is yours to publish.

Until one of those happens the game shows a *Pick a picture* panel with the
button on it. A picture chosen on the device always wins over a committed one,
and *Start again* forgets it.

That also leaves an obvious upgrade path. Grace's own drawings can replace any
of it a piece at a time, because each game keeps its art in one place:

- `shared/games.js` for the landing page thumbnails
- `games/puppy-match/puppy-art.js` for the twelve puppies
- `games/emoji-maker/parts.js` for every emoji part
- `games/catwalk-contest/wardrobe.js` for every garment
- `games/stretchamabobber/picture.png` for the picture it stretches, if you
  commit one
- the `draw*` functions in `games/cat-and-chickens/game.js` and
  `games/unicorn-dash/game.js` for the two canvas games

## How it is put together

```
index.html            the landing page, built from the manifest
shared/               things every game uses
  games.js            the one list of games, with thumbnails
  playground.css      colours, buttons, panels, the page shell
  storage.js          localStorage, guarded so it cannot throw
  loop.js             requestAnimationFrame loop with a clamped delta
  rng.js              seedable random, so runs can be replayed in a test
  ui.js               DOM helpers, canvas sizing, SVG to PNG
games/<slug>/
  index.html          the page
  logic.js            the rules, with no reference to the DOM
  game.js             input, drawing, and gluing the two together
  style.css           anything specific to this game
test/                 node --test, no dependencies
```

The split between `logic.js` and `game.js` is the important part. Everything
that decides what happens (what a cat does, what an outfit scores, what an
upgrade costs) lives in `logic.js`, imports nothing from the browser, and is
covered by tests. `game.js` is the part that can only be checked by looking at
it.

## Running it

Any static file server will do. There is no build step.

```sh
npx http-server -p 8123 .   # then open http://127.0.0.1:8123
```

Opening `index.html` straight off disk will not work, because the games are ES
modules and browsers refuse to load those over `file://`.

## Tests

```sh
npm test        # node --test, no install required
```

124 tests covering the game rules, the shared helpers, and the structure of the
site itself: that every link resolves, that every import resolves, that no page
loads anything from another domain, and that every game folder is in the
manifest.

## Deploying

The site is static, so going live is a handful of settings rather than a build.
In order:

1. **Make the repository public.** GitHub Pages does not serve a private
   repository on the Free plan. Pro also works if it needs to stay private.
   Nothing in the code changes either way.
2. **Set the default branch to `main`.** Settings → General → Default branch.
   Everything worth publishing needs to be merged into it first.
3. **Turn Pages on.** Settings → Pages → Deploy from a branch → `main` →
   `/ (root)`. There is no build step to configure: `.nojekyll` stops GitHub
   trying to process the files.
4. **Add the custom domain**, in Settings → Pages → Custom domain. GitHub
   commits a `CNAME` file to the branch for you and starts issuing the
   certificate, which takes a few minutes. Tick **Enforce HTTPS** once that
   finishes.

Every path in every page is relative, and none of them start with `/`, so the
site works both at a domain root and under a subpath like
`techluddite.github.io/gpg/`. `test/site.test.js` enforces that, and the whole
site has been driven in a browser under a subpath to prove it.

`404.html` is deliberately self contained: Pages serves it for any missing
path but leaves the address bar on the URL that was asked for, so a relative
stylesheet link in it would 404 in turn and the page would arrive unstyled.

## What is deliberately missing

- **Shared high score tables.** GitHub Pages serves static files and nothing
  else, so there is no server to keep them on. Every score is in `localStorage`
  on the device that set it, and clearing browser data clears it.
- **Sound.** Easy to add, and worth adding once somebody has decided what these
  should sound like.
- **A picture in the repository for Stretchamabobber.** See
  [The picture](#the-picture). The warp itself is done: a WebGL mesh with a 2D
  canvas fallback, pinned at the edges so the picture always fills its frame.

## Licence

MIT. See [LICENSE](LICENSE).
