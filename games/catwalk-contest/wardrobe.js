/**
 * The wardrobe. Every garment is SVG drawn on a 200x340 figure.
 *
 * `tags` are what the judges score against and `family` is the colour group
 * used for the harmony bonus, so adding a garment means adding one entry here
 * and nothing else.
 */

export const SKINS = ['#f7d9bb', '#e8c39a', '#c98b6b', '#8a5a3b', '#5d3a26'];

export const HAIR = [
  {
    id: 'bunches', name: 'Bunches', colour: '#3b2b2b', family: 'neutral', tags: ['playful', 'sport'],
    draw: (c) => `
      <path d="M72 42 q28 -30 56 0 q6 22 -4 30 q-6 -18 -24 -18 q-18 0 -24 18 q-10 -8 -4 -30z" fill="${c}"/>
      <circle cx="62" cy="62" r="15" fill="${c}"/>
      <circle cx="138" cy="62" r="15" fill="${c}"/>`,
  },
  {
    id: 'long', name: 'Long', colour: '#e8944a', family: 'warm', tags: ['elegant', 'fancy'],
    draw: (c) => `
      <path d="M68 46 q32 -32 64 0 q10 40 4 84 q-14 -16 -18 -46 q-14 8 -36 0 q-4 30 -18 46 q-6 -44 4 -84z" fill="${c}"/>`,
  },
  {
    id: 'curls', name: 'Curls', colour: '#5b3a1f', family: 'warm', tags: ['playful', 'party'],
    draw: (c) => `
      <circle cx="76" cy="46" r="18" fill="${c}"/><circle cx="100" cy="34" r="20" fill="${c}"/>
      <circle cx="124" cy="46" r="18" fill="${c}"/><circle cx="66" cy="66" r="14" fill="${c}"/>
      <circle cx="134" cy="66" r="14" fill="${c}"/>`,
  },
  {
    id: 'bob', name: 'Bob', colour: '#241c33', family: 'cool', tags: ['retro', 'elegant'],
    draw: (c) => `<path d="M68 48 q32 -30 64 0 q6 34 0 44 q-12 -22 -32 -22 q-20 0 -32 22 q-6 -10 0 -44z" fill="${c}"/>`,
  },
  {
    id: 'space-bun', name: 'Space buns', colour: '#a48cff', family: 'bright', tags: ['space', 'futuristic'],
    draw: (c) => `
      <path d="M70 46 q30 -28 60 0 q4 18 -2 24 q-10 -14 -28 -14 q-18 0 -28 14 q-6 -6 -2 -24z" fill="${c}"/>
      <circle cx="64" cy="34" r="16" fill="${c}"/><circle cx="136" cy="34" r="16" fill="${c}"/>`,
  },
  {
    id: 'rainbow', name: 'Rainbow', colour: '#ff5fa2', family: 'bright', tags: ['rainbow', 'party'],
    draw: () => `
      <path d="M68 48 q32 -30 64 0 q8 36 2 56 h-16 q6 -34 -18 -34 q-24 0 -18 34 h-16 q-6 -20 2 -56z" fill="#ff5fa2"/>
      <path d="M84 60 q16 -12 32 0 q4 22 0 44 h-8 q4 -26 -8 -26 q-12 0 -8 26 h-8 q-4 -22 0 -44z" fill="#ffc531"/>
      <path d="M92 74 q8 -6 16 0 q2 16 0 30 h-16 q-2 -14 0 -30z" fill="#37a7ff"/>`,
  },
];

