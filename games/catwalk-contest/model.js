/** Draws the figure and whatever it is wearing, on a 200x340 grid. */

import { SLOTS, itemIn } from './wardrobe.js';

function body(skin) {
  return `
    <ellipse cx="100" cy="318" rx="46" ry="9" fill="rgba(36,28,51,0.14)"/>
    <!-- legs -->
    <path d="M88 200 h10 v96 h-14z" fill="${skin}"/>
    <path d="M112 200 h10 v96 h-14z" fill="${skin}"/>
    <!-- torso -->
    <path d="M78 118 q22 -8 44 0 l6 78 q-28 10 -56 0z" fill="${skin}"/>
    <!-- arms -->
    <path d="M78 122 q-14 34 -12 68 h12 q4 -34 12 -60z" fill="${skin}"/>
    <path d="M122 122 q14 34 12 68 h-12 q-4 -34 -12 -60z" fill="${skin}"/>
    <!-- neck and head -->
    <rect x="94" y="102" width="12" height="16" fill="${skin}"/>
    <ellipse cx="100" cy="76" rx="30" ry="33" fill="${skin}"/>
    <circle cx="90" cy="76" r="3.6" fill="#241c33"/>
    <circle cx="110" cy="76" r="3.6" fill="#241c33"/>
    <path d="M91 90 q9 8 18 0" stroke="#241c33" stroke-width="3" fill="none" stroke-linecap="round"/>
    <ellipse cx="80" cy="86" rx="6" ry="4" fill="#ff5fa2" opacity="0.4"/>
    <ellipse cx="120" cy="86" rx="6" ry="4" fill="#ff5fa2" opacity="0.4"/>
  `;
}

/**
 * Layer order matters. Hair sits behind the head for long styles but the
 * accessory (hats, helmets) always goes last so it lands on top of everything.
 */
const STAGE = `
  <rect x="0" y="0" width="200" height="340" rx="16" fill="#fff4f9"/>
  <rect x="0" y="236" width="200" height="104" fill="#ffe3ef"/>
  <path d="M52 236 h96 l30 104 h-156z" fill="#ffd0e4"/>
  <path d="M74 0 h52 l46 236 h-144z" fill="#fff" opacity="0.5"/>
`;

export function renderModel(outfit, skin, { stage = false } = {}) {
  const layer = (key) => {
    const item = itemIn(key, outfit[key]);
    return item ? item.draw(item.colour) : '';
  };

  return [
    stage ? STAGE : '',
    layer('hair'),
    body(skin),
    layer('bottom'),
    layer('shoes'),
    layer('top'),
    layer('accessory'),
  ].join('');
}

/** A small preview used on the wardrobe buttons: the item on a plain figure. */
export function renderItemThumb(slotKey, itemId, skin) {
  const outfit = { hair: 'bob', top: null, bottom: null, shoes: null, accessory: null };
  outfit[slotKey] = itemId;
  if (slotKey !== 'hair') outfit.hair = 'bob';
  return renderModel(outfit, skin);
}

export { SLOTS };
