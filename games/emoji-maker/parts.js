/**
 * Every emoji part, drawn as SVG on a 200x200 grid.
 *
 * Each option is a function of the current config so that, for example, ears
 * and cheeks can pick up the face colour. Nothing here loads an image, which
 * is the whole point: the sticker book stays original work.
 */

export const SKINS = [
  '#ffc531', '#ffa53d', '#ff8ab0', '#a48cff', '#7fd9c0',
  '#8fd0ff', '#e8944a', '#c98b6b', '#8a5a3b', '#f2efe9',
];

export const BACKDROPS = [
  'transparent', '#fff6ec', '#ffe0ef', '#e2f3ff', '#e6fbf4',
  '#f0eaff', '#fff3cf', '#241c33',
];

const ink = '#241c33';

/* ---------- Faces ---------- */

export const FACES = [
  { id: 'round', name: 'Round', draw: (c) => `<circle cx="100" cy="100" r="76" fill="${c.skin}"/>` },
  { id: 'egg', name: 'Egg', draw: (c) => `<ellipse cx="100" cy="102" rx="66" ry="78" fill="${c.skin}"/>` },
  { id: 'wide', name: 'Wide', draw: (c) => `<ellipse cx="100" cy="100" rx="80" ry="62" fill="${c.skin}"/>` },
  {
    id: 'squircle',
    name: 'Squircle',
    draw: (c) => `<rect x="26" y="26" width="148" height="148" rx="46" fill="${c.skin}"/>`,
  },
  {
    id: 'cat',
    name: 'Cat',
    draw: (c) => `
      <path d="M44 62 l-8 -40 l44 22z" fill="${c.skin}"/>
      <path d="M156 62 l8 -40 l-44 22z" fill="${c.skin}"/>
      <circle cx="100" cy="104" r="72" fill="${c.skin}"/>`,
  },
  {
    id: 'blob',
    name: 'Blob',
    draw: (c) => `
      <path d="M100 24 q54 0 66 44 q12 44 -14 76 q-26 32 -52 32 q-26 0 -52 -32 q-26 -32 -14 -76 q12 -44 66 -44z" fill="${c.skin}"/>`,
  },
];

/* ---------- Eyes ---------- */

export const EYES = [
  {
    id: 'dots', name: 'Dots',
    draw: () => `<circle cx="74" cy="92" r="9" fill="${ink}"/><circle cx="126" cy="92" r="9" fill="${ink}"/>`,
  },
  {
    id: 'shiny', name: 'Shiny',
    draw: () => `
      <circle cx="74" cy="92" r="13" fill="${ink}"/><circle cx="126" cy="92" r="13" fill="${ink}"/>
      <circle cx="78.5" cy="87" r="4.5" fill="#fff"/><circle cx="130.5" cy="87" r="4.5" fill="#fff"/>`,
  },
  {
    id: 'happy', name: 'Happy',
    draw: () => `
      <path d="M62 96 q12 -16 24 0" stroke="${ink}" stroke-width="7" fill="none" stroke-linecap="round"/>
      <path d="M114 96 q12 -16 24 0" stroke="${ink}" stroke-width="7" fill="none" stroke-linecap="round"/>`,
  },
  {
    id: 'wink', name: 'Wink',
    draw: () => `
      <path d="M62 94 q12 -16 24 0" stroke="${ink}" stroke-width="7" fill="none" stroke-linecap="round"/>
      <circle cx="126" cy="92" r="11" fill="${ink}"/><circle cx="130" cy="87" r="4" fill="#fff"/>`,
  },
  {
    id: 'sleepy', name: 'Sleepy',
    draw: () => `
      <path d="M62 92 q12 14 24 0" stroke="${ink}" stroke-width="6" fill="none" stroke-linecap="round"/>
      <path d="M114 92 q12 14 24 0" stroke="${ink}" stroke-width="6" fill="none" stroke-linecap="round"/>`,
  },
  {
    id: 'stars', name: 'Stars',
    draw: () => {
      const star = (x, y) =>
        `<path d="M${x} ${y - 15} l4.6 9.8 10.8 1.4 -8 7.4 2 10.7 -9.4 -5.3 -9.4 5.3 2 -10.7 -8 -7.4 10.8 -1.4z" fill="#ffc531" stroke="${ink}" stroke-width="2.5" stroke-linejoin="round"/>`;
      return star(74, 94) + star(126, 94);
    },
  },
  {
    id: 'hearts', name: 'Hearts',
    draw: () => {
      const heart = (x, y) =>
        `<path d="M${x} ${y + 11} q-15 -10 -15 -19 a8 8 0 0 1 15 -4 a8 8 0 0 1 15 4 q0 9 -15 19z" fill="#ff5fa2"/>`;
      return heart(74, 90) + heart(126, 90);
    },
  },
  {
    id: 'huge', name: 'Huge',
    draw: () => `
      <ellipse cx="72" cy="92" rx="20" ry="23" fill="#fff" stroke="${ink}" stroke-width="3"/>
      <ellipse cx="128" cy="92" rx="20" ry="23" fill="#fff" stroke="${ink}" stroke-width="3"/>
      <circle cx="76" cy="95" r="10" fill="${ink}"/><circle cx="132" cy="95" r="10" fill="${ink}"/>
      <circle cx="80" cy="90" r="3.5" fill="#fff"/><circle cx="136" cy="90" r="3.5" fill="#fff"/>`,
  },
];