export const TOPS = [
  {
    id: 'swim', name: 'Swim top', colour: '#37a7ff', family: 'cool', tags: ['beach', 'summer', 'bright'],
    draw: (c) => `
      <path d="M74 128 q26 -10 52 0 l-6 32 q-20 8 -40 0z" fill="${c}"/>
      <path d="M78 126 q22 12 44 0" stroke="#fff" stroke-width="4" fill="none"/>`,
  },
  {
    id: 'spacesuit', name: 'Space suit', colour: '#d7dce8', family: 'cool', tags: ['space', 'futuristic', 'sport'],
    draw: (c) => `
      <path d="M70 122 q30 -12 60 0 l6 66 q-36 12 -72 0z" fill="${c}"/>
      <circle cx="100" cy="150" r="13" fill="#37a7ff" stroke="#8f9bb3" stroke-width="4"/>
      <rect x="78" y="176" width="16" height="8" rx="3" fill="#ff5fa2"/>
      <rect x="106" y="176" width="16" height="8" rx="3" fill="#ffc531"/>`,
  },
  {
    id: 'jumper', name: 'Woolly jumper', colour: '#e05a5a', family: 'warm', tags: ['winter', 'cosy', 'warm'],
    draw: (c) => `
      <path d="M64 124 q36 -14 72 0 l8 72 q-44 14 -88 0z" fill="${c}"/>
      <path d="M70 150 q30 10 60 0 M70 166 q30 10 60 0" stroke="rgba(255,255,255,0.45)" stroke-width="4" fill="none"/>`,
  },
  {
    id: 'sport', name: 'Sports vest', colour: '#17b795', family: 'bright', tags: ['sport', 'active', 'summer'],
    draw: (c) => `
      <path d="M78 124 q22 -10 44 0 l6 62 q-28 10 -56 0z" fill="${c}"/>
      <path d="M92 128 v56 M108 128 v56" stroke="#fff" stroke-width="5"/>`,
  },
  {
    id: 'gown', name: 'Gown top', colour: '#a48cff', family: 'cool', tags: ['fancy', 'elegant', 'sparkle'],
    draw: (c) => `
      <path d="M76 126 q24 -12 48 0 l6 60 q-30 10 -60 0z" fill="${c}"/>
      <path d="M84 140 l6 8 -6 8 -6 -8z M118 156 l6 8 -6 8 -6 -8z" fill="#fff" opacity="0.85"/>`,
  },
  {
    id: 'disco', name: 'Disco shirt', colour: '#ffc531', family: 'bright', tags: ['retro', 'party', 'sparkle'],
    draw: (c) => `
      <path d="M70 122 q30 -12 60 0 l6 66 q-36 12 -72 0z" fill="${c}"/>
      <circle cx="88" cy="146" r="4" fill="#ff5fa2"/><circle cx="112" cy="160" r="4" fill="#37a7ff"/>
      <circle cx="94" cy="176" r="4" fill="#a48cff"/><circle cx="116" cy="134" r="4" fill="#17b795"/>`,
  },
  {
    id: 'explorer', name: 'Explorer shirt', colour: '#7fa86b', family: 'neutral', tags: ['jungle', 'outdoors', 'sport'],
    draw: (c) => `
      <path d="M68 122 q32 -12 64 0 l6 68 q-38 12 -76 0z" fill="${c}"/>
      <rect x="80" y="146" width="16" height="12" rx="3" fill="rgba(0,0,0,0.2)"/>
      <rect x="106" y="146" width="16" height="12" rx="3" fill="rgba(0,0,0,0.2)"/>`,
  },
];

