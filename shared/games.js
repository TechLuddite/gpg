/**
 * The one list of games. The landing page renders from this, so adding a game
 * means adding a folder and one entry here.
 *
 * `art` is an inline SVG string, drawn by hand. No thumbnail may reference an
 * image file or another domain, which keeps the licensing question closed for
 * the landing page; `test/shared.test.js` enforces it. The only picture the
 * site ever shows is the one a player hands to Stretchamabobber.
 */

export const games = [
  {
    slug: 'cat-and-chickens',
    title: "Don't Let the Cat Eat the Chickens",
    short: 'Cat and Chickens',
    blurb: 'Shoo the cat before it reaches the coop. It gets faster every round.',
    tint: '#17b795',
    art: `
      <circle cx="60" cy="62" r="30" fill="#ffc531"/>
      <circle cx="52" cy="56" r="4" fill="#241c33"/>
      <circle cx="68" cy="56" r="4" fill="#241c33"/>
      <path d="M55 70 q5 6 10 0" stroke="#241c33" stroke-width="3" fill="none" stroke-linecap="round"/>
      <path d="M60 34 l-8 -12 l16 0 z" fill="#ff9f1c"/>
      <path d="M118 76 q6 -26 26 -26 q20 0 26 26 q-26 8 -52 0z" fill="#8a7bb8"/>
      <circle cx="134" cy="60" r="3.5" fill="#241c33"/>
      <circle cx="152" cy="60" r="3.5" fill="#241c33"/>
      <path d="M124 50 l-4 -14 l14 8z" fill="#8a7bb8"/>
      <path d="M164 50 l4 -14 l-14 8z" fill="#8a7bb8"/>
      <path d="M143 66 l-6 4 m6 -4 l6 4" stroke="#241c33" stroke-width="2" stroke-linecap="round"/>
    `,
  },
  {
    slug: 'corgi-clicker',
    title: 'Corgi Butt Clicker',
    short: 'Corgi Clicker',
    blurb: 'Click the fluffiest butt in the world. Buy helpers. Repeat forever.',
    tint: '#ffc531',
    art: `
      <ellipse cx="100" cy="118" rx="62" ry="9" fill="rgba(36,28,51,0.12)"/>
      <ellipse cx="70" cy="110" rx="19" ry="12" fill="#fff6ec"/>
      <ellipse cx="130" cy="110" rx="19" ry="12" fill="#fff6ec"/>
      <ellipse cx="72" cy="74" rx="34" ry="40" fill="#e8944a"/>
      <ellipse cx="128" cy="74" rx="34" ry="40" fill="#e8944a"/>
      <path d="M100 34 q15 22 14 52 q-1 17 -14 24 q-13 -7 -14 -24 q-1 -30 14 -52z" fill="#fff6ec"/>
      <path d="M95 50 l10 10 M105 50 l-10 10" stroke="#b9773f" stroke-width="3" stroke-linecap="round" opacity="0.85"/>
      <ellipse cx="100" cy="26" rx="14" ry="20" fill="#f3b877"/>
      <ellipse cx="100" cy="20" rx="8" ry="12" fill="#fff6ec"/>
      <circle cx="62" cy="110" r="3" fill="#e0567a"/><circle cx="70" cy="114" r="3" fill="#e0567a"/>
      <circle cx="78" cy="110" r="3" fill="#e0567a"/>
      <circle cx="122" cy="110" r="3" fill="#e0567a"/><circle cx="130" cy="114" r="3" fill="#e0567a"/>
      <circle cx="138" cy="110" r="3" fill="#e0567a"/>
    `,
  },
  {
    slug: 'puppy-match',
    title: 'Puppy Match',
    short: 'Puppy Match',
    blurb: 'Flip the cards, find the pairs, beat your best time.',
    tint: '#37a7ff',
    art: `
      <rect x="30" y="34" width="54" height="72" rx="10" fill="#6c4cd6"/>
      <rect x="38" y="42" width="38" height="56" rx="7" fill="#a48cff"/>
      <rect x="112" y="34" width="54" height="72" rx="10" fill="#fff6ec" stroke="#241c33" stroke-width="3"/>
      <circle cx="139" cy="66" r="20" fill="#e8944a"/>
      <path d="M121 54 q-6 -14 6 -16 q8 -1 10 10z" fill="#c97a35"/>
      <path d="M157 54 q6 -14 -6 -16 q-8 -1 -10 10z" fill="#c97a35"/>
      <circle cx="132" cy="64" r="3" fill="#241c33"/>
      <circle cx="146" cy="64" r="3" fill="#241c33"/>
      <ellipse cx="139" cy="74" rx="5" ry="4" fill="#241c33"/>
    `,
  },
  {
    slug: 'emoji-maker',
    title: 'Emoji Maker',
    short: 'Emoji Maker',
    blurb: 'Build a face out of parts, then save it to your sticker book.',
    tint: '#ff5fa2',
    art: `
      <circle cx="100" cy="70" r="40" fill="#ffc531"/>
      <path d="M76 58 q8 -10 18 0" stroke="#241c33" stroke-width="4" fill="none" stroke-linecap="round"/>
      <path d="M106 58 q8 -10 18 0" stroke="#241c33" stroke-width="4" fill="none" stroke-linecap="round"/>
      <circle cx="85" cy="68" r="5" fill="#241c33"/>
      <circle cx="115" cy="68" r="5" fill="#241c33"/>
      <path d="M80 84 q20 20 40 0" stroke="#241c33" stroke-width="5" fill="none" stroke-linecap="round"/>
      <circle cx="70" cy="80" r="7" fill="#ff5fa2" opacity="0.55"/>
      <circle cx="130" cy="80" r="7" fill="#ff5fa2" opacity="0.55"/>
    `,
  },
  {
    slug: 'unicorn-dash',
    title: 'Unicorn Dash',
    short: 'Unicorn Dash',
    blurb: 'An 8-bit lane race. Dodge the rocks, grab the stars, go faster.',
    tint: '#a48cff',
    art: `
      <rect x="40" y="26" width="120" height="88" rx="8" fill="#241c33"/>
      <rect x="52" y="38" width="96" height="64" fill="#4a3f6b"/>
      <rect x="82" y="38" width="6" height="64" fill="#6c5f92"/>
      <rect x="112" y="38" width="6" height="64" fill="#6c5f92"/>
      <rect x="92" y="76" width="18" height="14" fill="#ffffff"/>
      <rect x="96" y="66" width="10" height="12" fill="#ffffff"/>
      <rect x="98" y="58" width="6" height="8" fill="#ffc531"/>
      <rect x="88" y="90" width="6" height="8" fill="#ff5fa2"/>
      <rect x="108" y="90" width="6" height="8" fill="#37a7ff"/>
      <rect x="60" y="44" width="10" height="10" fill="#ffc531"/>
      <rect x="130" y="52" width="10" height="10" fill="#ffc531"/>
    `,
  },
  {
    slug: 'catwalk-contest',
    title: 'Catwalk Contest',
    short: 'Catwalk Contest',
    blurb: 'Get a theme, build an outfit, get judged. Five rounds.',
    tint: '#ff5fa2',
    art: `
      <circle cx="100" cy="44" r="16" fill="#f7d9bb"/>
      <path d="M84 40 q16 -20 32 0 q-4 -14 -16 -14 q-12 0 -16 14z" fill="#6c4cd6"/>
      <path d="M100 60 l-26 46 h52z" fill="#ff5fa2"/>
      <rect x="72" y="106" width="56" height="8" rx="4" fill="#ffc531"/>
      <circle cx="128" cy="52" r="6" fill="#37a7ff"/>
      <circle cx="72" cy="52" r="6" fill="#17b795"/>
    `,
  },
  {
    slug: 'stretchamabobber',
    title: 'Stretchamabobber',
    short: 'Stretchamabobber',
    blurb: 'Stretch a picture like rubber. Let go and it springs back. Save a photo.',
    tint: '#ff9f1c',
    art: `
      <path d="M92 24 C132 24 156 42 162 58 L194 68 C158 82 146 116 92 116 C42 116 24 96 24 70 C24 44 44 24 92 24z" fill="#ff9f1c"/>
      <path d="M92 34 C124 34 146 48 151 61 L176 68 C147 79 138 106 92 106 C50 106 34 91 34 70 C34 49 52 34 92 34z" fill="#fff6ec" opacity="0.5"/>
      <circle cx="70" cy="60" r="9" fill="#241c33"/>
      <ellipse cx="124" cy="63" rx="19" ry="8" fill="#241c33"/>
      <circle cx="67" cy="57" r="3" fill="#ffffff"/>
      <path d="M58 86 q40 24 88 -4" stroke="#241c33" stroke-width="6" fill="none" stroke-linecap="round"/>
      <circle cx="192" cy="68" r="9" fill="#ffffff" stroke="#241c33" stroke-width="3"/>
      <path d="M150 44 l22 -8 M152 92 l22 8" stroke="#241c33" stroke-width="3" fill="none" stroke-linecap="round" opacity="0.5"/>
    `,
  },
];

export function gameBySlug(slug) {
  return games.find((game) => game.slug === slug) || null;
}