/* ---------- Brows ---------- */

export const BROWS = [
  { id: 'none', name: 'None', draw: () => '' },
  {
    id: 'flat', name: 'Flat',
    draw: () => `
      <path d="M60 70 h28" stroke="${ink}" stroke-width="7" stroke-linecap="round"/>
      <path d="M112 70 h28" stroke="${ink}" stroke-width="7" stroke-linecap="round"/>`,
  },
  {
    id: 'raised', name: 'Surprised',
    draw: () => `
      <path d="M58 68 q14 -12 30 -2" stroke="${ink}" stroke-width="7" fill="none" stroke-linecap="round"/>
      <path d="M112 66 q16 -10 30 2" stroke="${ink}" stroke-width="7" fill="none" stroke-linecap="round"/>`,
  },
  {
    id: 'cross', name: 'Cross',
    draw: () => `
      <path d="M58 62 l30 12" stroke="${ink}" stroke-width="7" stroke-linecap="round"/>
      <path d="M142 62 l-30 12" stroke="${ink}" stroke-width="7" stroke-linecap="round"/>`,
  },
  {
    id: 'worried', name: 'Worried',
    draw: () => `
      <path d="M58 74 l30 -10" stroke="${ink}" stroke-width="7" stroke-linecap="round"/>
      <path d="M142 74 l-30 -10" stroke="${ink}" stroke-width="7" stroke-linecap="round"/>`,
  },
];

/* ---------- Mouths ---------- */

export const MOUTHS = [
  {
    id: 'smile', name: 'Smile',
    draw: () => `<path d="M70 124 q30 30 60 0" stroke="${ink}" stroke-width="8" fill="none" stroke-linecap="round"/>`,
  },
  {
    id: 'grin', name: 'Grin',
    draw: () => `
      <path d="M66 120 q34 44 68 0z" fill="${ink}"/>
      <path d="M74 122 q26 8 52 0" stroke="#fff" stroke-width="6" fill="none"/>`,
  },
  {
    id: 'tongue', name: 'Tongue',
    draw: () => `
      <path d="M68 120 q32 40 64 0z" fill="${ink}"/>
      <path d="M88 138 q12 24 26 4 q2 -10 -4 -12z" fill="#ff5fa2"/>`,
  },
  {
    id: 'o', name: 'Oh',
    draw: () => `<ellipse cx="100" cy="132" rx="16" ry="20" fill="${ink}"/>`,
  },
  {
    id: 'flat', name: 'Straight',
    draw: () => `<path d="M74 132 h52" stroke="${ink}" stroke-width="8" stroke-linecap="round"/>`,
  },
  {
    id: 'sad', name: 'Sad',
    draw: () => `<path d="M70 140 q30 -28 60 0" stroke="${ink}" stroke-width="8" fill="none" stroke-linecap="round"/>`,
  },
  {
    id: 'squiggle', name: 'Squiggle',
    draw: () => `<path d="M70 132 q10 -12 20 0 t20 0 t20 0" stroke="${ink}" stroke-width="7" fill="none" stroke-linecap="round"/>`,
  },
  {
    id: 'fangs', name: 'Fangs',
    draw: () => `
      <path d="M68 120 q32 40 64 0z" fill="${ink}"/>
      <path d="M82 122 l6 12 6 -12z" fill="#fff"/>
      <path d="M106 122 l6 12 6 -12z" fill="#fff"/>`,
  },
];