export const BOTTOMS = [
  {
    id: 'shorts', name: 'Beach shorts', colour: '#ffc531', family: 'bright', tags: ['beach', 'summer', 'sport'],
    draw: (c) => `
      <path d="M68 190 h64 l-4 44 h-22 l-6 -26 -6 26 h-22z" fill="${c}"/>`,
  },
  {
    id: 'skirt', name: 'Party skirt', colour: '#ff5fa2', family: 'bright', tags: ['party', 'rainbow', 'playful'],
    draw: (c) => `<path d="M70 188 h60 l20 56 q-50 14 -100 0z" fill="${c}"/>`,
  },
  {
    id: 'longskirt', name: 'Ball gown', colour: '#a48cff', family: 'cool', tags: ['fancy', 'elegant', 'sparkle'],
    draw: (c) => `
      <path d="M72 188 h56 l30 108 q-58 16 -116 0z" fill="${c}"/>
      <path d="M96 200 l4 10 -4 10 -4 -10z" fill="#fff" opacity="0.8"/>`,
  },
  {
    id: 'snowpants', name: 'Snow trousers', colour: '#37a7ff', family: 'cool', tags: ['winter', 'cosy', 'warm'],
    draw: (c) => `
      <path d="M70 188 h60 l-4 82 h-22 l-4 -50 -4 50 h-22z" fill="${c}"/>
      <path d="M74 220 h52" stroke="rgba(255,255,255,0.4)" stroke-width="4"/>`,
  },
  {
    id: 'spacepants', name: 'Moon trousers', colour: '#8f9bb3', family: 'cool', tags: ['space', 'futuristic', 'outdoors'],
    draw: (c) => `
      <path d="M70 188 h60 l-6 80 h-20 l-4 -48 -4 48 h-20z" fill="${c}"/>
      <rect x="76" y="230" width="14" height="8" rx="3" fill="#37a7ff"/>
      <rect x="110" y="230" width="14" height="8" rx="3" fill="#37a7ff"/>`,
  },
  {
    id: 'cargo', name: 'Cargo shorts', colour: '#7fa86b', family: 'neutral', tags: ['jungle', 'outdoors', 'active'],
    draw: (c) => `
      <path d="M68 190 h64 l-4 50 h-22 l-6 -30 -6 30 h-22z" fill="${c}"/>
      <rect x="72" y="204" width="14" height="14" rx="3" fill="rgba(0,0,0,0.18)"/>
      <rect x="114" y="204" width="14" height="14" rx="3" fill="rgba(0,0,0,0.18)"/>`,
  },
  {
    id: 'flares', name: 'Flares', colour: '#e8944a', family: 'warm', tags: ['retro', 'party', 'playful'],
    draw: (c) => `
      <path d="M70 188 h60 l10 84 h-32 l-8 -44 -8 44 h-32z" fill="${c}"/>`,
  },
];

export const SHOES = [
  {
    id: 'flipflops', name: 'Flip flops', colour: '#ff5fa2', family: 'bright', tags: ['beach', 'summer', 'playful'],
    draw: (c) => `
      <ellipse cx="86" cy="298" rx="16" ry="8" fill="${c}"/>
      <ellipse cx="114" cy="298" rx="16" ry="8" fill="${c}"/>`,
  },
  {
    id: 'trainers', name: 'Trainers', colour: '#ffffff', family: 'neutral', tags: ['sport', 'active', 'playful'],
    draw: (c) => `
      <path d="M72 290 h22 l6 12 h-30z" fill="${c}" stroke="#c9cddb" stroke-width="2"/>
      <path d="M106 290 h22 l6 12 h-30z" fill="${c}" stroke="#c9cddb" stroke-width="2"/>`,
  },
  {
    id: 'boots', name: 'Snow boots', colour: '#5b5170', family: 'cool', tags: ['winter', 'cosy', 'outdoors'],
    draw: (c) => `
      <path d="M74 276 h20 v26 h-26 z" fill="${c}"/>
      <path d="M106 276 h20 v26 h-26 z" fill="${c}"/>
      <path d="M70 280 h26 M104 280 h26" stroke="#fffaf2" stroke-width="5"/>`,
  },
  {
    id: 'moonboots', name: 'Moon boots', colour: '#d7dce8', family: 'cool', tags: ['space', 'futuristic', 'warm'],
    draw: (c) => `
      <path d="M72 272 h24 v30 h-30z" fill="${c}"/>
      <path d="M104 272 h24 v30 h-30z" fill="${c}"/>
      <path d="M66 296 h32 M100 296 h32" stroke="#ffc531" stroke-width="5"/>`,
  },
  {
    id: 'heels', name: 'Sparkly heels', colour: '#ffc531', family: 'bright', tags: ['fancy', 'elegant', 'sparkle'],
    draw: (c) => `
      <path d="M76 292 h18 l4 10 h-14 l-8 -4z" fill="${c}"/>
      <path d="M106 292 h18 l4 10 h-14 l-8 -4z" fill="${c}"/>`,
  },
  {
    id: 'wellies', name: 'Wellies', colour: '#17b795', family: 'bright', tags: ['jungle', 'outdoors', 'active'],
    draw: (c) => `
      <path d="M74 268 h20 v34 h-26z" fill="${c}"/>
      <path d="M106 268 h20 v34 h-26z" fill="${c}"/>`,
  },
];

