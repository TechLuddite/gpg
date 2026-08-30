/**
 * Draws a puppy from its parameters. Returns an SVG string on a 100x100 grid.
 *
 * Keeping this apart from the game means the same puppies can be reused later
 * (a colouring page, a sticker sheet) without dragging the card logic along.
 *
 * The three ear shapes all hang or fold. Upright triangles read as a cat and
 * plain circles read as a bear, so neither is offered.
 */

function ears(kind, coat) {
  if (kind === 'floppy') {
    // Long ears down to the jaw.
    return `
      <path d="M28 36 q-18 4 -19 28 q-1 20 12 22 q12 1 13 -16 q1 -20 -6 -34z" fill="${coat}"/>
      <path d="M72 36 q18 4 19 28 q1 20 -12 22 q-12 1 -13 -16 q-1 -20 6 -34z" fill="${coat}"/>`;
  }
  if (kind === 'short') {
    // Small rounded ears sitting on the side of the head.
    return `
      <path d="M30 34 q-16 2 -17 18 q-1 12 9 13 q10 1 12 -11z" fill="${coat}"/>
      <path d="M70 34 q16 2 17 18 q1 12 -9 13 q-10 1 -12 -11z" fill="${coat}"/>`;
  }
  // 'perky': up at the base, folded over at the tip.
  return `
    <path d="M32 34 q-8 -20 -18 -18 q-6 2 -2 12 q4 10 12 16z" fill="${coat}"/>
    <path d="M68 34 q8 -20 18 -18 q6 2 2 12 q-4 10 -12 16z" fill="${coat}"/>
    <path d="M14 16 q10 -4 14 6 q-8 0 -14 -6z" fill="rgba(0,0,0,0.18)"/>
    <path d="M86 16 q-10 -4 -14 6 q8 0 14 -6z" fill="rgba(0,0,0,0.18)"/>`;
}

function patch(kind) {
  if (kind === 'eye') {
    return `<ellipse cx="63" cy="50" rx="15" ry="13" fill="rgba(36,28,51,0.22)"/>`;
  }
  if (kind === 'brow') {
    return `
      <ellipse cx="38" cy="40" rx="8" ry="5" fill="rgba(255,255,255,0.5)"/>
      <ellipse cx="62" cy="40" rx="8" ry="5" fill="rgba(255,255,255,0.5)"/>`;
  }
  return '';
}

export function puppySvgBody(puppy) {
  return `
    ${ears(puppy.ears, puppy.earCoat)}
    <ellipse cx="50" cy="54" rx="33" ry="31" fill="${puppy.coat}"/>
    ${patch(puppy.patch)}
    <ellipse cx="50" cy="70" rx="21" ry="15" fill="rgba(255,255,255,0.62)"/>
    <circle cx="39" cy="49" r="4.5" fill="#241c33"/>
    <circle cx="61" cy="49" r="4.5" fill="#241c33"/>
    <circle cx="40.6" cy="47.4" r="1.6" fill="#fff"/>
    <circle cx="62.6" cy="47.4" r="1.6" fill="#fff"/>
    <ellipse cx="50" cy="64" rx="7" ry="5.4" fill="${puppy.nose}"/>
    <path d="M50 69 v4 M50 73 q-8 7 -13 1 M50 73 q8 7 13 1"
          stroke="#241c33" stroke-width="2.4" fill="none" stroke-linecap="round"/>
    <path d="M50 76 q4 8 9 6" stroke="#e0567a" stroke-width="4" fill="none" stroke-linecap="round"/>
  `;
}

export function puppySvg(puppy, size = 100) {
  return `<svg viewBox="0 0 100 100" width="${size}" height="${size}" role="img" aria-label="${puppy.name}">${puppySvgBody(puppy)}</svg>`;
}