/* ---------- Extras ---------- */

export const EXTRAS = [
  { id: 'none', name: 'None', draw: () => '' },
  {
    id: 'blush', name: 'Blush',
    draw: () => `
      <ellipse cx="56" cy="116" rx="14" ry="9" fill="#ff5fa2" opacity="0.5"/>
      <ellipse cx="144" cy="116" rx="14" ry="9" fill="#ff5fa2" opacity="0.5"/>`,
  },
  {
    id: 'glasses', name: 'Glasses',
    draw: () => `
      <circle cx="74" cy="92" r="24" fill="none" stroke="${ink}" stroke-width="6"/>
      <circle cx="126" cy="92" r="24" fill="none" stroke="${ink}" stroke-width="6"/>
      <path d="M98 92 h4" stroke="${ink}" stroke-width="6"/>
      <path d="M50 88 l-18 -8 M150 88 l18 -8" stroke="${ink}" stroke-width="6" stroke-linecap="round"/>`,
  },
  {
    id: 'shades', name: 'Sunglasses',
    draw: () => `
      <path d="M46 78 h108 v10 q0 26 -26 26 q-22 0 -26 -22 q-4 22 -26 22 q-26 0 -26 -26z" fill="${ink}"/>
      <path d="M58 86 q10 -4 18 0" stroke="rgba(255,255,255,0.5)" stroke-width="4" fill="none"/>`,
  },
  {
    id: 'party', name: 'Party hat',
    draw: () => `
      <path d="M100 6 l30 52 h-60z" fill="#ff5fa2"/>
      <path d="M100 6 l10 18 -22 12z" fill="#ffc531"/>
      <circle cx="100" cy="6" r="8" fill="#37a7ff"/>`,
  },
  {
    id: 'crown', name: 'Crown',
    draw: () => `
      <path d="M56 44 l10 -34 l16 20 l18 -28 l18 28 l16 -20 l10 34z" fill="#ffc531" stroke="#d8ab2e" stroke-width="3" stroke-linejoin="round"/>
      <circle cx="100" cy="32" r="5" fill="#ff5fa2"/>`,
  },
  {
    id: 'sparkles', name: 'Sparkles',
    draw: () => {
      const sparkle = (x, y, s) =>
        `<path d="M${x} ${y - s} q${s * 0.2} ${s * 0.8} ${s} ${s} q${-s * 0.8} ${s * 0.2} ${-s} ${s} q${-s * 0.2} ${-s * 0.8} ${-s} ${-s} q${s * 0.8} ${-s * 0.2} ${s} ${-s}z" fill="#ffc531"/>`;
      return sparkle(34, 46, 16) + sparkle(170, 62, 12) + sparkle(158, 168, 14);
    },
  },
  {
    id: 'freckles', name: 'Freckles',
    draw: () => {
      const dots = [[62, 112], [72, 118], [56, 122], [138, 112], [128, 118], [144, 122]];
      return dots.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.4" fill="rgba(36,28,51,0.35)"/>`).join('');
    },
  },
];

export const CATEGORIES = [
  { key: 'face', label: 'Face', options: FACES },
  { key: 'eyes', label: 'Eyes', options: EYES },
  { key: 'brows', label: 'Brows', options: BROWS },
  { key: 'mouth', label: 'Mouth', options: MOUTHS },
  { key: 'extra', label: 'Extras', options: EXTRAS },
];

export function optionsFor(key) {
  const category = CATEGORIES.find((c) => c.key === key);
  return category ? category.options : [];
}