export const ACCESSORIES = [
  {
    id: 'none', name: 'Nothing', colour: 'transparent', family: 'neutral', tags: [],
    draw: () => '',
  },
  {
    id: 'sunhat', name: 'Sun hat', colour: '#ffd766', family: 'warm', tags: ['beach', 'summer', 'outdoors'],
    draw: (c) => `
      <ellipse cx="100" cy="46" rx="56" ry="14" fill="${c}"/>
      <path d="M74 46 q4 -30 26 -30 q22 0 26 30z" fill="${c}"/>
      <path d="M74 42 q26 8 52 0" stroke="#e05a5a" stroke-width="6" fill="none"/>`,
  },
  {
    id: 'helmet', name: 'Space helmet', colour: 'rgba(180,220,255,0.55)', family: 'cool', tags: ['space', 'futuristic'],
    draw: (c) => `
      <circle cx="100" cy="66" r="44" fill="${c}" stroke="#d7dce8" stroke-width="6"/>
      <path d="M76 46 q16 -12 32 -4" stroke="#fff" stroke-width="6" fill="none" stroke-linecap="round"/>`,
  },
  {
    id: 'scarf', name: 'Scarf', colour: '#e05a5a', family: 'warm', tags: ['winter', 'cosy', 'warm'],
    draw: (c) => `
      <path d="M74 118 q26 14 52 0 l2 14 q-28 14 -56 0z" fill="${c}"/>
      <path d="M118 130 l10 44 h-14 l-6 -40z" fill="${c}"/>`,
  },
  {
    id: 'tiara', name: 'Tiara', colour: '#ffc531', family: 'bright', tags: ['fancy', 'elegant', 'sparkle'],
    draw: (c) => `
      <path d="M74 40 l8 -22 l12 14 l6 -20 l6 20 l12 -14 l8 22z" fill="${c}" stroke="#d8ab2e" stroke-width="2"/>
      <circle cx="100" cy="30" r="4" fill="#ff5fa2"/>`,
  },
  {
    id: 'shades', name: 'Big sunglasses', colour: '#241c33', family: 'neutral', tags: ['retro', 'party', 'summer'],
    draw: (c) => `
      <path d="M76 74 h48 v6 q0 14 -13 14 q-11 0 -12 -11 q-1 11 -12 11 q-13 0 -13 -14z" fill="${c}"/>`,
  },
  {
    id: 'backpack', name: 'Backpack', colour: '#7fa86b', family: 'neutral', tags: ['jungle', 'outdoors', 'active'],
    draw: (c) => `
      <rect x="128" y="130" width="26" height="40" rx="8" fill="${c}"/>
      <path d="M128 140 q-8 -14 -20 -14" stroke="${c}" stroke-width="6" fill="none"/>`,
  },
  {
    id: 'boa', name: 'Feather boa', colour: '#ff5fa2', family: 'bright', tags: ['party', 'rainbow', 'sparkle'],
    draw: (c) => `
      <circle cx="76" cy="126" r="11" fill="${c}"/><circle cx="94" cy="120" r="11" fill="${c}"/>
      <circle cx="112" cy="120" r="11" fill="${c}"/><circle cx="130" cy="128" r="11" fill="${c}"/>
      <circle cx="136" cy="148" r="10" fill="${c}"/>`,
  },
];

export const SLOTS = [
  { key: 'hair', label: 'Hair', items: HAIR, required: false },
  { key: 'top', label: 'Top', items: TOPS, required: true },
  { key: 'bottom', label: 'Bottom', items: BOTTOMS, required: true },
  { key: 'shoes', label: 'Shoes', items: SHOES, required: true },
  { key: 'accessory', label: 'Extra', items: ACCESSORIES, required: false },
];

export function itemIn(slotKey, id) {
  const slot = SLOTS.find((s) => s.key === slotKey);
  if (!slot) return null;
  return slot.items.find((item) => item.id === id) || null;
}
