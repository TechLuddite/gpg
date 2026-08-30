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
| [Durpy the Tiger Stretch Face](games/durpy-stretch/) | Drag his face about and take a photo of the result. |

## The names

Three of the ideas on the original list were named after things somebody else
owns: **Bluey**, **Barbie** and **Unicorn Academy**. The mechanics underneath
were always original, so only the names needed changing before this could be
public:

| Grace's name | Name here |
| --- | --- |
| Bluey memory card game | Puppy Match |
| Barbie fashion contest game | Catwalk Contest |
| Unicorn Academy 8-bit race game | Unicorn Dash |

These are placeholders. Grace picks the real ones.

"Durpy" is Grace's spelling and stays exactly as she wrote it.

## Artwork

Every drawing in this repository is code: SVG paths and canvas calls written by
hand. Nothing is downloaded, traced or embedded from anywhere else, so there is
no licence to track and no attribution file to keep up to date.

That also leaves an obvious upgrade path. Grace's own drawings can replace any
of it a piece at a time, because each game keeps its art in one place:

- `shared/games.js` for the landing page thumbnails
- `games/puppy-match/puppy-art.js` for the twelve puppies
- `games/emoji-maker/parts.js` for every emoji part
- `games/catwalk-contest/wardrobe.js` for every garment
- `games/durpy-stretch/index.html` for Durpy himself
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

111 tests covering the game rules, the shared helpers, and the structure of the
site itself: that every link resolves, that every import resolves, that no page
loads anything from another domain, and that every game folder is in the
manifest.

## Deploying

Settings → Pages → Deploy from a branch → `main` → `/ (root)`. Nothing else is
needed: `.nojekyll` stops GitHub trying to process the files, and there is no
build to run.

## What is deliberately missing

- **Shared high score tables.** GitHub Pages serves static files and nothing
  else, so there is no server to keep them on. Every score is in `localStorage`
  on the device that set it, and clearing browser data clears it.
- **Sound.** Easy to add, and worth adding once somebody has decided what these
  should sound like.
- **A real mesh warp for Durpy.** He moves whole features rather than stretching
  the drawing itself. A proper warp is a much larger job for a small gain.

## Licence

MIT. See [LICENSE](LICENSE).
